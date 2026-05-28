export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const supabase = createServerClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status === 'paid') {
      await supabase
        .from('purchases')
        .update({
          status: 'completed',
          stripe_payment_intent: session.payment_intent as string,
        })
        .eq('stripe_session_id', session.id);
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge;
    if (charge.payment_intent) {
      await supabase
        .from('purchases')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent', charge.payment_intent as string);
    }
  }

  return NextResponse.json({ received: true });
}
