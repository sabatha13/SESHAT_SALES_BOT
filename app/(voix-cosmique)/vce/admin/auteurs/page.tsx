export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import { suspendreAuteur, reactiverAuteur } from '../../actions/admin-auteurs';

interface Auteur {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  is_active: boolean | null;
  created_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminAuteursPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: auteursData }, { data: commandesData }] = await Promise.all([
    supabase
      .from('vce_auteurs')
      .select('id, prenom, nom, email, is_active, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('vce_commandes_services').select('auteur_id'),
  ]);

  const auteurs = (auteursData ?? []) as Auteur[];

  const nbCommandes = new Map<string, number>();
  for (const c of commandesData ?? []) {
    if (c.auteur_id) nbCommandes.set(c.auteur_id, (nbCommandes.get(c.auteur_id) ?? 0) + 1);
  }

  return (
    <div style={{ padding: '2.5rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--brun)',
          margin: '0 0 2rem',
        }}
      >
        Auteurs
        <span
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            fontWeight: 400,
            color: 'var(--accent-or-texte)',
            marginLeft: '0.75rem',
          }}
        >
          ({auteurs.length})
        </span>
      </h1>

      {auteurs.length === 0 ? (
        <div
          style={{
            background: 'var(--carte)',
            border: '1px solid var(--carte-bordure)',
            borderRadius: '8px',
            padding: '2.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>
            Aucun auteur inscrit.
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
          {/* En-tête */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1.8fr 1fr 0.9fr 0.7fr 1.6fr',
              gap: '0 0.75rem',
              padding: '0.7rem 1.25rem',
              background: 'var(--or-pale)',
              borderBottom: '1px solid var(--carte-bordure)',
            }}
          >
            {['Auteur', 'Email', 'Inscription', 'Statut', 'Cmd.', 'Actions'].map((col) => (
              <span
                key={col}
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-or-texte)',
                }}
              >
                {col}
              </span>
            ))}
          </div>

          {auteurs.map((a, idx) => {
            const actif = a.is_active !== false;
            return (
              <div
                key={a.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1.8fr 1fr 0.9fr 0.7fr 1.6fr',
                  gap: '0 0.75rem',
                  padding: '0.875rem 1.25rem',
                  borderBottom: idx < auteurs.length - 1 ? '1px solid var(--or-pale)' : 'none',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', fontWeight: 500 }}>
                  {a.prenom} {a.nom}
                </span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.email}
                </span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)' }}>
                  {formatDate(a.created_at)}
                </span>
                <span>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: actif ? '#DCFCE7' : '#FEE2E2',
                      color: actif ? '#166534' : '#991B1B',
                    }}
                  >
                    {actif ? 'Actif' : 'Suspendu'}
                  </span>
                </span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', fontWeight: 600 }}>
                  {nbCommandes.get(a.id) ?? 0}
                </span>
                <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Link
                    href={`/vce/admin/auteurs/${a.id}`}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.75rem',
                      color: 'var(--accent-or-texte)',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Détail
                  </Link>
                  {actif ? (
                    <form action={suspendreAuteur}>
                      <input type="hidden" name="auteur_id" value={a.id} />
                      <button
                        type="submit"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.75rem',
                          color: '#991B1B',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Suspendre
                      </button>
                    </form>
                  ) : (
                    <form action={reactiverAuteur}>
                      <input type="hidden" name="auteur_id" value={a.id} />
                      <button
                        type="submit"
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.75rem',
                          color: '#166534',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Réactiver
                      </button>
                    </form>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
