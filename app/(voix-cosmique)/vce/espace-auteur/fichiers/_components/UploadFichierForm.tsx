'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { uploadFichier, type FichiersState } from '../../../actions/fichiers';

// ─── Bouton de soumission avec état pending ────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        fontFamily: 'var(--font-inter)',
        background: pending ? '#C4B08A' : '#B5A020',
        color: '#FAF3E0',
        border: 'none',
        padding: '0.65rem 1.25rem',
        borderRadius: '4px',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: pending ? 'not-allowed' : 'pointer',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {pending ? 'Envoi en cours…' : 'Envoyer le fichier'}
    </button>
  );
}

// ─── Formulaire d'upload ──────────────────────────────────────────────────────

interface Commande {
  id: string;
  titre: string;
}

const initialState: FichiersState = {};

export default function UploadFichierForm({ commandes }: { commandes: Commande[] }) {
  const [state, formAction] = useFormState(uploadFichier, initialState);

  if (commandes.length === 0) return null;

  return (
    <div
      style={{
        background: '#FFFEF5',
        border: '1px solid #E8DFB0',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#3D2B1A',
          margin: '0 0 1.25rem',
        }}
      >
        Envoyer un fichier
      </h3>

      <form action={formAction} encType="multipart/form-data">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            alignItems: 'end',
          }}
        >
          {/* Sélection de la commande */}
          <div>
            <label
              htmlFor="commande_id"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6B4C2F',
                display: 'block',
                marginBottom: '0.35rem',
                letterSpacing: '0.05em',
              }}
            >
              Commande
            </label>
            <select
              id="commande_id"
              name="commande_id"
              required
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                color: '#3D2B1A',
                background: '#FAF3E0',
                border: '1px solid #C4B08A',
                borderRadius: '4px',
                padding: '0.6rem 0.75rem',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              <option value="">— Choisir une commande —</option>
              {commandes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Fichier */}
          <div>
            <label
              htmlFor="fichier"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6B4C2F',
                display: 'block',
                marginBottom: '0.35rem',
                letterSpacing: '0.05em',
              }}
            >
              Fichier (50 Mo max)
            </label>
            <input
              id="fichier"
              name="fichier"
              type="file"
              required
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#3D2B1A',
                background: '#FAF3E0',
                border: '1px solid #C4B08A',
                borderRadius: '4px',
                padding: '0.5rem 0.75rem',
                width: '100%',
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Bouton */}
          <div>
            <SubmitButton />
          </div>
        </div>

        {/* Feedback */}
        {state.error && (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              color: '#B91C1C',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '4px',
              padding: '0.6rem 0.875rem',
              margin: '0.875rem 0 0',
            }}
          >
            {state.error}
          </p>
        )}
        {state.success && (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              color: '#166534',
              background: '#DCFCE7',
              border: '1px solid #BBF7D0',
              borderRadius: '4px',
              padding: '0.6rem 0.875rem',
              margin: '0.875rem 0 0',
            }}
          >
            Fichier envoyé avec succès.
          </p>
        )}
      </form>
    </div>
  );
}
