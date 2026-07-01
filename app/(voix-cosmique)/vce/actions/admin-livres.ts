'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import { slugify } from '@/lib/vce/slug';

export type LivreState = { error?: string; success?: boolean };

// Erreur Postgres pour violation de contrainte unique
const UNIQUE_VIOLATION = '23505';

function parseLivreForm(formData: FormData) {
  const titre = (formData.get('titre') as string)?.trim();
  const auteur_id = (formData.get('auteur_id') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const resume_court = (formData.get('resume_court') as string)?.trim();

  const prixDollarsRaw = formData.get('prix_dollars') as string;
  const prixDollars = prixDollarsRaw ? parseFloat(prixDollarsRaw) : 0;
  const prix_cents = isNaN(prixDollars) ? 0 : Math.round(prixDollars * 100);

  const nbPagesRaw = formData.get('nb_pages') as string;
  const anneeRaw = formData.get('annee_publication') as string;

  return {
    titre,
    auteur_id,
    description,
    resume_court,
    prix_cents,
    sous_titre: (formData.get('sous_titre') as string)?.trim() || null,
    isbn: (formData.get('isbn') as string)?.trim() || null,
    lien_amazon: (formData.get('lien_amazon') as string)?.trim() || null,
    couverture_url: (formData.get('couverture_url') as string)?.trim() || null,
    nb_pages: nbPagesRaw ? parseInt(nbPagesRaw, 10) : null,
    annee_publication: anneeRaw ? parseInt(anneeRaw, 10) : null,
    langue: (formData.get('langue') as string)?.trim() || 'fr',
    is_published: formData.get('is_published') === 'on',
    is_featured: formData.get('is_featured') === 'on',
  };
}

export async function creerLivre(prevState: LivreState, formData: FormData): Promise<LivreState> {
  await assertVceAdmin();
  const data = parseLivreForm(formData);

  if (!data.titre) return { error: 'Le titre est requis.' };
  if (!data.auteur_id) return { error: 'L\'auteur est requis.' };
  if (!data.description) return { error: 'La description est requise.' };
  if (!data.resume_court) return { error: 'Le résumé court est requis.' };

  const slug = slugify(data.titre);
  if (!slug) return { error: 'Titre invalide pour générer un slug.' };

  const supabase = createServerClient();
  const { error } = await supabase.from('vce_livres').insert({ ...data, slug });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Un livre avec le slug « ${slug} » existe déjà. Modifie le titre.` };
    }
    return { error: 'Erreur lors de la création du livre.' };
  }

  revalidatePath('/vce/admin/livres');
  revalidatePath('/vce/catalogue');
  redirect('/admin/livres');
}

export async function modifierLivre(prevState: LivreState, formData: FormData): Promise<LivreState> {
  await assertVceAdmin();
  const livreId = formData.get('livre_id') as string;
  if (!livreId) return { error: 'Livre introuvable.' };

  const data = parseLivreForm(formData);
  if (!data.titre) return { error: 'Le titre est requis.' };
  if (!data.auteur_id) return { error: 'L\'auteur est requis.' };
  if (!data.description) return { error: 'La description est requise.' };
  if (!data.resume_court) return { error: 'Le résumé court est requis.' };

  const slug = slugify(data.titre);
  if (!slug) return { error: 'Titre invalide pour générer un slug.' };

  const supabase = createServerClient();
  const { error } = await supabase
    .from('vce_livres')
    .update({ ...data, slug, updated_at: new Date().toISOString() })
    .eq('id', livreId);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Un autre livre utilise déjà le slug « ${slug} ». Modifie le titre.` };
    }
    return { error: 'Erreur lors de la mise à jour du livre.' };
  }

  revalidatePath('/vce/admin/livres');
  revalidatePath(`/vce/admin/livres/${livreId}`);
  revalidatePath('/vce/catalogue');
  revalidatePath(`/vce/livres/${slug}`);
  return { success: true };
}

export async function supprimerLivre(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const livreId = formData.get('livre_id') as string;
  if (!livreId) return;

  const supabase = createServerClient();
  await supabase.from('vce_livres').delete().eq('id', livreId);

  revalidatePath('/vce/admin/livres');
  revalidatePath('/vce/catalogue');
  redirect('/admin/livres');
}
