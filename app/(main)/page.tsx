import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import BookGrid from '@/components/books/BookGrid';
import { Book } from '@/lib/types';
import { ArrowRight, Shield, Zap, Star } from 'lucide-react';

async function getFeaturedBooks(): Promise<Book[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(5);
    return data || [];
  } catch {
    return [];
  }
}

async function getLatestBooks(): Promise<Book[]> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  } catch {
    return [];
  }
}

const features = [
  {
    icon: Shield,
    title: 'Lecture Sécurisée',
    desc: 'Vos livres sont protégés par un filigrane dynamique et accessibles uniquement via notre lecteur.',
  },
  {
    icon: Zap,
    title: 'Accès Instantané',
    desc: 'Dès votre achat validé, votre bibliothèque est enrichie et disponible à tout moment.',
  },
  {
    icon: Star,
    title: 'Sélection Premium',
    desc: 'Des œuvres soigneusement sélectionnées pour leur qualité et leur profondeur ésotérique.',
  },
];

const categories = ['Magie', 'Kabbale', 'Alchimie', 'Astrologie', 'Tarot', 'Numérologie', 'Hermétisme', 'Chamanisme'];

export default async function HomePage() {
  const [featured, latest] = await Promise.all([getFeaturedBooks(), getLatestBooks()]);

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-glow-gold pointer-events-none" />
        <div className="absolute inset-0 bg-dark-gradient pointer-events-none" />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(212,175,55,0.3) 80px, rgba(212,175,55,0.3) 81px),
              repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(212,175,55,0.3) 80px, rgba(212,175,55,0.3) 81px)
            `,
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <p className="text-gold-600 uppercase tracking-[0.4em] text-xs font-medium mb-6 animate-fade-in">
            ✦ Bibliothèque Numérique Ésotérique ✦
          </p>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] mb-6 animate-slide-up">
            <span className="gold-shimmer">CDS</span>
            <br />
            <span className="text-silver-300">Librairie Ésotérique</span>
          </h1>
          <div className="divider-gold my-8" />
          <p className="text-silver-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in">
            Derrière chaque symbole se cache un monde que peu osent explorer. Le Comte de Sabatha vous ouvre les portes des arts interdits — kabbale, alchimie, hermétisme, magie — une œuvre unique, une vision singulière, un voyage sans retour.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link href="/boutique" className="btn-gold px-8 py-4 rounded-xl text-base font-medium flex items-center gap-2 group">
              Explorer la boutique
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/inscription" className="btn-ghost-gold px-8 py-4 rounded-xl text-base">
              Créer un compte
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-gold-600/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-600/60" />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-obsidian">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="card-dark p-6 rounded-2xl gold-border-hover text-center">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4 border border-gold-500/20">
                  <f.icon className="w-5 h-5 text-gold-500" />
                </div>
                <h3 className="font-serif text-lg text-gold-300 mb-2">{f.title}</h3>
                <p className="text-silver-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured books */}
      {featured.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Sélection</p>
            <h2 className="section-title">Coups de Cœur</h2>
            <div className="divider-gold mt-4" />
          </div>
          <BookGrid books={featured} />
        </section>
      )}

      {/* Categories */}
      <section className="py-20 px-4 bg-obsidian">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Explorer par thème</p>
          <h2 className="section-title mb-10">Domaines Ésotériques</h2>
          <div className="divider-gold mb-10" />
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(cat => (
              <Link
                key={cat}
                href={`/boutique?categorie=${encodeURIComponent(cat)}`}
                className="px-5 py-2 rounded-full border border-gold-600/30 text-silver-400 text-sm hover:border-gold-500/70 hover:text-gold-300 hover:bg-gold-500/5 transition-all duration-300"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest books */}
      {latest.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Catalogue</p>
              <h2 className="section-title">Dernières Parutions</h2>
            </div>
            <Link href="/boutique" className="btn-ghost-gold px-5 py-2 rounded-lg text-sm flex items-center gap-2 group">
              Tout voir
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <BookGrid books={latest} />
        </section>
      )}

      {/* CTA banner */}
      <section className="py-20 px-4 bg-obsidian">
        <div className="max-w-3xl mx-auto text-center">
          <p className="ornament text-3xl mb-6">✦</p>
          <h2 className="font-serif text-4xl md:text-5xl text-silver-200 font-light mb-4">
            Commencez votre voyage
          </h2>
          <p className="text-silver-500 mb-8 leading-relaxed">
            Rejoignez des centaines de lecteurs passionnés et accédez à une bibliothèque ésotérique unique.
          </p>
          <Link href="/inscription" className="btn-gold px-10 py-4 rounded-xl text-base font-medium">
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>
    </>
  );
}
