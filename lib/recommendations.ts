import { createServerClient } from '@/lib/supabase/server';
import { Book } from '@/lib/types';

/**
 * Co-purchase based recommendations ("frequently bought together").
 * Finds users who completed a purchase of `bookId`, then ranks the other
 * books those users also purchased by frequency.
 */
export async function getCoPurchasedBooks(bookId: string, limit: number): Promise<Book[]> {
  try {
    const supabase = createServerClient();

    // Users who completed a purchase of this book.
    const { data: buyers } = await supabase
      .from('purchases')
      .select('user_id')
      .eq('book_id', bookId)
      .eq('status', 'completed');

    const userIds = Array.from(new Set((buyers || []).map(b => b.user_id))).filter(Boolean);
    if (userIds.length === 0) return [];

    // Other books those users completed.
    const { data: coPurchases } = await supabase
      .from('purchases')
      .select('book_id')
      .in('user_id', userIds)
      .eq('status', 'completed')
      .neq('book_id', bookId);

    if (!coPurchases || coPurchases.length === 0) return [];

    // Rank candidate book ids by co-purchase frequency.
    const freq = new Map<string, number>();
    for (const p of coPurchases) {
      if (!p.book_id) continue;
      freq.set(p.book_id, (freq.get(p.book_id) || 0) + 1);
    }

    const rankedIds = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    if (rankedIds.length === 0) return [];

    // Fetch the published candidate books, then order them by rank.
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .eq('is_published', true)
      .in('id', rankedIds);

    if (!books) return [];

    const ordered = (books as Book[]).sort(
      (a, b) => (freq.get(b.id) || 0) - (freq.get(a.id) || 0)
    );

    return ordered.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Smart similarity recommendations ("dans le même courant").
 * Scores other published books against `book`:
 *   +3 per shared tag, +2 same category, +2 same author.
 * Books with a score of 0 and any id in `excludeIds` are dropped.
 */
export async function getSimilarBooks(book: Book, excludeIds: string[], limit: number): Promise<Book[]> {
  try {
    const supabase = createServerClient();
    const exclude = new Set([book.id, ...excludeIds]);

    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('is_published', true)
      .neq('id', book.id);

    if (!data) return [];

    const bookTags = new Set(book.tags || []);

    const scored = (data as Book[])
      .filter(candidate => !exclude.has(candidate.id))
      .map(candidate => {
        let score = 0;
        const sharedTags = (candidate.tags || []).filter(t => bookTags.has(t)).length;
        score += sharedTags * 3;
        if (candidate.category === book.category) score += 2;
        if (candidate.author === book.author) score += 2;
        return { candidate, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(s => s.candidate);
  } catch {
    return [];
  }
}
