export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import StatutSelectForm from './_components/StatutSelectForm';

interface Commande {
  id: string;
  titre: string;
  auteur_id: string | null;
  service_id: string | null;
  package_id: string | null;
  statut: string;
  montant_total: number | null;
  acompte_paye: number | null;
  solde_restant: number | null;
  created_at: string | null;
}

function formatMontant(val: number | null): string {
  if (val === null || isNaN(val)) return '—';
  return `${parseFloat(String(val)).toFixed(0)} $`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminCommandesPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: commandesData }, { data: auteursData }, { data: servicesData }, { data: packagesData }] =
    await Promise.all([
      supabase
        .from('vce_commandes_services')
        .select('id, titre, auteur_id, service_id, package_id, statut, montant_total, acompte_paye, solde_restant, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('vce_auteurs').select('id, prenom, nom'),
      supabase.from('vce_services').select('id, nom'),
      supabase.from('vce_service_packages').select('id, nom'),
    ]);

  const commandes = (commandesData ?? []) as Commande[];
  const auteurMap = new Map((auteursData ?? []).map((a) => [a.id, `${a.prenom} ${a.nom}`]));
  const serviceMap = new Map((servicesData ?? []).map((s) => [s.id, s.nom]));
  const packageMap = new Map((packagesData ?? []).map((p) => [p.id, p.nom]));

  function prestation(c: Commande): string {
    if (c.package_id && packageMap.has(c.package_id)) return `Package · ${packageMap.get(c.package_id)}`;
    if (c.service_id && serviceMap.has(c.service_id)) return serviceMap.get(c.service_id)!;
    return '—';
  }

  return (
    <div style={{ padding: '2.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 2rem' }}>
        Commandes
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 400, color: 'var(--accent-or-texte)', marginLeft: '0.75rem' }}>
          ({commandes.length})
        </span>
      </h1>

      {commandes.length === 0 ? (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucune commande.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', overflowX: 'auto' }}>
          {/* En-tête */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.6fr 1.2fr 1.4fr 1.5fr 0.9fr 0.9fr 0.9fr 0.8fr',
              gap: '0 0.75rem',
              padding: '0.7rem 1.25rem',
              background: 'var(--or-pale)',
              borderBottom: '1px solid var(--carte-bordure)',
              minWidth: '900px',
            }}
          >
            {['Titre', 'Auteur', 'Service / Package', 'Statut', 'Montant', 'Acompte', 'Solde', 'Date'].map((col) => (
              <span key={col} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent-or-texte)' }}>
                {col}
              </span>
            ))}
          </div>

          {commandes.map((c, idx) => (
            <div
              key={c.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1.2fr 1.4fr 1.5fr 0.9fr 0.9fr 0.9fr 0.8fr',
                gap: '0 0.75rem',
                padding: '0.875rem 1.25rem',
                borderBottom: idx < commandes.length - 1 ? '1px solid var(--or-pale)' : 'none',
                alignItems: 'center',
                minWidth: '900px',
              }}
            >
              <Link href={`/admin/commandes/${c.id}`} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', fontWeight: 500, textDecoration: 'none' }}>
                {c.titre}
              </Link>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)' }}>
                {c.auteur_id ? auteurMap.get(c.auteur_id) ?? '—' : '—'}
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--texte-carte-secondaire)' }}>
                {prestation(c)}
              </span>
              <StatutSelectForm commandeId={c.id} statutActuel={c.statut} />
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)', fontWeight: 600 }}>{formatMontant(c.montant_total)}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)' }}>{formatMontant(c.acompte_paye)}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)' }}>{formatMontant(c.solde_restant)}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--texte-carte-secondaire)' }}>{formatDate(c.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
