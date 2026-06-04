'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

const categories: { name: string; emoji: string }[] = [
  { name: 'Tous', emoji: '✦' },
  { name: 'Magie', emoji: '🔮' },
  { name: 'Kabbale', emoji: '✡️' },
  { name: 'Alchimie', emoji: '⚗️' },
  { name: 'Astrologie', emoji: '⭐' },
  { name: 'Tarot', emoji: '🃏' },
  { name: 'Numérologie', emoji: '🔢' },
  { name: 'Hermétisme', emoji: '🏛️' },
  { name: 'Chamanisme', emoji: '🌿' },
  { name: 'Vodou', emoji: '🕯️' },
  { name: 'Eso-psychologie', emoji: '🧠' },
  { name: 'Rituels', emoji: '📿' },
  { name: 'Gnose', emoji: '👁️' },
  { name: 'Tantra / Magie Sexuelle', emoji: '🌹' },
  { name: 'Franc-Maçonnerie', emoji: '📐' },
  { name: 'Rosicrucianisme', emoji: '🌹' },
];

interface BoutiqueFiltresProps {
  currentCategory?: string;
  currentQuery?: string;
}

export default function BoutiqueFiltres({ currentCategory, currentQuery }: BoutiqueFiltresProps) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery || '');
  const [scrolled, setScrolled] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (currentCategory && currentCategory !== 'Tous') {
        params.set('categorie', currentCategory);
      }
      if (query.trim()) {
        params.set('q', query.trim());
      }
      const search = params.toString();
      router.push(search ? `/boutique?${search}` : '/boutique');
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleCategoryClick = (cat: string) => {
    const params = new URLSearchParams();
    if (cat !== 'Tous') params.set('categorie', cat);
    if (query.trim()) params.set('q', query.trim());
    const search = params.toString();
    router.push(search ? `/boutique?${search}` : '/boutique');
  };

  return (
    <div
      className={`sticky top-0 z-40 bg-void/95 backdrop-blur border-b border-ash/30 transition-shadow duration-300 ${
        scrolled ? 'shadow-lg shadow-black/40' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un titre, auteur…"
            className="w-full bg-charcoal border border-ash text-silver-300 placeholder-silver-500 pl-11 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-gold-600/50 focus:ring-1 focus:ring-gold-600/20 transition-all"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-1.5 pb-1">
          {categories.map(cat => {
            const active = (!currentCategory && cat.name === 'Tous') || currentCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`px-3 py-1 rounded-full text-xs transition-all duration-200 flex items-center gap-1 ${
                  active
                    ? 'bg-gold-600 text-void font-medium shadow-gold-sm'
                    : 'border border-ash text-silver-500 hover:border-gold-600/40 hover:text-silver-300'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
