import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { user_id } = await req.json();

  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user_id)
    .eq('status', 'active')
    .single();

  if (existing) return NextResponse.json({ error: 'Abonnement déjà actif' }, { status: 400 });

  const { error } = await supabase.from('subscriptions').insert({
    user_id,
    stripe_subscription_id: 'manual_grant_' + Date.now(),
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: oneYearLater.toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}