import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import VCENav from './_components/VCENav';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Static data ──────────────────────────────────────────────────────────────

const PROCESSUS = [
  {
    num: '01',
    titre: 'Soumission',
    texte: 'Vous soumettez votre manuscrit et quelques informations. Aucun engagement immédiat.',
  },
  {
    num: '02',
    titre: 'Diagnostic',
    texte:
      'Notre équipe lit votre texte et vous envoie une analyse éditoriale détaillée sous 72h.',
  },
  {
    num: '03',
    titre: 'Accompagnement',
    texte: 'Un éditeur dédié vous suit tout au long du processus avec des points réguliers.',
  },
  {
    num: '04',
    titre: 'Production',
    texte:
      'Correction, mise en page, couverture : chaque détail est soigné selon vos retours.',
  },
  {
    num: '05',
    titre: 'Publication',
    texte: 'Votre œuvre est prête pour Amazon KDP ou tout autre canal de votre choix.',
  },
];

const VALEURS = [
  {
    icone: '✦',
    titre: 'Excellence éditoriale',
    texte:
      "Chaque manuscrit reçoit le même niveau d'exigence que dans les grandes maisons d'édition.",
  },
  {
    icone: '◈',
    titre: 'Accompagnement personnalisé',
    texte: "Un éditeur vous est attribué personnellement. Pas de production en chaîne.",
  },
  {
    icone: '◇',
    titre: 'Transparence totale',
    texte:
      'Devis clair, délais annoncés, aucuns frais cachés. Vous savez toujours où en est votre projet.',
  },
  {
    icone: '⟡',
    titre: 'Délais respectés',
    texte: 'Nous planifions chaque étape et nous engageons sur des dates de livraison fermes.',
  },
  {
    icone: '⌖',
    titre: 'Confidentialité absolue',
    texte:
      "Votre manuscrit reste votre propriété. Aucun partage sans accord écrit de votre part.",
  },
];

const POUR_QUI = [
  {
    profil: 'Premier roman',
    detail:
      "Vous avez une histoire à raconter et ne savez pas par où commencer. Nous vous guidons de A à Z.",
  },
  {
    profil: 'Mémoires & biographies',
    detail:
      "Votre vécu mérite d'être transmis. Nous aidons à structurer et donner vie à votre témoignage.",
  },
  {
    profil: 'Ouvrages spirituels',
    detail:
      "Enseignements, sagesse, éveil intérieur : notre expertise couvre la littérature de l'âme.",
  },
  {
    profil: 'Essais & développement',
    detail:
      'De la pensée brute au livre structuré : nous transformons vos idées en ouvrage de référence.',
  },
  {
    profil: 'Ghostwriting',
    detail: 'Vous avez le contenu, nous avons la plume. Votre nom, notre travail, votre œuvre.',
  },
  {
    profil: "Révision d'un manuscrit existant",
    detail: 'Votre texte est prêt mais imparfait. Correction approfondie et polish final.',
  },
];

