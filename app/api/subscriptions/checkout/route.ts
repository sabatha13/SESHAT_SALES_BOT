export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { planId } = await req.json();
    if (!planId) return NextResponse.json({ error: 'planId requis' }, { status: 400 });

    const supabase = createServerClient();

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (!plan || !plan.stripe_price_id) {
      return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || '';
    const fullName = user?.fullName || null;

    const { data: profile } = await supabase
      .from('profiles')
      .upsert(
        { clerk_user_id: userId, email, full_name: fullName },
        { onConflict: 'clerk_user_id' }
      )
      .select('id')
      .single();

    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 500 });

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      return NextResponse.json({ error: 'Abonnement déjà actif', redirect: '/abonnement/dashboard' }, { status: 409 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      metadata: { userId: profile.id, planId: plan.id, clerkUserId: userId },
      success_url: `${appUrl}/abonnement/dashboard?success=1`,
      cancel_url: `${appUrl}/abonnement`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Subscription checkout error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
