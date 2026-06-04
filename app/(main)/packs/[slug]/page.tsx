export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import BundlePurchaseButton from '@/components/books/BundlePurchaseButton';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, BookOpen, Check } from 'lucide-react';

interface Props {
  params: { slug: string };
}

interface BookLite {
  id: string;
  title: string;
  author: string | null;
  price: number;
  cover_url: string | null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PackDetailPage({ params }: Props) {
  const supabase = createServerClient();

  let { data: bundle } = await supabase
    .from('bundles')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .maybeSingle();

  if (!bundle && UUID_RE.test(params.slug)) {
    const { data } = await supabase
      .from('bundles')
      .select('*')
      .eq('id', params.slug)
      .eq('is_published', true)
      .maybeSingle();
    bundle = data;
  }

  if (!bundle) notFound();

  const bookIds: string[] = bundle.book_ids || [];
  let books: BookLite[] = [];
  if (bookIds.length > 0) {
    const { data: booksData } = await supabase
      .from('books')
      .select('id, title, author, price, cover_url')
      .in('id', bookIds);
    const map: Record<string, BookLite> = {};
    for (const b of (booksData || []) as BookLite[]) map[b.id] = b;
    books = bookIds.map(id => map[id]).filter(Boolean);
  }

  const totalValue = books.reduce((s, b) => s + (b.price || 0), 0);
  const discount = totalValue > 0 && bundle.price > 0 ? Math.round((1 - bundle.price / totalValue) * 100) : 0;
  const savings = Math.max(totalValue - bundle.price, 0);

  const coverCovers = books.map(b => b.cover_url).filter(Boolean).slice(0, 3) as string[];

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <Link href="/packs" className="inline-flex items-center gap-2 text-silver-500 hover:text-gold-400 text-sm transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour aux packs
      </Link>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {bundle.cover_url ? (
            <img src={bundle.cover_url} alt={bundle.title} className="w-full max-h-96 object-cover rounded-2xl shadow-gold-md" />
          ) : coverCovers.length > 0 ? (
            <div className="card-dark rounded-2xl h-72 flex items-center justify-center gap-4 px-6 overflow-hidden">
              {coverCovers.map((c, i) => (
                <img
                  key={i}
                  src={c}
                  alt=""
                  className="h-56 w-auto object-cover rounded-lg shadow-gold-md"
                  style={{ transform: `rotate(${(i - 1) * 6}deg)`, zIndex: 3 - Math.abs(i - 1) }}
                />
              ))}
            </div>
          ) : null}

          <div>
            <p className="text-gold-400 text-xs uppercase tracking-[0.3em] mb-2">Collection</p>
            <h1 className="font-serif text-3xl md:text-4xl text-silver-100 mb-4">{bundle.title}</h1>
            {bundle.description && (
              <p className="text-silver-400 leading-relaxed whitespace-pre-line">{bundle.description}</p>
            )}
          </div>

          {/* Books in bundle */}
          <div>
            <h2 className="font-serif text-xl text-silver-200 mb-4">
              Ce pack contient ({books.length} livre{books.length !== 1 ? 's' : ''})
            </h2>
            <div className="space-y-3">
              {books.map(b => (
                <Link
                  key={b.id}
                  href={`/livre/${b.id}`}
                  className="card-dark rounded-2xl p-4 flex items-center gap-4 gold-border-hover transition-all"
                >
                  <div className="w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-charcoal flex items-center justify-center">
                    {b.cover_url ? (
                      <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-gold-700/50" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-base text-silver-200 line-clamp-1">{b.title}</h3>
                    {b.author && <p className="text-silver-500 text-xs mt-0.5">{b.author}</p>}
                  </div>
                  <span className="gold-text text-sm font-medium flex-shrink-0">{formatPrice(b.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing panel */}
        <div className="lg:col-span-1">
          <div className="card-dark rounded-2xl p-6 lg:sticky lg:top-24 space-y-5">
            <div>
              {totalValue > 0 && (
                <p className="text-silver-500 text-sm line-through">{formatPrice(totalValue)}</p>
              )}
              <p className="font-serif text-4xl gold-text">{formatPrice(bundle.price)}</p>
              {discount > 0 && (
                <p className="text-emerald-400 text-sm mt-2">
                  Vous économisez {discount}% ({formatPrice(savings)})
                </p>
              )}
            </div>

            <BundlePurchaseButton bundleId={bundle.id} />

            <div className="space-y-2 pt-2 border-t border-ash/50">
              <p className="flex items-center gap-2 text-silver-400 text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Accès immédiat · Tous les livres ajoutés à votre bibliothèque
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
