import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cdslibrairie.com'),
  title: {
    default: "CDS Librairie Ésotérique",
    template: "%s | CDS Librairie Ésotérique",
  },
  description:
    "Découvrez notre collection de livres numériques ésotériques. Magie, occultisme, spiritualité — des œuvres rares et précieuses pour éveiller votre conscience.",
  keywords: [
    "ésotérisme",
    "livres numériques",
    "occultisme",
    "spiritualité",
    "magie",
    "kabbale",
    "alchimie",
    "Le Comte de Sabatha",
    "livres ésotériques",
    "magie noire",
    "hermétisme",
    "vodou haïtien",
    "numérologie",
    "tarot",
    "rosicrucianisme",
    "franc-maçonnerie",
    "gnose",
    "chamanisme",
    "rituels magiques",
    "spiritualité haïtienne",
  ],
  authors: [{ name: "Le Comte de Sabatha" }],
  alternates: {
    canonical: 'https://www.cdslibrairie.com',
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: 'https://www.cdslibrairie.com',
    siteName: "CDS Librairie Ésotérique",
    title: "CDS Librairie Ésotérique",
    description: "La bibliothèque numérique des arts ésotériques",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CDS Librairie Ésotérique — Le Comte de Sabatha',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "CDS Librairie Ésotérique",
    description: "La bibliothèque numérique des arts ésotériques",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#D4AF37",
          colorBackground: "#0D0D0F",
          colorText: "#E8E8E8",
          colorTextSecondary: "#8E8E95",
          colorInputBackground: "#1C1C1F",
          colorInputText: "#E8E8E8",
          borderRadius: "8px",
        },
        elements: {
          card: "bg-onyx border border-ash/50 shadow-card",
          headerTitle: "font-serif text-2xl text-gold-400",
          formButtonPrimary: "btn-gold",
          footerActionLink: "text-gold-400 hover:text-gold-300",
        },
      }}
    >
      <html lang="fr" suppressHydrationWarning>
        <body>{children}<Analytics /></body>
      </html>
    </ClerkProvider>
  );
}
