import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import SubscriptionBadge from '@/components/subscription/SubscriptionBadge';
import SubscriptionDashboardClient from './SubscriptionDashboardClient';
import BookCard from '@/components/books/BookCard';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function SubscriptionDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/connexion');

  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile) redirect('/connexion');

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plan:subscription_plans(*)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!sub) redirect('/abonnement');

  const { data: subBooks } = await supabase
    .from('books')
    .select('*')
    .eq('subscription_included', true)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(12);

  const plan = sub.plan as any;

  return (
    <div className="min-h-screen py-16 px-4 max-w-5xl mx-auto">
      <h1 className="font-serif text-3xl gold-text mb-8">Mon Abonnement</h1>

      {/* Past due warning */}
      {sub.status === 'past_due' && (
        <div className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-2xl p-5 mb-8">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">Paiement en échec</p>
            <p className="text-red-400/80 text-sm mt-1">Votre abonnement est suspendu en raison d'un paiement échoué. Veuillez mettre à jour votre moyen de paiement pour rétablir l'accès.</p>
          </div>
        </div>
      )}

      {/* Status card */}
      <div className="card-dark rounded-2xl p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-serif text-xl text-silver-200">
                Plan {plan?.interval === 'month' ? 'Mensuel' : 'Annuel'}
              </h2>
              <SubscriptionBadge status={sub.status as any} />
            </div>
            {sub.current_period_end && (
              <p className="text-silver-500 text-sm">
                {sub.cancel_at_period_end
                  ? `Accès jusqu'au ${formatDate(sub.current_period_end)}`
                  : `Prochain renouvellement le ${formatDate(sub.current_period_end)}`}
              </p>
            )}
            {plan && (
              <p className="text-gold-400 text-sm mt-1">
                {(plan.price_cents / 100).toFixed(2)} $US/{plan.interval === 'month' ? 'mois' : 'an'}
              </p>
            )}
          </div>
          <SubscriptionDashboardClient />
        </div>
      </div>

      {/* Included books */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-gold-400" />
          <h2 className="font-serif text-xl text-silver-200">Livres inclus dans votre abonnement</h2>
        </div>
        {subBooks && subBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {subBooks.map((book: any) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="card-dark rounded-2xl p-10 text-center text-silver-500">
            Aucun livre inclus dans l'abonnement pour l'instant.
          </div>
        )}
      </div>
    </div>
  );
}
