'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  bookId: string;
  initialInWishlist?: boolean;
  className?: string;
}

export default function WishlistButton({ bookId, initialInWishlist = false, className }: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      if (res.ok) {
        const data = await res.json();
        setInWishlist(data.added);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        'p-2 rounded-full border transition-all duration-200',
        inWishlist
          ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
          : 'bg-charcoal border-ash/50 text-silver-500 hover:text-red-400 hover:border-red-500/30',
        className
      )}
      title={inWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart className={cn('w-5 h-5', inWishlist && 'fill-red-400')} />
    </button>
  );
}
