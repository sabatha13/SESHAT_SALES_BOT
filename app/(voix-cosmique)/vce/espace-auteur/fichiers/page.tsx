import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../_components/VCENav';
import { vceLogout } from '../../actions/auth';
import { validerFichier } from '../../actions/fichiers';
import UploadFichierForm from './_components/UploadFichierForm';

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
  commande_id: string | null;
  vce_commandes_services: { titre: string } | null;
}

interface Commande {
  id: string;
  titre: string;
  statut: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
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

// ─── Ligne fichier ─────────────────────────────────────────────────────────────

function FichierRow({
  fichier,
  avecValidation,
  signedUrl,
}: {
  fichier: Fichier;
  avecValidation: boolean;
  signedUrl: string | null;
}) {
  const commandeTitre = fichier.vce_commandes_services?.titre ?? '—';
  const nonValide = avecValidation && !fichier.valide_par_auteur;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.875rem 1.25rem',
        background: nonValide ? '#FFFBEB' : undefined,
        borderLeft: nonValide ? '3px solid #B5A020' : '3px solid transparent',
      }}
    >
      {/* Icône type */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          background: '#E8DFB0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '1rem',
        }}
      >
        📄
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#3D2B1A',
            margin: '0 0 0.15rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fichier.nom_fichier}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            color: '#8A7818',
            margin: 0,
          }}
        >
          {commandeTitre} · {formatBytes(fichier.taille_bytes)} · {formatDate(fichier.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
        }}
      >
        {fichier.valide_par_auteur && (
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              background: '#DCFCE7',
              color: '#166534',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
            }}
          >
            VALIDÉ
          </span>
        )}

        {nonValide && (
          <form action={validerFichier}>
            <input type="hidden" name="fichierId" value={fichier.id} />
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#B5A020',
                color: '#FAF3E0',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Valider
            </button>
          </form>
        )}

        <a
          href={signedUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: signedUrl ? '#8A7818' : '#C4B08A',
            textDecoration: 'none',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            pointerEvents: signedUrl ? 'auto' : 'none',
          }}
        >
          Télécharger
        </a>
      </div>
    </div>
  );
}

// ─── Section fichiers ──────────────────────────────────────────────────────────

function SectionFichiers({
  titre,
  fichiers,
  avecValidation,
  vide,
  signedUrlMap,
}: {
  titre: string;
  fichiers: Fichier[];
  avecValidation: boolean;
  vide: string;
  signedUrlMap: Map<string, string>;
}) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#3D2B1A',
          margin: '0 0 1rem',
        }}
      >
        {titre}
        {fichiers.length > 0 && (
          <span
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              fontWeight: 400,
              color: '#8A7818',
              marginLeft: '0.5rem',
            }}
          >
            ({fichiers.length})
          </span>
        )}
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
              margin: 0,
            }}
          >
            {vide}
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
          {fichiers.map((f, idx) => (
            <div
              key={f.id}
              style={{
                borderBottom: idx < fichiers.length - 1 ? '1px solid #E8DFB0' : 'none',
              }}
            >
              <FichierRow
                fichier={f}
                avecValidation={avecValidation}
                signedUrl={signedUrlMap.get(f.url) ?? null}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FichiersPage() {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  // Étape 1 — toutes les commandes de l'auteur (pour le filtre fichiers + le select upload)
  const { data: commandesData } = await supabase
    .from('vce_commandes_services')
    .select('id, titre, statut')
    .eq('auteur_id', auteur.id)
    .order('created_at', { ascending: false });

  const toutes = (commandesData ?? []) as Commande[];
  const idsFilter =
    toutes.length > 0
      ? toutes.map((c) => c.id)
      : ['00000000-0000-0000-0000-000000000000'];

  // Commandes actives pour le formulaire d'upload
  const commandesActives = toutes.filter((c) => c.statut !== 'termine');

  // Étape 2 — tous les fichiers liés aux commandes de l'auteur
  const { data: fichiersData } = await supabase
    .from('vce_fichiers')
    .select(
      'id, nom_fichier, url, taille_bytes, type_fichier, envoye_par, valide_par_auteur, created_at, commande_id, vce_commandes_services(titre)',
    )
    .in('commande_id', idsFilter)
    .order('created_at', { ascending: false });

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

  const fichiersAuteur = fichiers.filter((f) => f.envoye_par === 'auteur');
  const fichiersVCE = fichiers.filter((f) => f.envoye_par !== 'auteur');
  const aValider = fichiersVCE.filter((f) => !f.valide_par_auteur);

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
                  color: item.href === '/espace-auteur/fichiers' ? '#FAF3E0' : '#C4B08A',
                  textDecoration: 'none',
                  padding: '0.875rem 1rem',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  borderBottom:
                    item.href === '/espace-auteur/fichiers'
                      ? '2px solid #B5A020'
                      : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {item.label}
                {item.href === '/espace-auteur/fichiers' && aValider.length > 0 && (
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
                    {aValider.length}
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
            <h1
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: 0,
              }}
            >
              Mes fichiers
            </h1>
          </div>

          {/* Formulaire d'upload */}
          <UploadFichierForm commandes={commandesActives} />

          {/* Livrables à valider — banner prioritaire si présents */}
          {aValider.length > 0 && (
            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #B5A020',
                borderRadius: '8px',
                padding: '0.875rem 1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span
                style={{
                  background: '#B5A020',
                  color: '#FAF3E0',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                {aValider.length} livrable{aValider.length > 1 ? 's' : ''} à valider
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.8rem',
                  color: '#3D2B1A',
                  margin: 0,
                }}
              >
                L'équipe VCE a déposé{' '}
                {aValider.length > 1 ? 'des livrables' : 'un livrable'} en attente de votre
                validation.
              </p>
            </div>
          )}

          {/* Livrables de l'équipe VCE */}
          <SectionFichiers
            titre="Livrables de l'équipe VCE"
            fichiers={fichiersVCE}
            avecValidation={true}
            vide="Aucun livrable reçu de l'équipe VCE pour l'instant."
            signedUrlMap={signedUrlMap}
          />

          {/* Fichiers envoyés par l'auteur */}
          <SectionFichiers
            titre="Vos fichiers envoyés"
            fichiers={fichiersAuteur}
            avecValidation={false}
            vide="Vous n'avez encore envoyé aucun fichier."
            signedUrlMap={signedUrlMap}
          />
        </div>
      </main>
    </>
  );
}
