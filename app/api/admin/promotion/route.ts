import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('promotions')
    .select('*, book:books(id, title, author, price, cover_url, category)')
    .single();
  return NextResponse.json(data || null);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServerClient();
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const body = await req.json();
  const { book_id, type, is_active } = body;

  const { data: existing } = await supabase.from('promotions').select('id').single();

  let result;
  if (existing) {
    const { data } = await supabase
      .from('promotions')
      .update({ book_id, type, is_active, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*, book:books(id, title, author, price, cover_url, category)')
      .single();
    result = data;
  } else {
    const { data } = await supabase
      .from('promotions')
      .insert({ book_id, type, is_active })
      .select('*, book:books(id, title, author, price, cover_url, category)')
      .single();
    result = data;
  }

  return NextResponse.json(result);
}
