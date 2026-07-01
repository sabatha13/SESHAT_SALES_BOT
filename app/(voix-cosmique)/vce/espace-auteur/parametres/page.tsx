export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { getVceAuteur } from '@/lib/vce/session';
import VCENav from '../../_components/VCENav';
import { vceLogout } from '../../actions/auth';
import Link from 'next/link';
import FormInfosAuteur from './_components/FormInfosAuteur';
import FormMotDePasse from './_components/FormMotDePasse';
import FormNotifications from './_components/FormNotifications';

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/espace-auteur', label: 'Tableau de bord' },
  { href: '/espace-auteur/commandes', label: 'Mes commandes' },
  { href: '/espace-auteur/fichiers', label: 'Mes fichiers' },
  { href: '/espace-auteur/messagerie', label: 'Messagerie' },
  { href: '/espace-auteur/paiements', label: 'Paiements' },
  { href: '/espace-auteur/parametres', label: 'Paramètres' },
];

const ACTIVE_HREF = '/espace-auteur/parametres';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ParametresPage() {
  const auteurBase = await getVceAuteur();
  const supabase = createServerClient();

  const { data: auteur } = await supabase
    .from('vce_auteurs')
    .select(
      'id, prenom, nom, nom_plume, bio, site_web, nationalite, langue_principale, notif_email, notif_whatsapp, notif_telegram',
    )
    .eq('id', auteurBase.id)
    .single();

  if (!auteur) return null;

  const sectionCardStyle: React.CSSProperties = {
    background: 'var(--carte)',
    border: '1px solid var(--carte-bordure)',
    borderRadius: '8px',
    padding: '1.5rem 1.75rem',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-playfair)',
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--brun)',
    margin: '0 0 1rem',
  };

  return (
    <>
      <VCENav />

      {/* Sub-nav */}
      <div style={{ background: 'var(--bandeau-fond)', borderBottom: '1px solid var(--or-pale)' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            overflowX: 'auto',
          }}
        >
          <nav style={{ display: 'flex' }}>
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === ACTIVE_HREF;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8rem',
                    color: isActive ? 'var(--bandeau-texte)' : 'var(--or)',
                    textDecoration: 'none',
                    padding: '0.875rem 1rem',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                    borderBottom: isActive ? '2px solid var(--accent-or)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action={vceLogout}>
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: 'var(--or)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                padding: '0.875rem 0 0.875rem 1rem',
              }}
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>

      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 120px)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 2rem' }}>

          {/* En-tête */}
          <div style={{ marginBottom: '2rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--or)',
                margin: '0 0 0.5rem',
              }}
            >
              Espace Auteur
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                fontWeight: 700,
                color: 'var(--brun)',
                margin: 0,
              }}
            >
              Paramètres
            </h1>
          </div>

          {/* ── Section 1 — Informations personnelles ─────────────────────────── */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={sectionTitleStyle}>Informations personnelles</h2>
            <div style={sectionCardStyle}>
              <FormInfosAuteur
                auteur={{
                  prenom: auteur.prenom,
                  nom: auteur.nom,
                  nom_plume: auteur.nom_plume,
                  bio: auteur.bio,
                  site_web: auteur.site_web,
                  nationalite: auteur.nationalite,
                  langue_principale: auteur.langue_principale,
                }}
              />
            </div>
          </section>

          {/* ── Section 2 — Changer le mot de passe ──────────────────────────── */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={sectionTitleStyle}>Changer le mot de passe</h2>
            <div style={sectionCardStyle}>
              <FormMotDePasse />
            </div>
          </section>

          {/* ── Section 3 — Préférences de notification ───────────────────────── */}
          <section>
            <h2 style={sectionTitleStyle}>Préférences de notification</h2>
            <div style={sectionCardStyle}>
              <FormNotifications
                auteur={{
                  notif_email: auteur.notif_email,
                  notif_whatsapp: auteur.notif_whatsapp,
                  notif_telegram: auteur.notif_telegram,
                }}
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
