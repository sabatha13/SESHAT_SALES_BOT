export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import LivreForm from '../_components/LivreForm';
import SupprimerLivreButton from '../_components/SupprimerLivreButton';

export default async function AdminModifierLivrePage({ params }: { params: { id: string } }) {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: livre }, { data: auteurs }] = await Promise.all([
    supabase.from('vce_livres').select('*').eq('id', params.id).single(),
    supabase.from('vce_auteurs').select('id, prenom, nom, nom_plume').order('prenom', { ascending: true }),
  ]);

  if (!livre) notFound();

  return (
    <div style={{ padding: '2.5rem', maxWidth: '760px' }}>
      <Link href="/admin/livres" style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--accent-or-texte)', textDecoration: 'none' }}>
        ← Retour aux livres
      </Link>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '1rem 0 2rem' }}>
        Modifier le livre
      </h1>

      <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '1.75rem', marginBottom: '1.5rem' }}>
        <LivreForm mode="edit" auteurs={auteurs ?? []} livre={livre} />
      </div>

      <div style={{ background: 'var(--carte)', border: '1px solid #991B1B', borderRadius: '8px', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.05rem', fontWeight: 600, color: '#991B1B', margin: '0 0 1rem' }}>
          Zone dangereuse
        </h2>
        <SupprimerLivreButton livreId={livre.id} livreTitre={livre.titre} />
      </div>
    </div>
  );
}
