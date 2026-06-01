import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminAuteurPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Profil Auteur</h1>
        <p className="text-silver-500 text-sm">Page publique de la biographie de l'auteur</p>
      </div>

      <div className="card-dark p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-4">
          <img
            src="https://oriiunftyumqcrniepux.supabase.co/storage/v1/object/public/IMAGE/3b0d1-my-pic-5-1-819x1024-1.webp"
            alt="Le Comte de Sabatha"
            className="w-20 h-20 rounded-full object-cover border-2 border-gold-500/40"
          />
          <div>
            <h2 className="font-serif text-xl text-gold-300">Le Comte de Sabatha</h2>
            <p className="text-silver-500 text-sm">Auteur, chercheur et guide spirituel</p>
          </div>
        </div>

        <div className="border-t border-ash/30 pt-4 space-y-3">
          <p className="text-silver-400 text-sm leading-relaxed">
            La page publique de la biographie est accessible via le menu "L'Auteur" sur le site.
            Pour modifier le contenu, contactez votre développeur.
          </p>
          <Link
            href="/auteur"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/20 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Voir la page publique
          </Link>
        </div>
      </div>
    </div>
  );
}
