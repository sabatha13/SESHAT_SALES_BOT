'use client';

import { useState, useEffect } from 'react';

const CITATIONS = [
  "La vie cache ses secrets aux yeux des inconscients et les révèle à ceux qui savent observer consciemment.",
  "Le savoir procure de l'information, la connaissance permet de la pratiquer, et la sagesse enseigne quand l'appliquer au juste moment.",
  "Tous les êtres naissent initiés, mais beaucoup demeurent inconscients de leurs droits divins.",
  "Il faut que je perde ma tête pour gagner mon cœur.",
  "Le silence est d'or, la parole est Dieu ; savoir quand se taire et quand parler au juste moment est un pouvoir divin.",
  "Sors de la conscience de masse et accède à la conscience éveillée.",
];

export default function CitationBand() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % CITATIONS.length);
        setVisible(true);
      }, 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-24 px-4 bg-void overflow-hidden">
      {/* Decorative symbols */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06] select-none">
        <span className="absolute top-10 left-[10%] text-6xl text-gold-500">✦</span>
        <span className="absolute bottom-12 right-[12%] text-7xl text-gold-500">⊕</span>
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 text-9xl text-gold-500">✧</span>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <p className="ornament text-2xl text-gold-600/70 mb-8">❝</p>
        <blockquote
          className="min-h-[7rem] flex items-center justify-center"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 600ms ease' }}
        >
          <p className="font-serif text-2xl md:text-3xl text-silver-200 font-light italic leading-relaxed">
            {CITATIONS[index]}
          </p>
        </blockquote>
        <div className="divider-gold my-8" />
        <p className="text-gold-400 text-sm uppercase tracking-[0.25em]">Le Comte de Sabatha</p>
      </div>
    </section>
  );
}
