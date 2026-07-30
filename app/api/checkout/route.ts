export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json({ error: 'bookId requis' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .eq('is_published', true)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Livre introuvable' }, { status: 404 });
    }

    if (!book.price || book.price <= 0) {
      return NextResponse.json({ error: "Prix du livre non configuré. Contactez l'administrateur." }, { status: 400 });
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

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 500 });
    }

    // Already paid — short-circuit
    const { data: completedPurchase } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', profile.id)
      .eq('book_id', bookId)
      .in('status', ['completed', 'external'])
      .maybeSingle();

    if (completedPurchase) {
      return NextResponse.json({ error: 'Déjà acheté', redirect: `/lecture/${bookId}` }, { status: 409 });
    }

    // Look for an existing pending/expired row (UNIQUE(user_id, book_id) means at most one)
    const { data: existingRow } = await supabase
      .from('purchases')
      .select('id, stripe_session_id, status')
      .eq('user_id', profile.id)
      .eq('book_id', bookId)
      .in('status', ['pending', 'expired'])
      .maybeSingle();

    // If there's a pending row, validate the Stripe session before creating a new one
    if (existingRow?.status === 'pending' && existingRow.stripe_session_id) {
      const stripeSession = await stripe.checkout.sessions.retrieve(existingRow.stripe_session_id);

      if (stripeSession.status === 'open') {
        // Session still live — send user straight to it
        return NextResponse.json({ url: stripeSession.url });
      }

      if (stripeSession.status === 'complete') {
        if (stripeSession.payment_status !== 'paid') {
          // Session closed but payment not confirmed (async method still processing).
          // Do not grant access. Do not create a new session.
          return NextResponse.json(
            { error: 'Votre paiement est en cours de traitement. Vous recevrez un email de confirmation.' },
            { status: 402 }
          );
        }
        // Webhook was missed and payment is confirmed — recover now.
        // Purchase update + audit run in parallel; audit failure never blocks access.
        const [, { error: auditError }] = await Promise.all([
          supabase.from('purchases').update({
            status: 'completed',
            stripe_payment_intent: stripeSession.payment_intent as string,
          }).eq('id', existingRow.id),
          supabase.from('purchase_audit').insert({
            purchase_id: existingRow.id,
            user_id: profile.id,
            book_id: bookId,
            stripe_session_id: existingRow.stripe_session_id,
            stripe_payment_intent: stripeSession.payment_intent as string,
            previous_status: 'pending',
            new_status: 'completed',
            recovery_source: 'checkout_recovery',
            performed_by: 'system',
          }),
        ]);
        if (auditError) console.error('Checkout recovery audit failed:', auditError.message);
        return NextResponse.json({ redirect: `/lecture/${bookId}` });
      }

      // Stripe session expired — timestamp the expiration, then fall through to create a new session
      await supabase.from('purchases')
        .update({ status: 'expired', expired_at: new Date().toISOString() })
        .eq('id', existingRow.id);
    }

    // Create a fresh Stripe Checkout session
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
              name: book.title,
              ...(book.short_description ? { description: book.short_description.slice(0, 500) } : {}),
            },
            unit_amount: book.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookId: book.id,
        userId: profile.id,
        clerkUserId: userId,
      },
      success_url: `${appUrl}/bibliotheque/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/livre/${book.id}`,
    });

    if (existingRow) {
      // Reuse the existing row — update stripe_session_id, reset to pending, clear expired_at
      await supabase
        .from('purchases')
        .update({ stripe_session_id: session.id, status: 'pending', amount: book.price, expired_at: null })
        .eq('id', existingRow.id);
    } else {
      await supabase.from('purchases').insert({
        user_id: profile.id,
        book_id: book.id,
        stripe_session_id: session.id,
        amount: book.price,
        status: 'pending',
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
