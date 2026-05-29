export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

async function getProfile(supabase: any, userId: string) {
  const { data } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  return data;
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ bookmarks: [] });

  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) return NextResponse.json({ error: 'bookId requis' }, { status: 400 });

  const supabase = createServerClient();
  const profile = await getProfile(supabase, userId);
  if (!profile) return NextResponse.json({ bookmarks: [] });

  const { data } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', profile.id)
    .eq('book_id', bookId)
    .order('page_number');

  return NextResponse.json({ bookmarks: data || [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { bookId, pageNumber, label } = await req.json();
  if (!bookId || !pageNumber) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });

  const supabase = createServerClient();
  const profile = await getProfile(supabase, userId);
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  const { data } = await supabase
    .from('bookmarks')
    .insert({ user_id: profile.id, book_id: bookId, page_number: pageNumber, label })
    .select()
    .single();

  return NextResponse.json({ bookmark: data });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const supabase = createServerClient();
  const profile = await getProfile(supabase, userId);
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', profile.id);
  return NextResponse.json({ ok: true });
}
