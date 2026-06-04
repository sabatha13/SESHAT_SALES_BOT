'use client';
import { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface Banner {
  code: string;
  discount_percent: number | null;
  discount_cents: number | null;
  expires_at: string | null;
}

export default function PromoBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const key = 'promo_dismissed';
    if (sessionStorage.getItem(key)) { setDismissed(true); return; }
    fetch('/api/promo-banner').then(r => r.json()).then(d => {
      if (d.banner) setBanner(d.banner);
    });
  }, []);

  function dismiss() {
    sessionStorage.setItem('promo_dismissed', '1');
    setDismissed(true);
  }

  function copy() {
    if (!banner) return;
    navigator.clipboard.writeText(banner.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!banner || dismissed) return null;

  const discount = banner.discount_percent
    ? `${banner.discount_percent}% de réduction`
    : banner.discount_cents
    ? `${(banner.discount_cents / 100).toFixed(2)} $ de réduction`
    : 'Réduction spéciale';

  const expiry = banner.expires_at
    ? ` · Expire le ${new Date(banner.expires_at).toLocaleDateString('fr-FR')}`
    : '';

  return (
    <div className="w-full bg-gradient-to-r from-gold-900/80 via-gold-800/60 to-gold-900/80 border-b border-gold-600/30 px-4 py-2.5 flex items-center justify-center gap-3 text-sm relative">
      <span className="text-gold-200">✨ Offre spéciale — <strong>{discount}</strong>{expiry}</span>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 bg-gold-500/20 border border-gold-500/40 text-gold-300 hover:bg-gold-500/30 px-3 py-1 rounded-full text-xs transition-all"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        <span className="font-mono font-bold">{banner.code}</span>
        {copied ? 'Copié !' : 'Copier'}
      </button>
      <button onClick={dismiss} className="absolute right-3 text-gold-500 hover:text-gold-300 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
