'use client';

import { useState } from 'react';
import StarRating from '@/components/ui/StarRating';
import { Loader2, Send } from 'lucide-react';

export default function ReviewForm({ bookId }: { bookId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setLoading(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, rating, comment }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="card-dark rounded-2xl p-5 text-center text-emerald-400 text-sm">
        ✓ Votre avis a été soumis et sera visible après modération.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-dark rounded-2xl p-5 space-y-4">
      <h3 className="font-serif text-silver-200">Laisser un avis</h3>
      <div>
        <p className="text-silver-500 text-xs mb-2">Note</p>
        <StarRating rating={rating} size="lg" interactive onRate={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Votre commentaire (optionnel)..."
        rows={3}
        className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-3 text-sm text-silver-300 placeholder-silver-600 focus:outline-none focus:border-gold-600/50 resize-none"
      />
      <button type="submit" disabled={!rating || loading} className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Soumettre
      </button>
    </form>
  );
}
