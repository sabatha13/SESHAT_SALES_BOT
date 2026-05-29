export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ items: [] });

  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  if (!profile) return NextResponse.json({ items: [] });

  const { data } = await supabase
    .from('wishlist')
    .select('*, book:books(*)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ items: data || [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { bookId } = await req.json();
  if (!bookId) return NextResponse.json({ error: 'bookId requis' }, { status: 400 });

  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', profile.id)
    .eq('book_id', bookId)
    .single();

  if (existing) {
    await supabase.from('wishlist').delete().eq('id', existing.id);
    return NextResponse.json({ added: false });
  } else {
    await supabase.from('wishlist').insert({ user_id: profile.id, book_id: bookId });
    return NextResponse.json({ added: true });
  }
}
