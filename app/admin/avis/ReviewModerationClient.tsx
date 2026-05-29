'use client';

import { useState } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import { formatDate } from '@/lib/utils';

export default function ReviewModerationClient({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews);

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
    await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const pending = reviews.filter(r => !r.is_approved);
  const approved = reviews.filter(r => r.is_approved);

  const ReviewRow = ({ r }: { r: any }) => (
    <div className="card-dark rounded-2xl p-5 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-silver-200 text-sm font-medium">{r.profile?.full_name || r.profile?.email || '—'}</p>
            <StarRating rating={r.rating} size="sm" />
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {r.is_approved ? 'Approuvé' : 'En attente'}
            </span>
          </div>
          <p className="text-silver-500 text-xs">{r.book?.title} · {formatDate(r.created_at)}</p>
          {r.comment && <p className="text-silver-400 text-sm mt-1">{r.comment}</p>}
        </div>
        <div className="flex gap-1">
          {!r.is_approved && (
            <button onClick={() => approve(r.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded" title="Approuver">
              <Check className="w-4 h-4" />
            </button>
          )}
          {r.is_approved && (
            <button onClick={() => reject(r.id)} className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded" title="Retirer l'approbation">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => remove(r.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-lg text-amber-400 mb-4">En attente ({pending.length})</h2>
        {pending.length > 0 ? (
          <div className="space-y-3">{pending.map(r => <ReviewRow key={r.id} r={r} />)}</div>
        ) : (
          <p className="text-silver-500 text-sm">Aucun avis en attente.</p>
        )}
      </div>
      <div>
        <h2 className="font-serif text-lg text-emerald-400 mb-4">Approuvés ({approved.length})</h2>
        {approved.length > 0 ? (
          <div className="space-y-3">{approved.map(r => <ReviewRow key={r.id} r={r} />)}</div>
        ) : (
          <p className="text-silver-500 text-sm">Aucun avis approuvé.</p>
        )}
      </div>
    </div>
  );
}
