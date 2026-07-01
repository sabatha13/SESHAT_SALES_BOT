export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';
import VCENav from '../_components/VCENav';

interface Livre {
  id: string;
  slug: string | null;
  titre: string;
  resume_court: string;
  couverture_url: string | null;
  prix_cents: number;
  auteur_id: string | null;
}

function formatPrix(cents: number): string {
  return `${(cents / 100).toFixed(2)} $`;
}

export default async function CataloguePage() {
  const supabase = createServerClient();

  const [{ data: livresData }, { data: auteursData }] = await Promise.all([
    supabase
      .from('vce_livres')
      .select('id, slug, titre, resume_court, couverture_url, prix_cents, auteur_id')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase.from('vce_auteurs').select('id, prenom, nom, nom_plume'),
  ]);

  const livres = (livresData ?? []) as Livre[];
  const auteurMap = new Map(
    (auteursData ?? []).map((a) => [a.id, a.nom_plume || `${a.prenom} ${a.nom}`]),
  );

  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 2rem' }}>
          <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--or)', margin: '0 0 0.75rem' }}>
              Voix Cosmique Éditions
            </p>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>
              Notre catalogue
            </h1>
          </header>

          {livres.length === 0 ? (
            <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', color: 'var(--texte-carte)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
                Notre catalogue s'enrichit bientôt — revenez nous voir.
              </p>
              <Link
                href="/services"
                style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 600, background: 'var(--accent-or)', color: 'var(--n)', padding: '0.75rem 1.75rem', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}
              >
                Découvrir nos services
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
              {livres.map((livre) => (
                <Link
                  key={livre.id}
                  href={livre.slug ? `/livres/${livre.slug}` : '#'}
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                >
                  <article style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '10px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '2 / 3', background: 'var(--or-pale)' }}>
                      {livre.couverture_url ? (
                        <Image src={livre.couverture_url} alt={livre.titre} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 50vw, 240px" />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-playfair)', fontSize: '2rem', color: 'var(--accent-or-texte)' }}>
                          ✦
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1.1rem 1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--texte-carte)', margin: '0 0 0.25rem', lineHeight: 1.3 }}>
                        {livre.titre}
                      </h2>
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--accent-or-texte)', margin: '0 0 0.6rem' }}>
                        {livre.auteur_id ? auteurMap.get(livre.auteur_id) ?? '' : ''}
                      </p>
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte-carte-secondaire)', margin: '0 0 1rem', lineHeight: 1.5, flex: 1 }}>
                        {livre.resume_court}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--texte-carte)' }}>
                          {formatPrix(livre.prix_cents)}
                        </span>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-or-texte)' }}>
                          Découvrir →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
