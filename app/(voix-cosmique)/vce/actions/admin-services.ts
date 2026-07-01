'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

export type AdminServiceState = { error?: string; success?: boolean };

export async function modifierPackage(
  prevState: AdminServiceState,
  formData: FormData,
): Promise<AdminServiceState> {
  await assertVceAdmin();

  const packageId = formData.get('package_id') as string;
  if (!packageId) return { error: 'Package introuvable.' };

  const prixRaw = formData.get('prix') as string;
  const economieRaw = formData.get('economie') as string;
  const description = (formData.get('description') as string)?.trim() || null;

  const prix = parseFloat(prixRaw);
  if (isNaN(prix) || prix < 0) return { error: 'Prix invalide.' };

  const economie = economieRaw ? parseFloat(economieRaw) : null;
  if (economie !== null && (isNaN(economie) || economie < 0)) {
    return { error: 'Économie invalide.' };
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from('vce_service_packages')
    .update({ prix, economie, description })
    .eq('id', packageId);

  if (error) return { error: 'Erreur lors de la mise à jour du package.' };

  revalidatePath('/vce/admin/services');
  return { success: true };
}
