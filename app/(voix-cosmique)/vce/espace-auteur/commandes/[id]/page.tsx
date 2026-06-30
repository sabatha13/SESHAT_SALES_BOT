import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../../_components/VCENav';
import { vceLogout } from '../../../actions/auth';
import CommandeRealtime, {
  type CommandeData,
  type EtapeData,
} from '../_components/CommandeRealtime';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Fichier {
  id: string;
  nom_fichier: string;
  url: string;
  taille_bytes: number | null;
  type_fichier: string | null;
  envoye_par: string | null;
  valide_par_auteur: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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

export default async function CommandeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  // Vérification propriété incluse dans la requête (.eq auteur_id) — 404 si l'ID ne correspond pas
  const { data: commande } = await supabase
    .from('vce_commandes_services')
    .select(
      'id, titre, statut, progression, date_debut, date_livraison_estimee, date_livraison_reelle, montant_total, acompte_paye, solde_restant, created_at',
    )
    .eq('id', params.id)
    .eq('auteur_id', auteur.id)
    .single();

  if (!commande) notFound();

  // Étapes + fichiers en parallèle
  const [{ data: etapesData }, { data: fichiersData }] = await Promise.all([
    supabase
      .from('vce_etapes')
      .select('id, titre, description, statut, ordre')
      .eq('commande_id', commande.id)
      .order('ordre', { ascending: true, nullsFirst: false }),

    supabase
      .from('vce_fichiers')
      .select('id, nom_fichier, url, taille_bytes, type_fichier, envoye_par, valide_par_auteur, created_at')
      .eq('commande_id', commande.id)
      .order('created_at', { ascending: false }),
  ]);

  const etapes = (etapesData ?? []) as EtapeData[];
  const fichiers = (fichiersData ?? []) as Fichier[];

  // Signed URLs pour les téléchargements (bucket privé, expiry 1h)
  const fichierPaths = fichiers.map((f) => f.url).filter(Boolean);
  const signedUrlMap = new Map<string, string>();
  if (fichierPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('vce-manuscripts')
      .createSignedUrls(fichierPaths, 3600);
    for (const item of signed ?? []) {
      if (item.signedUrl) signedUrlMap.set(item.path, item.signedUrl);
    }
  }

  // Données initiales passées au composant Realtime
  const commandeInitiale: CommandeData = {
    id: commande.id,
    titre: commande.titre,
    statut: commande.statut ?? 'briefing',
    progression: commande.progression ?? 0,
    date_livraison_estimee: commande.date_livraison_estimee,
  };

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
                  borderBottom:
                    item.href === '/espace-auteur/commandes'
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
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* Fil d'ariane */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Link
              href="/espace-auteur/commandes"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#8A7818',
                textDecoration: 'none',
              }}
            >
              ← Mes commandes
            </Link>
          </div>

          {/* En-tête commande */}
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
              Commande · {formatDate(commande.created_at)}
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: 0,
              }}
            >
              {commande.titre}
            </h1>
          </div>

          {/* Infos financières + dates */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              marginBottom: '2rem',
            }}
          >
            {[
              {
                label: 'Montant total',
                value:
                  commande.montant_total !== null
                    ? `${parseFloat(String(commande.montant_total)).toFixed(0)} $`
                    : 'À définir',
              },
              {
                label: 'Acompte versé',
                value:
                  commande.acompte_paye !== null
                    ? `${parseFloat(String(commande.acompte_paye)).toFixed(0)} $`
                    : '0 $',
              },
              {
                label: 'Solde restant',
                value:
                  commande.solde_restant !== null
                    ? `${parseFloat(String(commande.solde_restant)).toFixed(0)} $`
                    : '—',
              },
              {
                label: 'Date de début',
                value: formatDate(commande.date_debut),
              },
              {
                label: 'Livraison estimée',
                value: formatDate(commande.date_livraison_estimee),
              },
              ...(commande.date_livraison_reelle
                ? [{ label: 'Livré le', value: formatDate(commande.date_livraison_reelle) }]
                : []),
            ].map((info) => (
              <div
                key={info.label}
                style={{
                  background: '#FFFEF5',
                  border: '1px solid #E8DFB0',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#8A7818',
                    margin: '0 0 0.3rem',
                  }}
                >
                  {info.label}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#3D2B1A',
                    margin: 0,
                  }}
                >
                  {info.value}
                </p>
              </div>
            ))}
          </div>

          {/* Grille principale : Realtime + Fichiers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            {/* Statut + progression + étapes — Realtime */}
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#3D2B1A',
                  margin: '0 0 1rem',
                }}
              >
                Avancement
              </h2>
              <CommandeRealtime
                commandeId={commande.id}
                commandeInitiale={commandeInitiale}
                etapesInitiales={etapes}
              />
            </div>

            {/* Fichiers — statiques (Tâche 3 : gestion complète) */}
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#3D2B1A',
                  margin: '0 0 1rem',
                }}
              >
                Fichiers ({fichiers.length})
              </h2>

              {fichiers.length === 0 ? (
                <div
                  style={{
                    background: '#FFFEF5',
                    border: '1px solid #E8DFB0',
                    borderRadius: '8px',
                    padding: '2rem',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      color: '#6B4C2F',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    Aucun fichier pour cette commande.
                  </p>
                  <Link
                    href="/espace-auteur/fichiers"
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.8rem',
                      color: '#8A7818',
                      textDecoration: 'none',
                    }}
                  >
                    Gérer les fichiers →
                  </Link>
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
                  {fichiers.map((f, idx) => (
                    <div
                      key={f.id}
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderBottom: idx < fichiers.length - 1 ? '1px solid #E8DFB0' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: '#3D2B1A',
                            margin: '0 0 0.15rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {f.nom_fichier}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.7rem',
                            color: '#8A7818',
                            margin: 0,
                          }}
                        >
                          {formatBytes(f.taille_bytes)} ·{' '}
                          {f.envoye_par === 'auteur' ? 'Envoyé par vous' : 'Équipe VCE'} ·{' '}
                          {formatDate(f.created_at)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        {f.valide_par_auteur && (
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              background: '#DCFCE7',
                              color: '#166534',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '999px',
                            }}
                          >
                            VALIDÉ
                          </span>
                        )}
                        <a
                          href={signedUrlMap.get(f.url) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.75rem',
                            color: signedUrlMap.has(f.url) ? '#8A7818' : '#C4B08A',
                            textDecoration: 'none',
                            fontWeight: 500,
                            pointerEvents: signedUrlMap.has(f.url) ? 'auto' : 'none',
                          }}
                        >
                          Télécharger
                        </a>
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderTop: '1px solid #E8DFB0',
                      textAlign: 'right',
                    }}
                  >
                    <Link
                      href="/espace-auteur/fichiers"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8rem',
                        color: '#8A7818',
                        textDecoration: 'none',
                      }}
                    >
                      Gérer tous les fichiers →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
