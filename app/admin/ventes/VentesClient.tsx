'use client';
import { useState } from 'react';
import { formatPrice, formatDate } from '@/lib/utils';
import { Trash2, AlertCircle } from 'lucide-react';

const statusLabels: Record<string, { label: string; color: string }> = {
  completed: { label: 'Complété', color: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30' },
  pending:   { label: 'En attente', color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30' },
  refunded:  { label: 'Remboursé', color: 'text-red-400 bg-red-900/20 border-red-700/30' },
};

export default function VentesClient({ sales: initialSales }: { sales: any[] }) {
  const [sales, setSales] = useState(initialSales);
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.amount, 0);
  const pendingCount = sales.filter(s => s.status === 'pending').length;

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Ventes</h1>
          <p className="text-silver-500 text-sm">{sales.length} transaction{sales.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-start gap-4">
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
          <AlertCircle className="w-4 h-4" />
          {msg.text}
        </div>
      )}

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/50">
              {['Livre', 'Client', 'Montant', 'Statut', 'Date', ''].map(h => (
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
                    <button onClick={() => deleteSale(sale.id)} disabled={loading === sale.id} className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
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