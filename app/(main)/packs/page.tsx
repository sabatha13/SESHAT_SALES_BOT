export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Collections & Packs — CDS Librairie Ésotérique',
  description: 'Découvrez nos collections thématiques de livres ésotériques à prix réduit. Packs Magie, Kabbale, Initiation et plus.',
  openGraph: {
    url: 'https://www.cdslibrairie.com/packs',
    type: 'website',
    title: 'Collections & Packs — CDS Librairie Ésotérique',
    description: 'Découvrez nos collections thématiques de livres ésotériques à prix réduit. Packs Magie, Kabbale, Initiation et plus.',
  },
};
import { createServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';

interface Bundle {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  book_ids: string[];
  price: number;
  cover_url: string | null;
}

interface BookLite {
  id: string;
  title: string;
  price: number;
  cover_url: string | null;
}

function BundleCovers({ bundle, bookMap }: { bundle: Bundle; bookMap: Record<string, BookLite> }) {
  if (bundle.cover_url) {
    return <img src={bundle.cover_url} alt={bundle.title} className="w-full h-48 object-cover" />;
  }
  const covers = (bundle.book_ids || [])
    .map(id => bookMap[id]?.cover_url)
    .filter(Boolean)
    .slice(0, 3) as string[];
  return (
    <div className="w-full h-48 bg-charcoal flex items-center justify-center gap-2 px-6 overflow-hidden">
      {covers.length > 0 ? (
        covers.map((c, i) => (
          <img
            key={i}
            src={c}
            alt=""
            className="h-36 w-auto object-cover rounded-lg shadow-gold-md"
            style={{ transform: `rotate(${(i - 1) * 6}deg)`, zIndex: 3 - Math.abs(i - 1) }}
          />
        ))
      ) : (
        <span className="text-4xl gold-text">✦</span>
      )}
    </div>
  );
}

export default async function PacksPage() {
  const supabase = createServerClient();

  const { data: bundlesData } = await supabase
    .from('bundles')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const bundles = (bundlesData || []) as Bundle[];

  const allBookIds = Array.from(new Set(bundles.flatMap(b => b.book_ids || [])));
  const bookMap: Record<string, BookLite> = {};
  if (allBookIds.length > 0) {
    const { data: booksData } = await supabase
      .from('books')
      .select('id, title, price, cover_url')
      .in('id', allBookIds);
    for (const b of (booksData || []) as BookLite[]) bookMap[b.id] = b;
  }

  const totalValue = (b: Bundle) => (b.book_ids || []).reduce((s, id) => s + (bookMap[id]?.price || 0), 0);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center mb-12">
        <p className="text-gold-400 text-xs uppercase tracking-[0.3em] mb-3">Collections</p>
        <h1 className="section-title">Nos Packs</h1>
        <div className="divider-gold mx-auto my-5" />
        <p className="text-silver-400 max-w-xl mx-auto text-sm md:text-base">
          Des collections soigneusement composées pour approfondir un thème — et faire des économies par rapport à l'achat à l'unité.
        </p>
      </div>

      {bundles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bundles.map(b => {
            const tv = totalValue(b);
            const disc = tv > 0 && b.price > 0 ? Math.round((1 - b.price / tv) * 100) : 0;
            return (
              <Link
                key={b.id}
                href={`/packs/${b.slug || b.id}`}
                className="card-dark rounded-2xl overflow-hidden gold-border-hover hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="relative">
                  <BundleCovers bundle={b} bookMap={bookMap} />
                  {disc > 0 && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 text-void text-xs font-bold shadow-gold-md">
                      −{disc}%
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-serif text-lg text-silver-200 mb-1">{b.title}</h2>
                  <p className="text-silver-500 text-xs mb-4">
                    {(b.book_ids || []).length} livre{(b.book_ids || []).length !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-auto flex items-center gap-3 flex-wrap">
                    {tv > 0 && <span className="text-silver-500 text-sm line-through">{formatPrice(tv)}</span>}
                    <span className="gold-text text-xl font-medium">{formatPrice(b.price)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-5xl gold-text mb-4">✦</p>
          <p className="text-silver-400">Aucun pack disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}
