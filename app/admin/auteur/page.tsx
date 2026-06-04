import { createServerClient } from '@/lib/supabase/server';
import AuteurClient from './AuteurClient';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAuteurPage() {
  const supabase = createServerClient();
  const { data: profile } = await supabase.from('author_profile').select('*').single();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Profil Auteur</h1>
          <p className="text-silver-500 text-sm">Modifiez le contenu de la page publique de l'auteur</p>
        </div>
        <Link
          href="/auteur"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/20 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Voir la page
        </Link>
      </div>

      {profile ? (
        <AuteurClient profile={profile} />
      ) : (
        <p className="text-red-400 text-sm">Profil introuvable dans la base de données.</p>
      )}
    </div>
  );
}
