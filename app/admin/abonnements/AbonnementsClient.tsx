'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Crown, Ban, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function Avatar({ name }: { name: string }) {
  const initials = (name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-gold-700/40', 'bg-purple-700/40', 'bg-emerald-700/40', 'bg-blue-700/40', 'bg-rose-700/40'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color} border border-white/10`}>
      <span className="text-silver-200 text-xs font-medium">{initials}</span>
    </div>
  );
}

function DaysRemaining({ endDate }: { endDate: string }) {
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return <span className="text-red-400 text-xs">Expiré</span>;
  if (days <= 3) return <span className="text-red-400 text-xs font-medium">{days} jour{days !== 1 ? 's' : ''} restant{days !== 1 ? 's' : ''}</span>;
  if (days <= 7) return <span className="text-yellow-400 text-xs font-medium">{days} jours restants</span>;
  return <span className="text-emerald-400 text-xs">{days} jours restants</span>;
}

export default function AbonnementsClient({ subs: initialSubs }: { subs: any[] }) {
  const [subs, setSubs] = useState(initialSubs);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filtered = useMemo(() => {
    let result = subs;
    if (filter === 'active') result = result.filter(s => s.status === 'active');
    else if (filter === 'cancelled') result = result.filter(s => s.status === 'cancelled' || s.status === 'canceled');
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        (s.profile?.full_name || '').toLowerCase().includes(q) ||
        (s.profile?.email || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [subs, filter, search]);

  async function renewSub(subId: string, profileId: string) {
    setLoading(subId); setMsg(null);
    const res = await fetch('/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: profileId, months: 1 }),
    });
    if (res.ok) {
      setSubs(prev => prev.map(s => {
        if (s.id !== subId) return s;
        const newEnd = new Date(s.current_period_end || Date.now());
        newEnd.setMonth(newEnd.getMonth() + 1);
        return { ...s, status: 'active', current_period_end: newEnd.toISOString() };
      }));
      setMsg({ type: 'success', text: 'Abonnement renouvelé d\'1 mois.' });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors du renouvellement.' });
    }
    setLoading('');
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-charcoal border border-ash/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
          />
        </div>
        <div className="flex gap-2">
          {[{ key: 'all', label: 'Tous' }, { key: 'active', label: 'Actifs' }, { key: 'cancelled', label: 'Annulés' }].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filter === f.key ? 'bg-gold-500/20 border border-gold-500/50 text-gold-400' : 'bg-charcoal border border-ash/50 text-silver-400 hover:border-gold-500/30'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ash/50">
            <tr className="text-left">
              {['Utilisateur', 'Plan', 'Statut', 'Expiration', 'Jours restants', 'Créé le', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ash/30">
            {filtered.map((sub: any) => (
              <tr key={sub.id} className="hover:bg-charcoal/40 transition-colors">
                {/* Utilisateur */}
                <td className="px-4 py-3">
                  <Link href={`/admin/utilisateurs/${sub.profile?.id}`} className="flex items-center gap-3">
                    <Avatar name={sub.profile?.full_name || '?'} />
                    <div>
                      <p className="text-silver-200 font-medium text-sm hover:text-gold-400 transition-colors">
                        {sub.profile?.full_name || '—'}
                      </p>
                      <a
                        href={`mailto:${sub.profile?.email}`}
                        onClick={e => e.stopPropagation()}
                        className="text-silver-500 text-xs hover:text-gold-400 transition-colors"
                      >
                        {sub.profile?.email}
                      </a>
                    </div>
                  </Link>
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  {sub.plan ? (
                    <div>
                      <span className="text-silver-300 text-xs">{sub.plan.interval === 'month' ? 'Mensuel' : 'Annuel'}</span>
                      <p className="text-gold-400 text-xs font-medium">{(sub.plan.price_cents / 100).toFixed(2)} $US</p>
                    </div>
                  ) : (
                    <span className="text-blue-400 text-xs border border-blue-500/30 px-2 py-0.5 rounded-full">Manuel</span>
                  )}
                </td>

                {/* Statut */}
                <td className="px-4 py-3">
                  {sub.status === 'active' ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Actif
                    </span>
                  ) : (sub.status === 'cancelled' || sub.status === 'canceled') ? (
                    <span className="flex items-center gap-1.5 text-silver-500 text-xs">
                      <Ban className="w-3 h-3" /> Annulé
                    </span>
                  ) : (
                    <span className="text-silver-500 text-xs">{sub.status}</span>
                  )}
                </td>

                {/* Expiration */}
                <td className="px-4 py-3 text-silver-400 text-xs">
                  {sub.current_period_end ? formatDate(sub.current_period_end) : '—'}
                </td>

                {/* Jours restants */}
                <td className="px-4 py-3">
                  {sub.current_period_end && sub.status === 'active'
                    ? <DaysRemaining endDate={sub.current_period_end} />
                    : <span className="text-silver-600 text-xs">—</span>
                  }
                </td>

                {/* Créé le */}
                <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(sub.created_at)}</td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => renewSub(sub.id, sub.profile?.id)}
                    disabled={loading === sub.id}
                    title="Renouveler +1 mois"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs hover:bg-gold-500/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading === sub.id ? 'animate-spin' : ''}`} />
                    {loading === sub.id ? '...' : '+1 mois'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-silver-500 text-sm">
                  Aucun abonnement trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-ash/20 text-right">
          <p className="text-silver-600 text-xs">{filtered.length} abonnement{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}
