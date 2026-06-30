'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';

export type MessagerieState = { error?: string; success?: boolean };

// ─── Envoi d'un message par l'auteur ─────────────────────────────────────────

export async function envoyerMessage(
  prevState: MessagerieState,
  formData: FormData,
): Promise<MessagerieState> {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const commandeId = (formData.get('commande_id') as string)?.trim();
  const contenu = (formData.get('contenu') as string)?.trim();

  if (!commandeId) return { error: 'Commande manquante.' };
  if (!contenu) return { error: 'Le message ne peut pas être vide.' };
  if (contenu.length > 5000) return { error: 'Message trop long (5000 caractères max).' };

  // Vérifie que la commande appartient bien à cet auteur
  const { data: commande } = await supabase
    .from('vce_commandes_services')
    .select('id')
    .eq('id', commandeId)
    .eq('auteur_id', auteur.id)
    .single();

  if (!commande) return { error: 'Commande introuvable.' };

  const { error } = await supabase.from('vce_messages').insert({
    commande_id: commandeId,
    expediteur: 'auteur',
    expediteur_nom: `${auteur.prenom} ${auteur.nom}`,
    contenu,
  });

  if (error) return { error: "Erreur lors de l'envoi du message." };

  revalidatePath(`/espace-auteur/messagerie/${commandeId}`);
  revalidatePath('/espace-auteur/messagerie');
  return { success: true };
}

// ─── Marquer les messages VCE comme lus ──────────────────────────────────────

export async function marquerLus(commandeId: string): Promise<void> {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  // Ownership check obligatoire — cette action peut être appelée depuis le client
  const { data: commande } = await supabase
    .from('vce_commandes_services')
    .select('id')
    .eq('id', commandeId)
    .eq('auteur_id', auteur.id)
    .single();

  if (!commande) return;

  await supabase
    .from('vce_messages')
    .update({ lu: true })
    .eq('commande_id', commandeId)
    .eq('expediteur', 'vce')
    .eq('lu', false);

  revalidatePath('/espace-auteur/messagerie');
}
