import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .single();

  if (!sub) return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 404 });

  // Stripe subscription — cancel at period end
  if (sub.stripe_subscription_id) {
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('id', sub.id);

    return NextResponse.json({ success: true, type: 'stripe', ends_at: sub.current_period_end });
  }

  // Manual subscription — mark as cancelled, keep access until period end
  await supabase
    .from('subscriptions')
    .update({ cancel_at_period_end: true })
    .eq('id', sub.id);

  return NextResponse.json({ success: true, type: 'manual', ends_at: sub.current_period_end });
}
