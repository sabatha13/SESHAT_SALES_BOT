'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, BookMarked, Users, ShoppingBag, Plus, Crown, Download, Tag, Star, Feather, Megaphone, Package, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/livres', label: 'Livres', icon: BookMarked },
  { href: '/admin/livres/nouveau', label: 'Ajouter un livre', icon: Plus },
  { href: '/admin/auteur', label: 'Profil Auteur', icon: Feather },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
  { href: '/admin/ventes', label: 'Ventes', icon: ShoppingBag },
  { href: '/admin/abonnements', label: 'Abonnements', icon: Crown },
  { href: '/admin/telechargements', label: 'Téléchargements', icon: Download },
  { href: '/admin/packs', label: 'Packs', icon: Package },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/avis', label: 'Avis', icon: Star },
  { href: '/admin/promotion', label: 'Promotion', icon: Megaphone },
];

const vceNav = [
  { href: '/admin/vce', label: 'Tableau VCE', icon: Sparkles, exact: true },
  { href: '/admin/vce/auteurs', label: 'Auteurs', icon: Feather },
  { href: '/admin/vce/manuscrits', label: 'Manuscrits', icon: FileText },
  { href: '/admin/vce/livres', label: 'Livres VCE', icon: BookMarked },
  { href: '/admin/vce/commandes', label: 'Commandes', icon: ShoppingBag },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-obsidian border-r border-ash/50 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-ash/50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-void" />
          </div>
          <div>
            <p className="font-serif text-sm gold-text font-medium">CDS Admin</p>
            <p className="text-silver-500 text-[10px] uppercase tracking-widest">Panneau d'administration</p>
          </div>
        </Link>
      </div>

      {/* Nav CDS */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200',
                active
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-silver-500 hover:text-silver-300 hover:bg-charcoal'
              )}
            >
              <item.icon className={cn('w-4 h-4', active ? 'text-gold-400' : 'text-mist')} />
              {item.label}
            </Link>
          );
        })}

        {/* Séparateur VCE */}
        <div className="pt-4 pb-1">
          <div className="px-4 mb-1 flex items-center gap-2">
            <div className="flex-1 h-px bg-ash/40" />
            <span className="text-[9px] uppercase tracking-widest text-silver-600 font-medium whitespace-nowrap">
              Voix Cosmique Éd.
            </span>
            <div className="flex-1 h-px bg-ash/40" />
          </div>
        </div>

        {vceNav.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200',
                active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-silver-500 hover:text-silver-300 hover:bg-charcoal'
              )}
            >
              <item.icon className={cn('w-4 h-4', active ? 'text-amber-400' : 'text-mist')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="p-4 border-t border-ash/50">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 text-silver-500 hover:text-silver-300 text-sm transition-colors">
          ← Retour au site
        </Link>
      </div>
    </aside>
  );
}
