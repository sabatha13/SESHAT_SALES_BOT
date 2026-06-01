import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import AbonnementsClient from './AbonnementsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAbonnementsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const supabase = createServerClient();
  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!admin?.is_admin) redirect('/');

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*, profile:profiles(id, email, full_name), plan:subscription_plans(name, interval, price_cents)')
    .order('created_at', { ascending: false });

  const totalActive = subs?.filter(s => s.status === 'active').length || 0;

  const stripeMrr = subs?.filter(s => s.status === 'active').reduce((sum, s) => {
    const plan = s.plan as any;
    if (!plan) return sum;
    return sum + (plan.interval === 'month' ? plan.price_cents : plan.price_cents / 12);
  }, 0) || 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const { data: externalThisMonth } = await supabase
    .from('purchases')
    .select('amount')
    .eq('status', 'external')
    .gte('created_at', startOfMonth.toISOString());
  const externalMrr = (externalThisMonth || []).reduce((sum, p) => sum + p.amount, 0);
  const totalMrr = stripeMrr + externalMrr;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Abonnements</h1>
        <p className="text-silver-500 text-sm">Gestion de tous les abonnements</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card-dark rounded-2xl p-5">
          <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">Total actifs</p>
          <p className="font-serif text-3xl gold-text">{totalActive}</p>
        </div>
        <div className="card-dark rounded-2xl p-5">
          <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">Total abonnements</p>
          <p className="font-serif text-3xl text-silver-200">{subs?.length || 0}</p>
        </div>
        <div className="card-dark rounded-2xl p-5 border border-gold-600/20">
          <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">MRR estimé <span className="text-silver-600 font-normal normal-case">(mois en cours)</span></p>
          <p className="font-serif text-3xl gold-text">{formatPrice(totalMrr)}</p>
          <p className="text-silver-600 text-xs mt-1">Stripe + paiements externes ce mois</p>
        </div>
      </div>

      <AbonnementsClient subs={subs || []} />
    </div>
  );
}
