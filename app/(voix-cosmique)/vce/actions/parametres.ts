'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';

export type ParametresState = { error?: string; success?: boolean };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateInfosAuteur(
  prevState: ParametresState,
  formData: FormData,
): Promise<ParametresState> {
  const auteur = await getVceAuteur();

  const prenom = (formData.get('prenom') as string)?.trim();
  const nom = (formData.get('nom') as string)?.trim();
  if (!prenom || !nom) return { error: 'Le prénom et le nom sont requis.' };

  const supabase = createServerClient();
  const { error } = await supabase
    .from('vce_auteurs')
    .update({
      prenom,
      nom,
      nom_plume: (formData.get('nom_plume') as string)?.trim() || null,
      bio: (formData.get('bio') as string)?.trim() || null,
      site_web: (formData.get('site_web') as string)?.trim() || null,
      nationalite: (formData.get('nationalite') as string)?.trim() || null,
      langue_principale: (formData.get('langue_principale') as string)?.trim() || 'fr',
      updated_at: new Date().toISOString(),
    })
    .eq('id', auteur.id);

  if (error) return { error: 'Erreur lors de la mise à jour des informations.' };
  revalidatePath('/espace-auteur/parametres');
  return { success: true };
}

export async function changerMotDePasse(
  prevState: ParametresState,
  formData: FormData,
): Promise<ParametresState> {
  const token = cookies().get('vce_auth_session')?.value;
  if (!token) return { error: 'Session expirée. Veuillez vous reconnecter.' };

  const nouveau = (formData.get('nouveau_mot_de_passe') as string) ?? '';
  const confirmer = (formData.get('confirmer_mot_de_passe') as string) ?? '';

  if (nouveau !== confirmer) return { error: 'Les deux mots de passe ne correspondent pas.' };

  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongPassword.test(nouveau)) {
    return {
      error:
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.',
    };
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password: nouveau }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return {
      error: (err as { message?: string }).message ?? 'Erreur lors du changement de mot de passe.',
    };
  }

  return { success: true };
}

export async function updateNotifications(
  prevState: ParametresState,
  formData: FormData,
): Promise<ParametresState> {
  const auteur = await getVceAuteur();
  const supabase = createServerClient();

  const { error } = await supabase
    .from('vce_auteurs')
    .update({
      notif_email: formData.get('notif_email') === 'on',
      notif_whatsapp: formData.get('notif_whatsapp') === 'on',
      notif_telegram: formData.get('notif_telegram') === 'on',
      updated_at: new Date().toISOString(),
    })
    .eq('id', auteur.id);

  if (error) return { error: 'Erreur lors de la mise à jour des préférences.' };
  revalidatePath('/espace-auteur/parametres');
  return { success: true };
}
