export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  const { data: book } = await supabase
    .from('books')
    .select('id, pdf_path, download_allowed, title')
    .eq('id', params.id)
    .single();

  if (!book) return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 });
  if (!book.download_allowed) return NextResponse.json({ error: 'Téléchargement non autorisé' }, { status: 403 });

  // Verify purchase
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', profile.id)
    .eq('book_id', params.id)
    .eq('status', 'completed')
    .single();

  if (!purchase) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  // Rate-limit: max 5 downloads per day per user per book
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { count } = await supabase
    .from('downloads')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .eq('book_id', params.id)
    .gte('created_at', oneDayAgo);

  if ((count || 0) >= 5) {
    return NextResponse.json({ error: 'Limite de téléchargements atteinte' }, { status: 429 });
  }

  // Create expiring download token
  const { data: tokenRow } = await supabase
    .from('download_tokens')
    .insert({ user_id: profile.id, book_id: params.id })
    .select('token')
    .single();

  if (!tokenRow) return NextResponse.json({ error: 'Erreur création token' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.json({ url: `${appUrl}/api/download?token=${tokenRow.token}` });
}
