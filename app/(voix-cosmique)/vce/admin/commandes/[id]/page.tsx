export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import StatutSelectForm from '../_components/StatutSelectForm';
import { AjouterEtapeForm, EtapeRow } from './_components/EtapeForm';

function formatMontant(val: number | null): string {
  if (val === null || isNaN(val)) return '—';
  return `${parseFloat(String(val)).toFixed(2)} $`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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

interface Etape {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  ordre: number | null;
}

export default async function AdminCommandeDetailPage({ params }: { params: { id: string } }) {
  await assertVceAdmin();
  const supabase = createServerClient();

  const { data: commande } = await supabase
    .from('vce_commandes_services')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!commande) notFound();

  const [{ data: auteur }, { data: etapes }, { data: messages }, { data: fichiers }, { data: transactions }] =
    await Promise.all([
      commande.auteur_id
        ? supabase.from('vce_auteurs').select('id, prenom, nom, email').eq('id', commande.auteur_id).single()
        : Promise.resolve({ data: null }),
      supabase.from('vce_etapes').select('id, titre, description, statut, ordre').eq('commande_id', params.id).order('ordre', { ascending: true }),
      supabase.from('vce_messages').select('id, expediteur, expediteur_nom, contenu, lu, created_at').eq('commande_id', params.id).order('created_at', { ascending: true }),
      supabase.from('vce_fichiers').select('id, nom_fichier, envoye_par, valide_par_auteur, created_at').eq('commande_id', params.id).order('created_at', { ascending: false }),
      supabase.from('vce_transactions').select('id, type_paiement, montant, statut, created_at').eq('commande_id', params.id).order('created_at', { ascending: false }),
    ]);

  const etapesList = (etapes ?? []) as Etape[];

  return (
    <div style={{ padding: '2.5rem', maxWidth: '900px' }}>
      <Link href="/vce/admin/commandes" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--accent-or-texte)', textDecoration: 'none' }}>
        ← Retour aux commandes
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', margin: '1rem 0 2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 0.35rem' }}>
            {commande.titre}
          </h1>
          {auteur && (
            <Link href={`/vce/admin/auteurs/${auteur.id}`} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--accent-or-texte)', textDecoration: 'none' }}>
              {auteur.prenom} {auteur.nom} · {auteur.email}
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end' }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-or-texte)' }}>Statut</span>
          <StatutSelectForm commandeId={commande.id} statutActuel={commande.statut} />
        </div>
      </div>

      {/* Infos + montants */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Détails</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {[
            ['Montant total', formatMontant(commande.montant_total)],
            ['Acompte payé', formatMontant(commande.acompte_paye)],
            ['Solde restant', formatMontant(commande.solde_restant)],
            ['Progression', `${commande.progression ?? 0} %`],
            ['Créée le', formatDate(commande.created_at)],
            ['Livraison estimée', formatDate(commande.date_livraison_estimee)],
          ].map(([label, value]) => (
            <div key={label as string}>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-or-texte)', margin: '0 0 0.2rem' }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte)', margin: 0, fontWeight: 600 }}>{value}</p>
            </div>
          ))}
        </div>
        {commande.notes_internes && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-or-texte)', margin: '0 0 0.2rem' }}>Notes internes</p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0, lineHeight: 1.6 }}>{commande.notes_internes}</p>
          </div>
        )}
      </div>

      {/* Étapes */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Étapes ({etapesList.length})</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {etapesList.map((e) => (
            <EtapeRow key={e.id} etape={e} commandeId={params.id} />
          ))}
        </div>
        <AjouterEtapeForm commandeId={params.id} />
      </div>

      {/* Messages */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Messages ({(messages ?? []).length})</h2>
        {(messages ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun message.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(messages ?? []).map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  background: m.expediteur === 'auteur' ? 'var(--or-pale)' : 'var(--n)',
                  border: '1px solid var(--carte-bordure)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-or-texte)' }}>
                    {m.expediteur_nom ?? (m.expediteur === 'auteur' ? 'Auteur' : 'VCE')}
                    {!m.lu && m.expediteur === 'auteur' && (
                      <span style={{ marginLeft: '0.4rem', color: '#991B1B' }}>● non lu</span>
                    )}
                  </span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--texte-carte-secondaire)' }}>{formatDateTime(m.created_at)}</span>
                </div>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', margin: 0, whiteSpace: 'pre-wrap' }}>{m.contenu}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fichiers */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Fichiers ({(fichiers ?? []).length})</h2>
        {(fichiers ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun fichier.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(fichiers ?? []).map((f) => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--or-pale)' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)' }}>
                  {f.nom_fichier}
                  {f.valide_par_auteur && <span style={{ marginLeft: '0.4rem', color: '#166534', fontSize: '0.7rem' }}>✓ validé</span>}
                </span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--texte-carte-secondaire)', flexShrink: 0 }}>
                  {f.envoye_par === 'auteur' ? 'Auteur' : 'VCE'} · {formatDate(f.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div style={{ ...cardStyle, marginBottom: 0 }}>
        <h2 style={sectionTitle}>Transactions ({(transactions ?? []).length})</h2>
        {(transactions ?? []).length === 0 ? (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucune transaction.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(transactions ?? []).map((t) => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--or-pale)' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)', textTransform: 'capitalize' }}>{t.type_paiement ?? '—'} · {t.statut ?? '—'}</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte)', fontWeight: 600, flexShrink: 0 }}>{formatMontant(parseFloat(String(t.montant)))} · {formatDate(t.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
