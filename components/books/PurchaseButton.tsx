'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ShoppingCart, Loader2, BookOpen } from 'lucide-react';

interface PurchaseButtonProps {
  bookId: string;
  price: number;
  owned: boolean;
}

export default function PurchaseButton({ bookId, price, owned }: PurchaseButtonProps) {
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
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
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

  if (owned) {
    return (
      <button
        onClick={() => router.push(`/lecture/${bookId}`)}
        className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
      >
        <BookOpen className="w-4 h-4" />
        Lire maintenant
      </button>
    );
  }

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
      {loading ? 'Redirection…' : 'Acheter maintenant'}
    </button>
  );
}
