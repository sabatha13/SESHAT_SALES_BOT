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

    if (!book.price_cents || book.price_cents <= 0) {
      return NextResponse.json({ error: 'Prix du livre non configuré. Contactez l\'administrateur.' }, { status: 400 });
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

    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', profile.id)
      .eq('book_id', bookId)
      .eq('status', 'completed')
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Déjà acheté', redirect: `/lecture/${bookId}` }, { status: 409 });
    }

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
            unit_amount: book.price_cents,
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

    await supabase.from('purchases').insert({
      user_id: profile.id,
      book_id: book.id,
      stripe_session_id: session.id,
      amount: book.price_cents,
      status: 'pending',
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
