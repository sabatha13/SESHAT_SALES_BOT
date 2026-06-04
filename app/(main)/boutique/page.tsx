export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Boutique — Livres Ésotériques Numériques',
  description: 'Parcourez notre collection de livres numériques : magie, kabbale, alchimie, tarot, numérologie, hermétisme et plus. Œuvres du Comte de Sabatha.',
  openGraph: {
    url: 'https://www.cdslibrairie.com/boutique',
    type: 'website',
    title: 'Boutique — Livres Ésotériques Numériques',
    description: 'Parcourez notre collection de livres numériques : magie, kabbale, alchimie, tarot, numérologie, hermétisme et plus. Œuvres du Comte de Sabatha.',
  },
};
import BookGrid from '@/components/books/BookGrid';
import BoutiqueHero from '@/components/books/BoutiqueHero';
import BoutiqueFiltres from '@/components/books/BoutiqueFiltres';
import { Book } from '@/lib/types';

interface Props {
  searchParams: { categorie?: string; q?: string };
}

async function getBooks(category?: string, query?: string): Promise<Book[]> {
  try {
    const supabase = createServerClient();
    let q = supabase.from('books').select('*').eq('is_published', true);

    if (category && category !== 'Tous') {
      q = q.eq('category', category);
    }
    if (query) {
      q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data } = await q.order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

async function getRatings(): Promise<Record<string, { avg: number; count: number }>> {
  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('reviews')
      .select('book_id, rating')
      .eq('is_approved', true);

    if (!data) return {};

    const map: Record<string, { sum: number; count: number }> = {};
    for (const row of data) {
      if (!map[row.book_id]) map[row.book_id] = { sum: 0, count: 0 };
      map[row.book_id].sum += row.rating;
      map[row.book_id].count += 1;
    }

    const result: Record<string, { avg: number; count: number }> = {};
    for (const [bookId, val] of Object.entries(map)) {
      result[bookId] = { avg: val.sum / val.count, count: val.count };
    }
    return result;
  } catch {
    return {};
  }
}

export default async function BoutiquePage({ searchParams }: Props) {
  const { categorie, q } = searchParams;
  const [books, ratingsMap] = await Promise.all([getBooks(categorie, q), getRatings()]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newBookIds = new Set(
    books
      .filter(b => new Date(b.created_at) >= thirtyDaysAgo)
      .map(b => b.id)
  );

  return (
    <div className="min-h-screen">
      <BoutiqueHero bookCount={books.length} />

      <BoutiqueFiltres currentCategory={categorie} currentQuery={q} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count */}
        {(categorie || q) && (
          <p className="text-silver-500 text-sm mb-6">
            {books.length} livre{books.length !== 1 ? 's' : ''} trouvé{books.length !== 1 ? 's' : ''}
            {categorie ? ` dans "${categorie}"` : ''}
            {q ? ` pour "${q}"` : ''}
          </p>
        )}

        <BookGrid
          books={books}
          emptyMessage="Aucun livre ne correspond à votre recherche."
          ratings={ratingsMap}
          newBookIds={newBookIds}
        />
      </div>
    </div>
  );
}
