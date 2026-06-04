import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import PacksClient from './PacksClient';

export const dynamic = 'force-dynamic';

export default async function AdminPacksPage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const supabase = createServerClient();
  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!admin?.is_admin) redirect('/');

  const { data: bundles } = await supabase
    .from('bundles')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: books } = await supabase
    .from('books')
    .select('id, title, price, cover_url')
    .eq('is_published', true)
    .order('title', { ascending: true });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Packs &amp; Collections</h1>
        <p className="text-silver-500 text-sm">Vendez plusieurs livres ensemble à prix réduit</p>
      </div>
      <PacksClient bundles={bundles || []} books={books || []} />
    </div>
  );
}
