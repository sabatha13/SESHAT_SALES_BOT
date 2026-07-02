'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { creerLivre, modifierLivre } from '../../../actions/admin-livres';
import type { LivreState } from '../../../actions/admin-livres';

function BoutonSoumettre({ mode }: { mode: 'create' | 'edit' }) {
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
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Enregistrement...' : mode === 'create' ? 'Créer le livre' : 'Enregistrer'}
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

interface Auteur {
  id: string;
  prenom: string;
  nom: string;
  nom_plume: string | null;
}

interface Livre {
  id: string;
  titre: string;
  sous_titre: string | null;
  description: string;
  resume_court: string;
  auteur_id: string;
  isbn: string | null;
  lien_amazon: string | null;
  couverture_url: string | null;
  nb_pages: number | null;
  annee_publication: number | null;
  langue: string | null;
  prix_cents: number;
  is_published: boolean | null;
  is_featured: boolean | null;
}

interface Props {
  mode: 'create' | 'edit';
  auteurs: Auteur[];
  livre?: Livre;
}

const initialState: LivreState = {};

export default function LivreForm({ mode, auteurs, livre }: Props) {
  const action = mode === 'create' ? creerLivre : modifierLivre;
  const [state, formAction] = useFormState(action, initialState);

  const prixDollars =
    livre && livre.prix_cents ? (livre.prix_cents / 100).toFixed(2) : '';

  function nomAuteur(a: Auteur): string {
    return a.nom_plume ? `${a.nom_plume} (${a.prenom} ${a.nom})` : `${a.prenom} ${a.nom}`;
  }

  return (
    <form action={formAction}>
      {mode === 'edit' && livre && <input type="hidden" name="livre_id" value={livre.id} />}

      {state.error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.875rem', fontFamily: 'var(--font-inter)', marginBottom: '1rem' }}>
          {state.error}
        </div>
      )}
      {state.success && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.875rem', fontFamily: 'var(--font-inter)', marginBottom: '1rem' }}>
          Livre enregistré avec succès.
        </div>
      )}
      {state.warning && (
        <div style={{ background: '#FEF3C7', color: '#92400E', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.875rem', fontFamily: 'var(--font-inter)', marginBottom: '1rem' }}>
          {state.warning}
        </div>
      )}

      <div style={fieldStyle}>
        <label style={labelStyle}>Titre *</label>
        <input type="text" name="titre" defaultValue={livre?.titre ?? ''} required style={inputStyle} />
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--accent-or-texte)', margin: '0.3rem 0 0' }}>
          Le slug URL sera généré automatiquement depuis le titre.
        </p>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Sous-titre</label>
        <input type="text" name="sous_titre" defaultValue={livre?.sous_titre ?? ''} style={inputStyle} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Auteur *</label>
        <select name="auteur_id" defaultValue={livre?.auteur_id ?? ''} required style={inputStyle}>
          <option value="" disabled>
            — Sélectionner un auteur —
          </option>
          {auteurs.map((a) => (
            <option key={a.id} value={a.id}>
              {nomAuteur(a)}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Résumé court *</label>
        <textarea name="resume_court" defaultValue={livre?.resume_court ?? ''} rows={2} required style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Description complète *</label>
        <textarea name="description" defaultValue={livre?.description ?? ''} rows={5} required style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>ISBN</label>
          <input type="text" name="isbn" defaultValue={livre?.isbn ?? ''} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Prix (USD)</label>
          <input type="number" name="prix_dollars" step="0.01" min="0" defaultValue={prixDollars} style={inputStyle} placeholder="0.00" />
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Lien Amazon</label>
        <input type="text" name="lien_amazon" defaultValue={livre?.lien_amazon ?? ''} style={inputStyle} placeholder="https://amazon.com/..." />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Couverture (JPG, PNG, WebP — max 2 Mo)</label>

        {/* Aperçu de la couverture actuelle */}
        {livre?.couverture_url && (
          <img
            src={livre.couverture_url}
            alt="Couverture actuelle"
            style={{
              width: '128px',
              height: '176px',
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid var(--carte-bordure)',
              display: 'block',
              marginBottom: '0.6rem',
            }}
          />
        )}

        {/* Fallback : conserve l'URL existante si aucun fichier n'est envoyé */}
        <input type="hidden" name="couverture_url_actuelle" value={livre?.couverture_url ?? ''} />

        <input
          type="file"
          name="couverture_file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte)' }}
        />
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--accent-or-texte)', margin: '0.3rem 0 0' }}>
          Laisse vide pour conserver la couverture actuelle.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Nb pages</label>
          <input type="number" name="nb_pages" min="0" defaultValue={livre?.nb_pages ?? ''} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Année</label>
          <input type="number" name="annee_publication" defaultValue={livre?.annee_publication ?? ''} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Langue</label>
          <select name="langue" defaultValue={livre?.langue ?? 'fr'} style={inputStyle}>
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="es">Espagnol</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0 1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" name="is_published" defaultChecked={livre?.is_published ?? false} style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent-or)' }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte)' }}>Publié</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input type="checkbox" name="is_featured" defaultChecked={livre?.is_featured ?? false} style={{ width: '1rem', height: '1rem', accentColor: 'var(--accent-or)' }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte)' }}>Mis en avant</span>
        </label>
      </div>

      <BoutonSoumettre mode={mode} />
    </form>
  );
}
