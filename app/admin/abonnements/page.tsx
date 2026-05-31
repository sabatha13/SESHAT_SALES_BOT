import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { formatDate, formatPrice } from '@/lib/utils';
import SubscriptionBadge from '@/components/subscription/SubscriptionBadge';

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

  // MRR from Stripe plans
  const stripeMrr = subs?.filter(s => s.status === 'active').reduce((sum, s) => {
    const plan = s.plan as any;
    if (!plan) return sum;
    return sum + (plan.interval === 'month' ? plan.price_cents : plan.price_cents / 12);
  }, 0) || 0;

  // Revenue from external payments this month
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
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-serif text-2xl gold-text mb-2">Abonnements</h1>
      <p className="text-silver-500 text-sm mb-8">Gestion de tous les abonnements actifs</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card-dark rounded-2xl p-5">
          <p className="text-silver-500 text-xs uppercase tracking-widest">Total actifs</p>
          <p className="font-serif text-3xl gold-text mt-1">{totalActive}</p>
        </div>
        <div className="card-dark rounded-2xl p-5">
          <p className="text-silver-500 text-xs uppercase tracking-widest">Total abonnements</p>
          <p className="font-serif text-3xl text-silver-200 mt-1">{subs?.length || 0}</p>
        </div>
        <div className="card-dark rounded-2xl p-5">
          <p className="text-silver-500 text-xs uppercase tracking-widest">MRR estimé</p>
          <p className="font-serif text-3xl gold-text mt-1">{formatPrice(totalMrr)}</p>
          <p className="text-silver-600 text-xs mt-1">Stripe + paiements externes ce mois</p>
        </div>
      </div>

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ash/50">
            <tr className="text-left">
              {['Utilisateur', 'Plan', 'Statut', 'Période', 'Créé le'].map(h => (
                <th key={h} className="px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ash/30">
            {subs?.map((sub: any) => (
              <tr key={sub.id} className="hover:bg-charcoal/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-silver-200 font-medium">{sub.profile?.full_name || '—'}</p>
                  <p className="text-silver-500 text-xs">{sub.profile?.email}</p>
                </td>
                <td className="px-4 py-3 text-silver-400">
                  {sub.plan
                    ? `${sub.plan.interval === 'month' ? 'Mensuel' : 'Annuel'} • ${(sub.plan.price_cents / 100).toFixed(2)} $US`
                    : <span className="text-blue-400 text-xs border border-blue-500/30 px-2 py-0.5 rounded-full">Manuel</span>}
                </td>
                <td className="px-4 py-3">
                  <SubscriptionBadge status={sub.status} />
                </td>
                <td className="px-4 py-3 text-silver-400 text-xs">
                  {sub.current_period_end ? formatDate(sub.current_period_end) : '—'}
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(sub.created_at)}</td>
              </tr>
            ))}
            {(!subs || subs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-silver-500">Aucun abonnement</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
