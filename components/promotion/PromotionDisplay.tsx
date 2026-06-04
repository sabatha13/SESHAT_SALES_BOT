'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { X, BookOpen, ArrowRight, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Promotion {
  type: 'popup' | 'banner';
  expires_at?: string | null;
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    cover_url?: string;
    category: string;
  };
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const calc = useCallback(() => {
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, expired: diff === 0 };
  }, [expiresAt]);

  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [calc]);

  if (time.expired) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 justify-center text-amber-400 text-xs font-mono mt-2">
      <Clock className="w-3 h-3" />
      <span>Offre expire dans</span>
      <span className="bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
        {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </span>
    </div>
  );
}

export default function PromotionDisplay() {
  const [promo, setPromo] = useState<Promotion | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const lastDismissed = localStorage.getItem('promo_dismissed');
    if (lastDismissed) {
      const diff = Date.now() - parseInt(lastDismissed);
      if (diff < 60 * 60 * 1000) return; // 1h cooldown
    }

    fetch('/api/promotion', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data?.book) {
          setPromo(data);
          setTimeout(() => setVisible(true), 2000);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem('promo_dismissed', Date.now().toString());
  }

  if (!promo || dismissed || !visible) return null;

  if (promo.type === 'banner') {
    return (
      <div className="fixed top-16 md:top-20 left-0 right-0 z-40 animate-fade-in">
        <div className="bg-gradient-to-r from-gold-900/90 via-gold-800/90 to-gold-900/90 border-b border-gold-500/40 backdrop-blur-sm px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {promo.book.cover_url && (
                <img src={promo.book.cover_url} alt={promo.book.title} className="w-8 h-10 object-cover rounded flex-shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-gold-200 text-xs uppercase tracking-widest mr-2">Nouveau</span>
                <span className="text-silver-200 text-sm font-medium truncate">{promo.book.title}</span>
                <span className="text-silver-400 text-sm mx-2">·</span>
                <span className="text-gold-400 text-sm font-semibold">{formatPrice(promo.book.price)}</span>
                {promo.expires_at && (
                  <Countdown expiresAt={promo.expires_at} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href={`/livre/${promo.book.id}`}
                className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-void text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                onClick={dismiss}
              >
                Découvrir <ArrowRight className="w-3 h-3" />
              </Link>
              <button onClick={dismiss} className="text-silver-400 hover:text-silver-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Popup
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-obsidian border border-gold-500/30 rounded-2xl shadow-[0_0_60px_rgba(201,168,76,0.15)] max-w-sm w-full overflow-hidden animate-slide-up">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 text-silver-500 hover:text-silver-200 transition-colors bg-charcoal/80 rounded-full p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-b from-gold-900/30 to-transparent p-4 text-center border-b border-gold-500/20">
          <p className="text-gold-500 text-xs uppercase tracking-[0.3em]">✦ Nouveau livre disponible ✦</p>
        </div>

        <div className="p-6">
          {promo.book.cover_url && (
            <div className="flex justify-center mb-5">
              <img
                src={promo.book.cover_url}
                alt={promo.book.title}
                className="h-48 object-cover rounded-xl shadow-[0_8px_32px_rgba(201,168,76,0.2)] border border-gold-500/20"
              />
            </div>
          )}

          <div className="text-center">
            <span className="text-gold-600 text-xs uppercase tracking-widest border border-gold-700/40 px-2 py-0.5 rounded-full">
              {promo.book.category}
            </span>
            <h3 className="font-serif text-xl text-silver-200 mt-3 mb-1 leading-snug">{promo.book.title}</h3>
            <p className="text-silver-500 text-sm mb-3">par {promo.book.author}</p>
            <p className="text-gold-400 text-2xl font-semibold mb-2">{formatPrice(promo.book.price)}</p>
            {promo.expires_at && <Countdown expiresAt={promo.expires_at} />}
            <div className="mb-3" />

            <Link
              href={`/livre/${promo.book.id}`}
              className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
              onClick={dismiss}
            >
              <BookOpen className="w-4 h-4" />
              Découvrir ce livre
            </Link>
            <button onClick={dismiss} className="mt-3 text-silver-600 hover:text-silver-400 text-xs transition-colors w-full">
              Non merci, continuer la navigation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
