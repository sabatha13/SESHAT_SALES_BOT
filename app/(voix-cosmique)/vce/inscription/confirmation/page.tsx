import Link from 'next/link';

export default function InscriptionConfirmationPage() {
  return (
    <>
      <style>{`.vce-confirm-link:hover { color: #B5A020; }`}</style>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--n, #FAF3E0)',
        }}
      >
      <div
        style={{
          background: '#fff',
          border: '1px solid #E8DFB0',
          borderRadius: '1rem',
          padding: '2.5rem',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(181,160,32,0.10)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✉️</div>
        <h1
          style={{
            fontFamily: 'var(--font-playfair, serif)',
            fontSize: '1.5rem',
            color: 'var(--orl, #8A7818)',
            marginBottom: '1rem',
          }}
        >
          Vérifiez votre email
        </h1>
        <p style={{ color: 'var(--brun, #3D2B1A)', lineHeight: 1.6 }}>
          Un lien de confirmation vous a été envoyé. Cliquez dessus pour activer
          votre compte auteur Voix Cosmique Éditions.
        </p>
        <p style={{ color: 'var(--brun-clair, #6B4C2F)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Vous pouvez fermer cette page.
        </p>
        <Link
          href="/connexion"
          className="vce-confirm-link"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            color: '#8A7818',
            fontFamily: 'var(--font-inter, sans-serif)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            borderBottom: '1px solid currentColor',
            paddingBottom: '1px',
            transition: 'color 0.15s',
          }}
        >
          Me connecter →
        </Link>
      </div>
    </div>
    </>
  );
}
