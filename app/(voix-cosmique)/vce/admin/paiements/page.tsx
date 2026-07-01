export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

interface Transaction {
  id: string;
  commande_id: string | null;
  auteur_id: string | null;
  type_paiement: string | null;
  mode_paiement: string | null;
  montant: number;
  statut: string | null;
  facture_url: string | null;
  created_at: string | null;
}

function formatMontant(val: number): string {
  if (isNaN(val)) return '0 $';
  return `${val.toFixed(2)} $`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminPaiementsPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: transactionsData }, { data: auteursData }, { data: commandesData }] = await Promise.all([
    supabase
      .from('vce_transactions')
      .select('id, commande_id, auteur_id, type_paiement, mode_paiement, montant, statut, facture_url, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('vce_auteurs').select('id, prenom, nom'),
    supabase.from('vce_commandes_services').select('id, titre'),
  ]);

  const transactions = (transactionsData ?? []) as Transaction[];
  const auteurMap = new Map((auteursData ?? []).map((a) => [a.id, `${a.prenom} ${a.nom}`]));
  const commandeMap = new Map((commandesData ?? []).map((c) => [c.id, c.titre]));

  const confirmees = transactions.filter((t) => t.statut === 'confirme');
  const totalEncaisse = confirmees.reduce((s, t) => s + parseFloat(String(t.montant ?? 0)), 0);
  const nbTransactions = transactions.length;
  const moyenne = confirmees.length > 0 ? totalEncaisse / confirmees.length : 0;

  const kpis = [
    { label: 'Total encaissé (confirmé)', valeur: formatMontant(totalEncaisse) },
    { label: 'Nombre de transactions', valeur: String(nbTransactions) },
    { label: 'Montant moyen (confirmé)', valeur: formatMontant(moyenne) },
  ];

  return (
    <div style={{ padding: '2.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 2rem' }}>
        Paiements
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {kpis.map(({ label, valeur }) => (
          <div key={label} style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '1.25rem 1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-or-texte)', margin: '0 0 0.5rem' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>{valeur}</p>
          </div>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucune transaction.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.4fr 1.4fr 1fr 0.9fr 0.9fr 0.8fr',
              gap: '0 0.75rem',
              padding: '0.7rem 1.25rem',
              background: 'var(--or-pale)',
              borderBottom: '1px solid var(--carte-bordure)',
              minWidth: '820px',
            }}
          >
            {['Date', 'Auteur', 'Commande', 'Type', 'Montant', 'Statut', 'Reçu'].map((col) => (
              <span key={col} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent-or-texte)' }}>
                {col}
              </span>
            ))}
          </div>

          {transactions.map((t, idx) => (
            <div
              key={t.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.4fr 1.4fr 1fr 0.9fr 0.9fr 0.8fr',
                gap: '0 0.75rem',
                padding: '0.875rem 1.25rem',
                borderBottom: idx < transactions.length - 1 ? '1px solid var(--or-pale)' : 'none',
                alignItems: 'center',
                minWidth: '820px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte)' }}>{formatDate(t.created_at)}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>{t.auteur_id ? auteurMap.get(t.auteur_id) ?? '—' : '—'}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>{t.commande_id ? commandeMap.get(t.commande_id) ?? '—' : '—'}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)', textTransform: 'capitalize' }}>{t.type_paiement ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte-carte)', fontWeight: 600 }}>{formatMontant(parseFloat(String(t.montant)))}</span>
              <span>
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: t.statut === 'confirme' ? '#DCFCE7' : 'var(--or-pale)',
                    color: t.statut === 'confirme' ? '#166534' : 'var(--accent-or-texte)',
                  }}
                >
                  {t.statut ?? '—'}
                </span>
              </span>
              <span>
                {t.facture_url ? (
                  <a href={t.facture_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--accent-or-texte)', fontWeight: 600, textDecoration: 'none' }}>
                    Voir
                  </a>
                ) : (
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
