import { cn } from '@/lib/utils';

interface SubscriptionBadgeProps {
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | null;
  className?: string;
}

const labels: Record<string, string> = {
  active: 'Actif',
  canceled: 'Annulé',
  past_due: 'Paiement en retard',
  incomplete: 'Incomplet',
};

const styles: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  canceled: 'bg-ash/30 text-silver-500 border-ash/50',
  past_due: 'bg-red-500/10 text-red-400 border-red-500/20',
  incomplete: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function SubscriptionBadge({ status, className }: SubscriptionBadgeProps) {
  if (!status) return null;
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border', styles[status] || styles.incomplete, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', status === 'active' ? 'bg-emerald-400' : status === 'past_due' ? 'bg-red-400' : 'bg-silver-500')} />
      {labels[status] || status}
    </span>
  );
}
