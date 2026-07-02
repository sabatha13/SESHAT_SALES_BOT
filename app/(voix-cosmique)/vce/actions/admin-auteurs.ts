'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import { slugify } from '@/lib/vce/slug';

export type BioAuteurState = { error?: string; success?: boolean };

const UNIQUE_VIOLATION = '23505';

export async function suspendreAuteur(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const auteurId = formData.get('auteur_id') as string;
  if (!auteurId) return;

  const supabase = createServerClient();
  await supabase.from('vce_auteurs').update({ is_active: false }).eq('id', auteurId);

  revalidatePath('/vce/admin/auteurs');
  revalidatePath(`/vce/admin/auteurs/${auteurId}`);
}

export async function reactiverAuteur(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const auteurId = formData.get('auteur_id') as string;
  if (!auteurId) return;

  const supabase = createServerClient();
  await supabase.from('vce_auteurs').update({ is_active: true }).eq('id', auteurId);

  revalidatePath('/vce/admin/auteurs');
  revalidatePath(`/vce/admin/auteurs/${auteurId}`);
}

export async function supprimerAuteur(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const auteurId = formData.get('auteur_id') as string;
  if (!auteurId) return;

  const supabase = createServerClient();

  // Récupère les identifiants nécessaires à la cascade
  const { data: auteur } = await supabase
    .from('vce_auteurs')
    .select('id, auth_user_id')
    .eq('id', auteurId)
    .single();
  if (!auteur) return;

  const { data: commandes } = await supabase
    .from('vce_commandes_services')
    .select('id')
    .eq('auteur_id', auteurId);
  const commandeIds = (commandes ?? []).map((c) => c.id);

  // Cascade — ordre strict
  // 1. Messages (référencent commande_id)
  if (commandeIds.length > 0) {
    await supabase.from('vce_messages').delete().in('commande_id', commandeIds);
    // 2. Étapes (référencent commande_id)
    await supabase.from('vce_etapes').delete().in('commande_id', commandeIds);
  }
  // 3. Fichiers (auteur_id)
  await supabase.from('vce_fichiers').delete().eq('auteur_id', auteurId);
  // 4. Transactions (auteur_id)
  await supabase.from('vce_transactions').delete().eq('auteur_id', auteurId);
  // 5. Reviews (auteur_id)
  await supabase.from('vce_reviews').delete().eq('auteur_id', auteurId);
  // 6. Commandes (auteur_id)
  await supabase.from('vce_commandes_services').delete().eq('auteur_id', auteurId);
  // 7. Auteur
  await supabase.from('vce_auteurs').delete().eq('id', auteurId);
  // 8. Compte auth Supabase
  if (auteur.auth_user_id) {
    await supabase.auth.admin.deleteUser(auteur.auth_user_id);
  }

  revalidatePath('/vce/admin/auteurs');
  redirect('/admin/auteurs');
}

export async function updateBioAuteur(
  prevState: BioAuteurState,
  formData: FormData,
): Promise<BioAuteurState> {
  await assertVceAdmin();
  const auteurId = formData.get('auteur_id') as string;
  if (!auteurId) return { error: 'Auteur introuvable.' };

  const bio_courte = (formData.get('bio_courte') as string)?.trim().slice(0, 150) || null;
  const bio = (formData.get('bio') as string)?.trim() || null;
  const slugRaw = (formData.get('slug') as string)?.trim();
  const slug = slugRaw ? slugify(slugRaw) : null;

  // ── Photo : upload si un fichier est fourni, sinon on garde l'URL existante ──
  const photoFile = formData.get('photo_file') as File | null;
  const photoUrlActuelle = (formData.get('photo_url_actuelle') as string) || null;
  let finalPhotoUrl = photoUrlActuelle;

  const supabase = createServerClient();

  if (photoFile && photoFile.size > 0) {
    const MAX_SIZE = 2 * 1024 * 1024;
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (photoFile.size > MAX_SIZE) return { error: 'Fichier trop lourd (max 2 Mo).' };
    if (!ALLOWED.includes(photoFile.type)) {
      return { error: 'Format non supporté (JPG, PNG, WebP uniquement).' };
    }

    // Extension dérivée du type MIME (fallback fiable si le nom n'a pas d'extension)
    const extParType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const ext = extParType[photoFile.type] ?? 'jpg';
    const path = `auteurs/${auteurId}/photo.${ext}`;

    const buffer = Buffer.from(await photoFile.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('vce-auteurs-photos')
      .upload(path, buffer, { contentType: photoFile.type, upsert: true });

    if (uploadError) return { error: 'Erreur upload photo : ' + uploadError.message };

    const { data } = supabase.storage.from('vce-auteurs-photos').getPublicUrl(path);
    // Cache-busting : force le rafraîchissement de l'aperçu après ré-upload (même chemin)
    finalPhotoUrl = `${data.publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase
    .from('vce_auteurs')
    .update({
      bio_courte,
      bio,
      photo_url: finalPhotoUrl,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auteurId);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: `Le slug « ${slug} » est déjà utilisé par un autre auteur.` };
    }
    return { error: 'Erreur lors de la mise à jour de la bio.' };
  }

  revalidatePath('/vce/admin/auteurs');
  revalidatePath(`/vce/admin/auteurs/${auteurId}`);
  if (slug) revalidatePath(`/vce/auteurs/${slug}`);
  return { success: true };
}
