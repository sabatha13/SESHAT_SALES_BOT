export const dynamic = 'force-dynamic';

import { createServerClient } from '@/lib/supabase/server';
import { assertVceAdmin } from '@/lib/vce-admin';
import PackageEditForm from './_components/PackageEditForm';

interface Service {
  id: string;
  nom: string;
  description: string | null;
  type_tarif: string | null;
  prix_fixe: number | null;
  prix_0_100: number | null;
  prix_100_200: number | null;
  prix_200_300: number | null;
  prix_300_400: number | null;
  categorie: string | null;
  actif: boolean | null;
}

interface Package {
  id: string;
  nom: string;
  description: string | null;
  prix: number | null;
  economie: number | null;
  actif: boolean | null;
}

function money(v: number | null): string {
  if (v === null || isNaN(Number(v))) return '—';
  return `${parseFloat(String(v)).toFixed(0)} $`;
}

export default async function AdminServicesPage() {
  await assertVceAdmin();
  const supabase = createServerClient();

  const [{ data: servicesData }, { data: packagesData }] = await Promise.all([
    supabase.from('vce_services').select('*').order('ordre', { ascending: true }),
    supabase.from('vce_service_packages').select('*').order('created_at', { ascending: true }),
  ]);

  const services = (servicesData ?? []) as Service[];
  const packages = (packagesData ?? []) as Package[];

  return (
    <div style={{ padding: '2.5rem', maxWidth: '900px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 2rem' }}>
        Services &amp; Tarifs
      </h1>

      {/* Packages (éditables) */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--brun)', margin: '0 0 1rem' }}>
          Packages
        </h2>
        {packages.length === 0 ? (
          <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun package.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {packages.map((pkg) => (
              <div key={pkg.id} style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '1.5rem' }}>
                <PackageEditForm pkg={pkg} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Services (lecture seule) */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--brun)', margin: '0 0 1rem' }}>
          Services
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', fontWeight: 400, color: 'var(--accent-or-texte)', marginLeft: '0.5rem' }}>
            (lecture seule)
          </span>
        </h2>
        {services.length === 0 ? (
          <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>Aucun service.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--carte)', border: '1px solid var(--carte-bordure)', borderRadius: '8px', overflow: 'hidden' }}>
            {services.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderBottom: idx < services.length - 1 ? '1px solid var(--or-pale)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontFamily: 'var(--font-inter)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--texte-carte)', margin: '0 0 0.2rem' }}>
                      {s.nom}
                      {s.categorie && (
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', fontWeight: 600, background: 'var(--or-pale)', color: 'var(--accent-or-texte)', padding: '0.1rem 0.5rem', borderRadius: '999px', marginLeft: '0.5rem' }}>
                          {s.categorie}
                        </span>
                      )}
                    </h4>
                    {s.description && (
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.78rem', color: 'var(--texte-carte-secondaire)', margin: 0 }}>{s.description}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-or-texte)', margin: '0 0 0.2rem' }}>
                      {s.type_tarif ?? 'tarif'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'var(--texte-carte)', margin: 0, fontWeight: 600 }}>
                      {s.type_tarif === 'fixe'
                        ? money(s.prix_fixe)
                        : `${money(s.prix_0_100)} – ${money(s.prix_300_400)}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
