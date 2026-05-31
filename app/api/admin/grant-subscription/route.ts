import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { user_id, months, grant_type, payment_method, amount } = await req.json();

  const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', user_id).eq('status', 'active').single();
  if (existing) return NextResponse.json({ error: 'Abonnement déjà actif' }, { status: 400 });

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + (months || 1));

  const { error } = await supabase.from('subscriptions').insert({
    user_id,
    stripe_subscription_id: 'manual_grant_' + Date.now(),
    status: 'active',
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Record payment if paid externally
  if (grant_type === 'paid_external' && amount > 0) {
    await supabase.from('purchases').insert({
      user_id,
      book_id: null,
      amount,
      status: 'external',
      payment_method: payment_method || 'Autre',
      stripe_payment_intent_id: 'external_' + Date.now(),
    });
  }

  return NextResponse.json({ success: true });
}
