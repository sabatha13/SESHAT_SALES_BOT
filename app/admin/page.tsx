export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { formatPrice, formatDate } from '@/lib/utils';
import { BookMarked, Users, ShoppingBag, TrendingUp, BookOpen, UserPlus, Eye, Star, Crown } from 'lucide-react';

async function getStats() {
  const supabase = createServerClient();
  const [books, users, purchases, sessions] = await Promise.all([
    supabase.from('books').select('id', { count: 'exact' }).eq('is_published', true),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('purchases').select('amount, status').in('status', ['completed', 'external']),
    supabase.from('reader_sessions').select('id', { count: 'exact' }),
  ]);
  const revenue = (purchases.data || []).reduce((sum, p) => sum + p.amount, 0);
  return {
    books: books.count || 0,
    users: users.count || 0,
    sales: (purchases.data || []).filter(p => p.status === 'completed').length,
    revenue,
    reads: sessions.count || 0,
  };
}

async function getRecentSales() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('purchases')
    .select('*, profiles(email, full_name), books(title)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

async function getNewUsersLast7Days() {
  const supabase = createServerClient();
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    days[key] = 0;
  }
  (data || []).forEach(u => {
    const d = new Date(u.created_at);
    const key = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    if (key in days) days[key]++;
  });
  return Object.entries(days).map(([day, count]) => ({ day, count }));
}

async function getTopBooks() {
  const supabase = createServerClient();
  const [{ data: sessions }, { data: purchases }] = await Promise.all([
    supabase.from('reader_sessions').select('book_id, book:books(title)'),
    supabase.from('purchases').select('book_id').eq('status', 'completed'),
  ]);

  const reads: Record<string, { title: string; reads: number; sales: number }> = {};
  (sessions || []).forEach((s: any) => {
    if (!s.book_id) return;
    if (!reads[s.book_id]) reads[s.book_id] = { title: s.book?.title || 'Inconnu', reads: 0, sales: 0 };
    reads[s.book_id].reads++;
  });
  (purchases || []).forEach((p: any) => {
    if (!p.book_id) return;
    if (!reads[p.book_id]) reads[p.book_id] = { title: 'Inconnu', reads: 0, sales: 0 };
    reads[p.book_id].sales++;
  });
  return Object.values(reads).sort((a, b) => b.reads - a.reads).slice(0, 5);
}

async function getRevenueLast30Days() {
  const supabase = createServerClient();
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('purchases')
    .select('amount, created_at')
    .in('status', ['completed', 'external'])
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  const days: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days[key] = 0;
  }
  (data || []).forEach(p => {
    const key = new Date(p.created_at).toISOString().split('T')[0];
    if (key in days) days[key] += p.amount;
  });
  return Object.entries(days).map(([date, amount]) => ({
    date,
    label: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    amount,
  }));
}

async function getSubscriptionStats() {
  const supabase = createServerClient();
  const [activeSubs, plans] = await Promise.all([
    supabase.from('subscriptions').select('id, plan_id, subscription_plans(price_cents, interval)').eq('status', 'active'),
    supabase.from('subscriptions').select('id').eq('status', 'active').is('plan_id', null),
  ]);

  const subs = activeSubs.data || [];
  const manualCount = plans.data?.length || 0;
  const stripeCount = subs.filter(s => s.plan_id).length;

  let mrr = 0;
  subs.forEach((s: any) => {
    const plan = s.subscription_plans;
    if (!plan) return;
    mrr += plan.interval === 'month' ? plan.price_cents : Math.round(plan.price_cents / 12);
  });

  return { total: subs.length, stripeCount, manualCount, mrr };
}

