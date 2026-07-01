'use client';

import { useRef } from 'react';
import { changerStatutCommande } from '../../../actions/admin-commandes';

const STATUT_OPTIONS = [
  { value: 'briefing', label: 'Briefing' },
  { value: 'devis_envoye', label: 'Devis envoyé' },
  { value: 'production', label: 'En production' },
  { value: 'revision', label: 'Révision' },
  { value: 'livre', label: 'Livré' },
  { value: 'termine', label: 'Terminé' },
];

interface Props {
  commandeId: string;
  statutActuel: string;
}

export default function StatutSelectForm({ commandeId, statutActuel }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={changerStatutCommande} ref={formRef}>
      <input type="hidden" name="commande_id" value={commandeId} />
      <select
        name="statut"
        defaultValue={statutActuel}
        onChange={() => formRef.current?.requestSubmit()}
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          padding: '0.4rem 0.6rem',
          border: '1px solid var(--carte-bordure)',
          borderRadius: '4px',
          background: 'var(--n)',
          color: 'var(--texte)',
          cursor: 'pointer',
        }}
      >
        {STATUT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </form>
  );
}
