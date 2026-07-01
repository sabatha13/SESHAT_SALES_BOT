export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

interface Livre {
  id: string;
  titre: string;
  auteur_id: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  prix_cents: number;
}

function formatPrix(cents: number): string {
  return `${(cents / 100).toFixed(2)} $`;
}

export default async function AdminLivresPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: livresData }, { data: auteursData }] = await Promise.all([
    supabase
      .from('vce_livres')
      .select('id, titre, auteur_id, is_published, is_featured, prix_cents')
      .order('created_at', { ascending: false }),
    supabase.from('vce_auteurs').select('id, prenom, nom, nom_plume'),
  ]);

  const livres = (livresData ?? []) as Livre[];
  const auteurMap = new Map(
    (auteursData ?? []).map((a) => [a.id, a.nom_plume || `${a.prenom} ${a.nom}`]),
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>
          Livres
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 400, color: 'var(--accent-or-texte)', marginLeft: '0.75rem' }}>
            ({livres.length})
          </span>
        </h1>
        <Link
          href="/admin/livres/nouveau"
          style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 600, background: 'var(--accent-or)', color: 'var(--n)', padding: '0.6rem 1.25rem', borderRadius: '4px', textDecoration: 'none' }}
        >
          + Ajouter un livre
        </Link>
      </div>

      {livres.length === 0 ? (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>
            Aucun livre. Commence par en ajouter un.
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.4fr 1fr 0.9fr 0.8fr 0.9fr',
              gap: '0 0.75rem',
              padding: '0.7rem 1.25rem',
              background: 'var(--or-pale)',
              borderBottom: '1px solid var(--carte-bordure)',
            }}
          >
            {['Titre', 'Auteur', 'Statut', 'Prix', 'À la une', 'Action'].map((col) => (
              <span key={col} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent-or-texte)' }}>
                {col}
              </span>
            ))}
          </div>

          {livres.map((l, idx) => (
            <div
              key={l.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.4fr 1fr 0.9fr 0.8fr 0.9fr',
                gap: '0 0.75rem',
                padding: '0.875rem 1.25rem',
                borderBottom: idx < livres.length - 1 ? '1px solid var(--or-pale)' : 'none',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', fontWeight: 500 }}>{l.titre}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)' }}>
                {l.auteur_id ? auteurMap.get(l.auteur_id) ?? '—' : '—'}
              </span>
              <span>
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: l.is_published ? '#DCFCE7' : 'var(--or-pale)',
                    color: l.is_published ? '#166534' : 'var(--accent-or-texte)',
                  }}
                >
                  {l.is_published ? 'Publié' : 'Brouillon'}
                </span>
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte-carte)', fontWeight: 600 }}>{formatPrix(l.prix_cents)}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: l.is_featured ? 'var(--accent-or-texte)' : 'var(--texte-carte-secondaire)' }}>
                {l.is_featured ? '★ Oui' : '—'}
              </span>
              <span>
                <Link href={`/admin/livres/${l.id}`} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--accent-or-texte)', fontWeight: 600, textDecoration: 'none' }}>
                  Modifier
                </Link>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
