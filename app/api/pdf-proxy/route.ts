export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) return new NextResponse('Missing bookId', { status: 400 });

  const supabase = createServerClient();

  const { data: book } = await supabase
    .from('books')
    .select('pdf_path, access_type, subscription_included')
    .eq('id', bookId)
    .eq('is_published', true)
    .single();

  if (!book) return new NextResponse('Not found', { status: 404 });

  if (book.access_type !== 'free_preview') {
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
    if (!profile) return new NextResponse('Unauthorized', { status: 401 });

    const { data: purchase } = await supabase.from('purchases').select('id').eq('user_id', profile.id).eq('book_id', bookId).eq('status', 'completed').single();
    if (!purchase) {
      if (book.subscription_included || book.access_type === 'subscription_only' || book.access_type === 'purchase_and_subscription') {
        const { data: sub } = await supabase.from('subscriptions').select('id').eq('user_id', profile.id).eq('status', 'active').single();
        if (!sub) return new NextResponse('Unauthorized', { status: 401 });
      } else {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }
  }

  const { data } = await supabase.storage.from('pdfs').createSignedUrl(book.pdf_path, 3600);
  if (!data?.signedUrl) return new NextResponse('PDF not found', { status: 404 });

  const pdfRes = await fetch(data.signedUrl);
  if (!pdfRes.ok) return new NextResponse('PDF fetch failed', { status: 502 });

  const pdfBuffer = await pdfRes.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
