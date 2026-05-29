import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import ReviewModerationClient from './ReviewModerationClient';

export default async function AdminAvisPage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const supabase = createServerClient();
  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!admin?.is_admin) redirect('/');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profile:profiles(email, full_name), book:books(title)')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-serif text-2xl gold-text mb-8">Modération des avis</h1>
      <ReviewModerationClient initialReviews={reviews || []} />
    </div>
  );
}
