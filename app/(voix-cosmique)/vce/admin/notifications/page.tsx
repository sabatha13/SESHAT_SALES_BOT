export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';

interface Abonne {
  id: string;
  email: string;
  prenom: string | null;
  source: string | null;
  is_active: boolean | null;
  date_abonnement: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function AdminNotificationsPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const { data: abonnesData } = await supabase
    .from('vce_newsletter_abonnes')
    .select('id, email, prenom, source, is_active, date_abonnement')
    .order('date_abonnement', { ascending: false });

  const abonnes = (abonnesData ?? []) as Abonne[];
  const actifs = abonnes.filter((a) => a.is_active !== false).length;

  return (
    <div style={{ padding: '2.5rem', maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>
          Notifications
        </h1>
        {abonnes.length > 0 && (
          <a
            href="/api/vce/admin/newsletter-export"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'var(--accent-or)',
              color: 'var(--n)',
              padding: '0.6rem 1.25rem',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            Exporter CSV
          </a>
        )}
      </div>

      {/* Compteur */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Total abonnés', valeur: String(abonnes.length) },
          { label: 'Abonnés actifs', valeur: String(actifs) },
        ].map(({ label, valeur }) => (
          <div key={label} style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '1.25rem 1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-or-texte)', margin: '0 0 0.5rem' }}>{label}</p>
            <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>{valeur}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--brun)', margin: '0 0 1rem' }}>
        Abonnés newsletter
      </h2>

      {abonnes.length === 0 ? (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun abonné.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
              gap: '0 0.75rem',
              padding: '0.7rem 1.25rem',
              background: 'var(--or-pale)',
              borderBottom: '1px solid var(--carte-bordure)',
            }}
          >
            {['Email', 'Prénom', 'Source', 'Abonné le'].map((col) => (
              <span key={col} style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--accent-or-texte)' }}>
                {col}
              </span>
            ))}
          </div>

          {abonnes.map((a, idx) => (
            <div
              key={a.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
                gap: '0 0.75rem',
                padding: '0.8rem 1.25rem',
                borderBottom: idx < abonnes.length - 1 ? '1px solid var(--or-pale)' : 'none',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.82rem', color: 'var(--texte-carte)' }}>{a.email}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)' }}>{a.prenom ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--texte-carte-secondaire)' }}>{a.source ?? '—'}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)' }}>{formatDate(a.date_abonnement)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
