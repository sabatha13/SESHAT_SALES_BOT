'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';

export type LivreAuteurState = { error?: string; success?: boolean };

// Violation de contrainte FK : livre référencé ailleurs (commande, contrat, royalties)
const FK_VIOLATION = '23503';

export async function supprimerLivreAuteur(
  prevState: LivreAuteurState,
  formData: FormData,
): Promise<LivreAuteurState> {
  const auteur = await getVceAuteur(); // redirige vers /connexion si non authentifié

  const livreId = formData.get('livre_id') as string;
  if (!livreId) return { error: 'Livre introuvable.' };

  const supabase = createServerClient();

  const { data: livre } = await supabase
    .from('vce_livres')
    .select('id, auteur_id, is_published')
    .eq('id', livreId)
    .single();

  if (!livre) return { error: 'Livre introuvable.' };
  if (livre.auteur_id !== auteur.id) return { error: 'Accès refusé.' };
  if (livre.is_published) {
    return { error: "Ce livre est publié et ne peut plus être supprimé. Contactez l'équipe VCE." };
  }

  // Double garde-fou : conditions répétées dans le WHERE (défense en profondeur)
  const { error } = await supabase
    .from('vce_livres')
    .delete()
    .eq('id', livreId)
    .eq('auteur_id', auteur.id)
    .eq('is_published', false);

  if (error) {
    if (error.code === FK_VIOLATION) {
      return {
        error:
          "Ce livre est rattaché à d'autres éléments (commande, contrat ou royalties) et ne peut pas être supprimé. Contactez l'équipe VCE.",
      };
    }
    return { error: 'Erreur lors de la suppression du livre.' };
  }

  revalidatePath('/espace-auteur/livres');
  revalidatePath('/espace-auteur');
  return { success: true };
}
