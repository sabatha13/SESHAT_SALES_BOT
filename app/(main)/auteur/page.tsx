import Link from 'next/link';
import { BookOpen, Globe, Award, Users } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Le Comte de Sabatha — Auteur Ésotérique',
  description: 'Découvrez Le Comte de Sabatha, chercheur autodidacte spécialisé en traditions ésotériques. Auteur de nombreux ouvrages sur la magie, la kabbale et la spiritualité comparée.',
};

export default async function AuteurPage() {
  const supabase = createServerClient();
  const { data: author } = await supabase.from('author_profile').select('*').single();

  if (!author) return <div className="min-h-screen flex items-center justify-center text-silver-400">Profil introuvable.</div>;

  const paragraphs = (author.biography || '').split('\n').filter((p: string) => p.trim());

  return (
    <div className="min-h-screen py-16 px-4 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-silver-500 hover:text-gold-400 text-sm transition-colors mb-10">
        ← Retour à l'accueil
      </Link>

      {/* Hero */}
      <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
        <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-gold-500/40 shadow-[0_0_40px_rgba(201,168,76,0.25)] flex-shrink-0">
          <img src={author.photo_url} alt={author.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-2">L'Auteur</p>
          <h1 className="font-serif text-4xl md:text-5xl text-silver-200 font-light leading-tight mb-3">{author.name}</h1>
          <p className="text-gold-400 font-serif italic text-lg mb-4">{author.title}</p>
          <p className="text-silver-400 text-sm leading-relaxed max-w-xl">{author.intro}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {['Harvard Dataverse', 'Academia.edu', 'Zenodo'].map(p => (
              <span key={p} className="text-xs border border-gold-700/40 text-gold-500 px-3 py-1 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="divider-gold mb-12" />

      {/* Biographie */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-gold-300 mb-6">Biographie</h2>
        <div className="card-dark p-6 rounded-2xl border-l-2 border-gold-600/50">
          {paragraphs.map((para: string, i: number) => (
            <p key={i} className={`text-silver-400 text-sm leading-relaxed ${i > 0 ? 'mt-4' : ''}`}>{para}</p>
          ))}
        </div>
      </section>

      {/* Domaines */}
      {author.specializations?.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl text-gold-300 mb-6">Domaines de Spécialisation</h2>
          <div className="space-y-3">
            {author.specializations.map((s: string, i: number) => (
              <div key={i} className="flex gap-4 card-dark p-4 rounded-xl">
                <span className="text-gold-600 font-serif text-sm w-6 flex-shrink-0">{i + 1}.</span>
                <p className="text-silver-400 text-sm leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Publications */}
      {author.publications?.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-gold-400" />
            <h2 className="font-serif text-2xl text-gold-300">Publications</h2>
          </div>
          <div className="space-y-3">
            {author.publications.map((pub: string, i: number) => (
              <div key={i} className="flex gap-4 items-start card-dark p-4 rounded-xl hover:border-gold-600/30 border border-transparent transition-colors">
                <span className="text-gold-600 font-serif text-sm w-6 flex-shrink-0">{i + 1}.</span>
                <p className="text-silver-300 text-sm leading-relaxed italic">"{pub}"</p>
              </div>
            ))}
          </div>
          <Link href="/boutique" className="mt-6 inline-flex items-center gap-2 btn-gold px-5 py-2.5 rounded-xl text-sm">
            <BookOpen className="w-4 h-4" />
            Voir tous les livres
          </Link>
        </section>
      )}

      {/* Affiliations */}
      {author.affiliations?.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-5 h-5 text-gold-400" />
            <h2 className="font-serif text-2xl text-gold-300">Initiations & Affiliations</h2>
          </div>
          <div className="card-dark p-6 rounded-2xl">
            <div className="flex flex-wrap gap-2">
              {author.affiliations.map((a: string) => (
                <span key={a} className="text-silver-400 text-xs border border-ash px-3 py-1.5 rounded-full">{a}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Langues */}
      {author.languages?.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gold-400" />
            <h2 className="font-serif text-2xl text-gold-300">Langues</h2>
          </div>
          <div className="flex gap-3 flex-wrap">
            {author.languages.map((l: string) => (
              <span key={l} className="text-silver-300 text-sm border border-gold-700/30 px-4 py-2 rounded-full">{l}</span>
            ))}
          </div>
        </section>
      )}

      <div className="divider-gold mb-10" />

      <div className="text-center">
        <p className="text-silver-500 text-sm mb-4">Découvrez les œuvres du Comte de Sabatha</p>
        <Link href="/boutique" className="btn-gold px-8 py-3 rounded-xl text-sm">Explorer la boutique</Link>
      </div>
    </div>
  );
}
