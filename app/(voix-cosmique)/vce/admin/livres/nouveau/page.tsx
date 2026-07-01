export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import LivreForm from '../_components/LivreForm';

export default async function AdminNouveauLivrePage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const { data: auteurs } = await supabase
    .from('vce_auteurs')
    .select('id, prenom, nom, nom_plume')
    .order('prenom', { ascending: true });

  return (
    <div style={{ padding: '2.5rem', maxWidth: '760px' }}>
      <Link href="/admin/livres" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--accent-or-texte)', textDecoration: 'none' }}>
        ← Retour aux livres
      </Link>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '1rem 0 2rem' }}>
        Ajouter un livre
      </h1>

      <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '1.75rem' }}>
        <LivreForm mode="create" auteurs={auteurs ?? []} />
      </div>
    </div>
  );
}
