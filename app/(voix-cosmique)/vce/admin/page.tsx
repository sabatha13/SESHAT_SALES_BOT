export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

const STATUT_LABELS: Record<string, string> = {
  briefing: 'Briefing',
  devis_envoye: 'Devis envoyé',
  production: 'En production',
  revision: 'Révision',
  livre: 'Livré',
  termine: 'Terminé',
};

function formatMontant(val: number | null): string {
  if (val === null || isNaN(val)) return '0 $';
  return `${parseFloat(String(val)).toFixed(0)} $`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminDashboardPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [
    { count: totalAuteurs },
    { count: auteursActifs },
    { count: commandesEnCours },
    { data: transactionsConfirmees },
    { count: avisEnAttente },
    { count: abonnesNewsletter },
    { data: dernieresCommandes },
    { data: derniersAuteurs },
  ] = await Promise.all([
    supabase.from('vce_auteurs').select('*', { count: 'exact', head: true }),
    supabase.from('vce_auteurs').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('vce_commandes_services')
      .select('*', { count: 'exact', head: true })
      .not('statut', 'in', '("termine")'),
    supabase.from('vce_transactions').select('montant').eq('statut', 'confirme'),
    supabase.from('vce_reviews').select('*', { count: 'exact', head: true }).eq('approuve_admin', false),
    supabase.from('vce_newsletter_abonnes').select('*', { count: 'exact', head: true }),
    supabase
      .from('vce_commandes_services')
      .select('id, titre, auteur_id, statut, montant_total, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('vce_auteurs')
      .select('id, prenom, nom, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const revenusTotal = (transactionsConfirmees ?? []).reduce(
    (s, t) => s + parseFloat(String(t.montant ?? 0)),
    0,
  );

  const kpis = [
    { label: 'Total auteurs', valeur: String(totalAuteurs ?? 0) },
    { label: 'Auteurs actifs', valeur: String(auteursActifs ?? 0) },
    { label: 'Commandes en cours', valeur: String(commandesEnCours ?? 0) },
    { label: 'Revenus confirmés', valeur: formatMontant(revenusTotal) },
    { label: 'Avis à approuver', valeur: String(avisEnAttente ?? 0) },
    { label: 'Abonnés newsletter', valeur: String(abonnesNewsletter ?? 0) },
  ];

  return (
    <div style={{ padding: '2.5rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--brun)',
          margin: '0 0 2rem',
        }}
      >
        Tableau de bord
      </h1>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        {kpis.map(({ label, valeur }) => (
          <div
            key={label}
            style={{
              background: 'var(--carte)',
              border: '1px solid var(--carte-bordure)',
              borderRadius: '8px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent-or-texte)',
                margin: '0 0 0.5rem',
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--brun)',
                margin: 0,
              }}
            >
              {valeur}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Dernières commandes */}
        <section
          style={{
            background: 'var(--carte)',
            border: '1px solid var(--carte-bordure)',
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--texte-carte)',
              margin: '0 0 1rem',
            }}
          >
            Dernières commandes
          </h2>
          {(dernieresCommandes ?? []).length === 0 ? (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)' }}>
              Aucune commande.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(dernieresCommandes ?? []).map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/commandes/${c.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    textDecoration: 'none',
                    paddingBottom: '0.6rem',
                    borderBottom: '1px solid var(--or-pale)',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', fontWeight: 500 }}>
                    {c.titre}
                  </span>
                  <span style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        background: 'var(--or-pale)',
                        color: 'var(--accent-or-texte)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                      }}
                    >
                      {STATUT_LABELS[c.statut] ?? c.statut}
                    </span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)', fontWeight: 600 }}>
                      {formatMontant(c.montant_total)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Derniers auteurs */}
        <section
          style={{
            background: 'var(--carte)',
            border: '1px solid var(--carte-bordure)',
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--texte-carte)',
              margin: '0 0 1rem',
            }}
          >
            Derniers auteurs inscrits
          </h2>
          {(derniersAuteurs ?? []).length === 0 ? (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)' }}>
              Aucun auteur.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(derniersAuteurs ?? []).map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/auteurs/${a.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    textDecoration: 'none',
                    paddingBottom: '0.6rem',
                    borderBottom: '1px solid var(--or-pale)',
                  }}
                >
                  <span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', fontWeight: 500 }}>
                      {a.prenom} {a.nom}
                    </span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--texte-carte-secondaire)' }}>
                      {a.email}
                    </span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--texte-carte-secondaire)', flexShrink: 0 }}>
                    {formatDate(a.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
