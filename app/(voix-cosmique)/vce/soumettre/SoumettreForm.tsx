'use client';

import { useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { soumettreManuScrit, type SoumettreManuScritState } from '../actions/soumettre';

interface Service {
  id: string;
  nom: string;
  type_tarif: string;
  prix_fixe: number | null;
  prix_0_100: number | null;
  prix_100_200: number | null;
  prix_200_300: number | null;
  prix_300_400: number | null;
}

interface Package {
  id: string;
  nom: string;
  prix: number;
  description: string | null;
}

interface Props {
  services: Service[];
  packages: Package[];
  preselectedService?: string;
  preselectedPackage?: string;
}

const GENRES = [
  'Roman',
  'Nouvelles / Récits courts',
  'Essai',
  'Mémoires / Biographie',
  'Ouvrage spirituel',
  'Développement personnel',
  'Ghostwriting',
  'Autre',
];

const SOURCES = [
  'Instagram',
  'Facebook',
  'WhatsApp',
  'Recommandation',
  'Google',
  'Autre',
];

const initialState: SoumettreManuScritState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        padding: '1rem',
        background: pending ? '#C4B080' : '#B5A020',
        color: '#FAF3E0',
        border: 'none',
        borderRadius: '4px',
        fontFamily: 'var(--font-inter)',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? 'Envoi en cours…' : 'Soumettre mon manuscrit'}
    </button>
  );
}

const label = (style?: React.CSSProperties): React.CSSProperties => ({
  display: 'block',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#3D2B1A',
  marginBottom: '0.4rem',
  ...style,
});

const input = (style?: React.CSSProperties): React.CSSProperties => ({
  width: '100%',
  padding: '0.65rem 0.875rem',
  background: '#FFFEF5',
  border: '1px solid #D4C890',
  borderRadius: '4px',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.9rem',
  color: '#1C1208',
  outline: 'none',
  boxSizing: 'border-box',
  ...style,
});

