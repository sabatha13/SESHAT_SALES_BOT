import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { purchase_id, delete_all_pending } = await req.json();

  if (delete_all_pending) {
    const { error } = await supabase.from('purchases').delete().eq('status', 'pending');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from('purchases').delete().eq('id', purchase_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}