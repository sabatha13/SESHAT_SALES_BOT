import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

export type VceAuteur = {
  id: string;
  auth_user_id: string;
  prenom: string;
  nom: string;
  nom_plume: string | null;
  email: string;
  photo_url: string | null;
  bio: string | null;
  notif_email: boolean | null;
  notif_whatsapp: boolean | null;
  notif_telegram: boolean | null;
};

export async function getVceAuteur(): Promise<VceAuteur> {
  const cookieStore = cookies();
  const token = cookieStore.get('vce_auth_session')?.value;
  if (!token) redirect('/connexion');

  // Même pattern que middleware.ts — valide la signature JWT côté Supabase Auth
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) redirect('/connexion');

  // service_role bypass RLS — restriction garantie par le filtre auth_user_id
  const supabase = createServerClient();
  const { data: auteur } = await supabase
    .from('vce_auteurs')
    .select('id, auth_user_id, prenom, nom, nom_plume, email, photo_url, bio, notif_email, notif_whatsapp, notif_telegram')
    .eq('auth_user_id', user.id)
    .single();

  if (!auteur) redirect('/connexion');

  return auteur as VceAuteur;
}
