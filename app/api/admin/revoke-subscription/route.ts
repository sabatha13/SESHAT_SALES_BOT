import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { user_id } = await req.json();
  const { error } = await supabase.from('subscriptions').update({ status: 'canceled' }).eq('user_id', user_id).eq('status', 'active');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}