export default function SoumettreForm({
  services,
  packages,
  preselectedService,
  preselectedPackage,
}: Props) {
  const [state, action] = useFormState(soumettreManuScrit, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} encType="multipart/form-data">
      {state.error && (
        <div
          style={{
            background: '#FFF0F0',
            border: '1px solid #E8A0A0',
            borderRadius: '6px',
            padding: '0.875rem 1rem',
            marginBottom: '1.5rem',
            fontFamily: 'var(--font-inter)',
            fontSize: '0.875rem',
            color: '#8B1A1A',
          }}
        >
          {state.error}
        </div>
      )}

      {/* Identité */}
      <fieldset
        style={{
          border: 'none',
          padding: 0,
          margin: '0 0 2rem',
        }}
      >
        <legend
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#8A7818',
            marginBottom: '1rem',
            width: '100%',
            borderBottom: '1px solid #E8DFB0',
            paddingBottom: '0.5rem',
          }}
        >
          Vos coordonnées
        </legend>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <label style={label()}>
              Prénom <span style={{ color: '#B5A020' }}>*</span>
            </label>
            <input name="prenom" required style={input()} placeholder="Marie" />
          </div>
          <div>
            <label style={label()}>
              Nom <span style={{ color: '#B5A020' }}>*</span>
            </label>
            <input name="nom" required style={input()} placeholder="Dupont" />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={label()}>
            Email <span style={{ color: '#B5A020' }}>*</span>
          </label>
          <input
            name="email"
            type="email"
            required
            style={input()}
            placeholder="vous@email.com"
          />
        </div>

        <div>
          <label style={label()}>
            WhatsApp{' '}
            <span style={{ fontWeight: 400, color: '#8A7818', fontSize: '0.8rem' }}>
              (optionnel — pour le suivi rapide)
            </span>
          </label>
          <input
            name="whatsapp"
            type="tel"
            style={input()}
            placeholder="+1 555 123 4567"
          />
        </div>
      </fieldset>

      {/* Manuscrit */}
      <fieldset
        style={{
          border: 'none',
          padding: 0,
          margin: '0 0 2rem',
        }}
      >
        <legend
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#8A7818',
            marginBottom: '1rem',
            width: '100%',
            borderBottom: '1px solid #E8DFB0',
            paddingBottom: '0.5rem',
          }}
        >
          Votre manuscrit
        </legend>

        <div style={{ marginBottom: '1rem' }}>
          <label style={label()}>
            Titre du manuscrit <span style={{ color: '#B5A020' }}>*</span>
          </label>
          <input
            name="titre"
            required
            style={input()}
            placeholder="Le titre de votre œuvre"
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <label style={label()}>
              Genre <span style={{ color: '#B5A020' }}>*</span>
            </label>
            <select name="genre" required style={input()}>
              <option value="">— Choisir —</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label()}>Nombre de pages</label>
            <input
              name="nb_pages"
              type="number"
              min="1"
              max="9999"
              style={input()}
              placeholder="ex: 180"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={label()}>
            Synopsis <span style={{ color: '#B5A020' }}>*</span>
          </label>
          <textarea
            name="synopsis"
            required
            rows={5}
            style={{
              ...input(),
              resize: 'vertical',
              fontFamily: 'var(--font-inter)',
            }}
            placeholder="Résumez votre manuscrit en quelques lignes : thème, personnages, message central..."
          />
        </div>

        <div>
          <label style={label()}>
            Fichier manuscrit{' '}
            <span style={{ fontWeight: 400, color: '#8A7818', fontSize: '0.8rem' }}>
              (.pdf, .doc, .docx — optionnel)
            </span>
          </label>
          <input
            name="fichier"
            type="file"
            accept=".pdf,.doc,.docx"
            style={{
              ...input(),
              padding: '0.5rem',
              cursor: 'pointer',
            }}
          />
        </div>
      </fieldset>

      {/* Service / Package */}
      <fieldset
        style={{
          border: 'none',
          padding: 0,
          margin: '0 0 2rem',
        }}
      >
        <legend
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#8A7818',
            marginBottom: '1rem',
            width: '100%',
            borderBottom: '1px solid #E8DFB0',
            paddingBottom: '0.5rem',
          }}
        >
          Service souhaité <span style={{ color: '#B5A020' }}>*</span>
        </legend>

        {/* Services individuels */}
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.8rem',
            color: '#8A7818',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}
        >
          Services à la carte
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {services.map((svc) => {
            const prix =
              svc.type_tarif === 'fixe'
                ? `$${svc.prix_fixe?.toFixed(0)}`
                : `$${Math.min(
                    svc.prix_0_100 ?? 9999,
                    svc.prix_100_200 ?? 9999,
                    svc.prix_200_300 ?? 9999,
                    svc.prix_300_400 ?? 9999
                  )}+`;
            return (
              <label
                key={svc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: '#FFFEF5',
                  border: '1px solid #E8DFB0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="service_id"
                  value={svc.id}
                  defaultChecked={preselectedService === svc.id}
                  style={{ accentColor: '#B5A020', width: '16px', height: '16px', flexShrink: 0 }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: '#3D2B1A',
                    flex: 1,
                  }}
                >
                  {svc.nom}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: '#B5A020',
                    flexShrink: 0,
                  }}
                >
                  {prix}
                </span>
              </label>
            );
          })}
        </div>

        {/* Packages */}
        {packages.length > 0 && (
          <>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#8A7818',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              Packages complets
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {packages.map((pkg) => (
                <label
                  key={pkg.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: '#FAF3E0',
                    border: '1px solid #D4C890',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="package_id"
                    value={pkg.id}
                    defaultChecked={preselectedPackage === pkg.id}
                    style={{ accentColor: '#B5A020', width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#3D2B1A',
                        display: 'block',
                      }}
                    >
                      {pkg.nom}
                    </span>
                    {pkg.description && (
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.78rem',
                          color: '#6B4C2F',
                        }}
                      >
                        {pkg.description}
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#B5A020',
                      flexShrink: 0,
                    }}
                  >
                    ${pkg.prix.toFixed(0)}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </fieldset>

      {/* Comment avez-vous connu VCE */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={label()}>Comment avez-vous connu Voix Cosmique Éditions ?</label>
        <select name="source" style={input()}>
          <option value="">— Choisir (optionnel) —</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Note */}
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          color: '#8A7818',
          background: '#F0E8C0',
          padding: '0.75rem 1rem',
          borderRadius: '4px',
          marginBottom: '1.5rem',
          lineHeight: 1.6,
        }}
      >
        Votre soumission est <strong>gratuite et sans engagement</strong>. Notre équipe vous
        contactera sous 72h pour discuter de votre projet. Un acompte de 50 % sera demandé
        uniquement si vous confirmez la commande.
      </p>

      <SubmitButton />
    </form>
  );
}
