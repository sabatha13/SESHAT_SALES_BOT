export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';
import { logPurchaseEvent } from '@/lib/purchase-events';
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

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // VCE editorial service deposit — takes priority, different table entirely
      if (session.metadata?.vce_commande_id) {
        const commandeId = session.metadata.vce_commande_id;
        const auteurId = session.metadata.auteur_id;
        if (commandeId && auteurId) {
          const montantPaye = (session.amount_total ?? 0) / 100;
          const { data: commande, error: selectError } = await supabase
            .from('vce_commandes_services')
            .select('montant_total, acompte_paye')
            .eq('id', commandeId)
            .single();
          if (selectError) {
            console.error('VCE webhook: commande lookup failed:', selectError.message, { commandeId });
          } else if (commande) {
            const total = parseFloat(String(commande.montant_total));
            const dejaPane = parseFloat(String(commande.acompte_paye ?? 0));
            const nouvelAcompte = dejaPane + montantPaye;
            const soldeRestant = Math.max(0, total - nouvelAcompte);
            const { error: updateError } = await supabase
              .from('vce_commandes_services')
              .update({ acompte_paye: nouvelAcompte, solde_restant: soldeRestant, statut: 'production' })
              .eq('id', commandeId);
            if (updateError) console.error('VCE webhook: commande update failed:', updateError.message, { commandeId });
            const { error: txError } = await supabase.from('vce_transactions').insert({
              commande_id: commandeId,
              auteur_id: auteurId,
              type_paiement: 'acompte',
              mode_paiement: 'stripe',
              montant: montantPaye,
              stripe_payment_intent_id:
                typeof session.payment_intent === 'string' ? session.payment_intent : null,
              statut: 'confirme',
            });
            if (txError) console.error('VCE webhook: transaction insert failed:', txError.message, { commandeId });
          }
        }
        break;
      }

      if (session.mode === 'payment' && session.payment_status === 'paid') {
        // Bundle purchase: unlock every book in the pack
        if (session.metadata?.type === 'bundle') {
          const { bundleId, userId, bookIds } = session.metadata;
          const ids = (bookIds || '').split(',').filter(Boolean);
          if (userId && ids.length) {
            const perBook = Math.round((session.amount_total || 0) / ids.length);
            for (const bookId of ids) {
              const { data: existing } = await supabase
                .from('purchases')
                .select('id')
                .eq('user_id', userId)
                .eq('book_id', bookId)
                .eq('status', 'completed')
                .maybeSingle();
              if (!existing) {
                await supabase.from('purchases').insert({
                  user_id: userId,
                  book_id: bookId,
                  bundle_id: bundleId,
                  stripe_session_id: session.id,
                  stripe_payment_intent: session.payment_intent as string,
                  amount: perBook,
                  status: 'completed',
                });
              }
            }
          }
        } else {
          // SELECT and UPDATE run in parallel; SELECT result feeds the audit record only.
          const [{ data: purchaseRow }, { error: updateError }] = await Promise.all([
            supabase.from('purchases')
              .select('id, user_id, book_id')
              .eq('stripe_session_id', session.id)
              .maybeSingle(),
            supabase.from('purchases')
              .update({ status: 'completed', stripe_payment_intent: session.payment_intent as string })
              .eq('stripe_session_id', session.id),
          ]);
          if (updateError) console.error('Webhook purchase update failed:', updateError.message);
          if (purchaseRow) {
            await logPurchaseEvent({
              event_type: 'payment_completed',
              event_source: 'webhook',
              purchase_id: purchaseRow.id,
              user_id: purchaseRow.user_id,
              book_id: purchaseRow.book_id,
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent as string,
              previous_status: 'pending',
              new_status: 'completed',
              metadata: { stripe_event_id: event.id },
            });
          }
        }
      }
      if (session.mode === 'subscription' && session.subscription) {
        const { userId, planId } = session.metadata || {};
        if (userId && planId) {
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string);
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              plan_id: planId,
              stripe_subscription_id: stripeSub.id,
              stripe_customer_id: stripeSub.customer as string,
              status: stripeSub.status === 'active' ? 'active' : stripeSub.status,
              current_period_start: new Date((stripeSub as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((stripeSub as any).current_period_end * 1000).toISOString(),
              cancel_at_period_end: stripeSub.cancel_at_period_end,
            },
            { onConflict: 'stripe_subscription_id' }
          );
        }
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      if (charge.payment_intent) {
        const [{ data: purchaseRow }] = await Promise.all([
          supabase.from('purchases')
            .select('id, user_id, book_id')
            .eq('stripe_payment_intent', charge.payment_intent as string)
            .maybeSingle(),
          supabase.from('purchases')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent', charge.payment_intent as string),
        ]);
        if (purchaseRow) {
          await logPurchaseEvent({
            event_type: 'payment_refunded',
            event_source: 'webhook',
            purchase_id: purchaseRow.id,
            user_id: purchaseRow.user_id,
            book_id: purchaseRow.book_id,
            stripe_payment_intent: charge.payment_intent as string,
            previous_status: 'completed',
            new_status: 'refunded',
            metadata: { stripe_event_id: event.id },
          });
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string;
      if (subId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', subId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as any).subscription as string;
      if (subId) {
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({
          status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status,
          current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        .eq('stripe_subscription_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
