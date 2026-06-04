'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface BundlePurchaseButtonProps {
  bundleId: string;
}

export default function BundlePurchaseButton({ bundleId }: BundlePurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handlePurchase = async () => {
    if (!isSignedIn) {
      router.push('/connexion');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erreur lors du paiement');
      }
    } catch (err: any) {
      alert(err?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ShoppingCart className="w-4 h-4" />
      )}
      {loading ? 'Redirection…' : 'Acheter le pack'}
    </button>
  );
}
