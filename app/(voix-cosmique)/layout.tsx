import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Voix Cosmique Éditions',
    template: '%s | Voix Cosmique Éditions',
  },
  description: 'Maison d\'édition indépendante dédiée à la littérature de l\'éveil, de la spiritualité et des arts cosmiques.',
};

export default function VoixCosmiqueLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${playfair.variable} ${inter.variable}`}
      style={
        {
          '--or': '#B5A020',
          '--orl': '#8A7818',
          '--n': '#FEF8E8',
          '--or-pale': '#F0E8C0',
          '--brun': '#3D2B1A',
          '--brun-clair': '#6B4C2F',
          '--texte': '#000000',
          '--carte': '#FFFFFF',
          '--texte-carte': '#000000',
          '--texte-carte-secondaire': '#2E2E2E',
          '--carte-bordure': '#E5A700',
          '--accent-or': '#E5A700',
          '--accent-or-texte': '#7A6A10',
          '--bandeau-fond': '#0A0800',
          '--bandeau-texte': '#E5A700',
          minHeight: '100vh',
          background: 'var(--n)',
          color: 'var(--texte)',
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
