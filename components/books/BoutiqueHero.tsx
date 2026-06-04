'use client';

import { useState, useEffect } from 'react';

const citations = [
  {
    text: '« La vie cache ses secrets aux yeux des inconscients et les révèle à ceux qui savent observer consciemment. »',
    author: '— Le Comte de Sabatha',
  },
  {
    text: '« Le savoir procure de l\'information, la connaissance permet de la pratiquer, et la sagesse enseigne quand l\'appliquer au juste moment. »',
    author: '— Le Comte de Sabatha',
  },
  {
    text: '« Tous les êtres naissent initiés, mais beaucoup demeurent inconscients de leurs droits divins. »',
    author: '— Le Comte de Sabatha',
  },
];

interface BoutiqueHeroProps {
  bookCount: number;
}

export default function BoutiqueHero({ bookCount }: BoutiqueHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % citations.length);
        setVisible(true);
      }, 600);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full bg-void overflow-hidden py-20 px-4 text-center mb-0">
      {/* Floating decorative symbols */}
      <span className="absolute top-6 left-8 text-gold-600/20 text-4xl select-none animate-pulse" style={{ animationDuration: '3s' }}>✦</span>
      <span className="absolute top-12 right-12 text-gold-600/15 text-5xl select-none animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}>⊕</span>
      <span className="absolute bottom-8 left-16 text-gold-600/10 text-3xl select-none animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.5s' }}>✧</span>
      <span className="absolute bottom-12 right-8 text-gold-600/20 text-4xl select-none animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '2s' }}>✦</span>
      <span className="absolute top-1/2 left-4 text-gold-600/10 text-2xl select-none animate-pulse" style={{ animationDuration: '6s' }}>✧</span>
      <span className="absolute top-1/3 right-6 text-gold-600/15 text-3xl select-none animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>⊕</span>

      {/* Title */}
      <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Notre collection</p>
      <h1 className="font-serif text-5xl md:text-6xl text-gold-400 mb-2">La Boutique</h1>
      <p className="text-silver-400 text-lg tracking-widest mb-6">Collection Ésotérique</p>

      {/* Gold divider */}
      <div className="divider-gold mb-8 mx-auto max-w-xs" />

      {/* Rotating citation */}
      <div className="max-w-2xl mx-auto min-h-[100px] flex flex-col items-center justify-center gap-3">
        <p
          className="italic text-silver-400 text-base md:text-lg leading-relaxed transition-opacity duration-600"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
        >
          {citations[currentIndex].text}
        </p>
        <p
          className="text-gold-500 text-sm font-medium transition-opacity duration-600"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
        >
          {citations[currentIndex].author}
        </p>
      </div>

      {/* Book count badge */}
      <div className="mt-8">
        <span className="inline-block border border-gold-600/40 text-gold-400 text-sm px-5 py-2 rounded-full tracking-widest">
          {bookCount} œuvre{bookCount !== 1 ? 's' : ''} disponible{bookCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
