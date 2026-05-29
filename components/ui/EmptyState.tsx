import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-charcoal flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gold-700/50" />
      </div>
      <h3 className="font-serif text-xl text-silver-300 mb-2">{title}</h3>
      <p className="text-silver-500 text-sm max-w-xs leading-relaxed">{description}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn-gold mt-6 px-6 py-2.5 text-sm">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
