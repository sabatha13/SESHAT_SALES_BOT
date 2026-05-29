import { createServerClient } from '@/lib/supabase/server';
import PlanCard from '@/components/subscription/PlanCard';
import { BookOpen, Shield, Zap, Clock, Star, HelpCircle } from 'lucide-react';
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
    <div className="min-h-screen py-20 px-4">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs uppercase tracking-widest mb-6">
          <Star className="w-3 h-3" />
          Bibliothèque Ésotérique Premium
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-silver-100 mb-4">
          Accédez à l'<span className="gold-text">ensemble</span> de la collection
        </h1>
        <p className="text-silver-400 text-lg leading-relaxed">
          Explorez des centaines d'ouvrages ésotériques rares, de la Kabbale à l'Alchimie, pour un tarif mensuel ou annuel.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto mb-20">
        {plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {monthlyPlan && <PlanCard plan={monthlyPlan as SubscriptionPlan} features={FEATURES} />}
            {yearlyPlan && <PlanCard plan={yearlyPlan as SubscriptionPlan} featured features={YEARLY_FEATURES} />}
          </div>
        ) : (
          <div className="card-dark rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-gold-700/40 mx-auto mb-4" />
            <p className="text-silver-400">Les plans d'abonnement seront bientôt disponibles.</p>
            <p className="text-silver-500 text-sm mt-2">Revenez prochainement.</p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="max-w-5xl mx-auto mb-20">
        <div className="divider-gold mb-10" />
        <h2 className="font-serif text-2xl text-center text-silver-200 mb-10">
          Pourquoi s'abonner ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: BookOpen, title: 'Lecture illimitée', desc: 'Des centaines de titres disponibles dès maintenant.' },
            { icon: Shield, title: 'Sécurisé & Privé', desc: 'Vos lectures restent confidentielles et protégées.' },
            { icon: Zap, title: 'Accès instantané', desc: 'Commencez à lire immédiatement après votre abonnement.' },
            { icon: Clock, title: 'Lisez à votre rythme', desc: 'Sauvegardez votre progression et reprenez où vous en étiez.' },
          ].map(b => (
            <div key={b.title} className="card-dark rounded-2xl p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-3">
                <b.icon className="w-5 h-5 text-gold-400" />
              </div>
              <h3 className="font-serif text-silver-200 mb-1">{b.title}</h3>
              <p className="text-silver-500 text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto">
        <h2 className="font-serif text-2xl text-center text-silver-200 mb-8 flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5 text-gold-400" />
          Questions fréquentes
        </h2>
        <div className="space-y-4">
          {FAQ.map(item => (
            <div key={item.q} className="card-dark rounded-2xl p-6">
              <h4 className="font-medium text-silver-200 mb-2">{item.q}</h4>
              <p className="text-silver-400 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
