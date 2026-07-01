'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

const STATUTS_VALIDES = [
  'briefing',
  'devis_envoye',
  'production',
  'revision',
  'livre',
  'termine',
];

export async function changerStatutCommande(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const commandeId = formData.get('commande_id') as string;
  const statut = formData.get('statut') as string;
  if (!commandeId || !STATUTS_VALIDES.includes(statut)) return;

  const supabase = createServerClient();
  await supabase.from('vce_commandes_services').update({ statut }).eq('id', commandeId);

  revalidatePath('/vce/admin/commandes');
  revalidatePath(`/vce/admin/commandes/${commandeId}`);
}

export async function ajouterEtape(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const commandeId = formData.get('commande_id') as string;
  const titre = (formData.get('titre') as string)?.trim();
  if (!commandeId || !titre) return;

  const description = (formData.get('description') as string)?.trim() || null;
  const statut = (formData.get('statut') as string)?.trim() || 'a_venir';
  const ordreRaw = formData.get('ordre') as string;
  const ordre = ordreRaw ? parseInt(ordreRaw, 10) : 0;

  const supabase = createServerClient();
  await supabase.from('vce_etapes').insert({
    commande_id: commandeId,
    titre,
    description,
    statut,
    ordre: isNaN(ordre) ? 0 : ordre,
  });

  revalidatePath(`/vce/admin/commandes/${commandeId}`);
}

export async function modifierEtape(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const etapeId = formData.get('etape_id') as string;
  const commandeId = formData.get('commande_id') as string;
  const titre = (formData.get('titre') as string)?.trim();
  if (!etapeId || !titre) return;

  const description = (formData.get('description') as string)?.trim() || null;
  const statut = (formData.get('statut') as string)?.trim() || 'a_venir';

  const supabase = createServerClient();
  await supabase
    .from('vce_etapes')
    .update({ titre, description, statut })
    .eq('id', etapeId);

  if (commandeId) revalidatePath(`/vce/admin/commandes/${commandeId}`);
}

export async function supprimerEtape(formData: FormData): Promise<void> {
  await assertVceAdmin();
  const etapeId = formData.get('etape_id') as string;
  const commandeId = formData.get('commande_id') as string;
  if (!etapeId) return;

  const supabase = createServerClient();
  await supabase.from('vce_etapes').delete().eq('id', etapeId);

  if (commandeId) revalidatePath(`/vce/admin/commandes/${commandeId}`);
}
