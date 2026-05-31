import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { UserProfile } from '@clerk/nextjs';
import { Crown, Clock, Receipt, ArrowRight } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const { userId } = await auth();
  const supabase = createServerClient();

  let sub = null;
  let payments: any[] = [];

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (profile) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('status, current_period_end, plan:subscription_plans(interval)')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .single();
      sub = subData;

      const { data: payData } = await supabase
        .from('purchases')
        .select('id, created_at, amount, payment_method, status, book:books(title)')
        .eq('user_id', profile.id)
        .in('status', ['completed', 'external'])
        .order('created_at', { ascending: false })
        .limit(5);
      payments = payData || [];
    }
  }

  const daysLeft = sub?.current_period_end
    ? Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const expiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <div className="min-h-screen py-16 px-4 max-w-2xl mx-auto space-y-8">

      {/* Subscription card */}
      {sub ? (
        <div className={`card-dark rounded-2xl p-6 ${expiringSoon ? 'border border-yellow-500/30' : 'border border-purple-500/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              <h2 className="font-serif text-lg text-silver-200">Mon Abonnement</h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">Actif</span>
          </div>

          {expiringSoon && (
            <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-500/30 rounded-xl px-3 py-2 mb-4 text-yellow-400 text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Expire dans <strong>{daysLeft} jour{daysLeft > 1 ? 's' : ''}</strong> — le {formatDate(sub.current_period_end)}</span>
            </div>
          )}

          {!expiringSoon && sub.current_period_end && (
            <p className="text-silver-500 text-sm mb-4">
              Accès jusqu'au <span className="text-silver-300 font-medium">{formatDate(sub.current_period_end)}</span>
            </p>
          )}

          {/* Recent payments */}
          {payments.length > 0 && (
            <div className="border-t border-ash/30 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-silver-500" />
                <p className="text-silver-500 text-xs uppercase tracking-wide">Historique des paiements</p>
              </div>
              <div className="space-y-2">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-silver-300 text-sm">{p.status === 'external' ? 'Abonnement' : (p.book?.title || 'Achat')}</p>
                      <p className="text-silver-600 text-xs">{formatDate(p.created_at)}{p.payment_method ? ` · ${p.payment_method}` : ''}</p>
                    </div>
                    <span className="text-gold-400 text-sm font-medium">{formatPrice(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/abonnement/dashboard" className="mt-4 flex items-center gap-1 text-purple-400 text-sm hover:text-purple-300 transition-colors">
            Voir tous les détails <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="card-dark rounded-2xl p-6 border border-ash/30">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-silver-600" />
            <h2 className="font-serif text-lg text-silver-400">Abonnement</h2>
          </div>
          <p className="text-silver-500 text-sm mb-4">Vous n'avez pas d'abonnement actif.</p>
          <Link href="/abonnement" className="btn-gold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2">
            Voir les offres <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Clerk UserProfile */}
      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'bg-obsidian border border-ash/50 shadow-card rounded-2xl',
            headerTitle: 'font-serif text-silver-200',
            headerSubtitle: 'text-silver-500',
            formButtonPrimary: 'bg-gold-600 hover:bg-gold-500 text-void',
          },
        }}
      />
    </div>
  );
}
