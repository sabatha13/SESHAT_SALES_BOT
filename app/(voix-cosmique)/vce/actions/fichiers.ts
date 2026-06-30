'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';

export type FichiersState = { error?: string; success?: boolean };

// ─── Upload d'un fichier par l'auteur ─────────────────────────────────────────

export async function uploadFichier(
  prevState: FichiersState,
  formData: FormData,
): Promise<FichiersState> {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const commandeId = (formData.get('commande_id') as string)?.trim();
  const fichier = formData.get('fichier') as File | null;

  if (!commandeId) return { error: 'Veuillez sélectionner une commande.' };
  if (!fichier || fichier.size === 0) return { error: 'Veuillez sélectionner un fichier.' };
  if (fichier.size > 50 * 1024 * 1024) return { error: 'Le fichier ne doit pas dépasser 50 Mo.' };

  // Vérifie que la commande appartient bien à cet auteur
  const { data: commande } = await supabase
    .from('vce_commandes_services')
    .select('id')
    .eq('id', commandeId)
    .eq('auteur_id', auteur.id)
    .single();

  if (!commande) return { error: 'Commande introuvable.' };

  const buffer = await fichier.arrayBuffer();
  const fileName = `${auteur.id}/${commandeId}/${Date.now()}_${fichier.name}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('vce-manuscripts')
    .upload(fileName, buffer, {
      contentType: fichier.type || 'application/octet-stream',
    });

  if (uploadError || !uploadData) {
    return { error: "Erreur lors de l'envoi. Veuillez réessayer." };
  }

  const { error: insertError } = await supabase.from('vce_fichiers').insert({
    commande_id: commandeId,
    auteur_id: auteur.id,
    nom_fichier: fichier.name,
    url: uploadData.path,
    taille_bytes: fichier.size,
    type_fichier: 'document',
    envoye_par: 'auteur',
  });

  if (insertError) return { error: "Erreur lors de l'enregistrement." };

  revalidatePath('/espace-auteur/fichiers');
  revalidatePath('/espace-auteur/commandes');
  return { success: true };
}

// ─── Validation d'un livrable reçu de l'équipe VCE ───────────────────────────

export async function validerFichier(formData: FormData): Promise<void> {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const fichierId = (formData.get('fichierId') as string)?.trim();
  if (!fichierId) return;

  // Récupère le fichier et vérifie la propriété via la commande
  const { data: fichier } = await supabase
    .from('vce_fichiers')
    .select('id, commande_id')
    .eq('id', fichierId)
    .single();

  if (!fichier?.commande_id) return;

  const { data: commande } = await supabase
    .from('vce_commandes_services')
    .select('id')
    .eq('id', fichier.commande_id)
    .eq('auteur_id', auteur.id)
    .single();

  if (!commande) return;

  await supabase
    .from('vce_fichiers')
    .update({ valide_par_auteur: true })
    .eq('id', fichierId);

  revalidatePath('/espace-auteur/fichiers');
  revalidatePath(`/espace-auteur/commandes/${fichier.commande_id}`);
}
