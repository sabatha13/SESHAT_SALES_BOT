import type { Metadata } from 'next';
import Link from 'next/link';
import VCENav from '../../_components/VCENav';

export const metadata: Metadata = {
  title: 'Manuscrit reçu — Merci !',
};

interface PageProps {
  searchParams: { ref?: string };
}

export default function SoumettreConfirmationPage({ searchParams }: PageProps) {
  const ref = searchParams.ref;

  return (
    <>
      <VCENav />

      <section
        style={{
          minHeight: 'calc(100vh - 72px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          background: '#FAF3E0',
        }}
      >
        <div style={{ maxWidth: '540px', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: '#F0E8C0',
              border: '2px solid #B5A020',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 2rem',
              fontSize: '1.75rem',
            }}
          >
            ✦
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: '#3D2B1A',
              marginBottom: '1rem',
            }}
          >
            Votre manuscrit a été reçu
          </h1>

          {ref && (
            <div
              style={{
                background: '#F0E8C0',
                border: '1px solid #D4C890',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                display: 'inline-block',
                marginBottom: '1.5rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.8rem',
                  color: '#8A7818',
                  margin: '0 0 0.2rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Numéro de dossier
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#3D2B1A',
                  margin: 0,
                  letterSpacing: '0.1em',
                }}
              >
                #{ref}
              </p>
            </div>
          )}

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              color: '#6B4C2F',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}
          >
            Un email de confirmation vous a été envoyé. Notre équipe éditoriale va examiner
            votre manuscrit et vous contactera sous <strong>48 à 72 heures</strong> pour
            convenir d&apos;un appel de briefing.
          </p>

          <div
            style={{
              background: '#FFFEF5',
              border: '1px solid #E8DFB0',
              borderRadius: '8px',
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              textAlign: 'left',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#3D2B1A',
                marginBottom: '0.5rem',
              }}
            >
              Et maintenant ?
            </p>
            <ul
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                color: '#6B4C2F',
                lineHeight: 1.8,
                margin: 0,
                paddingLeft: '1.25rem',
              }}
            >
              <li>Vérifiez votre boîte email (y compris les spams)</li>
              <li>Notez votre numéro de dossier</li>
              <li>Attendez notre contact — nous vous appellerons ou vous écrirons</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-inter)',
                border: '1px solid #B5A020',
                color: '#8A7818',
                padding: '0.7rem 1.5rem',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              ← Retour à l&apos;accueil
            </Link>
            <Link
              href="/espace-auteur"
              style={{
                fontFamily: 'var(--font-inter)',
                background: '#B5A020',
                color: '#FAF3E0',
                padding: '0.7rem 1.5rem',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Accéder à mon espace auteur
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
