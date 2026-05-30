import { createServerClient } from '@/lib/supabase/server';
import BooksClient from './BooksClient';

export const dynamic = 'force-dynamic';

export default async function AdminLivresPage() {
  const supabase = createServerClient();

  const [{ data: books }, { data: sessions }] = await Promise.all([
    supabase.from('books').select('id, title, author, category, price, is_published, created_at').order('created_at', { ascending: false }),
    supabase.from('reader_sessions').select('book_id'),
  ]);

  const readCounts: Record<string, number> = {};
  (sessions || []).forEach((s: any) => {
    readCounts[s.book_id] = (readCounts[s.book_id] || 0) + 1;
  });

  const enriched = (books || []).map((b: any) => ({
    ...b,
    read_count: readCounts[b.id] || 0,
  }));

  return <BooksClient books={enriched} />;
}
