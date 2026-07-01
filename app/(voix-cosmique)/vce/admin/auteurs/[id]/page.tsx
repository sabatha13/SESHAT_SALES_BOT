export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import { suspendreAuteur, reactiverAuteur } from '../../../actions/admin-auteurs';
import SupprimerAuteurButton from './_components/SupprimerAuteurButton';

const STATUT_LABELS: Record<string, string> = {
  briefing: 'Briefing',
  devis_envoye: 'Devis envoyé',
  production: 'En production',
  revision: 'Révision',
  livre: 'Livré',
  termine: 'Terminé',
};

function formatMontant(val: number | null): string {
  if (val === null || isNaN(val)) return '—';
  return `${parseFloat(String(val)).toFixed(2)} $`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const cardStyle: React.CSSProperties = {
  background: 'var(--carte)',
  border: '1px solid var(--carte-bordure)',
  borderRadius: '8px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-playfair)',
  fontSize: '1.05rem',
  fontWeight: 600,
  color: 'var(--texte-carte)',
  margin: '0 0 1rem',
};

export default async function AdminAuteurDetailPage({ params }: { params: { id: string } }) {
  await assertVceAdmin();
  const supabase = createServerClient();

  const { data: auteur } = await supabase
    .from('vce_auteurs')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!auteur) notFound();

  const [{ data: commandes }, { data: fichiers }, { data: transactions }] = await Promise.all([
    supabase
      .from('vce_commandes_services')
      .select('id, titre, statut, montant_total, acompte_paye, solde_restant, created_at')
      .eq('auteur_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('vce_fichiers')
      .select('id, nom_fichier, envoye_par, created_at')
      .eq('auteur_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('vce_transactions')
      .select('id, type_paiement, montant, statut, created_at')
      .eq('auteur_id', params.id)
      .order('created_at', { ascending: false }),
  ]);

  const actif = auteur.is_active !== false;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '900px' }}>
      <Link
        href="/admin/auteurs"
        style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--accent-or-texte)', textDecoration: 'none' }}
      >
        ← Retour aux auteurs
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', margin: '1rem 0 2rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>
          {auteur.prenom} {auteur.nom}
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: actif ? '#DCFCE7' : '#FEE2E2',
              color: actif ? '#166534' : '#991B1B',
              marginLeft: '0.75rem',
              verticalAlign: 'middle',
            }}
          >
            {actif ? 'Actif' : 'Suspendu'}
          </span>
        </h1>
        {actif ? (
          <form action={suspendreAuteur}>
            <input type="hidden" name="auteur_id" value={auteur.id} />
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#991B1B',
                background: 'transparent',
                border: '1px solid #991B1B',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
              }}
            >
              Suspendre le compte
            </button>
          </form>
        ) : (
          <form action={reactiverAuteur}>
            <input type="hidden" name="auteur_id" value={auteur.id} />
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#166534',
                background: 'transparent',
                border: '1px solid #166534',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
              }}
            >
              Réactiver le compte
            </button>
          </form>
        )}
      </div>

      {/* Infos */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Informations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            ['Email', auteur.email],
            ['Nom de plume', auteur.nom_plume ?? '—'],
            ['Nationalité', auteur.nationalite ?? '—'],
            ['Langue', auteur.langue_principale ?? '—'],
            ['Site web', auteur.site_web ?? '—'],
            ['Inscrit le', formatDate(auteur.created_at)],
            ['Vérifié', auteur.is_verified ? 'Oui' : 'Non'],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-or-texte)', margin: '0 0 0.2rem' }}>
                {label}
              </p>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>
        {auteur.bio && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-or-texte)', margin: '0 0 0.2rem' }}>
              Biographie
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0, lineHeight: 1.6 }}>
              {auteur.bio}
            </p>
          </div>
        )}
      </div>

      {/* Commandes */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Commandes ({(commandes ?? []).length})</h2>
        {(commandes ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>
            Aucune commande.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(commandes ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/admin/commandes/${c.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', textDecoration: 'none', paddingBottom: '0.6rem', borderBottom: '1px solid var(--or-pale)' }}
              >
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', fontWeight: 500 }}>{c.titre}</span>
                <span style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 600, background: 'var(--or-pale)', color: 'var(--accent-or-texte)', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                    {STATUT_LABELS[c.statut] ?? c.statut}
                  </span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)', fontWeight: 600 }}>{formatMontant(c.montant_total)}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Fichiers */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Fichiers ({(fichiers ?? []).length})</h2>
        {(fichiers ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>
            Aucun fichier.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(fichiers ?? []).map((f) => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--or-pale)' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)' }}>{f.nom_fichier}</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--texte-carte-secondaire)', flexShrink: 0 }}>
                  {f.envoye_par === 'auteur' ? 'Auteur' : 'VCE'} · {formatDate(f.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Transactions ({(transactions ?? []).length})</h2>
        {(transactions ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>
            Aucune transaction.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(transactions ?? []).map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--or-pale)' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)', textTransform: 'capitalize' }}>
                  {t.type_paiement ?? '—'} · {t.statut ?? '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)', fontWeight: 600, flexShrink: 0 }}>
                  {formatMontant(parseFloat(String(t.montant)))} · {formatDate(t.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zone dangereuse */}
      <div style={{ ...cardStyle, borderColor: '#991B1B', marginBottom: 0 }}>
        <h2 style={{ ...sectionTitle, color: '#991B1B' }}>Zone dangereuse</h2>
        <SupprimerAuteurButton auteurId={auteur.id} auteurNom={`${auteur.prenom} ${auteur.nom}`} />
      </div>
    </div>
  );
}
