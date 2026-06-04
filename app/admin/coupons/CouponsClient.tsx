'use client';

import { useState } from 'react';
import { Loader2, Plus, ToggleLeft, ToggleRight, Mail, Check, AlertCircle, Copy } from 'lucide-react';
import { Coupon } from '@/lib/types';

interface Book { id: string; title: string; }

export default function CouponsClient({ initialCoupons, books }: { initialCoupons: Coupon[]; books: Book[] }) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [creating, setCreating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ code: '', discount_percent: '', max_uses: '', expires_at: '', book_ids: [] as string[] });

  function toggleBookSelect(id: string) {
    setForm(p => ({
      ...p,
      book_ids: p.book_ids.includes(id) ? p.book_ids.filter(b => b !== id) : [...p.book_ids, id],
    }));
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
          book_ids: form.book_ids.length ? form.book_ids : null,
        }),
      });
      const data = await res.json();
      if (data.coupon) {
        setCoupons(prev => [data.coupon, ...prev]);
        setForm({ code: '', discount_percent: '', max_uses: '', expires_at: '', book_ids: [] });
        setMsg({ type: 'success', text: 'Coupon créé.' });
      } else {
        setMsg({ type: 'error', text: data.error || 'Erreur.' });
      }
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

  const sendEmail = async (coupon: Coupon) => {
    setSendingEmail(coupon.id); setMsg(null);
    const bookTitles = coupon.book_ids?.length
      ? books.filter(b => coupon.book_ids!.includes(b.id)).map(b => b.title)
      : [];
    const res = await fetch('/api/admin/send-coupon-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon_code: coupon.code,
        discount_percent: coupon.discount_percent,
        expires_at: coupon.expires_at,
        book_titles: bookTitles,
      }),
    });
    const data = await res.json();
    setMsg(res.ok
      ? { type: 'success', text: `Email envoyé à ${data.sent} utilisateur${data.sent > 1 ? 's' : ''}.` }
      : { type: 'error', text: data.error || 'Erreur envoi email.' }
    );
    setSendingEmail('');
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    });
  };

  const isExpired = (expires_at: string | null) =>
    expires_at ? new Date(expires_at) < new Date() : false;

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
              type="number" value={form.discount_percent}
              onChange={e => setForm(p => ({ ...p, discount_percent: e.target.value }))}
              min="1" max="100" placeholder="20"
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Max utilisations</label>
            <input
              type="number" value={form.max_uses}
              onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))}
              placeholder="100"
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Expiration</label>
            <input
              type="date" value={form.expires_at}
              onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
            />
          </div>

          {/* Book restriction */}
          <div className="col-span-2">
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-2">
              Limiter à des livres spécifiques <span className="normal-case text-silver-600">(laisser vide = tous les livres)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {books.map(b => (
                <label key={b.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${form.book_ids.includes(b.id) ? 'border-gold-500/50 bg-gold-900/20 text-gold-300' : 'border-ash/40 text-silver-400 hover:border-ash'}`}>
                  <input
                    type="checkbox"
                    checked={form.book_ids.includes(b.id)}
                    onChange={() => toggleBookSelect(b.id)}
                    className="accent-gold-500"
                  />
                  <span className="line-clamp-1">{b.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <button type="submit" disabled={creating} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer le coupon
            </button>
          </div>
        </form>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* List */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ash/50">
            <tr className="text-left">
              {['Code', 'Réduction', 'Livres', 'Utilisations', 'Expire', 'Statut', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ash/30">
            {coupons.map(c => {
              const expired = isExpired(c.expires_at);
              const bookNames = c.book_ids?.length
                ? books.filter(b => c.book_ids!.includes(b.id)).map(b => b.title)
                : null;
              return (
                <tr key={c.id} className={`hover:bg-charcoal/50 ${expired ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gold-400">{c.code}</span>
                      <button
                        onClick={() => copyCode(c.id, c.code)}
                        title="Copier le code"
                        className="text-silver-500 hover:text-gold-400 transition-colors"
                      >
                        {copiedId === c.id
                          ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><Check className="w-3 h-3" />Copié</span>
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-silver-300">
                    {c.discount_percent ? `${c.discount_percent}%` : c.discount_cents ? `$${(c.discount_cents / 100).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-silver-400 text-xs max-w-[160px]">
                    {bookNames ? (
                      <span className="line-clamp-2">{bookNames.join(', ')}</span>
                    ) : (
                      <span className="text-silver-600">Tous</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-silver-400">
                    {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.expires_at ? (
                      <span className={expired ? 'text-red-400' : 'text-silver-500'}>
                        {new Date(c.expires_at).toLocaleDateString('fr-FR')}
                        {expired && ' (expiré)'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.is_active && !expired ? 'bg-emerald-500/10 text-emerald-400' : 'bg-ash/30 text-silver-500'}`}>
                      {expired ? 'Expiré' : c.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => sendEmail(c)}
                        disabled={sendingEmail === c.id}
                        title="Envoyer par email à tous les utilisateurs"
                        className="text-silver-400 hover:text-gold-400 transition-colors disabled:opacity-50"
                      >
                        {sendingEmail === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                      <button onClick={() => toggleCoupon(c.id, c.is_active)} className="text-silver-400 hover:text-gold-400 transition-colors">
                        {c.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {coupons.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-silver-500">Aucun coupon</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
