'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SESSION_COOKIE = 'vce_auth_session';
const REFRESH_COOKIE = 'vce_auth_refresh';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function supabaseAuthFetch(path: string, body: unknown, useServiceKey = false) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY,
      Authorization: `Bearer ${useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

function setSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 heure
  });

  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
}

async function createAuteurProfile(authUserId: string, data: {
  prenom: string;
  nom: string;
  email: string;
  nom_plume?: string;
}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vce_auteurs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      auth_user_id: authUserId,
      prenom: data.prenom,
      nom: data.nom,
      email: data.email,
      nom_plume: data.nom_plume || null,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erreur création profil auteur : ${err}`);
  }
}

// ─── Actions publiques ────────────────────────────────────────────────────────

export async function vceLogin(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const from = formData.get('from') as string | null;

  if (!email || !password) return { error: 'Email et mot de passe requis.' };

  const data = await supabaseAuthFetch('/token?grant_type=password', { email, password });

  if (data.error || !data.access_token) {
    return { error: data.error_description ?? 'Identifiants incorrects.' };
  }

  setSessionCookies(data.access_token, data.refresh_token);
  redirect(from ?? '/espace-auteur');
}

export async function vceSignup(formData: FormData): Promise<{ error?: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const prenom = formData.get('prenom') as string;
  const nom = formData.get('nom') as string;
  const nom_plume = (formData.get('nom_plume') as string) || undefined;

  if (!email || !password || !prenom || !nom) {
    return { error: 'Tous les champs obligatoires doivent être renseignés.' };
  }

  if (password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' };
  }

  // Créer le compte auth Supabase
  const data = await supabaseAuthFetch('/signup', { email, password });

  if (data.error || !data.user?.id) {
    return { error: data.error_description ?? 'Erreur lors de la création du compte.' };
  }

  // Créer le profil vce_auteurs via service_role
  try {
    await createAuteurProfile(data.user.id, { prenom, nom, email, nom_plume });
  } catch (err) {
    // Supprimer l'utilisateur auth créé pour éviter les fantômes
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${data.user.id}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    return { error: 'Erreur lors de la création du profil auteur.' };
  }

  // Si confirmation email désactivée, on a directement une session
  if (data.session?.access_token) {
    setSessionCookies(data.session.access_token, data.session.refresh_token);
    redirect('/espace-auteur');
  }

  // Sinon, rediriger vers une page de confirmation
  redirect('/inscription/confirmation');
}

export async function vceLogout(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  redirect('/connexion');
}
