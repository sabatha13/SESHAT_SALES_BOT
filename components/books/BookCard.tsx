'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Book } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Star, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  owned?: boolean;
  className?: string;
  avgRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  animationDelay?: number;
}

export default function BookCard({ book, owned = false, className, avgRating, reviewCount, isNew, animationDelay }: BookCardProps) {
  return (
    <Link href={owned ? `/lecture/${book.id}` : `/livre/${book.id}`}>
      <div
        className={cn(
          'group relative card-dark overflow-hidden cursor-pointer',
          'transition-all duration-500 hover:-translate-y-2',
          'hover:shadow-gold-md gold-border-hover',
          'opacity-0',
          className
        )}
        style={{
          animation: 'fadeInUp 0.5s ease forwards',
          animationDelay: animationDelay !== undefined ? `${animationDelay}ms` : '0ms',
        }}
      >
        {/* Cover */}
        <div className="relative aspect-[2/3] overflow-hidden bg-charcoal">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-charcoal to-onyx">
              <BookOpen className="w-12 h-12 text-gold-700/50" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Featured badge */}
          {book.is_featured && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-gold-600/90 text-void text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full">
              <Star className="w-2.5 h-2.5 fill-current" />
              Coup de cœur
            </div>
          )}

          {/* Owned badge */}
          {owned && (
            <div className="absolute top-2 right-2 bg-emerald-900/80 text-emerald-400 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full border border-emerald-700/50">
              Acquis
            </div>
          )}

          {/* Nouveau badge */}
          {isNew && !owned && (
            <div className="absolute top-2 right-2 bg-amber-600/90 text-amber-100 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full">
              Nouveau
            </div>
          )}

          {/* Abonnement badge */}
          {book.subscription_included && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-purple-900/80 text-purple-300 text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-full border border-purple-700/50">
              <span>♛</span>
              Abonnement
            </div>
          )}

          {/* Quick read CTA on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="btn-gold px-4 py-2 rounded-lg text-sm font-medium shadow-gold-md">
              {owned ? 'Lire maintenant' : 'Voir le livre'}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <div>
            <p className="text-gold-600 text-[10px] uppercase tracking-widest font-medium mb-1">
              {book.category}
            </p>
            <h3 className="font-serif text-base text-silver-300 group-hover:text-gold-300 transition-colors duration-200 leading-snug line-clamp-2">
              {book.title}
            </h3>
            <p className="text-silver-500 text-xs mt-1">{book.author}</p>
            {avgRating !== undefined && avgRating > 0 && (
              <p className="text-gold-400 text-xs mt-1">
                ★ {avgRating.toFixed(1)} <span className="text-silver-500">({reviewCount} avis)</span>
              </p>
            )}
          </div>

          {!owned && (
            <div className="flex items-center justify-between pt-1">
              <span className="gold-text font-semibold text-base">
                {book.price === 0 ? 'Gratuit' : formatPrice(book.price)}
              </span>
              <span className="text-mist text-xs">{book.page_count}p</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
