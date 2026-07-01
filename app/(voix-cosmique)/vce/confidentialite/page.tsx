import type { Metadata } from 'next';
import VCENav from '../_components/VCENav';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et protection des données de Voix Cosmique Éditions.',
};

const titreStyle: React.CSSProperties = {
  fontFamily: 'var(--font-playfair)',
  fontSize: '1.2rem',
  fontWeight: 600,
  color: 'var(--brun)',
  margin: '2rem 0 0.5rem',
};

const texteStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '0.92rem',
  color: 'var(--texte)',
  lineHeight: 1.7,
  margin: 0,
};

export default function ConfidentialitePage() {
  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3.5rem 2rem 5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--brun)', margin: '0 0 1rem' }}>
            Politique de confidentialité
          </h1>

          <h2 style={titreStyle}>Données collectées</h2>
          <p style={texteStyle}>
            Nous collectons uniquement les données nécessaires au traitement de votre demande&nbsp;:
            nom, adresse email et informations relatives à votre manuscrit.
          </p>

          <h2 style={titreStyle}>Finalité</h2>
          <p style={texteStyle}>
            Ces données sont utilisées exclusivement pour le traitement de vos demandes éditoriales et
            le suivi de votre projet.
          </p>

          <h2 style={titreStyle}>Conservation</h2>
          <p style={texteStyle}>
            Vos données sont conservées pendant toute la durée de la relation contractuelle, puis
            pendant une durée de 3 ans à compter de la fin de celle-ci.
          </p>

          <h2 style={titreStyle}>Vos droits</h2>
          <p style={texteStyle}>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour
            l'exercer, écrivez-nous à{' '}
            <a href="mailto:voixcosmique@cdslibrairie.com" style={{ color: 'var(--accent-or-texte)', fontWeight: 500 }}>
              voixcosmique@cdslibrairie.com
            </a>
            .
          </p>

          <h2 style={titreStyle}>Partage des données</h2>
          <p style={texteStyle}>
            Nous ne vendons ni ne cédons vos données personnelles à des tiers.
          </p>
        </div>
      </main>
    </>
  );
}
