import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { user_id, amount, payment_method } = await req.json();

  if (!user_id || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { error } = await supabase.from('purchases').insert({
    user_id,
    book_id: null,
    amount,
    status: 'external',
    payment_method: payment_method || 'Autre',
    stripe_payment_intent_id: 'external_' + Date.now(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
