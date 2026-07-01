'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { modifierPackage } from '../../../actions/admin-services';
import type { AdminServiceState } from '../../../actions/admin-services';

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
        padding: '0.5rem 1.1rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Enregistrement...' : 'Enregistrer'}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.85rem',
  width: '100%',
  padding: '0.5rem 0.7rem',
  border: '1px solid var(--carte-bordure)',
  borderRadius: '4px',
  background: 'var(--n)',
  color: 'var(--texte)',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--accent-or-texte)',
  display: 'block',
  marginBottom: '0.25rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

interface Package {
  id: string;
  nom: string;
  description: string | null;
  prix: number | null;
  economie: number | null;
}

const initialState: AdminServiceState = {};

export default function PackageEditForm({ pkg }: { pkg: Package }) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useFormState(modifierPackage, initialState);

  if (!editing) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1 }}>
          <h4
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--texte-carte)',
              margin: '0 0 0.35rem',
            }}
          >
            {pkg.nom}
          </h4>
          {pkg.description && (
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: 'var(--texte-carte-secondaire)',
                margin: '0 0 0.5rem',
              }}
            >
              {pkg.description}
            </p>
          )}
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', margin: 0 }}>
            <strong>{pkg.prix !== null ? `${parseFloat(String(pkg.prix)).toFixed(0)} $` : '—'}</strong>
            {pkg.economie !== null && pkg.economie > 0 && (
              <span style={{ color: 'var(--accent-or-texte)', marginLeft: '0.5rem' }}>
                (économie {parseFloat(String(pkg.economie)).toFixed(0)} $)
              </span>
            )}
          </p>
          {state.success && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: '#166534', margin: '0.5rem 0 0' }}>
              ✓ Enregistré.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            fontFamily: 'var(--font-inter)',
            background: 'transparent',
            color: 'var(--accent-or-texte)',
            border: '1px solid var(--carte-bordure)',
            padding: '0.4rem 0.9rem',
            borderRadius: '4px',
            fontSize: '0.8rem',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <input type="hidden" name="package_id" value={pkg.id} />
      <h4
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--texte-carte)',
          margin: 0,
        }}
      >
        {pkg.nom}
      </h4>

      {state.error && (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: '#991B1B', margin: 0 }}>
          {state.error}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Prix ($)</label>
          <input
            type="number"
            name="prix"
            step="0.01"
            defaultValue={pkg.prix !== null ? String(pkg.prix) : ''}
            required
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Économie ($)</label>
          <input
            type="number"
            name="economie"
            step="0.01"
            defaultValue={pkg.economie !== null ? String(pkg.economie) : ''}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          name="description"
          defaultValue={pkg.description ?? ''}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <BoutonSoumettre />
        <button
          type="button"
          onClick={() => setEditing(false)}
          style={{
            fontFamily: 'var(--font-inter)',
            background: 'transparent',
            color: 'var(--texte-carte-secondaire)',
            border: 'none',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
