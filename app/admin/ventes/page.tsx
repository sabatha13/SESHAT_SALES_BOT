import { createServerClient } from '@/lib/supabase/server';
import { formatPrice, formatDate } from '@/lib/utils';

async function getSales() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('purchases')
    .select('*, profiles(email, full_name), books(title, cover_url)')
    .order('created_at', { ascending: false });
  return data || [];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  completed: { label: 'Complété', color: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  pending:   { label: 'En attente', color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
  refunded:  { label: 'Remboursé', color: 'text-red-400 bg-red-900/20 border-red-700/30' },
};

export default async function VentesPage() {
  const sales = await getSales();
  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Ventes</h1>
          <p className="text-silver-500 text-sm">{sales.length} transaction{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card-dark px-5 py-3 rounded-xl text-right">
          <p className="text-silver-500 text-xs uppercase tracking-wide mb-1">Revenus totaux</p>
          <p className="text-2xl font-serif gold-text">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/50">
              {['Livre', 'Client', 'Montant', 'Statut', 'Date'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((sale: any) => {
              const s = statusLabels[sale.status] || statusLabels.pending;
              return (
                <tr key={sale.id} className="border-b border-ash/20 hover:bg-charcoal/30 transition-colors">
                  <td className="px-4 py-3 text-silver-300 text-sm max-w-[180px]">
                    <p className="line-clamp-1">{sale.books?.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-silver-300 text-sm">{sale.profiles?.full_name || '—'}</p>
                    <p className="text-silver-500 text-xs">{sale.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gold-400 text-sm font-medium">{formatPrice(sale.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block border text-xs px-2.5 py-0.5 rounded-full ${s.color}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(sale.created_at)}</td>
                </tr>
              );
            })}
            {sales.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-silver-500 text-sm">
                  Aucune vente pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
