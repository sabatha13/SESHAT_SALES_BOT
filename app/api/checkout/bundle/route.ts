export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { bundleId } = await req.json();
    if (!bundleId) return NextResponse.json({ error: 'bundleId requis' }, { status: 400 });

    const supabase = createServerClient();

    const { data: bundle } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', bundleId)
      .eq('is_published', true)
      .single();

    if (!bundle) return NextResponse.json({ error: 'Pack introuvable' }, { status: 404 });
    if (!bundle.price || bundle.price <= 0) {
      return NextResponse.json({ error: 'Prix du pack non configuré.' }, { status: 400 });
    }
    if (!bundle.book_ids?.length) {
      return NextResponse.json({ error: 'Pack vide.' }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress || '';
    const fullName = user?.fullName || null;

    const { data: profile } = await supabase
      .from('profiles')
      .upsert({ clerk_user_id: userId, email, full_name: fullName }, { onConflict: 'clerk_user_id' })
      .select('id')
      .single();

    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bundle.title,
              ...(bundle.description ? { description: bundle.description.slice(0, 500) } : {}),
            },
            unit_amount: bundle.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'bundle',
        bundleId: bundle.id,
        userId: profile.id,
        clerkUserId: userId,
        bookIds: (bundle.book_ids as string[]).join(','),
      },
      success_url: `${appUrl}/bibliotheque/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/packs/${bundle.slug || bundle.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Bundle checkout error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
