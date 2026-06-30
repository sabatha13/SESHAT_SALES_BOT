'use client';

import { useActionState } from 'react';
import { vceSignup } from '../actions/auth';

const initialState = { error: undefined as string | undefined };

export default function VCEInscriptionPage() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      return (await vceSignup(formData)) ?? initialState;
    },
    initialState,
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Devenir auteur</h1>
        <p style={styles.subtitle}>Voix Cosmique Éditions</p>

        <form action={formAction} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label htmlFor="prenom" style={styles.label}>Prénom <span style={styles.req}>*</span></label>
              <input id="prenom" name="prenom" type="text" required style={styles.input} />
            </div>
            <div style={styles.field}>
              <label htmlFor="nom" style={styles.label}>Nom <span style={styles.req}>*</span></label>
              <input id="nom" name="nom" type="text" required style={styles.input} />
            </div>
          </div>

          <div style={styles.field}>
            <label htmlFor="nom_plume" style={styles.label}>Nom de plume <span style={styles.opt}>(optionnel)</span></label>
            <input id="nom_plume" name="nom_plume" type="text" style={styles.input} />
          </div>

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Adresse email <span style={styles.req}>*</span></label>
            <input id="email" name="email" type="email" required autoComplete="email" style={styles.input} />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Mot de passe <span style={styles.req}>*</span></label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              style={styles.input}
            />
            <span style={styles.hint}>8 caractères minimum</span>
          </div>

          {state?.error && <p style={styles.error}>{state.error}</p>}

          <button type="submit" disabled={isPending} style={styles.button}>
            {isPending ? 'Création du compte…' : 'Créer mon compte auteur'}
          </button>
        </form>

        <p style={styles.footer}>
          Déjà un compte ?{' '}
          <a href="/connexion" style={styles.link}>Se connecter</a>
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
    maxWidth: '480px',
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
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '0.375rem' },
  label: { fontSize: '0.875rem', fontWeight: 500, color: 'var(--brun, #3D2B1A)' },
  req: { color: 'var(--or, #B5A020)' },
  opt: { color: 'var(--brun-clair, #6B4C2F)', fontWeight: 400, fontSize: '0.75rem' },
  hint: { fontSize: '0.75rem', color: 'var(--brun-clair, #6B4C2F)' },
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
    fontFamily: 'var(--font-inter, sans-serif)',
  },
  footer: { marginTop: '1.5rem', textAlign: 'center' as const, fontSize: '0.875rem', color: 'var(--brun-clair, #6B4C2F)' },
  link: { color: 'var(--or, #B5A020)', fontWeight: 500, textDecoration: 'none' },
};
