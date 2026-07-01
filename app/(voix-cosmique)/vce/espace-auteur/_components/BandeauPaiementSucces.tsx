'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  commandeId: string;
}

export default function BandeauPaiementSucces({ commandeId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/espace-auteur/commandes/${commandeId}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, [commandeId, router]);

  return (
    <div
      style={{
        background: 'var(--bandeau-fond)',
        color: 'var(--bandeau-texte)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.875rem',
          fontWeight: 500,
          margin: 0,
          letterSpacing: '0.02em',
        }}
      >
        ✦ Paiement confirmé — votre projet est en cours de démarrage.
      </p>
      <Link
        href={`/espace-auteur/commandes/${commandeId}`}
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--bandeau-texte)',
          textDecoration: 'underline',
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
        }}
      >
        Voir ma commande →
      </Link>
    </div>
  );
}
