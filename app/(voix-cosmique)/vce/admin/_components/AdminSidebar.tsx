'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/vce/admin', label: 'Tableau de bord' },
  { href: '/vce/admin/commandes', label: 'Commandes' },
  { href: '/vce/admin/auteurs', label: 'Auteurs' },
  { href: '/vce/admin/messagerie', label: 'Messagerie' },
  { href: '/vce/admin/fichiers', label: 'Fichiers' },
  { href: '/vce/admin/paiements', label: 'Paiements' },
  { href: '/vce/admin/services', label: 'Services & Tarifs' },
  { href: '/vce/admin/avis', label: 'Avis' },
  { href: '/vce/admin/notifications', label: 'Notifications' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/vce/admin') return pathname === '/vce/admin';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside
      style={{
        background: 'var(--bandeau-fond)',
        width: '240px',
        flexShrink: 0,
        minHeight: '100vh',
        padding: '2rem 0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--bandeau-texte)',
            margin: '0 0 0.35rem',
            opacity: 0.7,
          }}
        >
          Voix Cosmique
        </p>
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'var(--bandeau-texte)',
            margin: 0,
          }}
        >
          Administration
        </p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                color: active ? 'var(--bandeau-fond)' : 'var(--bandeau-texte)',
                background: active ? 'var(--accent-or)' : 'transparent',
                textDecoration: 'none',
                padding: '0.75rem 1.5rem',
                fontWeight: active ? 600 : 400,
                borderLeft: active ? '3px solid var(--bandeau-texte)' : '3px solid transparent',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(229,167,0,0.2)' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.8rem',
            color: 'var(--bandeau-texte)',
            textDecoration: 'none',
            opacity: 0.8,
          }}
        >
          ← Retour au site
        </Link>
      </div>
    </aside>
  );
}
