import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import VCENav from '../_components/VCENav';

export const metadata: Metadata = {
  title: 'Services éditoriaux',
  description:
    'Découvrez nos services éditoriaux : correction, ghostwriting, mise en page, couverture et publication.',
};

interface VCEService {
  id: string;
  nom: string;
  description: string | null;
  type_tarif: 'fixe' | 'selon_pages';
  prix_fixe: number | null;
  prix_0_100: number | null;
  prix_100_200: number | null;
  prix_200_300: number | null;
  prix_300_400: number | null;
  categorie: string | null;
  ordre: number;
}

interface VCEPackage {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  economie: number | null;
}

const CATEGORIES: Record<string, string> = {
  analyse: 'Analyse & diagnostic',
  correction: 'Correction & structuration',
  redaction: 'Rédaction',
  mise_en_page: 'Mise en page',
  design: 'Design',
  publication: 'Publication',
};

const SERVICE_DETAILS: Record<string, { prestations: string[]; ideal: string }> = {
  analyse: {
    prestations: [
      'Analyse complète du manuscrit',
      'Identification des forces et faiblesses',
      'Évaluation de la structure globale',
      'Détection des incohérences et zones floues',
      "Proposition d'un plan d'amélioration clair",
    ],
    ideal: "Idéal si vous ne savez pas comment améliorer votre livre ou par où commencer.",
  },
  correction: {
    prestations: [
      'Organisation logique des idées',
      'Création ou amélioration du plan du livre',
      'Réorganisation des chapitres',
      'Amélioration de la progression du contenu',
      'Clarification du message principal',
      'Correction des fautes grammaticales et orthographiques',
      'Amélioration de la fluidité du texte',
      'Réduction des répétitions',
      'Clarification des phrases complexes',
      "Harmonisation du style d'écriture",
    ],
    ideal: "Idéal si votre manuscrit est désorganisé ou difficile à suivre.",
  },
  redaction: {
    prestations: [
      'Rédaction complète du livre',
      'Structuration du contenu dès le départ',
      'Respect de votre idée et de votre vision',
      'Adaptation du style à votre personnalité',
      'Accompagnement tout au long du processus',
    ],
    ideal: "Idéal si vous avez une idée mais pas le temps ou la capacité d'écrire.",
  },
  mise_en_page: {
    prestations: [
      'Mise en forme professionnelle du document',
      'Adaptation aux standards Amazon KDP',
      'Structuration des titres et chapitres',
      'Optimisation pour lecture numérique ou papier',
      "Création d'un intérieur propre et lisible",
    ],
    ideal: "Idéal si votre livre est prêt mais mal présenté.",
  },
  design: {
    prestations: [
      'Design professionnel et attractif',
      'Adaptation au genre du livre',
      'Création visuelle conforme au marché',
      'Version ebook ou imprimée',
      "Optimisation pour capter l'attention",
    ],
    ideal: "Idéal pour attirer l'attention et augmenter les ventes.",
  },
  publication: {
    prestations: [
      'Création du compte KDP (si nécessaire)',
      'Mise en ligne du livre',
      'Configuration des formats (ebook / papier)',
      'Vérification des fichiers avant publication',
      "Assistance jusqu'à la mise en ligne finale",
      'Recherche de mots-clés pertinents',
      'Optimisation du titre du livre',
      "Rédaction d'une description efficace",
      'Amélioration de la visibilité sur Amazon',
      'Positionnement stratégique du livre',
    ],
    ideal: "Idéal si vous ne savez pas comment publier correctement, pour rendre votre livre visible et vendable.",
  },
};

