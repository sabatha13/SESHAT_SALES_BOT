'use client';

import { useState } from 'react';

interface Props {
  commandeId: string;
  montantTotal: number;
}

export default function BoutonPaiementAcompte({ commandeId, montantTotal }: Props) {
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const acompte = (montantTotal * 0.5).toFixed(0);

  async function handlePayer() {
    setLoading(true);
    setErreur(null);
    try {
      const res = await fetch('/api/vce/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commande_id: commandeId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setErreur(data.error ?? 'Une erreur est survenue. Veuillez réessayer.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setErreur('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePayer}
        disabled={loading}
        style={{
          fontFamily: 'var(--font-inter)',
          background: loading ? 'rgba(229,167,0,0.55)' : 'var(--accent-or)',
          color: 'var(--n)',
          border: 'none',
          borderRadius: '4px',
          padding: '0.75rem 1.75rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Redirection…' : `Payer l'acompte — ${acompte} USD`}
      </button>
      {erreur && (
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.8rem',
            color: '#8B1A1A',
            marginTop: '0.5rem',
            background: '#FFF0F0',
            border: '1px solid #E8A0A0',
            borderRadius: '4px',
            padding: '0.5rem 0.75rem',
          }}
        >
          {erreur}
        </p>
      )}
    </div>
  );
}
