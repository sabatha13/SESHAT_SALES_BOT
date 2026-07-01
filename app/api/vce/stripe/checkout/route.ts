import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // ── 1. Auth : validation JWT du cookie vce_auth_session ──────────────────
  const token = req.cookies.get('vce_auth_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  // ── 2. Réception de commande_id ───────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const commande_id: string | undefined = body?.commande_id;
  if (!commande_id) {
    return NextResponse.json({ error: 'commande_id requis' }, { status: 400 });
  }

  // ── 3. Vérification propriété (auteur connecté = propriétaire commande) ───
  const supabase = createServerClient();

  const [{ data: auteur }, { data: commande, error: commandeError }] = await Promise.all([
    supabase
      .from('vce_auteurs')
      .select('id')
      .eq('auth_user_id', user.id)
      .single(),
    supabase
      .from('vce_commandes_services')
      .select('id, titre, montant_total, auteur_id')
      .eq('id', commande_id)
      .single(),
  ]);

  if (!auteur) {
    return NextResponse.json({ error: 'Auteur introuvable' }, { status: 403 });
  }
  if (commandeError || !commande) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  }
  if (commande.auteur_id !== auteur.id) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // ── 4. Création session Stripe ────────────────────────────────────────────
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