export default async function ServicesPage() {
  const supabase = createServerClient();
  const [{ data: services }, { data: packages }] = await Promise.all([
    supabase.from('vce_services').select('*').eq('actif', true).order('ordre'),
    supabase.from('vce_service_packages').select('*').eq('actif', true).order('prix'),
  ]);

  const serviceList = (services ?? []) as VCEService[];
  const packageList = (packages ?? []) as VCEPackage[];

  return (
    <>
      <VCENav />

      {/* En-tête page */}
      <section
        style={{
          background: '#3D2B1A',
          padding: '4rem 2rem',
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
          Catalogue éditorial
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700,
            color: '#F0E8C0',
            margin: '0 0 1rem',
          }}
        >
          Nos services éditoriaux
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            color: '#C4B08A',
            maxWidth: '560px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          Choisissez le service qui correspond à votre projet, ou optez pour un package
          complet et économisez.
        </p>
      </section>

      {/* Services à la carte */}
      <section style={{ padding: '4rem 2rem', background: '#FAF3E0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-playfair)',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#3D2B1A',
              marginBottom: '2.5rem',
            }}
          >
            Services à la carte
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {serviceList.map((service) => (
              <article
                key={service.id}
                style={{
                  background: 'var(--carte)',
                  border: '1px solid var(--carte-bordure)',
                  borderRadius: '8px',
                  padding: '2rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    {service.categorie && (
                      <p
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.7rem',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: 'var(--texte-carte-secondaire)',
                          margin: '0 0 0.4rem',
                        }}
                      >
                        {CATEGORIES[service.categorie] ?? service.categorie}
                      </p>
                    )}
                    <h3
                      style={{
                        fontFamily: 'var(--font-playfair)',
                        fontSize: '1.3rem',
                        fontWeight: 600,
                        color: 'var(--texte-carte)',
                        margin: 0,
                      }}
                    >
                      {service.nom}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {service.type_tarif === 'fixe' ? (
                      <p
                        style={{
                          fontFamily: 'var(--font-playfair)',
                          fontSize: '1.75rem',
                          fontWeight: 700,
                          color: 'var(--texte-carte)',
                          margin: 0,
                        }}
                      >
                        ${service.prix_fixe?.toFixed(0)}
                      </p>
                    ) : (
                      <>
                        <p
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.75rem',
                            color: 'var(--texte-carte-secondaire)',
                            margin: '0 0 0.25rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                          }}
                        >
                          Selon le nombre de pages
                        </p>
                        <table
                          style={{
                            borderCollapse: 'collapse',
                            minWidth: '200px',
                          }}
                        >
                          <tbody>
                            {(
                              [
                                { range: '1–100 pages', prix: service.prix_0_100 },
                                { range: '101–200 pages', prix: service.prix_100_200 },
                                { range: '201–300 pages', prix: service.prix_200_300 },
                                { range: '301–400 pages', prix: service.prix_300_400 },
                              ] as const
                            )
                              .filter((r) => r.prix != null)
                              .map((row) => (
                                <tr key={row.range}>
                                  <td
                                    style={{
                                      fontFamily: 'var(--font-inter)',
                                      fontSize: '0.8rem',
                                      color: 'var(--texte-carte-secondaire)',
                                      padding: '0.2rem 1rem 0.2rem 0',
                                      textAlign: 'left',
                                    }}
                                  >
                                    {row.range}
                                  </td>
                                  <td
                                    style={{
                                      fontFamily: 'var(--font-inter)',
                                      fontSize: '0.9rem',
                                      fontWeight: 700,
                                      color: 'var(--texte-carte)',
                                      textAlign: 'right',
                                      padding: '0.2rem 0',
                                    }}
                                  >
                                    ${(row.prix as number).toFixed(0)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </>
                    )}
                  </div>
                </div>

                {service.description && (
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.9rem',
                      color: 'var(--texte-carte-secondaire)',
                      lineHeight: 1.7,
                      marginBottom: '1.5rem',
                    }}
                  >
                    {service.description}
                  </p>
                )}

                {SERVICE_DETAILS[service.categorie ?? ''] && (() => {
                  const details = SERVICE_DETAILS[service.categorie!];
                  return (
                    <>
                      <ol
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.85rem',
                          color: 'var(--texte-carte-secondaire)',
                          lineHeight: 1.6,
                          paddingLeft: '1.25rem',
                          margin: '0 0 1rem 0',
                        }}
                      >
                        {details.prestations.map((p, i) => (
                          <li key={i} style={{ marginBottom: '0.2rem' }}>{p}</li>
                        ))}
                      </ol>
                      <div
                        style={{
                          background: 'rgba(122, 106, 16, 0.07)',
                          border: '1px solid rgba(122, 106, 16, 0.2)',
                          borderRadius: '4px',
                          padding: '0.6rem 0.9rem',
                          marginBottom: '1.5rem',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.85rem',
                          color: 'var(--accent-or-texte)',
                          fontStyle: 'italic',
                        }}
                      >
                        ✦ {details.ideal}
                      </div>
                    </>
                  );
                })()}

                <Link
                  href={`/soumettre?service=${service.id}`}
                  style={{
                    fontFamily: 'var(--font-inter)',
                    display: 'inline-block',
                    background: '#B5A020',
                    color: '#FAF3E0',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  Choisir ce service
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      {packageList.length > 0 && (
        <section style={{ padding: '4rem 2rem', background: '#3D2B1A' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#F0E8C0',
                marginBottom: '0.5rem',
              }}
            >
              Packages complets
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                color: '#C4B08A',
                marginBottom: '2.5rem',
              }}
            >
              Combinez plusieurs services et réalisez des économies allant jusqu&apos;à $100.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {packageList.map((pkg, i) => (
                <div
                  key={pkg.id}
                  style={{
                    background: i === 1 ? 'var(--carte)' : 'rgba(255,255,255,0.04)',
                    border: i === 1 ? '1px solid var(--carte-bordure)' : '1px solid rgba(181,160,32,0.2)',
                    borderRadius: '8px',
                    padding: '2rem',
                    position: 'relative',
                  }}
                >
                  {i === 1 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--bandeau-fond)',
                        color: 'var(--bandeau-texte)',
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        padding: '0.3rem 1rem',
                        borderRadius: '999px',
                        border: '1px solid rgba(181,160,32,0.3)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Populaire
                    </span>
                  )}

                  <h3
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: i === 1 ? 'var(--texte-carte)' : '#F0E8C0',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {pkg.nom}
                  </h3>

                  {pkg.description && (
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.875rem',
                        color: i === 1 ? 'var(--texte-carte-secondaire)' : '#C4B08A',
                        marginBottom: '1.5rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {pkg.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-playfair)',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: i === 1 ? 'var(--texte-carte)' : '#B5A020',
                      }}
                    >
                      ${pkg.prix.toFixed(0)}
                    </span>
                    {pkg.economie && (
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.8rem',
                          color: i === 1 ? 'var(--texte-carte-secondaire)' : 'rgba(181,160,32,0.65)',
                        }}
                      >
                        (économie ${pkg.economie.toFixed(0)})
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/soumettre?package=${pkg.id}`}
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: i === 1 ? '#3D2B1A' : '#B5A020',
                      background: i === 1 ? '#FAF3E0' : 'transparent',
                      border: i === 1 ? 'none' : '1px solid rgba(181,160,32,0.4)',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      textAlign: 'center',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Choisir {pkg.nom}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        style={{
          padding: '3rem 2rem',
          background: '#FAF3E0',
          textAlign: 'center',
          borderTop: '1px solid #E8DFB0',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.9rem',
            color: '#6B4C2F',
            marginBottom: '1rem',
          }}
        >
          Une question sur nos tarifs ou nos délais ?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/soumettre"
            style={{
              fontFamily: 'var(--font-inter)',
              background: '#B5A020',
              color: '#FAF3E0',
              padding: '0.75rem 1.75rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Soumettre mon manuscrit
          </Link>
          <Link
            href="/contact"
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid #B5A020',
              color: '#8A7818',
              padding: '0.75rem 1.75rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Nous contacter
          </Link>
        </div>
      </section>
    </>
  );
}
