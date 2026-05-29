import { Scale } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen py-20 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <Scale className="w-6 h-6 text-gold-400" />
        <h1 className="font-serif text-3xl gold-text">Mentions Légales</h1>
      </div>
      <div className="card-dark rounded-2xl p-8 space-y-6 text-silver-400 text-sm leading-relaxed">
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Éditeur du site</h2>
          <p>CDS Librairie Ésotérique — Plateforme numérique de vente et lecture d'ebooks ésotériques.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Hébergement</h2>
          <p>Ce site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Propriété intellectuelle</h2>
          <p>Tous les contenus (textes, images, livres numériques) sont protégés par le droit d'auteur. Toute reproduction non autorisée est interdite.</p>
        </section>
      </div>
    </div>
  );
}
