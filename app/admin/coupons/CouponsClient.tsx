'use client';

import { useState } from 'react';
import { Loader2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { Coupon } from '@/lib/types';

export default function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', discount_percent: '', max_uses: '', expires_at: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
        }),
      });
      const data = await res.json();
      if (data.coupon) setCoupons(prev => [data.coupon, ...prev]);
      setForm({ code: '', discount_percent: '', max_uses: '', expires_at: '' });
    } finally {
      setCreating(false);
    }
  };

  const toggleCoupon = async (id: string, is_active: boolean) => {
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !is_active } : c));
  };

  return (
    <div className="space-y-8">
      {/* Create form */}
      <div className="card-dark rounded-2xl p-6">
        <h2 className="font-serif text-silver-200 mb-4">Créer un coupon</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Code *</label>
            <input
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              required
              placeholder="SOLEIL20"
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Réduction (%)</label>
            <input
              type="number"
              value={form.discount_percent}
              onChange={e => setForm(p => ({ ...p, discount_percent: e.target.value }))}
              min="1" max="100"
              placeholder="20"
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Max utilisations</label>
            <input
              type="number"
              value={form.max_uses}
              onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
              placeholder="100"
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Expiration</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={creating} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer le coupon
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ash/50">
            <tr className="text-left">
              {['Code', 'Réduction', 'Utilisations', 'Expire', 'Statut', ''].map(h => (
                <th key={h} className="px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ash/30">
            {coupons.map(c => (
              <tr key={c.id} className="hover:bg-charcoal/50">
                <td className="px-4 py-3 font-mono text-gold-400">{c.code}</td>
                <td className="px-4 py-3 text-silver-300">
                  {c.discount_percent ? `${c.discount_percent}%` : c.discount_cents ? `${(c.discount_cents / 100).toFixed(2)} €` : '—'}
                </td>
                <td className="px-4 py-3 text-silver-400">
                  {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-ash/30 text-silver-500'}`}>
                    {c.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleCoupon(c.id, c.is_active)} className="text-silver-400 hover:text-gold-400 transition-colors">
                    {c.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-silver-500">Aucun coupon</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
