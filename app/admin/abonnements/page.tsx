import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';
import SubscriptionBadge from '@/components/subscription/SubscriptionBadge';

export default async function AdminAbonnementsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const supabase = createServerClient();
  const { data: admin } = await supabase.from('profiles').select('is_admin').eq('clerk_user_id', userId).single();
  if (!admin?.is_admin) redirect('/');

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*, profile:profiles(email, full_name), plan:subscription_plans(name, interval, price_cents)')
    .order('created_at', { ascending: false });

  const totalActive = subs?.filter(s => s.status === 'active').length || 0;
  const mrr = subs?.filter(s => s.status === 'active').reduce((sum, s) => {
    const plan = s.plan as any;
    if (!plan) return sum;
    return sum + (plan.interval === 'month' ? plan.price_cents : plan.price_cents / 12);
  }, 0) || 0;

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
          <p className="font-serif text-3xl gold-text mt-1">{(mrr / 100).toFixed(2)} €</p>
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
                  {sub.plan?.interval === 'month' ? 'Mensuel' : 'Annuel'} • {sub.plan ? `${(sub.plan.price_cents / 100).toFixed(2)} €` : '—'}
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
