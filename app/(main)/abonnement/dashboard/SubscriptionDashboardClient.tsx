'use client';

import { useState } from 'react';
import { Loader2, CreditCard, ExternalLink, XCircle, Check, AlertCircle } from 'lucide-react';

export default function SubscriptionDashboardClient({ isManual = false, cancelAtPeriodEnd = false }: {
  isManual?: boolean;
  cancelAtPeriodEnd?: boolean;
}) {
  const [loading, setLoading] = useState('');
  const [cancelled, setCancelled] = useState(cancelAtPeriodEnd);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openPortal = async () => {
    setLoading('portal');
    try {
      const res = await fetch('/api/subscriptions/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading('');
    }
  };

  const cancelSubscription = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Vous garderez l\'accès jusqu\'à la fin de la période en cours.')) return;
    setLoading('cancel');
    setMsg(null);
    const res = await fetch('/api/subscriptions/cancel', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      setCancelled(true);
      setMsg({ type: 'success', text: 'Abonnement annulé. Vous gardez l\'accès jusqu\'à la fin de la période.' });
    } else {
      setMsg({ type: 'error', text: data.error || 'Erreur lors de l\'annulation.' });
    }
    setLoading('');
  };

  return (
    <div className="flex flex-col items-end gap-3">
      {msg && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {msg.text}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isManual && (
          <button
            onClick={openPortal}
            disabled={!!loading}
            className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {loading === 'portal' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Gérer la facturation
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        )}

        {!cancelled ? (
          <button
            onClick={cancelSubscription}
            disabled={!!loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all disabled:opacity-50"
          >
            {loading === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Annuler l'abonnement
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-silver-500 text-xs border border-ash/30 px-3 py-2 rounded-xl">
            <XCircle className="w-3.5 h-3.5" />
            Annulation programmée
          </span>
        )}
      </div>
    </div>
  );
}
