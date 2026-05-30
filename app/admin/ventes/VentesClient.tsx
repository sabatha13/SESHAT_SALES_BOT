'use client';
import { useState, useMemo } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import { Trash2, AlertCircle, Check, Download, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const statusLabels: Record<string, { label: string; color: string }> = {
  completed: { label: 'Complété', color: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  pending:   { label: 'En attente', color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
  refunded:  { label: 'Remboursé', color: 'text-red-400 bg-red-900/20 border-red-700/30' },
};

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export default function VentesClient({ sales: initialSales }: { sales: any[] }) {
  const [sales, setSales] = useState(initialSales);
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const completed = sales.filter(s => s.status === 'completed');
  const totalRevenue = completed.reduce((sum, s) => sum + s.amount, 0);
  const pendingCount = sales.filter(s => s.status === 'pending').length;

  // Revenue by month (last 12 months)
  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach(s => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = (map[key] || 0) + s.amount;
    });
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { month: MONTHS_FR[d.getMonth()], amount: (map[key] || 0) / 100 };
    });
  }, [sales]);

  // Revenue by book
  const revenueByBook = useMemo(() => {
    const map: Record<string, { title: string; amount: number; count: number }> = {};
    completed.forEach(s => {
      const id = s.books?.title || 'Inconnu';
      if (!map[id]) map[id] = { title: id, amount: 0, count: 0 };
      map[id].amount += s.amount;
      map[id].count += 1;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [sales]);

  function exportCSV() {
    const rows = [
      ['Livre', 'Client', 'Email', 'Montant ($US)', 'Statut', 'Date'],
      ...sales.map(s => [
        s.books?.title || '',
        s.profiles?.full_name || '',
        s.profiles?.email || '',
        (s.amount / 100).toFixed(2),
        s.status,
        formatDate(s.created_at),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteSale(id: string) {
    setLoading(id); setMsg(null);
    const res = await fetch('/api/admin/delete-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: id }),
    });
    if (res.ok) {
      setSales(prev => prev.filter(s => s.id !== id));
      setMsg({ type: 'success', text: 'Transaction supprimée.' });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
    setLoading('');
  }

  async function refundSale(id: string) {
    setLoading(`refund-${id}`); setMsg(null);
    const res = await fetch('/api/admin/refund-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: id }),
    });
    if (res.ok) {
      setSales(prev => prev.map(s => s.id === id ? { ...s, status: 'refunded' } : s));
      setMsg({ type: 'success', text: 'Vente marquée comme remboursée.' });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors du remboursement.' });
    }
    setLoading('');
  }

  async function deleteAllPending() {
    setLoading('all'); setMsg(null);
    const res = await fetch('/api/admin/delete-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delete_all_pending: true }),
    });
    if (res.ok) {
      setSales(prev => prev.filter(s => s.status !== 'pending'));
      setMsg({ type: 'success', text: 'Toutes les transactions en attente supprimées.' });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors de la suppression.' });
    }
    setLoading('');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Ventes & Revenus</h1>
          <p className="text-silver-500 text-sm">{sales.length} transaction{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-start gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-charcoal border border-ash/50 text-silver-300 text-sm hover:border-gold-500/50 hover:text-gold-400 transition-all">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
          {pendingCount > 0 && (
            <button onClick={deleteAllPending} disabled={loading === 'all'} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-all disabled:opacity-50">
              <Trash2 className="w-4 h-4" />
              {loading === 'all' ? 'Suppression...' : `Supprimer les ${pendingCount} en attente`}
            </button>
          )}
          <div className="card-dark px-5 py-3 rounded-xl text-right">
            <p className="text-silver-500 text-xs uppercase tracking-wide mb-1">Revenus totaux</p>
            <p className="text-2xl font-serif gold-text">{formatPrice(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by month */}
        <div className="card-dark p-5 rounded-2xl">
          <h2 className="font-serif text-lg text-gold-300 mb-4">Revenus par mois (12 derniers mois)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenus']}
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#e5e7eb' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {revenueByMonth.map((_, i) => (
                  <Cell key={i} fill={i === revenueByMonth.length - 1 ? '#d4a843' : '#4b3a1f'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by book */}
        <div className="card-dark p-5 rounded-2xl">
          <h2 className="font-serif text-lg text-gold-300 mb-4">Revenus par livre</h2>
          {revenueByBook.length === 0 ? (
            <p className="text-silver-500 text-sm">Aucune vente complétée.</p>
          ) : (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {revenueByBook.map((b, i) => {
                const pct = totalRevenue > 0 ? (b.amount / totalRevenue) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-silver-300 truncate max-w-[200px]">{b.title}</span>
                      <span className="text-gold-400 font-medium ml-2 shrink-0">{formatPrice(b.amount)} <span className="text-silver-500 font-normal text-xs">({b.count} vente{b.count > 1 ? 's' : ''})</span></span>
                    </div>
                    <div className="h-1.5 bg-charcoal rounded-full overflow-hidden">
                      <div className="h-full bg-gold-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transactions table */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/50">
              {['Livre', 'Client', 'Montant', 'Statut', 'Date', 'Actions'].map(h => (
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {sale.status === 'completed' && (
                        <button
                          onClick={() => refundSale(sale.id)}
                          disabled={loading === `refund-${sale.id}`}
                          title="Rembourser"
                          className="text-yellow-400 hover:text-yellow-300 transition-colors disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteSale(sale.id)}
                        disabled={loading === sale.id}
                        title="Supprimer"
                        className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sales.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-silver-500 text-sm">
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
