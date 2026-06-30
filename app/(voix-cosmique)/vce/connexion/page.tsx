'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { vceLogin } from '../actions/auth';

const initialState = { error: undefined as string | undefined };

function ConnexionSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: '0.75rem',
        background: 'var(--or, #B5A020)',
        color: '#fff',
        border: 'none',
        borderRadius: '0.5rem',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: pending ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}
    >
      {pending ? 'Connexion…' : 'Se connecter'}
    </button>
  );
}

export default function VCEConnexionPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const [state, formAction] = useFormState(
    async (_prev: typeof initialState, formData: FormData) => {
      if (searchParams.from) formData.set('from', searchParams.from);
      return (await vceLogin(formData)) ?? initialState;
    },
    initialState,
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Espace Auteur</h1>
        <p style={styles.subtitle}>Voix Cosmique Éditions</p>

        <form action={formAction} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Adresse email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={styles.input}
            />
          </div>

          {state?.error && <p style={styles.error}>{state.error}</p>}

          <ConnexionSubmitButton />
        </form>

        <p style={styles.footer}>
          Pas encore de compte ?{' '}
          <a href="/inscription" style={styles.link}>Créer un compte auteur</a>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--n, #FAF3E0)',
  },
  card: {
    background: '#fff',
    border: '1px solid #E8DFB0',
    borderRadius: '1rem',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(181,160,32,0.10)',
  },
  title: {
    fontFamily: 'var(--font-playfair, serif)',
    fontSize: '1.75rem',
    color: 'var(--orl, #8A7818)',
    margin: '0 0 0.25rem',
    textAlign: 'center' as const,
  },
  subtitle: {
    color: 'var(--brun-clair, #6B4C2F)',
    fontSize: '0.875rem',
    textAlign: 'center' as const,
    marginBottom: '2rem',
    letterSpacing: '0.05em',
  },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '1.25rem' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '0.375rem' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: 'var(--brun, #3D2B1A)' },
  input: {
    padding: '0.625rem 0.875rem',
    border: '1px solid #D4C87A',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    background: '#FFFEF5',
    color: 'var(--texte, #1C1208)',
    outline: 'none',
  },
  error: {
    color: '#B91C1C',
    fontSize: '0.875rem',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.875rem',
    margin: 0,
  },
  button: {
    padding: '0.75rem',
    background: 'var(--or, #B5A020)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontFamily: 'var(--font-inter, sans-serif)',
  },
  footer: { marginTop: '1.5rem', textAlign: 'center' as const, fontSize: '0.875rem', color: 'var(--brun-clair, #6B4C2F)' },
  link: { color: 'var(--or, #B5A020)', fontWeight: 500, textDecoration: 'none' },
};
