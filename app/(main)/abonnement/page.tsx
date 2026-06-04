import { createServerClient } from '@/lib/supabase/server';
import PlanCard from '@/components/subscription/PlanCard';
import { BookOpen, Shield, Zap, Clock, Eye, Sparkles, Library, Lock } from 'lucide-react';
import { SubscriptionPlan } from '@/lib/types';

const FEATURES = [
  'Accès illimité à tous les livres inclus',
  'Lecture en ligne sécurisée',
  'Marque-pages et annotations',
  'Suivi de progression',
  'Nouveaux titres chaque mois',
  'Expérience sans publicité',
];

const YEARLY_FEATURES = [
  ...FEATURES,
  '2 mois offerts par rapport au mensuel',
  'Accès prioritaire aux nouveautés',
];

const BENEFITS = [
  {
    icon: '📚',
    title: 'Bibliothèque complète',
    desc: 'Accès immédiat à tous les titres inclus dans l\'abonnement',
  },
  {
    icon: '🔮',
    title: 'Nouveautés en avant-première',
    desc: 'Les nouveaux ouvrages sont disponibles pour les membres avant tout le monde',
  },
  {
    icon: '👁',
    title: 'Lecteur immersif',
    desc: 'Marque-pages, annotations, suivi de progression sur tous vos appareils',
  },
  {
    icon: '⚡',
    title: 'Accès instantané',
    desc: 'Commencez à lire en quelques secondes après votre abonnement',
  },
  {
    icon: '🔒',
    title: 'Confidentialité absolue',
    desc: 'Vos lectures restent privées et protégées',
  },
  {
    icon: '✦',
    title: 'Tarif préférentiel',
    desc: 'Économisez jusqu\'à 2 mois avec l\'abonnement annuel',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Ce grimoire numérique a transformé ma pratique quotidienne.',
    name: 'Marie L.',
    duration: 'Initiée depuis 8 mois',
  },
  {
    quote: 'Une bibliothèque d\'une richesse inégalée. Je découvre chaque semaine de nouvelles perspectives.',
    name: 'Jean-Pierre M.',
    duration: 'Membre annuel',
  },
  {
    quote: 'Le Comte de Sabatha a une façon unique d\'expliquer l\'inexplicable.',
    name: 'Sophia R.',
    duration: 'Initiée depuis 3 mois',
  },
];

const FAQ = [
  {
    q: 'Puis-je télécharger les livres avec l\'abonnement ?',
    a: 'Non. L\'abonnement donne accès à la lecture en ligne uniquement. Pour télécharger, vous devez acheter le livre individuellement (si le téléchargement est activé par l\'administrateur).',
  },
  {
    q: 'Comment annuler mon abonnement ?',
    a: 'Vous pouvez annuler à tout moment depuis votre espace abonné. L\'accès reste actif jusqu\'à la fin de la période en cours.',
  },
  {
    q: 'Quels livres sont inclus dans l\'abonnement ?',
    a: 'Les livres marqués "Inclus dans l\'abonnement" sont accessibles. Le catalogue s\'enrichit régulièrement.',
  },
  {
    q: 'Puis-je acheter un livre même avec un abonnement ?',
    a: 'Oui. L\'achat individuel vous donne accès permanent au livre, y compris le téléchargement si disponible.',
  },
];