const PAIEMENTS = [
  { nom: 'Carte bancaire', sous: 'Via Stripe — sécurisé', icon: '💳' },
  { nom: 'Zelle', sous: 'Virement instantané USA', icon: '⚡' },
  { nom: 'CashApp', sous: '$cashtag', icon: '💸' },
  { nom: 'Western Union', sous: 'Transfert international', icon: '🌐' },
  { nom: 'PayPal', sous: 'Paiement en ligne', icon: '🔵' },
  { nom: 'MoneyGram', sous: 'Transfert international', icon: '🌍' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prixLabel(s: VCEService): string {
  if (s.type_tarif === 'fixe') return `$${s.prix_fixe?.toFixed(0)}`;
  const vals = [s.prix_0_100, s.prix_100_200, s.prix_200_300, s.prix_300_400].filter(
    (v): v is number => v != null
  );
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return `$${min}–$${max}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function VCELandingPage() {
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

      {/* ── Hero (façade) ────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundImage: "url('/images/vce/vce.final.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 18%',
          backgroundColor: '#3D2B1A',
          height: 'clamp(180px, 25vw, 420px)',
          overflow: 'hidden',
        }}
      />

      {/* ── Titre & CTA ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'var(--n)',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: 'var(--texte)',
            maxWidth: '760px',
            margin: '0 auto 1.5rem',
            lineHeight: 1.2,
          }}
        >
          Transformez votre manuscrit en{' '}
          <span style={{ color: 'var(--accent-or-texte)' }}>chef-d&apos;œuvre</span>
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1.125rem',
            color: 'var(--texte-carte-secondaire)',
            maxWidth: '580px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          Voix Cosmique Éditions accompagne les auteurs de la spiritualité, du développement
          personnel et de l&apos;ésotérisme — de la première ligne à la publication finale.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/soumettre"
            style={{
              fontFamily: 'var(--font-inter)',
              background: '#B5A020',
              color: '#FAF3E0',
              padding: '0.9rem 2rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
            }}
          >
            Soumettre mon manuscrit
          </Link>
          <Link
            href="/services"
            style={{
              fontFamily: 'var(--font-inter)',
              border: '1px solid var(--texte)',
              color: 'var(--texte)',
              padding: '0.9rem 2rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
            }}
          >
            Découvrir nos services
          </Link>
        </div>
      </section>

      {/* ── Bandeau chiffres ─────────────────────────────────────────────── */}
      <section
        style={{
          background: '#B5A020',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '4rem',
          flexWrap: 'wrap',
        }}
      >
        {[
          { val: '6', lab: 'Services éditoriaux' },
          { val: '3', lab: 'Packages complets' },
          { val: '6', lab: 'Méthodes de paiement' },
          { val: '72h', lab: 'Délai de réponse' },
        ].map((s) => (
          <div key={s.lab} style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: '2rem',
                fontWeight: 700,
                color: '#FAF3E0',
                margin: 0,
              }}
            >
              {s.val}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: 'rgba(250,243,224,0.8)',
                margin: '0.25rem 0 0',
                letterSpacing: '0.05em',
              }}
            >
              {s.lab}
            </p>
          </div>
        ))}
      </section>

      {/* ── Processus ────────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: '#FAF3E0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
              Comment ça marche
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: 0,
              }}
            >
              Notre processus éditorial en 5 étapes
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '2rem',
            }}
          >
            {PROCESSUS.map((step) => (
              <div key={step.num} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    color: '#E8DFB0',
                    lineHeight: 1,
                    marginBottom: '0.75rem',
                  }}
                >
                  {step.num}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#3D2B1A',
                    marginBottom: '0.5rem',
                  }}
                >
                  {step.titre}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: '#6B4C2F',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {step.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services à la carte ──────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: '#FFFEF5' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
              Nos prestations
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: 0,
              }}
            >
              Services éditoriaux à la carte
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {serviceList.map((service) => (
              <article
                key={service.id}
                style={{
                  background: '#FAF3E0',
                  border: '1px solid #E8DFB0',
                  borderRadius: '8px',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      color: '#3D2B1A',
                      margin: 0,
                      flex: 1,
                    }}
                  >
                    {service.nom}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#B5A020',
                      marginLeft: '1rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {prixLabel(service)}
                  </span>
                </div>

                {service.description && (
                  <p
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      color: '#6B4C2F',
                      lineHeight: 1.6,
                      marginBottom: '1rem',
                      flex: 1,
                    }}
                  >
                    {service.description}
                  </p>
                )}

                {service.type_tarif === 'selon_pages' && (
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginBottom: '1rem',
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.7rem',
                            color: '#8A7818',
                            textAlign: 'left',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '0.25rem 0',
                            borderBottom: '1px solid #E8DFB0',
                          }}
                        >
                          Pages
                        </th>
                        <th
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.7rem',
                            color: '#8A7818',
                            textAlign: 'right',
                            fontWeight: 600,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            padding: '0.25rem 0',
                            borderBottom: '1px solid #E8DFB0',
                          }}
                        >
                          Tarif
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          { range: '1–100', prix: service.prix_0_100 },
                          { range: '101–200', prix: service.prix_100_200 },
                          { range: '201–300', prix: service.prix_200_300 },
                          { range: '301–400', prix: service.prix_300_400 },
                        ] as const
                      )
                        .filter((r) => r.prix != null)
                        .map((row) => (
                          <tr key={row.range}>
                            <td
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '0.8rem',
                                color: '#6B4C2F',
                                padding: '0.3rem 0',
                              }}
                            >
                              {row.range} pages
                            </td>
                            <td
                              style={{
                                fontFamily: 'var(--font-inter)',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#3D2B1A',
                                textAlign: 'right',
                                padding: '0.3rem 0',
                              }}
                            >
                              ${(row.prix as number).toFixed(0)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}

                <Link
                  href="/soumettre"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.8rem',
                    color: '#8A7818',
                    textDecoration: 'none',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    marginTop: 'auto',
                  }}
                >
                  Choisir ce service →
                </Link>
              </article>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link
              href="/services"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.875rem',
                color: '#8A7818',
                textDecoration: 'none',
                borderBottom: '1px solid #B5A020',
                paddingBottom: '2px',
              }}
            >
              Voir tous les services en détail →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Packages ─────────────────────────────────────────────────────── */}
      {packageList.length > 0 && (
        <section style={{ padding: '5rem 2rem', background: '#3D2B1A' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
                Offres groupées
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  fontWeight: 700,
                  color: '#F0E8C0',
                  margin: 0,
                }}
              >
                Packages — Économisez jusqu&apos;à $100
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  {i === 1 && (
                    <div
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
                    </div>
                  )}

                  <h3
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '1.4rem',
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
                        lineHeight: 1.5,
                      }}
                    >
                      {pkg.description}
                    </p>
                  )}

                  <div
                    style={{
                      fontFamily: 'var(--font-playfair)',
                      fontSize: '2.25rem',
                      fontWeight: 700,
                      color: i === 1 ? 'var(--texte-carte)' : '#B5A020',
                      marginBottom: '0.25rem',
                    }}
                  >
                    ${pkg.prix.toFixed(0)}
                  </div>

                  {pkg.economie && (
                    <p
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.8rem',
                        color: i === 1 ? 'var(--texte-carte-secondaire)' : 'rgba(181,160,32,0.65)',
                        marginBottom: '1.5rem',
                      }}
                    >
                      Économie de ${pkg.economie.toFixed(0)}
                    </p>
                  )}

                  <Link
                    href="/soumettre"
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

      {/* ── Méthodes de paiement ─────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: '#FAF3E0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
              Flexibilité
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: '0 0 0.75rem',
              }}
            >
              6 méthodes de paiement acceptées
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                color: '#6B4C2F',
                margin: 0,
              }}
            >
              Où que vous soyez dans le monde, nous avons une solution pour vous.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
            }}
          >
            {PAIEMENTS.map((p) => (
              <div
                key={p.nom}
                style={{
                  background: 'var(--carte)',
                  border: '1px solid var(--carte-bordure)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{p.icon}</div>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--texte-carte)',
                    margin: '0 0 0.25rem',
                  }}
                >
                  {p.nom}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.75rem',
                    color: 'var(--texte-carte-secondaire)',
                    margin: 0,
                  }}
                >
                  {p.sous}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.8rem',
              color: '#8A7818',
              textAlign: 'center',
              marginTop: '1.5rem',
            }}
          >
            Un acompte de 50 % est demandé à la commande. Le solde est réglé à la livraison.
          </p>
        </div>
      </section>

      {/* ── Pour qui ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: '#FFFEF5' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
              Nos auteurs
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: 0,
              }}
            >
              Pour qui travaillons-nous ?
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {POUR_QUI.map((p) => (
              <div
                key={p.profil}
                style={{
                  padding: '1.5rem',
                  borderLeft: '3px solid #B5A020',
                  background: '#FAF3E0',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: '#3D2B1A',
                    marginBottom: '0.5rem',
                  }}
                >
                  {p.profil}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: '#6B4C2F',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Valeurs ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 2rem', background: '#FAF3E0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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
              Notre engagement
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#3D2B1A',
                margin: 0,
              }}
            >
              Ce qui nous distingue
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem',
            }}
          >
            {VALEURS.map((v) => (
              <div key={v.titre} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', color: '#B5A020', marginBottom: '0.75rem' }}>
                  {v.icone}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-playfair)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#3D2B1A',
                    marginBottom: '0.5rem',
                  }}
                >
                  {v.titre}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.875rem',
                    color: '#6B4C2F',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {v.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA finale ───────────────────────────────────────────────────── */}
      <section
        style={{ padding: '5rem 2rem', background: '#3D2B1A', textAlign: 'center' }}
      >
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            color: '#B5A020',
            marginBottom: '1rem',
          }}
        >
          &ldquo;Chaque auteur mérite un accompagnement à la hauteur de son œuvre.&rdquo;
        </p>
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 700,
            color: '#F0E8C0',
            marginBottom: '1.5rem',
          }}
        >
          Prêt à publier votre livre ?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '1rem',
            color: '#C4B08A',
            maxWidth: '500px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}
        >
          Soumettez votre manuscrit gratuitement. Diagnostic sous 72h. Aucun engagement.
        </p>
        <Link
          href="/soumettre"
          style={{
            fontFamily: 'var(--font-inter)',
            display: 'inline-block',
            background: '#B5A020',
            color: '#FAF3E0',
            padding: '1rem 2.5rem',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            letterSpacing: '0.04em',
          }}
        >
          Soumettre mon manuscrit gratuitement
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ background: '#1C1208', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: '1rem',
            color: '#B5A020',
            marginBottom: '1rem',
          }}
        >
          Voix Cosmique Éditions
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {[
            { href: '/services', label: 'Services' },
            { href: '/soumettre', label: 'Soumettre' },
            { href: '/contact', label: 'Contact' },
            { href: '/espace-auteur', label: 'Espace Auteur' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8rem',
                color: '#8A7818',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '0.75rem',
            color: '#3D2B1A',
          }}
        >
          © {new Date().getFullYear()} Voix Cosmique Éditions. Tous droits réservés.
        </p>
      </footer>
    </>
  );
}
