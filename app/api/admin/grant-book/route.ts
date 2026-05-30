import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { user_id, book_id } = await req.json();

  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user_id)
    .eq('book_id', book_id)
    .single();

  if (existing) return NextResponse.json({ error: 'Livre déjà accordé' }, { status: 400 });

  const { error } = await supabase.from('purchases').insert({
    user_id,
    book_id,
    stripe_session_id: 'manual_grant_' + Date.now(),
    amount: 0,
    status: 'completed',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}