'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { supprimerLivreAuteur } from '../../../actions/livres';
import type { LivreAuteurState } from '../../../actions/livres';

function BoutonConfirmer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        fontFamily: 'var(--font-inter)',
        background: '#991B1B',
        color: '#FFFFFF',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Suppression...' : 'Confirmer la suppression'}
    </button>
  );
}

const initialState: LivreAuteurState = {};

export default function SupprimerLivreAuteurButton({ livreId, livreTitre }: { livreId: string; livreTitre: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [state, action] = useFormState(supprimerLivreAuteur, initialState);

  if (!confirmed) {
    return (
      <div>
        {state.error && (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: '#991B1B', margin: '0 0 0.5rem' }}>{state.error}</p>
        )}
        <button
          type="button"
          onClick={() => setConfirmed(true)}
          style={{
            fontFamily: 'var(--font-inter)',
            background: 'transparent',
            color: '#991B1B',
            border: '1px solid #991B1B',
            padding: '0.45rem 0.9rem',
            borderRadius: '4px',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Supprimer
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#FEE2E2', border: '1px solid #991B1B', borderRadius: '6px', padding: '0.9rem 1.1rem' }}>
      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: '#991B1B', margin: '0 0 0.75rem', fontWeight: 500 }}>
        Supprimer définitivement « {livreTitre} » ? Cette action est irréversible.
      </p>
      {state.error && (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: '#991B1B', margin: '0 0 0.75rem' }}>{state.error}</p>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <form action={action}>
          <input type="hidden" name="livre_id" value={livreId} />
          <BoutonConfirmer />
        </form>
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          style={{ fontFamily: 'var(--font-inter)', background: 'transparent', color: 'var(--texte-carte-secondaire)', border: 'none', fontSize: '0.78rem', cursor: 'pointer' }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
