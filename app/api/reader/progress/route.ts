export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ session: null });

  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) return NextResponse.json({ error: 'bookId requis' }, { status: 400 });

  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  if (!profile) return NextResponse.json({ session: null });

  const { data } = await supabase
    .from('reader_sessions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('book_id', bookId)
    .single();

  return NextResponse.json({ session: data || null });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { bookId, currentPage, totalPages, completed } = await req.json();
  if (!bookId) return NextResponse.json({ error: 'bookId requis' }, { status: 400 });

  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  await supabase.from('reader_sessions').upsert(
    {
      user_id: profile.id,
      book_id: bookId,
      current_page: currentPage,
      total_pages: totalPages,
      last_read_at: new Date().toISOString(),
      completed: completed || false,
    },
    { onConflict: 'user_id,book_id' }
  );

  return NextResponse.json({ ok: true });
}
