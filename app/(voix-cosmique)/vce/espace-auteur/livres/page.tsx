export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../_components/VCENav';
import SupprimerLivreAuteurButton from './_components/SupprimerLivreAuteurButton';

interface Livre {
  id: string;
  titre: string;
  resume_court: string;
  prix_cents: number;
  is_published: boolean | null;
  created_at: string | null;
}

function formatPrix(cents: number): string {
  return `${(cents / 100).toFixed(2)} $`;
}

export default async function MesLivresPage() {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const { data: livresData } = await supabase
    .from('vce_livres')
    .select('id, titre, resume_court, prix_cents, is_published, created_at')
    .eq('auteur_id', auteur.id)
    .order('created_at', { ascending: false });

  const livres = (livresData ?? []) as Livre[];

  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 2rem' }}>
          <Link href="/espace-auteur" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--accent-or-texte)', textDecoration: 'none' }}>
            ← Tableau de bord
          </Link>

          <div style={{ margin: '1rem 0 2rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--or)', margin: '0 0 0.5rem' }}>
              Espace Auteur
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>
              Mes livres
            </h1>
          </div>

          {livres.length === 0 ? (
            <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>
                Aucun livre pour l'instant. Vos ouvrages apparaîtront ici une fois créés par l'équipe VCE.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {livres.map((livre) => {
                const publie = livre.is_published === true;
                return (
                  <div key={livre.id} style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '1.25rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                          <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--texte-carte)', margin: 0 }}>
                            {livre.titre}
                          </h2>
                          <span
                            style={{
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              background: publie ? '#DCFCE7' : 'var(--or-pale)',
                              color: publie ? '#166534' : 'var(--accent-or-texte)',
                            }}
                          >
                            {publie ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte-carte-secondaire)', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
                          {livre.resume_court}
                        </p>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--texte-carte)' }}>
                          {formatPrix(livre.prix_cents)}
                        </span>
                      </div>

                      {/* Suppression uniquement sur les brouillons */}
                      {!publie && (
                        <div style={{ flexShrink: 0 }}>
                          <SupprimerLivreAuteurButton livreId={livre.id} livreTitre={livre.titre} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
