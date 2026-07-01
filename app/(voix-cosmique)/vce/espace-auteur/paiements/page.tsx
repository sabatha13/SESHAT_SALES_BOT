export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../_components/VCENav';
import { vceLogout } from '../../actions/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandePaiement {
  id: string;
  titre: string;
  montant_total: number | null;
  acompte_paye: number | null;
  solde_restant: number | null;
  statut: string;
}

interface Transaction {
  id: string;
  commande_id: string | null;
  type_paiement: string | null;
  mode_paiement: string | null;
  montant: number;
  statut: string | null;
  facture_url: string | null;
  created_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/espace-auteur', label: 'Tableau de bord' },
  { href: '/espace-auteur/commandes', label: 'Mes commandes' },
  { href: '/espace-auteur/fichiers', label: 'Mes fichiers' },
  { href: '/espace-auteur/messagerie', label: 'Messagerie' },
  { href: '/espace-auteur/paiements', label: 'Paiements' },
  { href: '/espace-auteur/parametres', label: 'Paramètres' },
];

const ACTIVE_HREF = '/espace-auteur/paiements';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PaiementsPage() {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const [{ data: commandesData }, { data: transactionsData }] = await Promise.all([
    supabase
      .from('vce_commandes_services')
      .select('id, titre, montant_total, acompte_paye, solde_restant, statut')
      .eq('auteur_id', auteur.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('vce_transactions')
      .select('id, commande_id, type_paiement, mode_paiement, montant, statut, facture_url, created_at')
      .eq('auteur_id', auteur.id)
      .order('created_at', { ascending: false }),
  ]);

  const commandes = (commandesData ?? []) as CommandePaiement[];
  const transactions = (transactionsData ?? []) as Transaction[];

  const totalEngage = commandes.reduce((s, c) => s + parseFloat(String(c.montant_total ?? 0)), 0);
  const totalPaye = commandes.reduce((s, c) => s + parseFloat(String(c.acompte_paye ?? 0)), 0);
  const soldeTotal = commandes.reduce((s, c) => s + parseFloat(String(c.solde_restant ?? 0)), 0);

  const kpis = [
    { label: 'Total engagé', valeur: formatMontant(totalEngage) },
    { label: 'Total payé', valeur: formatMontant(totalPaye) },
    { label: 'Solde restant', valeur: formatMontant(soldeTotal) },
  ];

  return (
    <>
      <VCENav />

      {/* Sub-nav */}
      <div style={{ background: 'var(--bandeau-fond)', borderBottom: '1px solid var(--or-pale)' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            overflowX: 'auto',
          }}
        >
          <nav style={{ display: 'flex' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === ACTIVE_HREF;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8rem',
                    color: isActive ? 'var(--bandeau-texte)' : 'var(--or)',
                    textDecoration: 'none',
                    padding: '0.875rem 1rem',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                    borderBottom: isActive ? '2px solid var(--accent-or)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action={vceLogout}>
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: 'var(--or)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                padding: '0.875rem 0 0.875rem 1rem',
              }}
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* En-tête */}
          <div style={{ marginBottom: '2rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--or)',
                margin: '0 0 0.5rem',
              }}
            >
              Espace Auteur
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 700,
                color: 'var(--brun)',
                margin: 0,
              }}
            >
              Paiements
            </h1>
          </div>

          {/* ── Section 1 — Résumé financier ─────────────────────────────────── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--brun)',
                margin: '0 0 1rem',
              }}
            >
              Résumé financier
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
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
                      letterSpacing: '0.12em',
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
                      fontSize: '1.5rem',
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
          </section>

          {/* ── Section 2 — État des paiements par commande ───────────────────── */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--brun)',
                margin: '0 0 1rem',
              }}
            >
              Mes commandes — état des paiements
            </h2>

            {commandes.length === 0 ? (
              <div
                style={{
                  background: 'var(--carte)',
                  border: '1px solid var(--carte-bordure)',
                  borderRadius: '8px',
                  padding: '2.5rem',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: 'var(--texte-carte-secondaire)',
                    margin: 0,
                  }}
                >
                  Aucune commande pour l'instant.{' '}
                  <Link href="/soumettre" style={{ color: 'var(--accent-or-texte)', fontWeight: 600 }}>
                    Soumettre un manuscrit →
                  </Link>
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {commandes.map((commande) => {
                  const montant = parseFloat(String(commande.montant_total ?? 0));
                  const acompte = parseFloat(String(commande.acompte_paye ?? 0));
                  const solde = parseFloat(String(commande.solde_restant ?? 0));
                  const showBoutonSolde = solde > 0 && commande.statut === 'production';

                  return (
                    <div
                      key={commande.id}
                      style={{
                        background: 'var(--carte)',
                        border: '1px solid var(--carte-bordure)',
                        borderRadius: '8px',
                        padding: '1.25rem 1.5rem',
                      }}
                    >
                      {/* Ligne titre + statut */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          marginBottom: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              fontFamily: 'var(--font-playfair)',
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: 'var(--brun)',
                              margin: '0 0 0.35rem',
                            }}
                          >
                            {commande.titre}
                          </h3>
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              background: 'var(--or-pale)',
                              color: 'var(--accent-or-texte)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                            }}
                          >
                            {STATUT_LABELS[commande.statut] ?? commande.statut}
                          </span>
                        </div>

                        {/* Montants */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '2rem',
                            flexShrink: 0,
                            flexWrap: 'wrap',
                            alignItems: 'flex-start',
                          }}
                        >
                          {[
                            { label: 'Total', valeur: formatMontant(montant), muted: false },
                            {
                              label: 'Acompte',
                              valeur: acompte > 0 ? `${formatMontant(acompte)} ✦` : formatMontant(acompte),
                              muted: acompte === 0,
                            },
                            { label: 'Solde', valeur: formatMontant(solde), muted: false },
                          ].map(({ label, valeur, muted }) => (
                            <div key={label} style={{ textAlign: 'right' }}>
                              <p
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.65rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  color: 'var(--accent-or-texte)',
                                  margin: '0 0 0.2rem',
                                }}
                              >
                                {label}
                              </p>
                              <p
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.95rem',
                                  fontWeight: 600,
                                  color: muted ? 'var(--texte-carte-secondaire)' : 'var(--texte-carte)',
                                  margin: 0,
                                }}
                              >
                                {valeur}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bouton payer le solde (disabled) */}
                      {showBoutonSolde && (
                        <div
                          style={{
                            borderTop: '1px solid var(--carte-bordure)',
                            paddingTop: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.875rem',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.75rem',
                              color: 'var(--accent-or-texte)',
                              fontStyle: 'italic',
                            }}
                          >
                            Disponible prochainement
                          </span>
                          <button
                            disabled
                            title="Disponible prochainement"
                            style={{
                              fontFamily: 'var(--font-inter)',
                              background: 'var(--or-pale)',
                              color: 'var(--accent-or-texte)',
                              border: '1px solid var(--carte-bordure)',
                              padding: '0.6rem 1.25rem',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              cursor: 'not-allowed',
                              opacity: 0.65,
                            }}
                          >
                            Payer le solde — {formatMontant(solde)}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Section 3 — Historique des transactions ───────────────────────── */}
          <section>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--brun)',
                margin: '0 0 1rem',
              }}
            >
              Historique des transactions
            </h2>

            {transactions.length === 0 ? (
              <div
                style={{
                  background: 'var(--carte)',
                  border: '1px solid var(--carte-bordure)',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: 'var(--texte-carte-secondaire)',
                    margin: 0,
                  }}
                >
                  Aucune transaction pour l'instant.
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--carte)',
                  border: '1px solid var(--carte-bordure)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {/* En-tête tableau */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr',
                    gap: '0 0.75rem',
                    padding: '0.6rem 1.25rem',
                    background: 'var(--or-pale)',
                    borderBottom: '1px solid var(--carte-bordure)',
                  }}
                >
                  {['Date', 'Type', 'Montant', 'Statut', 'Reçu'].map((col) => (
                    <span
                      key={col}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--accent-or-texte)',
                      }}
                    >
                      {col}
                    </span>
                  ))}
                </div>

                {/* Lignes */}
                {transactions.map((tx, idx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr',
                      gap: '0 0.75rem',
                      padding: '0.875rem 1.25rem',
                      borderBottom:
                        idx < transactions.length - 1
                          ? '1px solid var(--carte-bordure)'
                          : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8rem',
                        color: 'var(--texte-carte)',
                      }}
                    >
                      {formatDate(tx.created_at)}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8rem',
                        color: 'var(--texte-carte-secondaire)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tx.type_paiement ?? '—'}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--texte-carte)',
                      }}
                    >
                      {formatMontant(parseFloat(String(tx.montant)))}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: 'var(--or-pale)',
                        color: 'var(--accent-or-texte)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                        display: 'inline-block',
                      }}
                    >
                      {tx.statut ?? '—'}
                    </span>
                    <span>
                      {tx.facture_url ? (
                        <a
                          href={tx.facture_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.8rem',
                            color: 'var(--accent-or-texte)',
                            fontWeight: 500,
                          }}
                        >
                          Voir →
                        </a>
                      ) : (
                        <span
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.8rem',
                            color: 'var(--texte-carte-secondaire)',
                          }}
                        >
                          —
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
