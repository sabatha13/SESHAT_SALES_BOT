import { createServerClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import { BookMarked, Users, ShoppingBag, TrendingUp } from 'lucide-react';

async function getStats() {
  const supabase = createServerClient();
  const [books, users, purchases] = await Promise.all([
    supabase.from('books').select('id', { count: 'exact' }).eq('is_published', true),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('purchases').select('amount').eq('status', 'completed'),
  ]);

  const revenue = (purchases.data || []).reduce((sum, p) => sum + p.amount, 0);

  return {
    books: books.count || 0,
    users: users.count || 0,
    sales: (purchases.data || []).length,
    revenue,
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

export default async function AdminDashboard() {
  const [stats, recentSales] = await Promise.all([getStats(), getRecentSales()]);

  const cards = [
    { label: 'Livres publiés', value: stats.books, icon: BookMarked, color: 'text-blue-400' },
    { label: 'Utilisateurs', value: stats.users, icon: Users, color: 'text-purple-400' },
    { label: 'Ventes', value: stats.sales, icon: ShoppingBag, color: 'text-emerald-400' },
    { label: 'Revenus', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-gold-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Tableau de bord</h1>
        <p className="text-silver-500 text-sm">Vue d'ensemble de votre librairie</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Recent sales */}
      <div className="card-dark rounded-2xl p-6">
        <h2 className="font-serif text-xl text-gold-300 mb-4">Ventes récentes</h2>
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
    </div>
  );
}
