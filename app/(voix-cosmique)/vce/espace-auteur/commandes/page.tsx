import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../_components/VCENav';
import { vceLogout } from '../../actions/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandeService {
  id: string;
  titre: string;
  statut: string;
  progression: number;
  date_livraison_estimee: string | null;
  date_livraison_reelle: string | null;
  montant_total: number | null;
  created_at: string;
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

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/espace-auteur', label: 'Tableau de bord' },
  { href: '/espace-auteur/commandes', label: 'Mes commandes' },
  { href: '/espace-auteur/fichiers', label: 'Mes fichiers' },
  { href: '/espace-auteur/messagerie', label: 'Messagerie' },
  { href: '/espace-auteur/paiements', label: 'Paiements' },
  { href: '/espace-auteur/parametres', label: 'Paramètres' },
];

// ─── Card commande ─────────────────────────────────────────────────────────────

function CommandeCard({ commande, termine }: { commande: CommandeService; termine: boolean }) {
  const couleurs = STATUT_COLORS[commande.statut] ?? { bg: '#F3F4F6', text: '#374151' };
  return (
    <Link href={`/espace-auteur/commandes/${commande.id}`} style={{ textDecoration: 'none' }}>
      <article
        style={{
          background: '#FFFEF5',
          border: '1px solid #E8DFB0',
          borderRadius: '8px',
          padding: '1.25rem 1.5rem',
          opacity: termine ? 0.75 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '0.875rem',
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#3D2B1A',
                margin: '0 0 0.25rem',
              }}
            >
              {commande.titre}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: '#8A7818',
                margin: 0,
              }}
            >
              Démarré le {formatDate(commande.created_at)}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
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
              }}
            >
              {STATUT_LABELS[commande.statut] ?? commande.statut}
            </span>
            {commande.montant_total !== null && (
              <span
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#3D2B1A',
                }}
              >
                {parseFloat(String(commande.montant_total)).toFixed(0)} $
              </span>
            )}
          </div>
        </div>

        {/* Progression — affichée uniquement pour les projets actifs */}
        {!termine && (
          <>
            <div
              style={{
                background: '#E8DFB0',
                borderRadius: '999px',
                height: '5px',
                overflow: 'hidden',
                marginBottom: '0.4rem',
              }}
            >
              <div
                style={{
                  background: '#B5A020',
                  height: '100%',
                  width: `${commande.progression ?? 0}%`,
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
                  color: '#8A7818',
                  fontWeight: 600,
                }}
              >
                {commande.progression ?? 0} %
              </span>
              {commande.date_livraison_estimee && (
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.7rem',
                    color: '#6B4C2F',
                  }}
                >
                  Livraison estimée : {formatDate(commande.date_livraison_estimee)}
                </span>
              )}
            </div>
          </>
        )}

        {/* Pour les terminées, on affiche la date de livraison réelle */}
        {termine && commande.date_livraison_reelle && (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.75rem',
              color: '#3A9E6E',
              margin: 0,
            }}
          >
            Livré le {formatDate(commande.date_livraison_reelle)}
          </p>
        )}
      </article>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CommandesPage() {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const { data: commandesData } = await supabase
    .from('vce_commandes_services')
    .select('id, titre, statut, progression, date_livraison_estimee, date_livraison_reelle, montant_total, created_at')
    .eq('auteur_id', auteur.id)
    .order('created_at', { ascending: false });

  const toutes = (commandesData ?? []) as CommandeService[];
  const actives = toutes.filter((c) => c.statut !== 'termine');
  const terminees = toutes.filter((c) => c.statut === 'termine');

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
                  color: item.href === '/espace-auteur/commandes' ? '#FAF3E0' : '#C4B08A',
                  textDecoration: 'none',
                  padding: '0.875rem 1rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  borderBottom: item.href === '/espace-auteur/commandes' ? '2px solid #B5A020' : '2px solid transparent',
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
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* En-tête */}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <h1
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  fontWeight: 700,
                  color: '#3D2B1A',
                  margin: 0,
                }}
              >
                Mes commandes
              </h1>
              <Link
                href="/soumettre"
                style={{
                  fontFamily: 'var(--font-inter)',
                  background: '#B5A020',
                  color: '#FAF3E0',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                + Nouveau projet
              </Link>
            </div>
          </div>

          {/* Commandes actives */}
          <section style={{ marginBottom: '3rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#3D2B1A',
                margin: '0 0 1rem',
              }}
            >
              En cours{actives.length > 0 ? ` (${actives.length})` : ''}
            </h2>

            {actives.length === 0 ? (
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
                    fontSize: '0.9rem',
                    color: '#6B4C2F',
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
                {actives.map((c) => (
                  <CommandeCard key={c.id} commande={c} termine={false} />
                ))}
              </div>
            )}
          </section>

          {/* Commandes terminées */}
          {terminees.length > 0 && (
            <section>
              <h2
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#3D2B1A',
                  margin: '0 0 1rem',
                }}
              >
                Terminées ({terminees.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {terminees.map((c) => (
                  <CommandeCard key={c.id} commande={c} termine={true} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
