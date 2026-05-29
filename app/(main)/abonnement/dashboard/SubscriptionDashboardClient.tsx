'use client';

import { useState } from 'react';
import { Loader2, CreditCard, ExternalLink } from 'lucide-react';

export default function SubscriptionDashboardClient() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="btn-gold flex items-center gap-2 px-5 py-2.5 text-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      Gérer la facturation
      <ExternalLink className="w-3 h-3 opacity-60" />
    </button>
  );
}
