'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { envoyerContact, type ContactState } from '../actions/contact';
import VCENav from '../_components/VCENav';

const initialState: ContactState = {};

function ContactSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: '100%',
        padding: '0.9rem',
        background: pending ? '#C4B080' : '#B5A020',
        color: '#FAF3E0',
        border: 'none',
        borderRadius: '4px',
        fontFamily: 'var(--font-inter)',
        fontSize: '0.95rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? 'Envoi…' : 'Envoyer le message'}
    </button>
  );
}

const label: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-inter)',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#3D2B1A',
  marginBottom: '0.4rem',
};

const inputStyle: React.CSSProperties = {
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
};

export default function ContactPage() {
  const [state, action] = useFormState(envoyerContact, initialState);

  return (
    <>
      <VCENav />

      {/* En-tête */}
      <section
        style={{
          background: '#3D2B1A',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#B5A020',
            marginBottom: '0.75rem',
          }}
        >
          Nous écrire
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: '#F0E8C0',
            margin: 0,
          }}
        >
          Contactez-nous
        </h1>
      </section>

      <section style={{ padding: '4rem 2rem', background: '#FAF3E0' }}>
        <div
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr',
            gap: '4rem',
            alignItems: 'start',
          }}
        >
          {/* Infos */}
          <aside>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#3D2B1A',
                marginBottom: '1.5rem',
              }}
            >
              Une question ?
            </h2>

            {[
              {
                titre: 'Soumission de manuscrit',
                texte:
                  "Pour soumettre votre manuscrit, utilisez notre formulaire dédié — c'est plus rapide et notre équipe l'examinera en priorité.",
                lien: '/soumettre',
                labelLien: 'Formulaire de soumission →',
              },
              {
                titre: 'Tarifs & devis',
                texte:
                  'Consultez notre page services pour les grilles tarifaires complètes. Pour un devis personnalisé, écrivez-nous ici.',
                lien: '/services',
                labelLien: 'Voir les services →',
              },
              {
                titre: 'Espace auteur',
                texte:
                  'Si vous avez déjà un compte et un dossier en cours, connectez-vous directement à votre espace.',
                lien: '/espace-auteur',
                labelLien: 'Mon espace auteur →',
              },
            ].map((item) => (
              <div
                key={item.titre}
                style={{
                  marginBottom: '1.5rem',
                  paddingLeft: '1rem',
                  borderLeft: '2px solid #E8DFB0',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#3D2B1A',
                    marginBottom: '0.4rem',
                  }}
                >
                  {item.titre}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.82rem',
                    color: '#6B4C2F',
                    lineHeight: 1.6,
                    marginBottom: '0.5rem',
                  }}
                >
                  {item.texte}
                </p>
                <Link
                  href={item.lien}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8rem',
                    color: '#8A7818',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  {item.labelLien}
                </Link>
              </div>
            ))}

            <div
              style={{
                background: '#FFFEF5',
                border: '1px solid #E8DFB0',
                borderRadius: '6px',
                padding: '1rem',
                marginTop: '2rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.8rem',
                  color: '#6B4C2F',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Délai de réponse habituel : <strong>24 à 48h ouvrées.</strong>
              </p>
            </div>
          </aside>

          {/* Formulaire */}
          <div>
            {state.success ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  background: '#FFFEF5',
                  border: '1px solid #E8DFB0',
                  borderRadius: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    color: '#B5A020',
                  }}
                >
                  ✦
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#3D2B1A',
                    marginBottom: '0.75rem',
                  }}
                >
                  Message envoyé !
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    color: '#6B4C2F',
                    lineHeight: 1.7,
                  }}
                >
                  Nous avons bien reçu votre message et vous répondrons sous 24 à 48h ouvrées.
                </p>
              </div>
            ) : (
              <form action={action}>
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

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <label style={label}>
                      Prénom <span style={{ color: '#B5A020' }}>*</span>
                    </label>
                    <input name="prenom" required style={inputStyle} placeholder="Marie" />
                  </div>
                  <div>
                    <label style={label}>
                      Nom <span style={{ color: '#B5A020' }}>*</span>
                    </label>
                    <input name="nom" required style={inputStyle} placeholder="Dupont" />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={label}>
                    Email <span style={{ color: '#B5A020' }}>*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    style={inputStyle}
                    placeholder="vous@email.com"
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={label}>
                    Sujet <span style={{ color: '#B5A020' }}>*</span>
                  </label>
                  <select name="sujet" required style={inputStyle}>
                    <option value="">— Choisir —</option>
                    <option>Question sur un service</option>
                    <option>Question sur un tarif</option>
                    <option>Délais et disponibilités</option>
                    <option>Suivi d&apos;un dossier existant</option>
                    <option>Partenariat ou collaboration</option>
                    <option>Autre</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={label}>
                    Message <span style={{ color: '#B5A020' }}>*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      fontFamily: 'var(--font-inter)',
                    }}
                    placeholder="Votre message…"
                  />
                </div>

                <ContactSubmitButton />
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
