'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { changerMotDePasse } from '../../../actions/parametres';
import type { ParametresState } from '../../../actions/parametres';

function BoutonSoumettre() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        fontFamily: 'var(--font-inter)',
        background: 'var(--accent-or)',
        color: 'var(--n)',
        border: 'none',
        padding: '0.65rem 1.5rem',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer',
        letterSpacing: '0.03em',
        opacity: pending ? 0.7 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {pending ? 'Modification...' : 'Changer le mot de passe'}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.875rem',
  width: '100%',
  padding: '0.6rem 0.875rem',
  border: '1px solid var(--carte-bordure)',
  borderRadius: '4px',
  background: 'var(--n)',
  color: 'var(--texte)',
  boxSizing: 'border-box',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--brun)',
  display: 'block',
  marginBottom: '0.35rem',
};

const initialState: ParametresState = {};

export default function FormMotDePasse() {
  const [state, action] = useFormState(changerMotDePasse, initialState);

  return (
    <form action={action}>
      {state.success && (
        <div
          style={{
            background: '#DCFCE7',
            color: '#166534',
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-inter)',
            marginBottom: '1rem',
          }}
        >
          Mot de passe modifié avec succès.
        </div>
      )}
      {state.error && (
        <div
          style={{
            background: '#FEE2E2',
            color: '#991B1B',
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-inter)',
            marginBottom: '1rem',
          }}
        >
          {state.error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Nouveau mot de passe</label>
        <input
          type="password"
          name="nouveau_mot_de_passe"
          required
          autoComplete="new-password"
          style={inputStyle}
        />
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            color: 'var(--accent-or-texte)',
            margin: '0.35rem 0 0',
          }}
        >
          8 caractères minimum, une majuscule, une minuscule, un chiffre.
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={labelStyle}>Confirmer le mot de passe</label>
        <input
          type="password"
          name="confirmer_mot_de_passe"
          required
          autoComplete="new-password"
          style={inputStyle}
        />
      </div>

      <BoutonSoumettre />
    </form>
  );
}