export default async function AbonnementPage() {
  const supabase = createServerClient();
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_cents');

  const monthlyPlan = plans?.find(p => p.interval === 'month');
  const yearlyPlan = plans?.find(p => p.interval === 'year');

  return (
    <div className="min-h-screen">

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden py-28 px-4 text-center">
        {/* Floating mystical symbols */}
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
          <span className="absolute top-[8%]  left-[6%]  text-5xl text-gold-400 opacity-10 rotate-12">✦</span>
          <span className="absolute top-[14%] right-[9%] text-7xl text-gold-500 opacity-10 -rotate-6">⊕</span>
          <span className="absolute top-[38%] left-[3%]  text-4xl text-gold-300 opacity-10 rotate-45">✧</span>
          <span className="absolute top-[55%] right-[5%] text-6xl text-gold-400 opacity-10 rotate-12">👁</span>
          <span className="absolute bottom-[18%] left-[12%] text-3xl text-gold-500 opacity-10 -rotate-12">✦</span>
          <span className="absolute bottom-[10%] right-[15%] text-5xl text-gold-300 opacity-10 rotate-6">✧</span>
          <span className="absolute top-[70%] left-[40%] text-4xl text-gold-400 opacity-10">⊕</span>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs uppercase tracking-widest mb-8">
            ✦ Accès Exclusif ✦
          </div>

          {/* Title */}
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-silver-100 mb-6 leading-tight">
            Le Cercle des{' '}
            <span className="gold-text">Initiés</span>
          </h1>

          {/* Subtitle */}
          <p className="text-silver-400 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Rejoignez une communauté d'érudits ésotériques. Accédez à l'intégralité des œuvres du Comte de Sabatha.
          </p>

          {/* Gold divider */}
          <div className="divider-gold mb-10" />

          {/* Citation */}
          <blockquote className="italic text-silver-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            <span className="gold-text text-2xl leading-none mr-1">"</span>
            La connaissance véritable ne s'achète pas — elle se mérite par la constance de la quête.
            <span className="gold-text text-2xl leading-none ml-1">"</span>
            <footer className="mt-3 text-silver-500 text-sm not-italic tracking-wide">
              — Le Comte de Sabatha
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ── 2. BENEFITS ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-silver-100 mb-3">
              Les privilèges du <span className="gold-text">Cercle</span>
            </h2>
            <p className="text-silver-500 text-sm uppercase tracking-widest">Ce que vous obtenez en rejoignant</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="card-dark rounded-2xl p-6 flex flex-col gap-4 group hover:border-gold-500/30 transition-colors duration-300">
                <div className="w-12 h-12 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-xl shrink-0 group-hover:bg-gold-500/20 transition-colors duration-300">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-serif text-silver-100 text-lg mb-1">{b.title}</h3>
                  <p className="text-silver-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. PRICING ── */}
      <section id="plans" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="divider-gold mb-8" />
            <h2 className="font-serif text-3xl sm:text-4xl text-silver-100 mb-3">
              Choisissez votre <span className="gold-text">engagement</span>
            </h2>
            <p className="text-silver-500 text-sm">Résiliable à tout moment · Accès immédiat</p>
          </div>

          {plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {monthlyPlan && <PlanCard plan={monthlyPlan as SubscriptionPlan} features={FEATURES} />}
              {yearlyPlan && <PlanCard plan={yearlyPlan as SubscriptionPlan} featured features={YEARLY_FEATURES} />}
            </div>
          ) : (
            <div className="card-dark rounded-2xl p-12 text-center max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 text-gold-700/40 mx-auto mb-4" />
              <p className="text-silver-400">Les plans d'abonnement seront bientôt disponibles.</p>
              <p className="text-silver-500 text-sm mt-2">Revenez prochainement.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. TESTIMONIALS ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl text-silver-100 mb-3">
              La parole des <span className="gold-text">Initiés</span>
            </h2>
            <p className="text-silver-500 text-sm uppercase tracking-widest">Témoignages de membres</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card-dark rounded-2xl p-6 border-l-2 border-gold-500/40 flex flex-col gap-4">
                <p className="italic text-silver-300 text-sm leading-relaxed flex-1">
                  <span className="gold-text text-xl leading-none">"</span>
                  {t.quote}
                  <span className="gold-text text-xl leading-none">"</span>
                </p>
                <div>
                  <p className="text-silver-200 text-sm font-medium">{t.name}</p>
                  <p className="text-silver-500 text-xs">{t.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FAQ ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-silver-100 mb-3 flex items-center justify-center gap-3">
              <span className="gold-text text-2xl">?</span>
              Questions fréquentes
              <span className="gold-text text-2xl">?</span>
            </h2>
            <div className="divider-gold mt-6" />
          </div>

          <div className="space-y-4">
            {FAQ.map(item => (
              <div key={item.q} className="card-dark rounded-2xl p-6 hover:border-gold-500/20 transition-colors duration-300">
                <h4 className="font-serif text-silver-100 mb-3 flex items-start gap-2">
                  <span className="gold-text shrink-0 mt-0.5">✦</span>
                  {item.q}
                </h4>
                <p className="text-silver-400 text-sm leading-relaxed pl-5">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FINAL CTA BANNER ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold-900/60 via-gold-800/30 to-void border border-gold-500/20 p-12 sm:p-16 text-center">
            {/* Decorative symbols */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <span className="absolute top-4  left-8  text-4xl text-gold-400 opacity-10">✦</span>
              <span className="absolute top-4  right-8 text-3xl text-gold-400 opacity-10">✧</span>
              <span className="absolute bottom-4 left-12 text-3xl text-gold-400 opacity-10">⊕</span>
              <span className="absolute bottom-4 right-10 text-4xl text-gold-400 opacity-10">✦</span>
            </div>

            <div className="relative z-10">
              <p className="text-gold-400 text-xs uppercase tracking-widest mb-4">Votre chemin commence ici</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-silver-100 mb-4">
                Prêt à rejoindre le <span className="gold-text">Cercle</span> ?
              </h2>
              <p className="text-silver-400 text-base max-w-md mx-auto mb-8">
                Chaque grand voyage ésotérique commence par un premier pas. Le vôtre commence maintenant.
              </p>
              <a
                href="#plans"
                className="btn-gold inline-flex items-center gap-2 text-base px-8 py-3 rounded-xl"
              >
                Commencer mon initiation →
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
