'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateBioAuteur } from '../../../../actions/admin-auteurs';
import type { BioAuteurState } from '../../../../actions/admin-auteurs';

const BIO_COURTE_MAX = 150;

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
        padding: '0.6rem 1.4rem',
        borderRadius: '4px',
        fontSize: '0.85rem',
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
  padding: '0.55rem 0.8rem',
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
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--accent-or-texte)',
  display: 'block',
  marginBottom: '0.3rem',
};

interface Props {
  auteurId: string;
  bioCourte: string | null;
  bio: string | null;
  photoUrl: string | null;
  slug: string | null;
  slugDefaut: string;
}

const initialState: BioAuteurState = {};

export default function BioPhotoForm({ auteurId, bioCourte, bio, photoUrl, slug, slugDefaut }: Props) {
  const [state, action] = useFormState(updateBioAuteur, initialState);
  const [bioCourteLen, setBioCourteLen] = useState((bioCourte ?? '').length);

  return (
    <form action={action}>
      <input type="hidden" name="auteur_id" value={auteurId} />

      {state.error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '0.7rem 1rem', borderRadius: '4px', fontSize: '0.82rem', fontFamily: 'var(--font-inter)', marginBottom: '1rem' }}>
          {state.error}
        </div>
      )}
      {state.success && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '0.7rem 1rem', borderRadius: '4px', fontSize: '0.82rem', fontFamily: 'var(--font-inter)', marginBottom: '1rem' }}>
          Bio &amp; photo enregistrées.
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Bio courte (max 150 caractères — pour les cartes catalogue)</label>
        <textarea
          name="bio_courte"
          defaultValue={bioCourte ?? ''}
          maxLength={BIO_COURTE_MAX}
          rows={2}
          onChange={(e) => setBioCourteLen(e.target.value.length)}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.7rem',
            color: bioCourteLen >= BIO_COURTE_MAX ? '#991B1B' : 'var(--accent-or-texte)',
            margin: '0.3rem 0 0',
            textAlign: 'right',
          }}
        >
          {bioCourteLen} / {BIO_COURTE_MAX} caractères
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>Bio complète</label>
        <textarea name="bio" defaultValue={bio ?? ''} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={labelStyle}>URL de la photo</label>
        <input type="text" name="photo_url" defaultValue={photoUrl ?? ''} style={inputStyle} placeholder="https://..." />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>Slug (URL publique /auteurs/…)</label>
        <input type="text" name="slug" defaultValue={slug ?? slugDefaut} style={inputStyle} />
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', color: 'var(--accent-or-texte)', margin: '0.3rem 0 0' }}>
          Pré-rempli depuis le nom de plume ou le nom. Modifiable — sera normalisé à l'enregistrement.
        </p>
      </div>

      <BoutonSoumettre />
    </form>
  );
}
