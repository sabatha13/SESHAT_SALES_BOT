import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret manquant' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const commandeId = session.metadata?.vce_commande_id;
    const auteurId = session.metadata?.auteur_id;

    if (!commandeId || !auteurId) {
      return NextResponse.json({ received: true });
    }

    const montantPaye = (session.amount_total ?? 0) / 100;
    const supabase = createServerClient();

    const { data: commande } = await supabase
      .from('vce_commandes_services')
      .select('montant_total, acompte_paye')
      .eq('id', commandeId)
      .single();

    if (commande) {
      const total = parseFloat(String(commande.montant_total));
      const dejaPane = parseFloat(String(commande.acompte_paye ?? 0));
      const nouvelAcompte = dejaPane + montantPaye;
      const soldeRestant = Math.max(0, total - nouvelAcompte);

      await supabase
        .from('vce_commandes_services')
        .update({
          acompte_paye: nouvelAcompte,
          solde_restant: soldeRestant,
          statut: 'production',
        })
        .eq('id', commandeId);

      await supabase.from('vce_transactions').insert({
        commande_id: commandeId,
        auteur_id: auteurId,
        type_paiement: 'acompte',
        mode_paiement: 'stripe',
        montant: montantPaye,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        statut: 'confirme',
      });
    }
  }

  return NextResponse.json({ received: true });
}
