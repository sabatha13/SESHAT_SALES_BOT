'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { supprimerAuteur } from '../../../../actions/admin-auteurs';

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
        padding: '0.55rem 1.1rem',
        borderRadius: '4px',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: pending ? 'wait' : 'pointer',
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Suppression...' : 'Confirmer la suppression définitive'}
    </button>
  );
}

interface Props {
  auteurId: string;
  auteurNom: string;
}

export default function SupprimerAuteurButton({ auteurId, auteurNom }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  if (!confirmed) {
    return (
      <button
        type="button"
        onClick={() => setConfirmed(true)}
        style={{
          fontFamily: 'var(--font-inter)',
          background: 'transparent',
          color: '#991B1B',
          border: '1px solid #991B1B',
          padding: '0.55rem 1.1rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Supprimer ce compte
      </button>
    );
  }

  return (
    <div
      style={{
        background: '#FEE2E2',
        border: '1px solid #991B1B',
        borderRadius: '6px',
        padding: '1rem 1.25rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.85rem',
          color: '#991B1B',
          margin: '0 0 0.75rem',
          fontWeight: 500,
        }}
      >
        Cette action est irréversible. Le compte de <strong>{auteurNom}</strong> ainsi que toutes
        ses commandes, messages, fichiers, transactions et avis seront définitivement supprimés.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <form action={supprimerAuteur}>
          <input type="hidden" name="auteur_id" value={auteurId} />
          <BoutonConfirmer />
        </form>
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          style={{
            fontFamily: 'var(--font-inter)',
            background: 'transparent',
            color: 'var(--texte-carte-secondaire)',
            border: 'none',
            padding: '0.55rem 0.5rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
