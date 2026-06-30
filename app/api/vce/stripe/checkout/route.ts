import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const commande_id: string | undefined = body?.commande_id;

  if (!commande_id) {
    return NextResponse.json({ error: 'commande_id requis' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: commande, error } = await supabase
    .from('vce_commandes_services')
    .select('id, titre, montant_total, auteur_id')
    .eq('id', commande_id)
    .single();

  if (error || !commande) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  }

  const montantTotal = parseFloat(String(commande.montant_total));
  const acomptesCents = Math.round(montantTotal * 0.5 * 100);

  const VCE_BASE =
    process.env.NEXT_PUBLIC_VCE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Acompte 50 % — ${commande.titre}`,
            description: 'Voix Cosmique Éditions — Acompte sur commande éditoriale',
          },
          unit_amount: acomptesCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${VCE_BASE}/espace-auteur?payment=success&commande=${commande_id}`,
    cancel_url: `${VCE_BASE}/espace-auteur`,
    metadata: {
      vce_commande_id: commande_id,
      auteur_id: String(commande.auteur_id),
    },
  });

  return NextResponse.json({ url: session.url });
}
