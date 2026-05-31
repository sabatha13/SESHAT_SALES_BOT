export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import PromotionClient from './PromotionClient';

export default async function PromotionPage() {
  const supabase = createServerClient();

  const [{ data: books }, { data: promotion }] = await Promise.all([
    supabase.from('books').select('id, title, author, cover_url, price').eq('is_published', true).order('title'),
    supabase.from('promotions').select('*, book:books(id, title, author, price, cover_url)').single(),
  ]);

  return <PromotionClient books={books || []} promotion={promotion} />;
}
