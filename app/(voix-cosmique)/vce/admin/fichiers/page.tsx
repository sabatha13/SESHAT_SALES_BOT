export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

interface Fichier {
  id: string;
  nom_fichier: string;
  url: string;
  taille_bytes: number | null;
  envoye_par: string | null;
  valide_par_auteur: boolean | null;
  commande_id: string | null;
  auteur_id: string | null;
  created_at: string | null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminFichiersPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: fichiersData }, { data: commandesData }, { data: auteursData }] = await Promise.all([
    supabase
      .from('vce_fichiers')
      .select('id, nom_fichier, url, taille_bytes, envoye_par, valide_par_auteur, commande_id, auteur_id, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('vce_commandes_services').select('id, titre'),
    supabase.from('vce_auteurs').select('id, prenom, nom'),
  ]);

  const fichiers = (fichiersData ?? []) as Fichier[];
  const commandeMap = new Map((commandesData ?? []).map((c) => [c.id, c.titre]));
  const auteurMap = new Map((auteursData ?? []).map((a) => [a.id, `${a.prenom} ${a.nom}`]));

  // Signed URLs (bucket privé, 1h)
  const paths = fichiers.map((f) => f.url).filter(Boolean);
  const signedMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage.from('vce-manuscripts').createSignedUrls(paths, 3600);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
    }
  }

  return (
    <div style={{ padding: '2.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 2rem' }}>
        Fichiers
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 400, color: 'var(--accent-or-texte)', marginLeft: '0.75rem' }}>
          ({fichiers.length})
        </span>
      </h1>

      {fichiers.length === 0 ? (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun fichier.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.4fr 1.2fr 0.7fr 0.8fr 0.9fr 0.9fr',
              gap: '0 0.75rem',
              padding: '0.7rem 1.25rem',
              background: 'var(--or-pale)',
              borderBottom: '1px solid var(--carte-bordure)',
              minWidth: '860px',
            }}
          >
            {['Nom', 'Commande', 'Auteur', 'Taille', 'Source', 'Validé', 'Action'].map((col) => (
              <span key={col} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent-or-texte)' }}>
                {col}
              </span>
            ))}
          </div>

          {fichiers.map((f, idx) => (
            <div
              key={f.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.4fr 1.2fr 0.7fr 0.8fr 0.9fr 0.9fr',
                gap: '0 0.75rem',
                padding: '0.875rem 1.25rem',
                borderBottom: idx < fichiers.length - 1 ? '1px solid var(--or-pale)' : 'none',
                alignItems: 'center',
                minWidth: '860px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte-carte)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {f.nom_fichier}
                <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--texte-carte-secondaire)', fontWeight: 400 }}>{formatDate(f.created_at)}</span>
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>
                {f.commande_id ? commandeMap.get(f.commande_id) ?? '—' : '—'}
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>
                {f.auteur_id ? auteurMap.get(f.auteur_id) ?? '—' : '—'}
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>{formatBytes(f.taille_bytes)}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>{f.envoye_par === 'auteur' ? 'Auteur' : 'VCE'}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', fontWeight: 600, color: f.valide_par_auteur ? '#166534' : 'var(--texte-carte-secondaire)' }}>
                {f.valide_par_auteur ? '✓ Oui' : 'Non'}
              </span>
              <span>
                {signedMap.get(f.url) ? (
                  <a href={signedMap.get(f.url)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--accent-or-texte)', fontWeight: 600, textDecoration: 'none' }}>
                    Télécharger
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
