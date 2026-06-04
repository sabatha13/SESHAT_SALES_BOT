import { Shield, Zap, BookOpen, Lock } from 'lucide-react';

const ITEMS = [
  { icon: Zap,      label: 'Accès immédiat' },
  { icon: BookOpen, label: 'Lecture en ligne sécurisée' },
  { icon: Shield,   label: 'Paiement 100% sécurisé' },
  { icon: Lock,     label: 'Bibliothèque à vie' },
];

export default function TrustBadge() {
  return (
    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-ash/30">
      {ITEMS.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-silver-500 text-[11px]">
          <Icon className="w-3 h-3 text-gold-600 flex-shrink-0" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
