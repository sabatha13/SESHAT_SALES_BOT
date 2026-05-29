'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubscriptionPlan } from '@/lib/types';

interface PlanCardProps {
  plan: SubscriptionPlan;
  featured?: boolean;
  features: string[];
}

export default function PlanCard({ plan, featured = false, features }: PlanCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (data.redirect) window.location.href = data.redirect;
      else if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const priceLabel = plan.interval === 'month'
    ? `${(plan.price_cents / 100).toFixed(2)} $US/mois`
    : `${(plan.price_cents / 100).toFixed(2)} $US/an`;

  const perMonth = plan.interval === 'year'
    ? `soit ${((plan.price_cents / 100) / 12).toFixed(2)} $US/mois`
    : null;

  return (
    <div className={cn(
      'relative rounded-2xl p-8 flex flex-col gap-6',
      featured
        ? 'bg-gold-gradient text-void border-2 border-gold-400'
        : 'card-dark border border-ash/50'
    )}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-void px-4 py-1 rounded-full text-gold-400 text-xs font-medium border border-gold-500/30">
          Meilleure offre
        </div>
      )}

      <div>
        <h3 className={cn('font-serif text-xl font-semibold', featured ? 'text-void' : 'text-silver-200')}>
          {plan.interval === 'month' ? 'Mensuel' : 'Annuel'}
        </h3>
        <div className={cn('mt-3', featured ? 'text-void' : 'gold-text')}>
          <span className="text-4xl font-bold font-serif">{priceLabel}</span>
        </div>
        {perMonth && (
          <p className={cn('text-sm mt-1', featured ? 'text-void/70' : 'text-silver-500')}>{perMonth}</p>
        )}
      </div>

      <ul className="space-y-3 flex-1">
        {features.map(f => (
          <li key={f} className={cn('flex items-start gap-2 text-sm', featured ? 'text-void' : 'text-silver-400')}>
            <Check className={cn('w-4 h-4 flex-shrink-0 mt-0.5', featured ? 'text-void' : 'text-gold-400')} />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={cn(
          'w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2',
          featured
            ? 'bg-void text-gold-400 hover:bg-obsidian'
            : 'btn-gold'
        )}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        S'abonner maintenant
      </button>
    </div>
  );
}
