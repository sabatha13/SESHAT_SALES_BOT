import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export async function assertVceAdmin(): Promise<{ email: string; userId: string }> {
  // 1. Vérifie le JWT VCE (même pattern que middleware.ts)
  const token = cookies().get('vce_auth_session')?.value;
  if (!token) redirect('/connexion');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) redirect('/connexion');

  // 2. Vérifie que l'email est dans VCE_ADMIN_EMAILS
  const adminEmails = (process.env.VCE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes(user.email?.toLowerCase() ?? '')) {
    redirect('/espace-auteur'); // pas admin → renvoie vers espace auteur
  }

  return { email: user.email!, userId: user.id };
}
