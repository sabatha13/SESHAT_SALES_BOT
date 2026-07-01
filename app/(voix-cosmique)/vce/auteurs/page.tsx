export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import VCENav from '../_components/VCENav';

interface Auteur {
  id: string;
  prenom: string;
  nom: string;
  nom_plume: string | null;
  bio: string | null;
  photo_url: string | null;
  slug: string | null;
}

function initiales(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

export default async function AuteursListePage() {
  const supabase = createServerClient();

  const { data: auteursData } = await supabase
    .from('vce_auteurs')
    .select('id, prenom, nom, nom_plume, bio, photo_url, slug')
    .eq('is_active', true)
    .not('slug', 'is', null)
    .order('prenom', { ascending: true });

  const auteurs = (auteursData ?? []) as Auteur[];

  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3.5rem 2rem' }}>
          <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--or)', margin: '0 0 0.75rem' }}>
              Voix Cosmique Éditions
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>
              Nos auteurs
            </h1>
          </header>

          {auteurs.length === 0 ? (
            <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', color: 'var(--texte-carte)', margin: 0, lineHeight: 1.5 }}>
                Nos auteurs seront bientôt présentés ici.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
              {auteurs.map((auteur) => {
                const nomAffiche = auteur.nom_plume || `${auteur.prenom} ${auteur.nom}`;
                return (
                  <Link key={auteur.id} href={`/auteurs/${auteur.slug}`} style={{ textDecoration: 'none' }}>
                    <article style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '12px', padding: '1.75rem', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', background: 'var(--or-pale)', border: '2px solid var(--carte-bordure)', marginBottom: '1rem' }}>
                        {auteur.photo_url ? (
                          <Image src={auteur.photo_url} alt={nomAffiche} fill style={{ objectFit: 'cover' }} sizes="96px" />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-playfair)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-or-texte)' }}>
                            {initiales(auteur.prenom, auteur.nom)}
                          </div>
                        )}
                      </div>
                      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--texte-carte)', margin: '0 0 0.6rem' }}>
                        {nomAffiche}
                      </h2>
                      {auteur.bio && (
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte-carte-secondaire)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {auteur.bio}
                        </p>
                      )}
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-or-texte)', marginTop: 'auto', paddingTop: '1rem' }}>
                        Voir le profil →
                      </span>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
