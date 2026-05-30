'use client';
import { useState } from 'react';
import { BookOpen, Crown, Check, AlertCircle } from 'lucide-react';

interface Book { id: string; title: string; }

export default function GrantActions({ userId, books }: { userId: string; books: Book[] }) {
  const [selectedBook, setSelectedBook] = useState('');
  const [loadingBook, setLoadingBook] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function grantBook() {
    if (!selectedBook) return;
    setLoadingBook(true);
    setMsg(null);
    const res = await fetch('/api/admin/grant-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, book_id: selectedBook }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Livre accordé avec succès !' } : { type: 'error', text: data.error });
    setLoadingBook(false);
    if (res.ok) setTimeout(() => window.location.reload(), 1000);
  }

  async function grantSubscription() {
    setLoadingSub(true);
    setMsg(null);
    const res = await fetch('/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Abonnement activé pour 1 an !' } : { type: 'error', text: data.error });
    setLoadingSub(false);
    if (res.ok) setTimeout(() => window.location.reload(), 1000);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl text-gold-300">Accorder un accès manuellement</h2>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="card-dark p-5 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
          <BookOpen className="w-4 h-4 text-gold-500" />
          Accorder un livre gratuitement
        </div>
        <select
          value={selectedBook}
          onChange={e => setSelectedBook(e.target.value)}
          className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm"
        >
          <option value="">Choisir un livre...</option>
          {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        <button
          onClick={grantBook}
          disabled={!selectedBook || loadingBook}
          className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {loadingBook ? 'En cours...' : 'Accorder ce livre'}
        </button>
      </div>

      <div className="card-dark p-5 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
          <Crown className="w-4 h-4 text-purple-400" />
          Accorder un abonnement (1 an)
        </div>
        <p className="text-silver-500 text-xs">Active un abonnement gratuit d'un an pour cet utilisateur.</p>
        <button
          onClick={grantSubscription}
          disabled={loadingSub}
          className="px-4 py-2 rounded-lg text-sm bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50"
        >
          {loadingSub ? 'En cours...' : 'Activer abonnement 1 an'}
        </button>
      </div>
    </div>
  );
}