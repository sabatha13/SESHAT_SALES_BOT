import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../_components/VCENav';
import { vceLogout } from '../actions/auth';
import BandeauPaiementSucces from './_components/BandeauPaiementSucces';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandeService {
  id: string;
  titre: string;
  statut: string;
  progression: number;
  date_livraison_estimee: string | null;
}

interface MessageNonLu {
  id: string;
  contenu: string;
  expediteur_nom: string | null;
  created_at: string;
  vce_commandes_services: { titre: string } | null;
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

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  briefing: { bg: '#FEF3C7', text: '#92400E' },
  devis_envoye: { bg: '#DBEAFE', text: '#1E40AF' },
  production: { bg: '#EDE9FE', text: '#5B21B6' },
  revision: { bg: '#FEF9C3', text: '#713F12' },
  livre: { bg: '#DCFCE7', text: '#166534' },
  termine: { bg: '#F3F4F6', text: '#374151' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Sub-navigation espace auteur ─────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/espace-auteur', label: 'Tableau de bord' },
  { href: '/espace-auteur/commandes', label: 'Mes commandes' },
  { href: '/espace-auteur/fichiers', label: 'Mes fichiers' },
  { href: '/espace-auteur/messagerie', label: 'Messagerie' },
  { href: '/espace-auteur/paiements', label: 'Paiements' },
  { href: '/espace-auteur/parametres', label: 'Paramètres' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { payment?: string; commande?: string };
}

export default async function EspaceAuteurPage({ searchParams }: PageProps) {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  // Étape 1 — IDs des commandes de l'auteur (nécessaire pour filtrer les messages)
  const { data: commandeRows } = await supabase
    .from('vce_commandes_services')
    .select('id')
    .eq('auteur_id', auteur.id);

  const commandeIds = (commandeRows ?? []).map((c) => c.id);
  // UUID impossible utilisé comme filtre vide pour éviter une requête sans .in()
  const idsFilter = commandeIds.length > 0
    ? commandeIds
    : ['00000000-0000-0000-0000-000000000000'];

  // Étape 2 — Toutes les données en parallèle
  const [
    { count: commandesActives },
    { count: livresPublies },
    { count: messagesNonLusCount },
    { data: commandes },
    { data: derniersMessages },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from('vce_commandes_services')
      .select('id', { count: 'exact', head: true })
      .eq('auteur_id', auteur.id)
      .neq('statut', 'termine'),

    supabase
      .from('vce_livres')
      .select('id', { count: 'exact', head: true })
      .eq('auteur_id', auteur.id)
      .eq('is_published', true),

    supabase
      .from('vce_messages')
      .select('id', { count: 'exact', head: true })
      .in('commande_id', idsFilter)
      .eq('lu', false)
      .neq('expediteur', 'auteur'),

    supabase
      .from('vce_commandes_services')
      .select('id, titre, statut, progression, date_livraison_estimee')
      .eq('auteur_id', auteur.id)
      .neq('statut', 'termine')
      .order('created_at', { ascending: false })
      .limit(5),

    supabase
      .from('vce_messages')
      .select('id, contenu, expediteur_nom, created_at, vce_commandes_services(titre)')
      .in('commande_id', idsFilter)
      .eq('lu', false)
      .neq('expediteur', 'auteur')
      .order('created_at', { ascending: false })
      .limit(1),

    supabase
      .from('vce_transactions')
      .select('montant')
      .eq('auteur_id', auteur.id)
      .eq('statut', 'confirme'),
  ]);

  const projetsList = (commandes ?? []) as CommandeService[];
  const dernierMessage = (derniersMessages ?? [])[0] as MessageNonLu | undefined;
  const totalInvesti = (transactions ?? []).reduce(
    (sum, t) => sum + parseFloat(String(t.montant ?? 0)),
    0,
  );
  const nomAffiche = auteur.nom_plume ?? `${auteur.prenom} ${auteur.nom}`;
  const nbNonLus = messagesNonLusCount ?? 0;

  return (
    <>
      <VCENav />

      {searchParams.payment === 'success' && searchParams.commande && (
        <BandeauPaiementSucces commandeId={searchParams.commande} />
      )}

      {/* ── Sub-nav espace auteur ───────────────────────────────────────────── */}
      <div style={{ background: '#3D2B1A', borderBottom: '1px solid rgba(181,160,32,0.2)' }}>
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
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.8rem',
                  color: '#C4B08A',
                  textDecoration: 'none',
                  padding: '0.875rem 1rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {item.label}
                {item.href === '/espace-auteur/messagerie' && nbNonLus > 0 && (
                  <span
                    style={{
                      background: '#B5A020',
                      color: '#FAF3E0',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      lineHeight: 1.4,
                    }}
                  >
                    {nbNonLus}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <form action={vceLogout}>
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#8A7818',
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

      {/* ── Contenu principal ──────────────────────────────────────────────── */}
      <main style={{ background: '#FAF3E0', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* En-tête */}
          <div style={{ marginBottom: '2.5rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#B5A020',
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
                color: '#3D2B1A',
                margin: '0 0 0.25rem',
              }}
            >
              Bonjour, {nomAffiche}
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#6B4C2F',
                margin: 0,
              }}
            >
              Voici l'état de vos projets éditoriaux.
            </p>
          </div>

          {/* ── KPIs ─────────────────────────────────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            {[
              {
                label: 'Projets actifs',
                value: commandesActives ?? 0,
                href: '/espace-auteur/commandes',
                money: false,
              },
              {
                label: 'Livres publiés',
                value: livresPublies ?? 0,
                href: null,
                money: false,
              },
              {
                label: 'Messages non lus',
                value: nbNonLus,
                href: '/espace-auteur/messagerie',
                money: false,
              },
              {
                label: 'Total investi',
                value: totalInvesti,
                href: '/espace-auteur/paiements',
                money: true,
              },
            ].map((kpi) => {
              const card = (
                <div
                  style={{
                    background: 'var(--carte)',
                    border: '1px solid var(--carte-bordure)',
                    borderRadius: '8px',
                    padding: '1.5rem',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--texte-carte-secondaire)',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    {kpi.label}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: 'var(--texte-carte)',
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {kpi.money ? `${totalInvesti.toFixed(0)} $` : kpi.value}
                  </p>
                </div>
              );

              return kpi.href ? (
                <Link key={kpi.label} href={kpi.href} style={{ textDecoration: 'none' }}>
                  {card}
                </Link>
              ) : (
                <div key={kpi.label}>{card}</div>
              );
            })}
          </div>

          {/* ── Projets + Messagerie ──────────────────────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Projets en cours */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: '#3D2B1A',
                    margin: 0,
                  }}
                >
                  Projets en cours
                </h2>
                {projetsList.length > 0 && (
                  <Link
                    href="/espace-auteur/commandes"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.8rem',
                      color: '#8A7818',
                      textDecoration: 'none',
                    }}
                  >
                    Voir tout →
                  </Link>
                )}
              </div>

