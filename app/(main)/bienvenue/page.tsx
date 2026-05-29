import Link from 'next/link';
import { Sparkles, BookOpen, Crown, Star } from 'lucide-react';

export default function BienvenuePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-2xl w-full text-center space-y-10">
        {/* Hero */}
        <div className="space-y-4">
          <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center mx-auto shadow-lg animate-pulse-gold">
            <Sparkles className="w-10 h-10 text-void" />
          </div>
          <h1 className="font-serif text-5xl gold-text">Bienvenue</h1>
          <p className="font-serif text-xl text-silver-400 italic">
            "La connaissance est la lumière qui dissipe les ténèbres."
          </p>
          <p className="text-silver-400 leading-relaxed max-w-lg mx-auto">
            Vous venez de rejoindre CDS Librairie Ésotérique. Explorez notre collection unique d'ouvrages sur la Kabbale, l'Alchimie, la Magie et bien plus encore.
          </p>
        </div>

        <div className="divider-gold" />

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: BookOpen, title: 'Parcourez la boutique', desc: 'Découvrez des centaines de livres ésotériques rares.' },
            { icon: Crown, title: 'Abonnez-vous', desc: 'Accès illimité à notre collection pour un tarif mensuel.' },
            { icon: Star, title: 'Commencez à lire', desc: 'Lisez en ligne avec notre lecteur sécurisé.' },
          ].map(step => (
            <div key={step.title} className="card-dark rounded-2xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-3">
                <step.icon className="w-5 h-5 text-gold-400" />
              </div>
              <h3 className="font-serif text-silver-200 text-sm mb-1">{step.title}</h3>
              <p className="text-silver-500 text-xs">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/boutique" className="btn-gold px-8 py-3 text-base">
            Explorer la boutique
          </Link>
          <Link href="/abonnement" className="btn-ghost-gold px-8 py-3 text-base">
            Voir les abonnements
          </Link>
        </div>

        <p className="text-silver-600 text-xs font-serif italic">✦ Lux in Tenebris ✦</p>
      </div>
    </div>
  );
}
