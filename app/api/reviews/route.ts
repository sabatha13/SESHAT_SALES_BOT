export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId');
  if (!bookId) return NextResponse.json({ reviews: [] });

  const supabase = createServerClient();
  const { data } = await supabase
    .from('reviews')
    .select('*, profile:profiles(full_name, avatar_url)')
    .eq('book_id', bookId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return NextResponse.json({ reviews: data || [] });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { bookId, rating, comment } = await req.json();
  if (!bookId || !rating) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
  if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Note invalide' }, { status: 400 });

  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  // Only purchased users can review
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', profile.id)
    .eq('book_id', bookId)
    .eq('status', 'completed')
    .single();

  if (!purchase) return NextResponse.json({ error: 'Achat requis pour évaluer' }, { status: 403 });

  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      { user_id: profile.id, book_id: bookId, rating, comment, is_approved: false },
      { onConflict: 'user_id,book_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
