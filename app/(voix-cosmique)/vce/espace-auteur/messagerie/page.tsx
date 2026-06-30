import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../_components/VCENav';
import { vceLogout } from '../../actions/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Commande {
  id: string;
  titre: string;
  statut: string;
}

interface Message {
  id: string;
  commande_id: string | null;
  expediteur: string;
  contenu: string;
  lu: boolean | null;
  created_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 24) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MessageriePage() {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const { data: commandesData } = await supabase
    .from('vce_commandes_services')
    .select('id, titre, statut')
    .eq('auteur_id', auteur.id)
    .order('created_at', { ascending: false });

  const commandes = (commandesData ?? []) as Commande[];
  const commandeIds =
    commandes.length > 0
      ? commandes.map((c) => c.id)
      : ['00000000-0000-0000-0000-000000000000'];

  const { data: messagesData } = await supabase
    .from('vce_messages')
    .select('id, commande_id, expediteur, contenu, lu, created_at')
    .in('commande_id', commandeIds)
    .order('created_at', { ascending: false });

  const messages = (messagesData ?? []) as Message[];

  // Dernier message et compteur non-lus par commande
  const dernierParCommande = new Map<string, Message>();
  const nonLusParCommande = new Map<string, number>();

  for (const msg of messages) {
    if (!msg.commande_id) continue;
    if (!dernierParCommande.has(msg.commande_id)) {
      dernierParCommande.set(msg.commande_id, msg);
    }
    if (msg.expediteur === 'vce' && !msg.lu) {
      nonLusParCommande.set(
        msg.commande_id,
        (nonLusParCommande.get(msg.commande_id) ?? 0) + 1,
      );
    }
  }

  const totalNonLus = [...nonLusParCommande.values()].reduce((a, b) => a + b, 0);

  return (
    <>
      <VCENav />

      {/* Sub-nav */}
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
                  color: item.href === '/espace-auteur/messagerie' ? '#FAF3E0' : '#C4B08A',
                  textDecoration: 'none',
                  padding: '0.875rem 1rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  borderBottom:
                    item.href === '/espace-auteur/messagerie'
                      ? '2px solid #B5A020'
                      : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {item.label}
                {item.href === '/espace-auteur/messagerie' && totalNonLus > 0 && (
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
                    {totalNonLus}
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

      <main style={{ background: '#FAF3E0', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

          <div style={{ marginBottom: '2rem' }}>
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
                margin: 0,
              }}
            >
              Messagerie
            </h1>
          </div>

          {commandes.length === 0 ? (
            <div
              style={{
                background: '#FFFEF5',
                border: '1px solid #E8DFB0',
                borderRadius: '8px',
                padding: '3rem 2rem',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.875rem',
                  color: '#6B4C2F',
                  margin: 0,
                }}
              >
                Aucune commande en cours. La messagerie sera disponible dès le début de votre projet.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: '#FFFEF5',
                border: '1px solid #E8DFB0',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {commandes.map((commande, idx) => {
                const dernier = dernierParCommande.get(commande.id);
                const nonLus = nonLusParCommande.get(commande.id) ?? 0;
                return (
                  <Link
                    key={commande.id}
                    href={`/espace-auteur/messagerie/${commande.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderBottom:
                        idx < commandes.length - 1 ? '1px solid #E8DFB0' : 'none',
                      textDecoration: 'none',
                      background: nonLus > 0 ? '#FFFBEB' : 'transparent',
                    }}
                  >
                    {/* Indicateur non-lus */}
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: nonLus > 0 ? '#B5A020' : '#E8DFB0',
                        flexShrink: 0,
                      }}
                    />

                    {/* Infos fil */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <p
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.875rem',
                            fontWeight: nonLus > 0 ? 700 : 500,
                            color: '#3D2B1A',
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {commande.titre}
                        </p>
                        <span
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.7rem',
                            color: '#8A7818',
                            flexShrink: 0,
                          }}
                        >
                          {dernier ? formatDate(dernier.created_at) : '—'}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.8rem',
                          color: nonLus > 0 ? '#3D2B1A' : '#8A7818',
                          fontWeight: nonLus > 0 ? 500 : 400,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {dernier
                          ? `${dernier.expediteur === 'auteur' ? 'Vous' : 'VCE'} : ${dernier.contenu}`
                          : 'Aucun message — commencez la discussion'}
                      </p>
                    </div>

                    {/* Badge non-lus */}
                    {nonLus > 0 && (
                      <span
                        style={{
                          background: '#B5A020',
                          color: '#FAF3E0',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          flexShrink: 0,
                        }}
                      >
                        {nonLus}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
