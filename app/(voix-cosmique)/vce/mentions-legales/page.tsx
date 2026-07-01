import type { Metadata } from 'next';
import VCENav from '../_components/VCENav';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de Voix Cosmique Éditions.',
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

export default function MentionsLegalesPage() {
  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3.5rem 2rem 5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--brun)', margin: '0 0 1rem' }}>
            Mentions légales
          </h1>

          <h2 style={titreStyle}>Éditeur</h2>
          <p style={texteStyle}>Voix Cosmique Éditions</p>

          <h2 style={titreStyle}>Hébergeur</h2>
          <p style={texteStyle}>
            Vercel Inc.
            <br />
            340 Pine Street, Suite 700
            <br />
            San Francisco, CA 94104
          </p>

          <h2 style={titreStyle}>Contact</h2>
          <p style={texteStyle}>
            <a href="mailto:voixcosmique@cdslibrairie.com" style={{ color: 'var(--accent-or-texte)', fontWeight: 500 }}>
              voixcosmique@cdslibrairie.com
            </a>
          </p>

          <h2 style={titreStyle}>Propriété intellectuelle</h2>
          <p style={texteStyle}>
            L'ensemble des contenus présents sur ce site (textes, visuels, éléments graphiques) est
            &copy; Voix Cosmique Éditions. Toute reproduction, représentation ou diffusion, totale ou
            partielle, sans autorisation écrite préalable, est interdite.
          </p>
        </div>
      </main>
    </>
  );
}
