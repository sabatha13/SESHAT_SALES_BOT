import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import VCENav from '../_components/VCENav';
import SoumettreForm from './SoumettreForm';

export const metadata: Metadata = {
  title: 'Soumettre mon manuscrit',
  description:
    'Soumettez votre manuscrit à Voix Cosmique Éditions. Gratuit, sans engagement. Réponse sous 72h.',
};

interface PageProps {
  searchParams: { service?: string; package?: string };
}

export default async function SoumettrePageWrapper({ searchParams }: PageProps) {
  const supabase = createServerClient();
  const [{ data: services }, { data: packages }] = await Promise.all([
    supabase.from('vce_services').select('id, nom, type_tarif, prix_fixe, prix_0_100, prix_100_200, prix_200_300, prix_300_400').eq('actif', true).order('ordre'),
    supabase.from('vce_service_packages').select('id, nom, prix, description').eq('actif', true).order('prix'),
  ]);

  return (
    <>
      <VCENav />

      <section
        style={{
          background: '#3D2B1A',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#B5A020',
            marginBottom: '0.75rem',
          }}
        >
          Première étape
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: '#F0E8C0',
            margin: '0 0 0.75rem',
          }}
        >
          Soumettre mon manuscrit
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.95rem',
            color: '#C4B08A',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          Remplissez ce formulaire. Notre équipe vous contactera sous 72h. Aucun engagement
          à cette étape.
        </p>
      </section>

      <section style={{ padding: '3rem 2rem', background: '#FAF3E0' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <SoumettreForm
            services={services ?? []}
            packages={packages ?? []}
            preselectedService={searchParams.service}
            preselectedPackage={searchParams.package}
          />
        </div>
      </section>
    </>
  );
}
