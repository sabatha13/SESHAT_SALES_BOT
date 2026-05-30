import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('coupons')
    .select('code, discount_percent, discount_cents, expires_at')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return NextResponse.json({ banner: null });
  return NextResponse.json({ banner: data });
}
