import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import ReviewModerationClient from './ReviewModerationClient';

export const dynamic = 'force-dynamic';

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Modération des avis</h1>
        <p className="text-silver-500 text-sm">Approuver, rejeter ou supprimer les avis clients</p>
      </div>
      <ReviewModerationClient initialReviews={reviews || []} />
    </div>
  );
}
