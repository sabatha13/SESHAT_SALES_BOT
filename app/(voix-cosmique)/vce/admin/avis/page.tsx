export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import { approuverAvis, rejeterAvis } from '../../actions/admin-avis';

interface Review {
  id: string;
  commande_id: string | null;
  auteur_id: string | null;
  note: number | null;
  commentaire: string | null;
  autorise_affichage: boolean | null;
  approuve_admin: boolean | null;
  created_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function etoiles(note: number | null): string {
  const n = note ?? 0;
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
}

export default async function AdminAvisPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: reviewsData }, { data: auteursData }] = await Promise.all([
    supabase.from('vce_reviews').select('*').order('created_at', { ascending: false }),
    supabase.from('vce_auteurs').select('id, prenom, nom'),
  ]);

  const reviews = (reviewsData ?? []) as Review[];
  const auteurMap = new Map((auteursData ?? []).map((a) => [a.id, `${a.prenom} ${a.nom}`]));

  return (
    <div style={{ padding: '2.5rem', maxWidth: '860px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 2rem' }}>
        Avis
        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 400, color: 'var(--accent-or-texte)', marginLeft: '0.75rem' }}>
          ({reviews.length})
        </span>
      </h1>

      {reviews.length === 0 ? (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun avis.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((r) => {
            const approuve = r.approuve_admin === true;
            return (
              <div key={r.id} style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--accent-or)', letterSpacing: '0.1em' }}>{etoiles(r.note)}</span>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--texte-carte)' }}>
                        {r.auteur_id ? auteurMap.get(r.auteur_id) ?? '—' : '—'}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'var(--texte-carte-secondaire)' }}>{formatDate(r.created_at)}</span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      background: approuve ? '#DCFCE7' : 'var(--or-pale)',
                      color: approuve ? '#166534' : 'var(--accent-or-texte)',
                    }}
                  >
                    {approuve ? 'Approuvé · affiché' : 'En attente'}
                  </span>
                </div>

                {r.commentaire && (
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', margin: '0 0 1rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                    « {r.commentaire} »
                  </p>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <form action={approuverAvis}>
                    <input type="hidden" name="review_id" value={r.id} />
                    <button
                      type="submit"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: '#166534',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.45rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Approuver
                    </button>
                  </form>
                  <form action={rejeterAvis}>
                    <input type="hidden" name="review_id" value={r.id} />
                    <button
                      type="submit"
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: 'transparent',
                        color: '#991B1B',
                        border: '1px solid #991B1B',
                        padding: '0.45rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Rejeter
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
