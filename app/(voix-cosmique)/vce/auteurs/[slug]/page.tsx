export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import VCENav from '../../_components/VCENav';

interface Livre {
  id: string;
  slug: string | null;
  titre: string;
  resume_court: string;
  couverture_url: string | null;
  prix_cents: number;
}

function initiales(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function formatPrix(cents: number): string {
  return `${(cents / 100).toFixed(2)} $`;
}

export default async function AuteurPublicPage({ params }: { params: { slug: string } }) {
  const supabase = createServerClient();

  const { data: auteur } = await supabase
    .from('vce_auteurs')
    .select('id, prenom, nom, nom_plume, bio, photo_url, site_web, is_active')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (!auteur) notFound();

  const { data: livresData } = await supabase
    .from('vce_livres')
    .select('id, slug, titre, resume_court, couverture_url, prix_cents')
    .eq('auteur_id', auteur.id)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const livres = (livresData ?? []) as Livre[];
  const nomAffiche = auteur.nom_plume || `${auteur.prenom} ${auteur.nom}`;

  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
          {/* En-tête auteur */}
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', background: 'var(--or-pale)', flexShrink: 0, border: '2px solid var(--carte-bordure)' }}>
              {auteur.photo_url ? (
                <Image src={auteur.photo_url} alt={nomAffiche} fill style={{ objectFit: 'cover' }} sizes="120px" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-playfair)', fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-or-texte)' }}>
                  {initiales(auteur.prenom, auteur.nom)}
                </div>
              )}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 700, color: 'var(--brun)', margin: '0 0 0.5rem' }}>
                {nomAffiche}
              </h1>
              {auteur.site_web && (
                <a href={auteur.site_web} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--accent-or-texte)', textDecoration: 'none', fontWeight: 500 }}>
                  {auteur.site_web} →
                </a>
              )}
            </div>
          </div>

          {/* Bio */}
          <section style={{ marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'var(--texte)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
              {auteur.bio ?? 'Biographie à venir'}
            </p>
          </section>

          {/* Livres */}
          <section>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--brun)', margin: '0 0 1.5rem' }}>
              Livres publiés
            </h2>

            {livres.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>
                Aucun livre publié pour l'instant.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {livres.map((livre) => (
                  <Link key={livre.id} href={livre.slug ? `/livres/${livre.slug}` : '#'} style={{ textDecoration: 'none' }}>
                    <article style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '10px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3', background: 'var(--or-pale)' }}>
                        {livre.couverture_url ? (
                          <Image src={livre.couverture_url} alt={livre.titre} fill style={{ objectFit: 'cover' }} sizes="200px" />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', color: 'var(--accent-or-texte)' }}>
                            ✦
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--texte-carte)', margin: '0 0 0.5rem', lineHeight: 1.3, flex: 1 }}>
                          {livre.titre}
                        </h3>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--texte-carte)' }}>
                          {formatPrix(livre.prix_cents)}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
