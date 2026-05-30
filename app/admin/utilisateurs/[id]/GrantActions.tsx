'use client';
import { useState } from 'react';
import { BookOpen, Crown, Check, AlertCircle, Trash2, Ban } from 'lucide-react';

interface Book { id: string; title: string; }
interface OwnedBook { purchaseId: string; bookId: string; title: string; cover_url?: string; category?: string; purchaseDate: string; price: number; }

export default function GrantActions({ userId, books, ownedBooks, hasSubscription, isBanned }: {
  userId: string;
  books: Book[];
  ownedBooks: OwnedBook[];
  hasSubscription: boolean;
  isBanned: boolean;
}) {
  const [selectedBook, setSelectedBook] = useState('');
  const [loadingBook, setLoadingBook] = useState(false);
  const [loadingSub, setLoadingSub] = useState('');
  const [loadingRevoke, setLoadingRevoke] = useState('');
  const [loadingBan, setLoadingBan] = useState(false);
  const [banned, setBanned] = useState(isBanned);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function grantBook() {
    if (!selectedBook) return;
    setLoadingBook(true); setMsg(null);
    const res = await fetch('/api/admin/grant-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, book_id: selectedBook }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Livre accordé !' } : { type: 'error', text: data.error });
    setLoadingBook(false);
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  }

  async function grantSub(months: number) {
    setLoadingSub(String(months)); setMsg(null);
    const res = await fetch('/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, months }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: `Abonnement ${months === 1 ? 'mensuel' : 'annuel'} activé !` } : { type: 'error', text: data.error });
    setLoadingSub('');
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  }

  async function revokeBook(purchaseId: string) {
    setLoadingRevoke(purchaseId); setMsg(null);
    const res = await fetch('/api/admin/revoke-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: purchaseId }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Accès retiré.' } : { type: 'error', text: data.error });
    setLoadingRevoke('');
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  }

  async function toggleBan() {
    setLoadingBan(true); setMsg(null);
    const res = await fetch('/api/admin/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ban: !banned }),
    });
    const data = await res.json();
    if (res.ok) {
      setBanned(!banned);
      setMsg({ type: 'success', text: !banned ? 'Compte suspendu.' : 'Compte réactivé.' });
    } else {
      setMsg({ type: 'error', text: data.error });
    }
    setLoadingBan(false);
  }

  async function revokeSubscription() {
    setLoadingSub('revoke'); setMsg(null);
    const res = await fetch('/api/admin/revoke-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Abonnement annulé.' } : { type: 'error', text: data.error });
    setLoadingSub('');
    if (res.ok) setTimeout(() => window.location.reload(), 800);
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

      {/* Ban / Suspend */}
      <div className={`card-dark p-5 rounded-xl space-y-3 ${banned ? 'border border-red-500/30' : ''}`}>
        <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
          <Ban className="w-4 h-4 text-red-400" />
          Suspension du compte
        </div>
        {banned && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
            <Ban className="w-3 h-3" /> Ce compte est actuellement suspendu
          </div>
        )}
        <button
          onClick={toggleBan}
          disabled={loadingBan}
          className={`px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 ${banned ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'}`}
        >
          {loadingBan ? '...' : banned ? 'Réactiver le compte' : 'Suspendre le compte'}
        </button>
      </div>

      {/* Grant book */}
      <div className="card-dark p-5 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
          <BookOpen className="w-4 h-4 text-gold-500" />
          Accorder un livre gratuitement
        </div>
        <select value={selectedBook} onChange={e => setSelectedBook(e.target.value)} className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm">
          <option value="">Choisir un livre...</option>
          {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        <button onClick={grantBook} disabled={!selectedBook || loadingBook} className="btn-gold px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {loadingBook ? 'En cours...' : 'Accorder ce livre'}
        </button>
      </div>

      {/* Grant subscription */}
      <div className="card-dark p-5 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
          <Crown className="w-4 h-4 text-purple-400" />
          Accorder un abonnement
        </div>
        {hasSubscription && (
          <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
            <span className="text-purple-400 text-xs">Abonnement actif</span>
            <button onClick={revokeSubscription} disabled={loadingSub === 'revoke'} className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> {loadingSub === 'revoke' ? '...' : 'Annuler'}
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => grantSub(1)} disabled={!!loadingSub || hasSubscription} className="flex-1 px-3 py-2 rounded-lg text-sm bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50">
            {loadingSub === '1' ? '...' : 'Mensuel (1 mois)'}
          </button>
          <button onClick={() => grantSub(12)} disabled={!!loadingSub || hasSubscription} className="flex-1 px-3 py-2 rounded-lg text-sm bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50">
            {loadingSub === '12' ? '...' : 'Annuel (1 an)'}
          </button>
        </div>
      </div>

      {/* Revoke book access */}
      {ownedBooks.length > 0 && (
        <div className="card-dark p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
            <Trash2 className="w-4 h-4 text-red-400" />
            Retirer un accès livre
          </div>
          <div className="space-y-2">
            {ownedBooks.map(ob => (
              <div key={ob.purchaseId} className="flex items-center justify-between bg-charcoal/50 rounded-lg px-3 py-2">
                <span className="text-silver-400 text-sm">{ob.title}</span>
                <button onClick={() => revokeBook(ob.purchaseId)} disabled={loadingRevoke === ob.purchaseId} className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> {loadingRevoke === ob.purchaseId ? '...' : 'Retirer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}