              {projetsList.length === 0 ? (
                <div
                  style={{
                    background: 'var(--carte)',
                    border: '1px solid var(--carte-bordure)',
                    borderRadius: '8px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.9rem',
                      color: 'var(--texte-carte-secondaire)',
                      marginBottom: '1.5rem',
                    }}
                  >
                    Aucun projet en cours.
                  </p>
                  <Link
                    href="/soumettre"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      background: '#B5A020',
                      color: '#FAF3E0',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    Soumettre un manuscrit
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {projetsList.map((projet) => {
                    const couleurs = STATUT_COLORS[projet.statut] ?? {
                      bg: '#F3F4F6',
                      text: '#374151',
                    };
                    return (
                      <Link
                        key={projet.id}
                        href={`/espace-auteur/commandes/${projet.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <article
                          style={{
                            background: 'var(--carte)',
                            border: '1px solid var(--carte-bordure)',
                            borderRadius: '8px',
                            padding: '1.25rem 1.5rem',
                          }}
                        >
                          {/* Titre + badge statut */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              marginBottom: '0.875rem',
                            }}
                          >
                            <h3
                              style={{
                                fontFamily: 'var(--font-playfair)',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: 'var(--texte-carte)',
                                margin: 0,
                                flex: 1,
                              }}
                            >
                              {projet.titre}
                            </h3>
                            <span
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                background: couleurs.bg,
                                color: couleurs.text,
                                padding: '0.2rem 0.6rem',
                                borderRadius: '999px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {STATUT_LABELS[projet.statut] ?? projet.statut}
                            </span>
                          </div>

                          {/* Barre de progression */}
                          <div
                            style={{
                              background: '#E8DFB0',
                              borderRadius: '999px',
                              height: '5px',
                              overflow: 'hidden',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <div
                              style={{
                                background: '#B5A020',
                                height: '100%',
                                width: `${projet.progression ?? 0}%`,
                                borderRadius: '999px',
                              }}
                            />
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '0.7rem',
                                color: 'var(--texte-carte-secondaire)',
                                fontWeight: 600,
                              }}
                            >
                              {projet.progression ?? 0} %
                            </span>
                            {projet.date_livraison_estimee && (
                              <span
                                style={{
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.7rem',
                                  color: 'var(--texte-carte-secondaire)',
                                }}
                              >
                                Livraison : {formatDate(projet.date_livraison_estimee)}
                              </span>
                            )}
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* CTA Nouveau projet */}
              <div style={{ marginTop: '1.25rem' }}>
                <Link
                  href="/soumettre"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    display: 'inline-block',
                    background: '#B5A020',
                    color: '#FAF3E0',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                  }}
                >
                  + Nouveau projet
                </Link>
              </div>
            </section>

            {/* Messagerie */}
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: '#3D2B1A',
                    margin: 0,
                  }}
                >
                  Messagerie
                </h2>
                {nbNonLus > 0 && (
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      color: '#8A7818',
                    }}
                  >
                    {nbNonLus} non lu{nbNonLus > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {dernierMessage ? (
                <Link href="/espace-auteur/messagerie" style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: 'var(--carte)',
                      border: '1px solid var(--carte-bordure)',
                      borderLeft: '3px solid #B5A020',
                      borderRadius: '8px',
                      padding: '1.25rem 1.5rem',
                    }}
                  >
                    {/* Expéditeur */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#3D2B1A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          color: '#B5A020',
                          flexShrink: 0,
                          letterSpacing: '0.05em',
                        }}
                      >
                        VCE
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--texte-carte)',
                            margin: 0,
                          }}
                        >
                          {dernierMessage.expediteur_nom ?? 'Équipe VCE'}
                        </p>
                        {dernierMessage.vce_commandes_services?.titre && (
                          <p
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.7rem',
                              color: 'var(--texte-carte-secondaire)',
                              margin: 0,
                            }}
                          >
                            {dernierMessage.vce_commandes_services.titre}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Extrait du message */}
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.85rem',
                        color: 'var(--texte-carte)',
                        lineHeight: 1.55,
                        margin: '0 0 0.75rem',
                      }}
                    >
                      {dernierMessage.contenu.length > 120
                        ? `${dernierMessage.contenu.slice(0, 120)}…`
                        : dernierMessage.contenu}
                    </p>

                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.7rem',
                        color: 'var(--texte-carte-secondaire)',
                        margin: 0,
                      }}
                    >
                      {formatDate(dernierMessage.created_at)}
                    </p>
                  </div>
                </Link>
              ) : (
                <div
                  style={{
                    background: 'var(--carte)',
                    border: '1px solid var(--carte-bordure)',
                    borderRadius: '8px',
                    padding: '2.5rem 2rem',
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
                    Aucun message non lu.
                  </p>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                <Link
                  href="/espace-auteur/messagerie"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8rem',
                    color: '#8A7818',
                    textDecoration: 'none',
                  }}
                >
                  Toute la messagerie →
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
