'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, max = 5, size = 'md', interactive = false, onRate }: StarRatingProps) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(i + 1)}
          className={cn(!interactive && 'cursor-default')}
        >
          <Star
            className={cn(
              sizes[size],
              'transition-colors',
              i < rating ? 'fill-gold-400 text-gold-400' : 'fill-transparent text-ash'
            )}
          />
        </button>
      ))}
    </div>
  );
}
