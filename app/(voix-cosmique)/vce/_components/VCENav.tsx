import Link from 'next/link';
import Image from 'next/image';

export default function VCENav() {
  return (
    <header
      style={{
        background: '#FAF3E0',
        borderBottom: '1px solid #E8DFB0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        <Link href="/" style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Image
            src="/images/vce/logo.png"
            alt="Voix Cosmique Éditions"
            width={2000}
            height={600}
            priority
            style={{ height: '48px', width: 'auto' }}
          />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {[
            { href: '/services', label: 'Services' },
            { href: '/soumettre', label: 'Soumettre' },
            { href: '/contact', label: 'Contact' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#3D2B1A',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/espace-auteur"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.875rem',
              color: '#FAF3E0',
              background: '#B5A020',
              padding: '0.5rem 1.25rem',
              borderRadius: '4px',
              textDecoration: 'none',
              letterSpacing: '0.02em',
              fontWeight: 500,
            }}
          >
            Espace Auteur
          </Link>
        </nav>
      </div>
    </header>
  );
}
