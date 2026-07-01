'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

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
  redirect('/vce/admin/auteurs');
}
