'use client';

import { useState } from 'react';
import { Megaphone, Check, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  price: number;
}

interface Promotion {
  id: string;
  book_id: string | null;
  type: 'popup' | 'banner';
  is_active: boolean;
  book?: Book;
}

export default function PromotionClient({ books, promotion: initial }: { books: Book[]; promotion: Promotion | null }) {
  const [bookId, setBookId] = useState(initial?.book_id || '');
  const [type, setType] = useState<'popup' | 'banner'>(initial?.type || 'popup');
  const [isActive, setIsActive] = useState(initial?.is_active || false);
  const [expiresAt, setExpiresAt] = useState((initial as any)?.expires_at ? new Date((initial as any).expires_at).toISOString().slice(0, 16) : '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedBook = books.find(b => b.id === bookId);

  async function save() {
    setLoading(true);
    setMsg(null);
    const res = await fetch('/api/admin/promotion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId || null, type, is_active: isActive, expires_at: expiresAt || null }),
    });
    if (res.ok) {
      setMsg({ type: 'success', text: 'Promotion sauvegardée avec succès !' });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Promotion</h1>
        <p className="text-silver-500 text-sm">Configurez le popup ou bannière affiché sur la page d'accueil.</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="card-dark rounded-2xl p-6 space-y-6">

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-silver-200 text-sm font-medium">Promotion active</p>
            <p className="text-silver-500 text-xs mt-0.5">Afficher la promotion sur la page d'accueil</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${isActive ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-ash/20 border-ash/40 text-silver-500'}`}
          >
            {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {isActive ? 'Activée' : 'Désactivée'}
          </button>
        </div>

        {/* Type */}
        <div>
          <p className="text-silver-400 text-sm mb-3">Type d'affichage</p>
          <div className="grid grid-cols-2 gap-3">
            {(['popup', 'banner'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`p-4 rounded-xl border text-sm transition-all ${type === t ? 'border-gold-500/60 bg-gold-500/10 text-gold-400' : 'border-ash/40 text-silver-500 hover:border-ash'}`}
              >
                <p className="font-medium capitalize">{t === 'popup' ? '🪟 Popup' : '📢 Bannière'}</p>
                <p className="text-xs mt-1 opacity-70">
                  {t === 'popup' ? 'Fenêtre centrée, s\'affiche après 2s' : 'Bandeau en haut de page'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Book selector */}
        <div>
          <p className="text-silver-400 text-sm mb-3">Livre à promouvoir</p>
          <select
            value={bookId}
            onChange={e => setBookId(e.target.value)}
            className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-3 text-silver-300 text-sm focus:border-gold-500/50 focus:outline-none"
          >
            <option value="">— Choisir un livre —</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.title} — {formatPrice(b.price)}</option>
            ))}
          </select>
        </div>

        {/* Preview */}
        {selectedBook && (
          <div>
            <p className="text-silver-500 text-xs uppercase tracking-wide mb-3">Aperçu du livre sélectionné</p>
            <div className="flex items-center gap-4 bg-charcoal/50 rounded-xl p-4 border border-ash/30">
              {selectedBook.cover_url ? (
                <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-12 h-16 object-cover rounded-lg" />
              ) : (
                <div className="w-12 h-16 bg-ash/30 rounded-lg" />
              )}
              <div>
                <p className="text-silver-200 text-sm font-medium">{selectedBook.title}</p>
                <p className="text-silver-500 text-xs">par {selectedBook.author}</p>
                <p className="text-gold-400 text-sm font-semibold mt-1">{formatPrice(selectedBook.price)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expiry countdown */}
        <div>
          <p className="text-silver-400 text-sm mb-2">Date d'expiration (compte à rebours)</p>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-3 text-silver-300 text-sm focus:border-gold-500/50 focus:outline-none"
          />
          <p className="text-silver-600 text-xs mt-1">Laissez vide pour pas de compte à rebours.</p>
        </div>

        <button
          onClick={save}
          disabled={loading}
          className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
          Sauvegarder la promotion
        </button>
      </div>
    </div>
  );
}
