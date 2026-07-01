import type { Metadata } from 'next';
import VCENav from '../_components/VCENav';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'Conditions générales de vente de Voix Cosmique Éditions.',
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

export default function CGVPage() {
  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3.5rem 2rem 5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--brun)', margin: '0 0 1rem' }}>
            Conditions générales de vente
          </h1>

          <h2 style={titreStyle}>Modalités de paiement</h2>
          <p style={texteStyle}>
            Un acompte de 50&nbsp;% est exigé à la commande. Le solde de 50&nbsp;% est réglé à la
            livraison des travaux.
          </p>

          <h2 style={titreStyle}>Délai de réponse</h2>
          <p style={texteStyle}>
            Nous nous engageons à répondre à toute soumission dans un délai de 72&nbsp;heures
            ouvrées.
          </p>

          <h2 style={titreStyle}>Révisions</h2>
          <p style={texteStyle}>
            Des révisions sont incluses dans chaque service, dans les conditions précisées lors de
            l'établissement du devis.
          </p>

          <h2 style={titreStyle}>Droits d'auteur</h2>
          <p style={texteStyle}>
            L'auteur conserve <strong>100&nbsp;%</strong> de ses droits d'auteur sur son œuvre.
          </p>

          <h2 style={titreStyle}>Annulation</h2>
          <p style={texteStyle}>
            En cas d'annulation avant le commencement des travaux, l'acompte versé est intégralement
            remboursé.
          </p>

          <h2 style={titreStyle}>Litiges</h2>
          <p style={texteStyle}>
            Les présentes conditions sont soumises au droit français. En cas de litige, la juridiction
            compétente est déterminée selon le domicile du client.
          </p>
        </div>
      </main>
    </>
  );
}
