import CheminQuiz from '@/components/quiz/CheminQuiz';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Trouvez Votre Voie Initiatique — Quiz Ésotérique',
  description: 'Quel chemin ésotérique vous correspond ? Répondez à notre quiz initiatique et découvrez votre voie : Magie, Kabbale, Alchimie, Hermétisme...',
};

export default function CheminPage() {
  return (
    <div className="relative min-h-screen bg-void overflow-hidden">
      {/* Floating decorative symbols */}
      <span className="absolute top-24 left-8 text-gold-600/15 text-4xl select-none animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}>✦</span>
      <span className="absolute top-40 right-12 text-gold-600/10 text-5xl select-none animate-pulse pointer-events-none" style={{ animationDuration: '5s', animationDelay: '1s' }}>⊕</span>
      <span className="absolute bottom-24 left-16 text-gold-600/10 text-3xl select-none animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '0.5s' }}>✧</span>
      <span className="absolute bottom-40 right-8 text-gold-600/15 text-4xl select-none animate-pulse pointer-events-none" style={{ animationDuration: '4.5s', animationDelay: '2s' }}>✦</span>

      <div className="relative z-10 pt-28 md:pt-36 pb-20 px-4">
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto mb-14 animate-fade-in">
          <p className="text-gold-600 uppercase tracking-[0.4em] text-xs mb-4">✦ Quiz Initiatique ✦</p>
          <h1 className="font-serif text-4xl md:text-6xl text-gold-400 mb-4 leading-tight">Trouve ton Chemin</h1>
          <div className="divider-gold my-6 mx-auto max-w-xs" />
          <p className="text-silver-400 text-base md:text-lg leading-relaxed">
            Chaque âme porte une affinité secrète avec l&apos;un des arts occultes. Laisse ces quelques questions
            faire parler ton intuition, et les arcanes révéleront la voie qui t&apos;appelle.
          </p>
        </div>

        <CheminQuiz />
      </div>
    </div>
  );
}
