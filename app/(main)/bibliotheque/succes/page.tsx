import Link from 'next/link';
import Image from 'next/image';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  category: string;
  price: number;
}

interface Purchase {
  book_id: string;
  book: Book | null;
}

interface RecBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  price: number;
  category: string;
}

export default async function SuccesPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const supabase = createServerClient();

  let purchase: Purchase | null = null;

  if (searchParams.session_id) {
    const { data } = await supabase
      .from('purchases')
      .select('book_id, book:books(id, title, author, cover_url, category, price)')
      .eq('stripe_session_id', searchParams.session_id)
      .eq('status', 'completed')
      .maybeSingle();

    purchase = data as Purchase | null;
  }

  const book = purchase?.book ?? null;

  const { data: recs } = await supabase
    .from('books')
    .select('id, title, author, cover_url, price, category')
    .eq('is_published', true)
    .eq('category', book?.category ?? 'Magie')
    .neq('id', book?.id ?? '')
    .limit(3);

  const recommendations: RecBook[] = (recs as RecBook[]) ?? [];

  return (
    <div className="min-h-screen bg-void px-4 py-16">
      {/* ── 1. ANIMATED SUCCESS HEADER ── */}
      <section className="flex flex-col items-center text-center mb-16">
        {/* Sparkling symbols — top row */}
        <div className="flex gap-6 text-gold-400 text-xl mb-4 animate-pulse select-none">
          <span>✦</span>
          <span className="opacity-60">✧</span>
          <span>⊕</span>
          <span className="opacity-60">✧</span>
          <span>✦</span>
        </div>

        {/* Gold checkmark circle */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{
            background: 'radial-gradient(circle, rgba(202,163,86,0.15) 0%, transparent 70%)',
            border: '1px solid rgba(202,163,86,0.4)',
            animation: 'succesCheck 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <svg
            viewBox="0 0 40 40"
            fill="none"
            className="w-12 h-12"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M8 21l8 8 16-17"
              stroke="#CAA356"
              strokeWidth="3"
              style={{ animation: 'drawCheck 0.5s 0.4s ease forwards', strokeDasharray: 40, strokeDashoffset: 40 }}
            />
          </svg>
        </div>

        {/* Inline keyframes */}
        <style>{`
          @keyframes succesCheck {
            from { opacity: 0; transform: scale(0.4); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
        `}</style>

        {/* Sparkling symbols — bottom row */}
        <div className="flex gap-6 text-gold-500 text-sm mb-8 animate-pulse select-none" style={{ animationDelay: '0.3s' }}>
          <span>⊕</span>
          <span className="opacity-50">✦</span>
          <span>✧</span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl gold-text mb-4 tracking-wide">
          Votre initiation commence.
        </h1>

        <p className="text-silver-400 text-lg max-w-lg leading-relaxed">
          Votre paiement a été accepté.{' '}
          {book ? (
            <>
              <span className="text-silver-200 font-medium">{book.title}</span>{' '}
              est maintenant dans votre bibliothèque.
            </>
          ) : (
            'Votre livre est maintenant dans votre bibliothèque.'
          )}
        </p>
      </section>

      {/* ── 2. PURCHASED BOOK CARD ── */}
      {book && (
        <section className="max-w-md mx-auto mb-20">
          <div className="card-dark rounded-2xl overflow-hidden border border-gold-600/20 shadow-[0_0_40px_rgba(202,163,86,0.06)]">
            <div className="flex gap-5 p-6">
              {/* Cover */}
              <div className="flex-shrink-0 w-24 h-36 rounded-lg overflow-hidden bg-obsidian relative">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold-500 text-3xl">
                    ✦
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-col justify-between min-w-0">
                <div>
                  <span className="inline-block text-xs uppercase tracking-widest text-gold-500 bg-gold-500/10 border border-gold-500/20 rounded-full px-2 py-0.5 mb-2">
                    {book.category}
                  </span>
                  <h2 className="font-serif text-xl text-silver-100 leading-snug mb-1 line-clamp-2">
                    {book.title}
                  </h2>
                  <p className="text-silver-500 text-sm">{book.author}</p>
                </div>
                <p className="text-gold-400 font-semibold mt-3">
                  {book.price.toFixed(2)} €
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <Link
                href={`/lecture/${book.id}`}
                className="btn-gold w-full text-center py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2"
              >
                <span>📖</span>
                <span>Commencer ma lecture →</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. UPSELL — RECS ── */}
      {recommendations.length > 0 && (
        <section className="max-w-4xl mx-auto mb-20">
          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="divider-gold flex-1" />
            <h2 className="font-serif text-2xl md:text-3xl gold-text whitespace-nowrap px-2">
              Les initiés ont aussi exploré
            </h2>
            <div className="divider-gold flex-1" />
          </div>

          {/* Scrollable row */}
          <div className="flex gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide snap-x snap-mandatory">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="card-dark rounded-xl overflow-hidden border border-charcoal/60 flex-shrink-0 w-56 md:w-auto snap-start transition-transform hover:-translate-y-1 duration-300"
              >
                {/* Cover */}
                <div className="relative w-full h-52 bg-obsidian">
                  {rec.cover_url ? (
                    <Image
                      src={rec.cover_url}
                      alt={rec.title}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 224px, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold-600 text-4xl">
                      ✦
                    </div>
                  )}
                  {/* Price badge */}
                  <span className="absolute top-3 right-3 bg-void/80 backdrop-blur-sm text-gold-400 text-xs font-semibold px-2 py-1 rounded-full border border-gold-600/30">
                    {rec.price.toFixed(2)} €
                  </span>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <p className="font-serif text-silver-200 text-sm leading-snug line-clamp-2 mb-1">
                      {rec.title}
                    </p>
                    <p className="text-silver-500 text-xs">{rec.author}</p>
                  </div>
                  <Link
                    href={`/boutique/${rec.id}`}
                    className="btn-ghost-gold text-center text-xs py-2 rounded-lg"
                  >
                    Voir le livre
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 4. CTA STRIP ── */}
      <section className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/bibliotheque"
            className="btn-gold px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
          >
            Ma Bibliothèque →
          </Link>
          <Link
            href="/boutique"
            className="btn-ghost-gold px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
          >
            Explorer la Boutique →
          </Link>
          <Link
            href="/chemin"
            className="btn-ghost-gold px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap"
          >
            Trouver ma Voie →
          </Link>
        </div>
      </section>
    </div>
  );
}
