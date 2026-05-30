'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { BookOpen, Menu, X, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/boutique', label: 'Boutique' },
  { href: '/bibliotheque', label: 'Ma Bibliothèque', auth: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-void/95 backdrop-blur-md border-b border-gold-600/40 shadow-[0_1px_20px_rgba(201,168,76,0.15)]'
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-sm group-hover:shadow-gold-md transition-shadow duration-300">
              <BookOpen className="w-4 h-4 text-void" />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif text-lg gold-text font-medium tracking-wider">CDS</span>
              <span className="text-silver-400 text-xs block leading-none tracking-widest uppercase">Librairie Ésotérique</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/boutique" className={cn('nav-link text-sm tracking-wide', pathname === '/boutique' && 'text-gold-400')}>
              Boutique
            </Link>
            <Link href="/abonnement" className={cn('nav-link text-sm tracking-wide', pathname === '/abonnement' && 'text-gold-400')}>
              Abonnement
            </Link>
            <SignedIn>
              <Link href="/bibliotheque" className={cn('nav-link text-sm tracking-wide', pathname === '/bibliotheque' && 'text-gold-400')}>
                Ma Bibliothèque
              </Link>
            </SignedIn>
            <Link href="/contact" className={cn('nav-link text-sm tracking-wide', pathname === '/contact' && 'text-gold-400')}>
              Contact
            </Link>
            <a href="https://chat.whatsapp.com/ClVIQUqtU4G4nwMdFqWPDB" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-600/20 border border-green-500/40 text-green-400 text-xs hover:bg-green-600/30 transition-all duration-300">Club WhatsApp</a>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <Link href="/connexion" className="btn-ghost-gold px-4 py-2 rounded-lg text-sm">
                Connexion
              </Link>
              <Link href="/inscription" className="btn-gold px-4 py-2 rounded-lg text-sm">
                S'inscrire
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/bibliotheque" className="nav-link flex items-center gap-2 text-sm">
                <ShoppingBag className="w-4 h-4" />
                Ma bibliothèque
              </Link>
              <UserButton
                appearance={{
                  variables: {
                    colorPrimary: '#C9A84C',
                    colorBackground: '#1a1a1a',
                    colorText: '#e8e0d0',
                    colorTextSecondary: '#C9A84C',
                    colorTextOnPrimaryBackground: '#C9A84C',
                    colorNeutral: '#C9A84C',
                    colorInputBackground: '#2a2a2a',
                    colorInputText: '#e8e0d0',
                  },
                  elements: {
                    avatarBox: 'w-8 h-8 ring-1 ring-gold-500/40 ring-offset-2 ring-offset-void',
                    card: 'bg-obsidian border border-ash/50 shadow-xl',
                    userPreviewMainIdentifier: 'text-gold-400 font-serif',
                    userPreviewSecondaryIdentifier: 'text-silver-500',
                    menuItem: 'text-gold-400 hover:text-gold-300 hover:bg-gold-500/10',
                    menuItemText: 'text-gold-400',
                    menuItemIcon: 'text-gold-400',
                  },
                }}
                afterSignOutUrl="/" userProfileMode="navigation" userProfileUrl="/profil"
              />
            </SignedIn>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-silver-400 hover:text-gold-400 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-obsidian border-t border-ash/50 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <Link href="/boutique" className="block px-4 py-3 rounded-lg text-silver-300 hover:text-gold-400 hover:bg-charcoal transition-all text-sm" onClick={() => setMobileOpen(false)}>
              Boutique
            </Link>
            <Link href="/abonnement" className="block px-4 py-3 rounded-lg text-silver-300 hover:text-gold-400 hover:bg-charcoal transition-all text-sm" onClick={() => setMobileOpen(false)}>
              Abonnement
            </Link>
            <SignedIn>
              <Link href="/bibliotheque" className="block px-4 py-3 rounded-lg text-silver-300 hover:text-gold-400 hover:bg-charcoal transition-all text-sm" onClick={() => setMobileOpen(false)}>
                Ma Bibliothèque
              </Link>
            </SignedIn>
            <Link href="/contact" className="block px-4 py-3 rounded-lg text-silver-300 hover:text-gold-400 hover:bg-charcoal transition-all text-sm" onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
            <div className="pt-3 border-t border-ash/50 flex flex-col gap-2">
              <SignedOut>
                <Link href="/connexion" className="btn-ghost-gold px-4 py-2 rounded-lg text-sm text-center" onClick={() => setMobileOpen(false)}>
                  Connexion
                </Link>
                <Link href="/inscription" className="btn-gold px-4 py-2 rounded-lg text-sm text-center" onClick={() => setMobileOpen(false)}>
                  S'inscrire
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}




