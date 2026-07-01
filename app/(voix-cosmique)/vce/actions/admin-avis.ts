'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

export async function approuverAvis(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const reviewId = formData.get('review_id') as string;
  if (!reviewId) return;

  const supabase = createServerClient();
  await supabase
    .from('vce_reviews')
    .update({ approuve_admin: true, autorise_affichage: true })
    .eq('id', reviewId);

  revalidatePath('/vce/admin/avis');
}

export async function rejeterAvis(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const reviewId = formData.get('review_id') as string;
  if (!reviewId) return;

  const supabase = createServerClient();
  await supabase
    .from('vce_reviews')
    .update({ approuve_admin: false, autorise_affichage: false })
    .eq('id', reviewId);

  revalidatePath('/vce/admin/avis');
}
