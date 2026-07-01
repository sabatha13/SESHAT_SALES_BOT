'use client';

import { useState } from 'react';
import { ajouterEtape, modifierEtape, supprimerEtape } from '../../../../actions/admin-commandes';

const ETAPE_STATUTS = [
  { value: 'a_venir', label: 'À venir' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminée' },
];

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

const btnPrimary: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  background: 'var(--accent-or)',
  color: 'var(--n)',
  border: 'none',
  padding: '0.5rem 1.1rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
};

interface Etape {
  id: string;
  titre: string;
  description: string | null;
  statut: string;
  ordre: number | null;
}

// ── Formulaire d'ajout ──────────────────────────────────────────────────────

export function AjouterEtapeForm({ commandeId }: { commandeId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={btnPrimary}>
        + Ajouter une étape
      </button>
    );
  }

  return (
    <form
      action={ajouterEtape}
      style={{
        background: 'var(--carte)',
        border: '1px solid var(--carte-bordure)',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <input type="hidden" name="commande_id" value={commandeId} />
      <input type="text" name="titre" placeholder="Titre de l'étape" required style={inputStyle} />
      <textarea name="description" placeholder="Description (optionnel)" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <select name="statut" defaultValue="a_venir" style={{ ...inputStyle, width: 'auto' }}>
          {ETAPE_STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input type="number" name="ordre" placeholder="Ordre" defaultValue={0} style={{ ...inputStyle, width: '90px' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button type="submit" style={btnPrimary}>
          Ajouter
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
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

// ── Ligne étape (affichage + édition inline) ────────────────────────────────

export function EtapeRow({ etape, commandeId }: { etape: Etape; commandeId: string }) {
  const [editing, setEditing] = useState(false);

  const statutLabel = ETAPE_STATUTS.find((s) => s.value === etape.statut)?.label ?? etape.statut;

  if (!editing) {
    return (
      <div
        style={{
          background: 'var(--carte)',
          border: '1px solid var(--carte-bordure)',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                color: 'var(--accent-or-texte)',
                fontWeight: 600,
              }}
            >
              #{etape.ordre ?? 0}
            </span>
            <h4
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--texte-carte)',
                margin: 0,
              }}
            >
              {etape.titre}
            </h4>
            <span
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.65rem',
                fontWeight: 600,
                background: 'var(--or-pale)',
                color: 'var(--accent-or-texte)',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
              }}
            >
              {statutLabel}
            </span>
          </div>
          {etape.description && (
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: 'var(--texte-carte-secondaire)',
                margin: 0,
              }}
            >
              {etape.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            style={{
              fontFamily: 'var(--font-inter)',
              background: 'transparent',
              color: 'var(--accent-or-texte)',
              border: '1px solid var(--carte-bordure)',
              padding: '0.35rem 0.7rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Modifier
          </button>
          <form action={supprimerEtape}>
            <input type="hidden" name="etape_id" value={etape.id} />
            <input type="hidden" name="commande_id" value={commandeId} />
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                background: 'transparent',
                color: '#991B1B',
                border: '1px solid #991B1B',
                padding: '0.35rem 0.7rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              Suppr.
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form
      action={modifierEtape}
      style={{
        background: 'var(--carte)',
        border: '1px solid var(--carte-bordure)',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <input type="hidden" name="etape_id" value={etape.id} />
      <input type="hidden" name="commande_id" value={commandeId} />
      <input type="text" name="titre" defaultValue={etape.titre} required style={inputStyle} />
      <textarea name="description" defaultValue={etape.description ?? ''} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
      <select name="statut" defaultValue={etape.statut} style={{ ...inputStyle, width: 'auto' }}>
        {ETAPE_STATUTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button type="submit" style={btnPrimary}>
          Enregistrer
        </button>
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
