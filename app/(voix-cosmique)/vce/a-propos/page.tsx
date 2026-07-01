import Link from 'next/link';
import type { Metadata } from 'next';
import VCENav from '../_components/VCENav';

export const metadata: Metadata = {
  title: 'Qui sommes-nous ?',
  description:
    "Voix Cosmique Éditions accompagne les auteurs de la spiritualité, du développement personnel et de l'ésotérisme.",
};

const VALEURS = [
  { icone: '✦', titre: 'Intégrité', desc: 'Vos droits d\'auteur restent intégralement les vôtres. Transparence totale à chaque étape.' },
  { icone: '❋', titre: 'Excellence', desc: 'Un accompagnement éditorial exigeant, de la structuration du manuscrit à l\'œuvre publiée.' },
  { icone: '☾', titre: 'Accompagnement', desc: 'Un interlocuteur dédié, une écoute attentive, un suivi humain de votre projet.' },
];

const CHIFFRES = [
  { valeur: '6', label: 'services éditoriaux' },
  { valeur: '3', label: 'packages complets' },
  { valeur: '72h', label: 'délai de réponse' },
  { valeur: '100%', label: 'droits préservés' },
];

export default function AProposPage() {
  return (
    <>
      <VCENav />
      <main style={{ background: 'var(--n)', minHeight: 'calc(100vh - 72px)' }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '4rem 2rem 3rem' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--or)', margin: '0 0 0.75rem' }}>
            Voix Cosmique Éditions
          </p>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, color: 'var(--brun)', margin: 0 }}>
            Qui sommes-nous ?
          </h1>
        </section>

        {/* Mission */}
        <section style={{ maxWidth: '720px', margin: '0 auto', padding: '0 2rem 3.5rem', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1.05rem', color: 'var(--texte)', lineHeight: 1.8, margin: 0 }}>
            Voix Cosmique Éditions accompagne les auteurs de la spiritualité, du développement
            personnel et de l'ésotérisme. Notre mission&nbsp;: transformer votre manuscrit en œuvre
            publiée, en préservant <strong>100% de vos droits d'auteur</strong>.
          </p>
        </section>

        {/* Valeurs */}
        <section style={{ background: 'var(--carte)', borderTop: '1px solid var(--carte-bordure)', borderBottom: '1px solid var(--carte-bordure)', padding: '3.5rem 2rem' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem' }}>
            {VALEURS.map((v) => (
              <div key={v.titre} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '2rem', color: 'var(--accent-or-texte)', marginBottom: '0.75rem' }}>{v.icone}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--texte-carte)', margin: '0 0 0.6rem' }}>{v.titre}</h3>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.88rem', color: 'var(--texte-carte-secondaire)', margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Chiffres */}
        <section style={{ padding: '3.5rem 2rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem' }}>
            {CHIFFRES.map((c) => (
              <div key={c.label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--brun)', margin: '0 0 0.35rem' }}>{c.valeur}</p>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-or-texte)', margin: 0 }}>{c.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '2rem 2rem 5rem' }}>
          <Link
            href="/soumettre"
            style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', fontWeight: 600, background: 'var(--accent-or)', color: 'var(--n)', padding: '0.9rem 2rem', borderRadius: '4px', textDecoration: 'none', display: 'inline-block' }}
          >
            Soumettre mon manuscrit
          </Link>
        </section>
      </main>
    </>
  );
}
