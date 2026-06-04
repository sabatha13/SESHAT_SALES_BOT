import Link from 'next/link';
import { ArrowRight, Shield, Zap, Star, Package } from 'lucide-react';
import PromotionDisplay from '@/components/promotion/PromotionDisplay';
import CitationBand from '@/components/home/CitationBand';
import BookCard from '@/components/books/BookCard';
import { createServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import { Book } from '@/lib/types';

export const dynamic = 'force-dynamic';

const features = [
  { icon: Shield, title: 'Lecture Sécurisée', desc: 'Vos livres sont protégés par un filigrane dynamique et accessibles uniquement via notre lecteur.' },
  { icon: Zap, title: 'Accès Instantané', desc: 'Dès votre achat validé, votre bibliothèque est enrichie et disponible à tout moment.' },
  { icon: Star, title: 'Sélection Premium', desc: 'Des œuvres soigneusement sélectionnées pour leur qualité et leur profondeur ésotérique.' },
];

const categories = ['Magie', 'Kabbale', 'Alchimie', 'Astrologie', 'Tarot', 'Numérologie', 'Hermétisme', 'Chamanisme', 'Vodou', 'Eso-psychologie', 'Rituels', 'Gnose', 'Tantra / Magie Sexuelle', 'Franc-Maçonnerie', 'Rosicrucianisme'];

async function getFeaturedBooks(): Promise<Book[]> {
  try {
    const supabase = createServerClient();
    // Prefer featured books, fall back to most recent
    const { data: featured } = await supabase
      .from('books').select('*').eq('is_published', true).eq('is_featured', true)
      .order('created_at', { ascending: false }).limit(5);
    if (featured && featured.length >= 3) return featured as Book[];
    const { data: recent } = await supabase
      .from('books').select('*').eq('is_published', true)
      .order('created_at', { ascending: false }).limit(5);
    return (recent as Book[]) || [];
  } catch { return []; }
}

async function getFeaturedBundles() {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('bundles').select('*').eq('is_published', true)
      .order('created_at', { ascending: false }).limit(3);
    if (!data?.length) return [];
    // Gather covers for the books in these bundles
    const bookIds = Array.from(new Set(data.flatMap((b: any) => b.book_ids || [])));
    const { data: books } = await supabase.from('books').select('id, title, price, cover_url').in('id', bookIds);
    const bookMap = new Map((books || []).map((b: any) => [b.id, b]));
    return data.map((bundle: any) => {
      const items = (bundle.book_ids || []).map((id: string) => bookMap.get(id)).filter(Boolean);
      const totalValue = items.reduce((s: number, b: any) => s + (b.price || 0), 0);
      const discount = totalValue > 0 ? Math.round((1 - bundle.price / totalValue) * 100) : 0;
      return { ...bundle, items, totalValue, discount };
    });
  } catch { return []; }
}

