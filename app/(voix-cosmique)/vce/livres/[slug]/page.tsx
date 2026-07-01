export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import VCENav from '../../_components/VCENav';

function formatPrix(cents: number): string {
  return `${(cents / 100).toFixed(2)} $`;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createServerClient();
  const { data: livre } = await supabase
    .from('vce_livres')
    .select('titre, sous_titre, resume_court')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!livre) return { title: 'Livre introuvable' };

  return {
    title: livre.titre,
    description: livre.resume_court,
    openGraph: {
      title: livre.sous_titre ? `${livre.titre} — ${livre.sous_titre}` : livre.titre,
      description: livre.resume_court,
    },
  };
}

export default async function LivreDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createServerClient();

  const { data: livre } = await supabase
    .from('vce_livres')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!livre) notFound();

  const { data: auteur } = livre.auteur_id
    ? await supabase
        .from('vce_auteurs')
        .select('id, prenom, nom, nom_plume, slug')
        .eq('id', livre.auteur_id)
        .single()
    : { data: null };

  const auteurNom = auteur ? auteur.nom_plume || `${auteur.prenom} ${auteur.nom}` : null;

  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
          <Link href="/catalogue" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--accent-or-texte)', textDecoration: 'none' }}>
            ← Retour au catalogue
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: '3rem', marginTop: '1.5rem', alignItems: 'start' }}>
            {/* Couverture */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3', background: 'var(--or-pale)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--carte-bordure)' }}>
              {livre.couverture_url ? (
                <Image src={livre.couverture_url} alt={livre.titre} fill style={{ objectFit: 'cover' }} sizes="300px" priority />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-playfair)', fontSize: '3rem', color: 'var(--accent-or-texte)' }}>
                  ✦
                </div>
              )}
            </div>

            {/* Détails */}
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, color: 'var(--brun)', margin: '0 0 0.4rem', lineHeight: 1.2 }}>
                {livre.titre}
              </h1>
              {livre.sous_titre && (
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontStyle: 'italic', color: 'var(--brun-clair)', margin: '0 0 1rem' }}>
                  {livre.sous_titre}
                </p>
              )}

              {auteurNom && (
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'var(--texte)', margin: '0 0 1.5rem' }}>
                  par{' '}
                  {auteur?.slug ? (
                    <Link href={`/auteurs/${auteur.slug}`} style={{ color: 'var(--accent-or-texte)', fontWeight: 600, textDecoration: 'none' }}>
                      {auteurNom}
                    </Link>
                  ) : (
                    <span style={{ fontWeight: 600 }}>{auteurNom}</span>
                  )}
                </p>
              )}

              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'var(--texte)', lineHeight: 1.7, margin: '0 0 2rem', whiteSpace: 'pre-wrap' }}>
                {livre.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--brun)' }}>
                  {formatPrix(livre.prix_cents)}
                </span>
                {livre.lien_amazon && (
                  <a
                    href={livre.lien_amazon}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 600, background: 'var(--accent-or)', color: 'var(--n)', padding: '0.75rem 1.75rem', borderRadius: '4px', textDecoration: 'none' }}
                  >
                    Voir sur Amazon →
                  </a>
                )}
              </div>

              {/* Métadonnées */}
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', borderTop: '1px solid var(--carte-bordure)', paddingTop: '1.25rem' }}>
                {[
                  ['ISBN', livre.isbn],
                  ['Pages', livre.nb_pages],
                  ['Année', livre.annee_publication],
                  ['Langue', livre.langue],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label as string}>
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-or-texte)', margin: '0 0 0.2rem' }}>
                        {label}
                      </p>
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte)', margin: 0, fontWeight: 500 }}>
                        {value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
