import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CDS Librairie Ésotérique',
    template: '%s | CDS Librairie Ésotérique',
  },
  description: 'Découvrez notre collection de livres numériques ésotériques. Magie, occultisme, spiritualité — des œuvres rares et précieuses pour éveiller votre conscience.',
  keywords: ['ésotérisme', 'livres numériques', 'occultisme', 'spiritualité', 'magie', 'kabbale', 'alchimie'],
  authors: [{ name: 'CDS Librairie Ésotérique' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'CDS Librairie Ésotérique',
    title: 'CDS Librairie Ésotérique',
    description: 'La bibliothèque numérique des arts ésotériques',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR as any} appearance={{
      variables: {
        colorPrimary: '#D4AF37',
        colorBackground: '#0D0D0F',
        colorText: '#E8E8E8',
        colorTextSecondary: '#8E8E95',
        colorInputBackground: '#1C1C1F',
        colorInputText: '#E8E8E8',
        borderRadius: '8px',
      },
      elements: {
        card: 'bg-onyx border border-ash/50 shadow-card',
        headerTitle: 'font-serif text-2xl text-gold-400',
        formButtonPrimary: 'btn-gold',
        footerActionLink: 'text-gold-400 hover:text-gold-300',
      },
    }}>
      <html lang="fr" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
