import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('promotions')
    .select('*, book:books(id, title, author, price, cover_url, category)')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  return NextResponse.json(data || null);
}
