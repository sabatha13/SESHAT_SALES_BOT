'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import { slugify } from '@/lib/vce/slug';

export type LivreState = { error?: string; success?: boolean; warning?: string };

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

  // NB : couverture_url n'est plus géré ici (upload async traité hors parse)
  return {
    titre,
    auteur_id,
    description,
    resume_court,
    prix_cents,
    sous_titre: (formData.get('sous_titre') as string)?.trim() || null,
    isbn: (formData.get('isbn') as string)?.trim() || null,
    lien_amazon: (formData.get('lien_amazon') as string)?.trim() || null,
    nb_pages: nbPagesRaw ? parseInt(nbPagesRaw, 10) : null,
    annee_publication: anneeRaw ? parseInt(anneeRaw, 10) : null,
    langue: (formData.get('langue') as string)?.trim() || 'fr',
    is_published: formData.get('is_published') === 'on',
    is_featured: formData.get('is_featured') === 'on',
  };
}

// Upload de la couverture vers le bucket public dédié (service_role).
// Retourne l'URL existante si aucun fichier fourni ; un message d'erreur sinon.
async function uploaderCouverture(
  livreId: string,
  formData: FormData,
  urlActuelle: string | null,
): Promise<{ url?: string; error?: string }> {
  const fichier = formData.get('couverture_file') as File | null;
  if (!fichier || fichier.size === 0) return { url: urlActuelle ?? undefined };

  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (fichier.size > MAX_SIZE) return { error: 'Fichier trop lourd (max 2 Mo).' };
  if (!ALLOWED.includes(fichier.type)) return { error: 'Format non supporté (JPG, PNG, WebP uniquement).' };

  const extParType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extParType[fichier.type] ?? 'jpg';
  const path = `livres/${livreId}/couverture.${ext}`;

  const supabase = createServerClient();
  const buffer = Buffer.from(await fichier.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('vce-livres-couvertures')
    .upload(path, buffer, { contentType: fichier.type, upsert: true });

  if (uploadError) return { error: 'Erreur upload couverture : ' + uploadError.message };

  const { data } = supabase.storage.from('vce-livres-couvertures').getPublicUrl(path);
  return { url: `${data.publicUrl}?v=${Date.now()}` };
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

  // 1. INSERT sans couverture (l'id est nécessaire pour le chemin d'upload)
  const { data: nouveauLivre, error } = await supabase
    .from('vce_livres')
    .insert({ ...data, slug, couverture_url: null })
    .select('id')
    .single();

  if (error || !nouveauLivre) {
    if (error?.code === UNIQUE_VIOLATION) {
      return { error: `Un livre avec le slug « ${slug} » existe déjà. Modifie le titre.` };
    }
    return { error: 'Erreur lors de la création du livre.' };
  }

  // 2. Upload couverture — le livre existe déjà, on ne fait PAS échouer la création
  const upload = await uploaderCouverture(nouveauLivre.id, formData, null);

  if (upload.error) {
    revalidatePath('/vce/admin/livres');
    revalidatePath('/vce/catalogue');
    return { success: true, warning: 'Livre créé, mais erreur upload couverture : ' + upload.error };
  }

  // 3. Si une couverture a été uploadée → UPDATE de l'URL
  if (upload.url) {
    await supabase.from('vce_livres').update({ couverture_url: upload.url }).eq('id', nouveauLivre.id);
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

  // 1. Récupère la couverture actuelle AVANT (fallback si aucun nouveau fichier)
  const { data: livreExistant } = await supabase
    .from('vce_livres')
    .select('couverture_url')
    .eq('id', livreId)
    .single();

  // 2. Upload (ou conservation de l'URL existante)
  const upload = await uploaderCouverture(livreId, formData, livreExistant?.couverture_url ?? null);
  if (upload.error) return { error: upload.error };

  // 3. UPDATE incluant la couverture
  const { error } = await supabase
    .from('vce_livres')
    .update({ ...data, slug, couverture_url: upload.url ?? null, updated_at: new Date().toISOString() })
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
