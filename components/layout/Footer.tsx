import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ash/40 bg-obsidian mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-void" />
              </div>
              <span className="font-serif text-lg gold-text font-medium">CDS Librairie Ésotérique</span>
            </div>
            <p className="text-silver-500 text-sm leading-relaxed">
              La bibliothèque numérique des arts occultes et de la sagesse ancienne. Découvrez des œuvres rares et précieuses pour éveiller votre conscience.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-gold-600 uppercase text-xs tracking-widest font-medium mb-4">Navigation</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Accueil' },
                { href: '/boutique', label: 'Boutique' },
                { href: '/bibliotheque', label: 'Ma Bibliothèque' },
                { href: '/profil', label: 'Mon Profil' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-silver-500 hover:text-gold-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gold-600 uppercase text-xs tracking-widest font-medium mb-4">Support</h4>
            <ul className="space-y-2">
              {[
                { href: '/contact', label: 'Contact & Support' },
                { href: '/abonnement', label: 'Abonnements' },
                { href: '/remboursement', label: 'Politique de remboursement' },
                { href: '/dmca', label: 'DMCA & Droits d\'auteur' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-silver-500 hover:text-gold-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-gold-600 uppercase text-xs tracking-widest font-medium mb-4">Légal</h4>
            <ul className="space-y-2">
              {[
                { href: '/mentions-legales', label: 'Mentions légales' },
                { href: '/confidentialite', label: 'Confidentialité' },
                { href: '/remboursement', label: 'Remboursement' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-silver-500 hover:text-gold-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ash/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-silver-500 text-xs">
            © {new Date().getFullYear()} CDS Librairie Ésotérique. Tous droits réservés.
          </p>
          <p className="text-mist text-xs font-serif italic">
            ✦ Lux in Tenebris ✦
          </p>
        </div>
      </div>
    </footer>
  );
}
