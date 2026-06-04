'use client';

import { useState, useMemo } from 'react';
import { Check, X, Trash2, Search, Star } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
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

export default function ReviewModerationClient({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const approve = async (id: string) => {
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_approved: true }),
    });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: true } : r));
  };

  const reject = async (id: string) => {
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_approved: false }),
    });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_approved: false } : r));
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet avis définitivement ?')) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  }, [reviews]);

  const filtered = useMemo(() => {
    let result = reviews;
    if (filter === 'pending') result = result.filter(r => !r.is_approved);
    else if (filter === 'approved') result = result.filter(r => r.is_approved);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        (r.profile?.full_name || '').toLowerCase().includes(q) ||
        (r.profile?.email || '').toLowerCase().includes(q) ||
        (r.book?.title || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [reviews, filter, search]);

  const pending = reviews.filter(r => !r.is_approved).length;

  const ReviewCard = ({ r }: { r: any }) => {
    const name = r.profile?.full_name || r.profile?.email || '—';
    return (
      <div className="card-dark rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <Avatar name={name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-silver-200 text-sm font-medium">{name}</p>
                  <StarRating rating={r.rating} size="sm" />
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${r.is_approved ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {r.is_approved ? 'Approuvé' : 'En attente'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {r.book?.title && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400">
                      {r.book.title}
                    </span>
                  )}
                  <span className="text-silver-600 text-xs">{formatDate(r.created_at)}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!r.is_approved && (
                  <button onClick={() => approve(r.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Approuver">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {r.is_approved && (
                  <button onClick={() => reject(r.id)} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Retirer l'approbation">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => remove(r.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {r.comment && (
              <p className="text-silver-400 text-sm mt-3 leading-relaxed border-l-2 border-ash/50 pl-3 italic">
                "{r.comment}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-dark rounded-2xl p-5">
          <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">Total avis</p>
          <p className="font-serif text-3xl text-silver-200">{reviews.length}</p>
        </div>
        <div className="card-dark rounded-2xl p-5">
          <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">En attente</p>
          <p className={`font-serif text-3xl ${pending > 0 ? 'text-amber-400' : 'text-silver-200'}`}>{pending}</p>
        </div>
        <div className="card-dark rounded-2xl p-5 border border-gold-600/20">
          <p className="text-silver-500 text-xs uppercase tracking-widest mb-1">Note moyenne</p>
          <div className="flex items-center gap-2">
            <p className="font-serif text-3xl gold-text">{avgRating.toFixed(1)}</p>
            <Star className="w-5 h-5 text-gold-400 fill-gold-400" />
          </div>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
          <input
            type="text"
            placeholder="Rechercher par nom, livre ou commentaire..."
            value={search}
            onChange={e => { setSearch(e.target.value); }}
            className="w-full bg-charcoal border border-ash/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
          />
        </div>
        <div className="flex gap-2">
          {[{ key: 'all', label: 'Tous' }, { key: 'pending', label: 'En attente' }, { key: 'approved', label: 'Approuvés' }].map(f => (
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

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(r => <ReviewCard key={r.id} r={r} />)}
        </div>
      ) : (
        <div className="card-dark rounded-2xl p-10 text-center text-silver-500 text-sm">
          Aucun avis trouvé.
        </div>
      )}

      <p className="text-silver-600 text-xs text-right">{filtered.length} avis affiché{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
}
