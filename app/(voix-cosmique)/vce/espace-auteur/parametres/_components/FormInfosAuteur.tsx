'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateInfosAuteur } from '../../../actions/parametres';
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
      {pending ? 'Enregistrement...' : 'Enregistrer'}
    </button>
  );
}

interface Props {
  auteur: {
    prenom: string;
    nom: string;
    nom_plume: string | null;
    bio: string | null;
    site_web: string | null;
    nationalite: string | null;
    langue_principale: string | null;
  };
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

const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };

const initialState: ParametresState = {};

export default function FormInfosAuteur({ auteur }: Props) {
  const [state, action] = useFormState(updateInfosAuteur, initialState);

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
          Informations mises à jour avec succès.
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Prénom *</label>
          <input type="text" name="prenom" defaultValue={auteur.prenom} required style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Nom *</label>
          <input type="text" name="nom" defaultValue={auteur.nom} required style={inputStyle} />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Nom de plume</label>
        <input type="text" name="nom_plume" defaultValue={auteur.nom_plume ?? ''} style={inputStyle} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Biographie</label>
        <textarea
          name="bio"
          defaultValue={auteur.bio ?? ''}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Site web</label>
          <input
            type="text"
            name="site_web"
            defaultValue={auteur.site_web ?? ''}
            style={inputStyle}
            placeholder="https://..."
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Nationalité</label>
          <input
            type="text"
            name="nationalite"
            defaultValue={auteur.nationalite ?? ''}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ ...fieldStyle, marginBottom: '1.5rem' }}>
        <label style={labelStyle}>Langue principale</label>
        <select
          name="langue_principale"
          defaultValue={auteur.langue_principale ?? 'fr'}
          style={inputStyle}
        >
          <option value="fr">Français</option>
          <option value="en">Anglais</option>
          <option value="es">Espagnol</option>
        </select>
      </div>

      <BoutonSoumettre />
    </form>
  );
}
