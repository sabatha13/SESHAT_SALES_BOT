import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../../_components/VCENav';
import { vceLogout } from '../../../actions/auth';
import { marquerLus } from '../../../actions/messagerie';
import FilDiscussion from './_components/FilDiscussion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MessageData {
  id: string;
  commande_id: string | null;
  expediteur: string;
  expediteur_nom: string | null;
  contenu: string;
  lu: boolean | null;
  created_at: string | null;
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

export default async function FilMessagerieePage({
  params,
}: {
  params: { commandeId: string };
}) {
  const auteur = await getVceAuteur();
  // Le JWT est passé au Client Component pour l'auth Realtime — même trade-off que CommandeRealtime.
  // Voir audit sécurité 30 juin 2026.
  const token = cookies().get('vce_auth_session')?.value ?? '';
  const supabase = createServerClient();

  // Vérification propriété — 404 si la commande n'appartient pas à cet auteur
  const { data: commande } = await supabase
    .from('vce_commandes_services')
    .select('id, titre')
    .eq('id', params.commandeId)
    .eq('auteur_id', auteur.id)
    .single();

  if (!commande) notFound();

  const { data: messagesData } = await supabase
    .from('vce_messages')
    .select('id, commande_id, expediteur, expediteur_nom, contenu, lu, created_at')
    .eq('commande_id', commande.id)
    .order('created_at', { ascending: true });

  const messages = (messagesData ?? []) as MessageData[];

  // Marque les messages VCE comme lus dès l'ouverture du fil
  await marquerLus(commande.id);

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
                }}
              >
                {item.label}
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
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            padding: '2.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 120px)',
          }}
        >
          {/* Fil d'ariane */}
          <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
            <Link
              href="/espace-auteur/messagerie"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#8A7818',
                textDecoration: 'none',
              }}
            >
              ← Messagerie
            </Link>
          </div>

          {/* En-tête */}
          <div style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#B5A020',
                margin: '0 0 0.4rem',
              }}
            >
              Fil de discussion
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: 0,
              }}
            >
              {commande.titre}
            </h1>
          </div>

          {/* Fil Realtime — occupe le reste de la hauteur */}
          <FilDiscussion
            commandeId={commande.id}
            messagesInitiaux={messages}
            token={token}
          />
        </div>
      </main>
    </>
  );
}
