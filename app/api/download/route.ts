export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logPurchaseEvent } from '@/lib/purchase-events';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 });

  const supabase = createServerClient();

  const { data: tokenRow } = await supabase
    .from('download_tokens')
    .select('*, book:books(id, pdf_path, title)')
    .eq('token', token)
    .single();

  if (!tokenRow) return NextResponse.json({ error: 'Token invalide' }, { status: 404 });
  if (tokenRow.used) return NextResponse.json({ error: 'Token déjà utilisé' }, { status: 410 });
  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Token expiré' }, { status: 410 });
  }

  const book = tokenRow.book as any;

  // Mark token as used — atomic: only succeeds if not already used (guards against TOCTOU race)
  const { data: marked } = await supabase
    .from('download_tokens')
    .update({ used: true })
    .eq('id', tokenRow.id)
    .eq('used', false)
    .select('id')
    .single();

  if (!marked) return NextResponse.json({ error: 'Token déjà utilisé' }, { status: 410 });

  // Log download
  await Promise.all([
    supabase.from('downloads').insert({
      user_id: tokenRow.user_id,
      book_id: tokenRow.book_id,
      token_id: tokenRow.id,
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    }),
    logPurchaseEvent({
      event_type: 'download_completed',
      event_source: 'token_redemption',
      user_id: tokenRow.user_id,
      book_id: tokenRow.book_id,
      metadata: { token_id: tokenRow.id },
    }),
  ]);

  // Generate signed URL (15 min) — download:true force le Content-Disposition: attachment
  const { data: signedData } = await supabase.storage
    .from('pdfs')
    .createSignedUrl(book.pdf_path, 900, { download: true });

  if (!signedData?.signedUrl) {
    return NextResponse.json({ error: 'Erreur génération URL' }, { status: 500 });
  }

  return NextResponse.redirect(signedData.signedUrl);
}