export default async function HomePage() {
  const [featuredBooks, featuredBundles] = await Promise.all([getFeaturedBooks(), getFeaturedBundles()]);

  return (
    <>
      <PromotionDisplay />
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-glow-gold pointer-events-none" />
        <div className="absolute inset-0 bg-dark-gradient pointer-events-none" />
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
            Derrière chaque symbole se cache un monde — explorez les arts initiatiques, la magie et l&apos;occultisme à travers une collection d&apos;œuvres rares, accessibles et sécurisées.
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
          <div className="mt-8 text-center">
            <a href="https://chat.whatsapp.com/ClVIQUqtU4G4nwMdFqWPDB" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-600/20 border border-green-500/40 text-green-400 text-sm hover:bg-green-600/30 transition-all duration-300 mb-3">
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Rejoindre le Club de Lecture WhatsApp
            </a>
            <p className="text-silver-500 text-xs max-w-sm mx-auto leading-relaxed">Un groupe pour les lecteurs des livres du Comte de Sabatha — suivez un programme de lecture guid&eacute; et &eacute;changez avec la communaut&eacute;.</p>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-gold-600/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-600/60" />
        </div>
      </section>

      {/* Rotating author citations */}
      <CitationBand />

      {/* Featured books */}
      {featuredBooks.length > 0 && (
        <section className="py-20 px-4 bg-obsidian">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">À découvrir</p>
                <h2 className="font-serif text-4xl text-silver-200 font-light">Œuvres en vedette</h2>
              </div>
              <Link href="/boutique" className="btn-ghost-gold px-5 py-2 rounded-lg text-sm inline-flex items-center gap-2 group whitespace-nowrap">
                Toute la collection
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {featuredBooks.map((book, i) => (
                <BookCard key={book.id} book={book} animationDelay={i * 80} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured bundles / packs */}
      {featuredBundles.length > 0 && (
        <section className="py-20 px-4 bg-void">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Économisez</p>
              <h2 className="font-serif text-4xl text-silver-200 font-light mb-4">Nos Collections</h2>
              <div className="divider-gold mt-4" />
              <p className="text-silver-500 text-sm max-w-xl mx-auto mt-4">
                Des sélections d'œuvres réunies à prix réduit pour approfondir un thème.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBundles.map((bundle: any) => (
                <Link
                  key={bundle.id}
                  href={`/packs/${bundle.slug || bundle.id}`}
                  className="card-dark rounded-2xl overflow-hidden gold-border-hover hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="relative aspect-[16/9] bg-charcoal overflow-hidden">
                    {bundle.cover_url ? (
                      <img src={bundle.cover_url} alt={bundle.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex items-center justify-center gap-2 h-full p-4">
                        {bundle.items.slice(0, 3).map((b: any) => (
                          b.cover_url
                            ? <img key={b.id} src={b.cover_url} alt="" className="h-full w-auto rounded shadow-lg object-cover" />
                            : <Package key={b.id} className="w-8 h-8 text-gold-700/40" />
                        ))}
                      </div>
                    )}
                    {bundle.discount > 0 && (
                      <span className="absolute top-3 right-3 bg-emerald-500/90 text-void text-xs font-bold px-2.5 py-1 rounded-full">
                        −{bundle.discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-gold-600 text-[10px] uppercase tracking-widest mb-1">{bundle.items.length} livres</p>
                    <h3 className="font-serif text-lg text-silver-200 group-hover:text-gold-300 transition-colors leading-snug mb-3">{bundle.title}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="gold-text font-semibold text-lg">{formatPrice(bundle.price)}</span>
                      {bundle.totalValue > bundle.price && (
                        <span className="text-silver-600 text-sm line-through">{formatPrice(bundle.totalValue)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 px-4 bg-void">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">L'Auteur</p>
            <h2 className="font-serif text-4xl text-silver-200 font-light mb-4">Le Comte de Sabatha</h2>
            <div className="divider-gold mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-gold-500/40 shadow-[0_0_30px_rgba(201,168,76,0.2)]">
                <img src="https://oriiunftyumqcrniepux.supabase.co/storage/v1/object/public/IMAGE/3b0d1-my-pic-5-1-819x1024-1.webp" alt="Le Comte de Sabatha" className="w-full h-full object-cover" />
              </div>
              <div className="text-center">
                <h3 className="font-serif text-xl text-gold-300 mb-2">Le Comte de Sabatha</h3>
                <p className="text-silver-500 text-sm leading-relaxed max-w-xs">Auteur, chercheur et guide spirituel. Ses oeuvres initiatiques ouvrent les portes de la sagesse ancienne et des arts occultes.</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gold-600/20 shadow-lg" style={{aspectRatio:'16/9'}}>
              <iframe width="100%" height="100%" src="https://www.youtube.com/embed/jjqBP6pW11w" title="Le Comte de Sabatha" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      </section>

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

      <section className="py-20 px-4 bg-void">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Explorer par thème</p>
          <h2 className="section-title mb-10">Domaines Ésotériques</h2>
          <div className="divider-gold mb-10" />
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map(cat => (
              <Link key={cat} href={`/boutique?categorie=${encodeURIComponent(cat)}`} className="px-5 py-2 rounded-full border border-gold-600/30 text-silver-400 text-sm hover:border-gold-500/70 hover:text-gold-300 hover:bg-gold-500/5 transition-all duration-300">
                {cat}
              </Link>
            ))}
          </div>
          <Link href="/boutique" className="btn-ghost-gold px-6 py-2.5 rounded-lg text-sm inline-flex items-center gap-2 group">
            Tout voir
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

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