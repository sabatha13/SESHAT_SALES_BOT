import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import CouponsClient from './CouponsClient';

export default async function AdminCouponsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const supabase = createServerClient();
  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!admin?.is_admin) redirect('/');

  const [{ data: coupons }, { data: books }] = await Promise.all([
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('books').select('id, title').eq('is_published', true).order('title'),
  ]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-serif text-2xl gold-text mb-8">Codes de réduction</h1>
      <CouponsClient initialCoupons={coupons || []} books={books || []} />
    </div>
  );
}
