'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Book } from '@/lib/types';

export default function PurchasedBookCard({ book }: { book: Book }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    // Ouvrir la fenêtre immédiatement (contexte clic direct) pour passer les popup blockers
    const win = window.open('', '_blank');
    try {
      const res = await fetch(`/api/books/${book.id}/download`, { method: 'POST' });
      const data = await res.json();
      if (data.url && win) {
        win.location.href = data.url;
      } else {
        win?.close();
        setError(data.error || 'Erreur téléchargement');
      }
    } catch {
      win?.close();
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-dark rounded-2xl overflow-hidden border border-ash/30 hover:border-gold-600/30 transition-all flex flex-col">
      <Link href={`/lecture/${book.id}`} className="block relative aspect-[2/3] bg-charcoal group">
        {book.cover_url ? (
          <Image src={book.cover_url} alt={book.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gold-700/30" />
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-silver-200 text-sm font-medium line-clamp-1 mb-0.5">{book.title}</p>
        <p className="text-silver-500 text-xs mb-3">{book.author}</p>

        <div className="mt-auto space-y-1.5">
          <Link
            href={`/lecture/${book.id}`}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs text-gold-400 border border-gold-600/30 hover:bg-gold-600/10 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Lire
          </Link>

          {book.download_allowed && (
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {loading ? 'Préparation…' : 'Télécharger PDF'}
            </button>
          )}

          {error && <p className="text-red-400 text-[10px] text-center mt-0.5">{error}</p>}
        </div>
      </div>
    </div>
  );
}
