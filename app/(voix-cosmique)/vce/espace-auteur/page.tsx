import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function EspaceAuteurPage() {
  const cookieStore = cookies();
  if (!cookieStore.get('vce_auth_session')?.value) {
    redirect('/connexion');
  }

  return (
    <main style={{ padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair, serif)', color: 'var(--orl, #8A7818)', fontSize: '2rem' }}>
        Espace Auteur
      </h1>
      <p style={{ color: 'var(--brun-clair, #6B4C2F)', marginTop: '1rem' }}>
        Tableau de bord auteur — en construction.
      </p>
    </main>
  );
}