async function getRecentUsers() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('full_name, email, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

export default async function AdminDashboard() {
  const [stats, recentSales, newUsers, topBooks, recentUsers, revenue30, subStats] = await Promise.all([
    getStats(), getRecentSales(), getNewUsersLast7Days(), getTopBooks(), getRecentUsers(),
    getRevenueLast30Days(), getSubscriptionStats(),
  ]);

  const maxNewUsers = Math.max(...newUsers.map(d => d.count), 1);

  const cards = [
    { label: 'Livres publiés', value: stats.books, icon: BookMarked, color: 'text-blue-400' },
    { label: 'Utilisateurs', value: stats.users, icon: Users, color: 'text-purple-400' },
    { label: 'Ventes', value: stats.sales, icon: ShoppingBag, color: 'text-emerald-400' },
    { label: 'Revenus', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-gold-400' },
    { label: 'Sessions lecture', value: stats.reads, icon: BookOpen, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Tableau de bord</h1>
        <p className="text-silver-500 text-sm">Vue d'ensemble de votre librairie</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="card-dark p-5 rounded-2xl gold-border-hover">
            <div className="flex items-center justify-between mb-3">
              <p className="text-silver-500 text-xs uppercase tracking-wide">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-2xl font-semibold text-silver-200">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Subscription stats + Revenue chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Subscription stats */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Crown className="w-4 h-4 text-purple-400" />
            <h2 className="font-serif text-lg text-gold-300">Abonnements actifs</h2>
          </div>
          <p className="text-4xl font-semibold text-silver-200 mb-1">{subStats.total}</p>
          <p className="text-silver-500 text-sm mb-5">abonné{subStats.total !== 1 ? 's' : ''} actif{subStats.total !== 1 ? 's' : ''}</p>
          <div className="space-y-2 border-t border-ash/30 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-silver-500">Via Stripe</span>
              <span className="text-silver-300">{subStats.stripeCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-silver-500">Manuels</span>
              <span className="text-silver-300">{subStats.manualCount}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-ash/30 pt-2 mt-2">
              <span className="text-silver-400 font-medium">MRR estimé</span>
              <span className="text-gold-400 font-semibold">{formatPrice(subStats.mrr)}</span>
            </div>
          </div>
        </div>

        {/* Revenue last 30 days */}
        <div className="card-dark rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-400" />
              <h2 className="font-serif text-lg text-gold-300">Revenus (30 jours)</h2>
            </div>
            <span className="text-gold-400 font-semibold text-sm">
              {formatPrice(revenue30.reduce((s, d) => s + d.amount, 0))}
            </span>
          </div>
          {(() => {
            const max = Math.max(...revenue30.map(d => d.amount), 1);
            const hasData = revenue30.some(d => d.amount > 0);
            return hasData ? (
              <div className="flex items-end gap-0.5 h-28">
                {revenue30.map((d, i) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div
                      className="w-full rounded-t-sm bg-gold-500/40 border-t-2 border-gold-400 transition-all group-hover:bg-gold-500/60"
                      style={{ height: `${Math.max((d.amount / max) * 100, d.amount > 0 ? 8 : 2)}%` }}
                    />
                    {i % 5 === 0 && (
                      <span className="text-silver-600 text-[9px] absolute -bottom-4">{d.label}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-silver-500 text-sm">
                Aucun revenu sur les 30 derniers jours.
              </div>
            );
          })()}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* New users last 7 days */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="w-4 h-4 text-purple-400" />
            <h2 className="font-serif text-lg text-gold-300">Nouveaux inscrits (7 jours)</h2>
          </div>
          <div className="flex items-end gap-2 h-32">
            {newUsers.map(({ day, count }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-silver-400 text-xs">{count > 0 ? count : ''}</span>
                <div
                  className="w-full rounded-t-sm bg-purple-500/40 border-t-2 border-purple-400 transition-all"
                  style={{ height: `${Math.max((count / maxNewUsers) * 100, 4)}%` }}
                />
                <span className="text-silver-600 text-[10px] text-center leading-tight">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top books */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-gold-400" />
            <h2 className="font-serif text-lg text-gold-300">Top livres</h2>
          </div>
          {topBooks.length === 0 ? (
            <p className="text-silver-500 text-sm">Aucune donnée de lecture.</p>
          ) : (
            <div className="space-y-3">
              {topBooks.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-gold-600 font-serif text-sm w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-silver-300 text-sm truncate">{b.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-cyan-400 text-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />{b.reads} lecture{b.reads !== 1 ? 's' : ''}
                      </span>
                      <span className="text-emerald-400 text-xs flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" />{b.sales} vente{b.sales !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent sales */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <h2 className="font-serif text-lg text-gold-300">Ventes récentes</h2>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-silver-500 text-sm">Aucune vente pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b border-ash/30 last:border-0">
                  <div>
                    <p className="text-silver-300 text-sm">{sale.books?.title}</p>
                    <p className="text-silver-500 text-xs">{sale.profiles?.email}</p>
                  </div>
                  <span className="text-gold-400 text-sm font-medium">{formatPrice(sale.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent signups */}
        <div className="card-dark rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-purple-400" />
            <h2 className="font-serif text-lg text-gold-300">Derniers inscrits</h2>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-silver-500 text-sm">Aucun utilisateur.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-ash/30 last:border-0">
                  <div>
                    <p className="text-silver-300 text-sm">{u.full_name || 'Sans nom'}</p>
                    <p className="text-silver-500 text-xs">{u.email}</p>
                  </div>
                  <span className="text-silver-600 text-xs">{formatDate(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
