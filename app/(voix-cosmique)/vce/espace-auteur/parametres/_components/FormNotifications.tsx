'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateNotifications } from '../../../actions/parametres';
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
    notif_email: boolean | null;
    notif_whatsapp: boolean | null;
    notif_telegram: boolean | null;
  };
}

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  cursor: 'pointer',
};

const checkboxLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.875rem',
  color: 'var(--texte)',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  width: '1rem',
  height: '1rem',
  accentColor: 'var(--accent-or)',
  cursor: 'pointer',
  flexShrink: 0,
};

const initialState: ParametresState = {};

export default function FormNotifications({ auteur }: Props) {
  const [state, action] = useFormState(updateNotifications, initialState);

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
          Préférences enregistrées.
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <label style={checkboxRowStyle}>
          <input
            type="checkbox"
            name="notif_email"
            defaultChecked={auteur.notif_email ?? false}
            style={checkboxStyle}
          />
          <span style={checkboxLabelStyle}>Recevoir les mises à jour par email</span>
        </label>

        <label style={checkboxRowStyle}>
          <input
            type="checkbox"
            name="notif_whatsapp"
            defaultChecked={auteur.notif_whatsapp ?? false}
            style={checkboxStyle}
          />
          <span style={checkboxLabelStyle}>Recevoir les notifications WhatsApp</span>
        </label>

        <label style={checkboxRowStyle}>
          <input
            type="checkbox"
            name="notif_telegram"
            defaultChecked={auteur.notif_telegram ?? false}
            style={checkboxStyle}
          />
          <span style={checkboxLabelStyle}>Recevoir les notifications Telegram</span>
        </label>
      </div>

      <BoutonSoumettre />
    </form>
  );
}
