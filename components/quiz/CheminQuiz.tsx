'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';

type Category =
  | 'Magie'
  | 'Kabbale'
  | 'Alchimie'
  | 'Astrologie'
  | 'Tarot'
  | 'Numérologie'
  | 'Hermétisme'
  | 'Chamanisme'
  | 'Vodou'
  | 'Eso-psychologie'
  | 'Rituels'
  | 'Gnose'
  | 'Tantra / Magie Sexuelle'
  | 'Franc-Maçonnerie'
  | 'Rosicrucianisme';

type Scores = Partial<Record<Category, number>>;

interface Option {
  label: string;
  symbol: string;
  scores: Scores;
}

interface Question {
  prompt: string;
  options: Option[];
}

const questions: Question[] = [
  {
    prompt: 'Qu\'est-ce qui t\'appelle le plus ?',
    options: [
      { label: 'Le pouvoir de transformer le réel par la volonté', symbol: '✦', scores: { Magie: 3, Rituels: 2, 'Tantra / Magie Sexuelle': 1 } },
      { label: 'Le déchiffrement des lois cachées de l\'univers', symbol: '⊕', scores: { Hermétisme: 3, Kabbale: 2, Numérologie: 1 } },
      { label: 'La quête de l\'or intérieur et la métamorphose de l\'âme', symbol: '✧', scores: { Alchimie: 3, Rosicrucianisme: 2, 'Eso-psychologie': 1 } },
      { label: 'Le dialogue avec les esprits et les forces de la nature', symbol: '👁️', scores: { Chamanisme: 3, Vodou: 2, Astrologie: 1 } },
    ],
  },
  {
    prompt: 'Quelle est ta quête véritable ?',
    options: [
      { label: 'Connaître mon destin inscrit dans les astres et les nombres', symbol: '✧', scores: { Astrologie: 3, Numérologie: 3 } },
      { label: 'M\'éveiller à la connaissance divine et briser l\'illusion', symbol: '👁️', scores: { Gnose: 3, Hermétisme: 1, Kabbale: 1 } },
      { label: 'Maîtriser des rites concrets et opératifs', symbol: '✦', scores: { Rituels: 3, Magie: 2, Vodou: 1 } },
      { label: 'Guérir mes blessures et comprendre mon âme profonde', symbol: '⊕', scores: { 'Eso-psychologie': 3, Alchimie: 1, Chamanisme: 1 } },
    ],
  },
  {
    prompt: 'Quel symbole résonne en toi ?',
    options: [
      { label: 'L\'Arbre de Vie et ses dix sphères de lumière', symbol: '⊕', scores: { Kabbale: 3, Gnose: 1, Hermétisme: 1 } },
      { label: 'La rose épanouie au centre de la croix', symbol: '✦', scores: { Rosicrucianisme: 3, Alchimie: 1, 'Franc-Maçonnerie': 1 } },
      { label: 'L\'équerre et le compas des bâtisseurs', symbol: '✧', scores: { 'Franc-Maçonnerie': 3, Hermétisme: 1 } },
      { label: 'Le serpent et le feu sacré de l\'union des contraires', symbol: '👁️', scores: { 'Tantra / Magie Sexuelle': 3, Magie: 1, Chamanisme: 1 } },
    ],
  },
  {
    prompt: 'Comment préfères-tu progresser ?',
    options: [
      { label: 'Par l\'étude patiente des textes et des correspondances', symbol: '⊕', scores: { Hermétisme: 2, Kabbale: 2, Numérologie: 1, 'Franc-Maçonnerie': 1 } },
      { label: 'Par la pratique, les opérations et les rites', symbol: '✦', scores: { Rituels: 2, Magie: 2, Vodou: 2 } },
      { label: 'Par l\'expérience directe, la transe et la vision', symbol: '👁️', scores: { Chamanisme: 2, Gnose: 2, 'Tantra / Magie Sexuelle': 1 } },
      { label: 'Par l\'introspection et la transmutation de soi', symbol: '✧', scores: { Alchimie: 2, 'Eso-psychologie': 2, Rosicrucianisme: 1, Astrologie: 1 } },
    ],
  },
  {
    prompt: 'Vers quel maître t\'inclines-tu ?',
    options: [
      { label: 'Le mage qui plie les forces invisibles à sa parole', symbol: '✦', scores: { Magie: 3, Rituels: 1 } },
      { label: 'Le sage qui lit le ciel, les nombres et les cycles', symbol: '✧', scores: { Astrologie: 2, Numérologie: 2, Hermétisme: 1 } },
      { label: 'Le guérisseur qui voyage entre les mondes', symbol: '👁️', scores: { Chamanisme: 2, Vodou: 2, 'Eso-psychologie': 1 } },
      { label: 'L\'initié des sociétés secrètes et de la lumière intérieure', symbol: '⊕', scores: { 'Franc-Maçonnerie': 2, Rosicrucianisme: 2, Gnose: 1, Kabbale: 1 } },
    ],
  },
];

const descriptions: Record<Category, string> = {
  Magie: 'La Magie est l\'art de mouvoir les forces invisibles par la volonté éveillée et la parole juste. Elle t\'enseigne à devenir cause consciente plutôt que simple effet du monde.',
  Kabbale: 'La Kabbale dévoile l\'architecture secrète de la création à travers l\'Arbre de Vie et ses sphères de lumière. Elle t\'invite à remonter le fil des émanations jusqu\'à la source de tout ce qui est.',
  Alchimie: 'L\'Alchimie est l\'œuvre au noir, au blanc et au rouge : la transmutation patiente du plomb de l\'âme en or spirituel. Elle te promet la métamorphose intérieure sous le voile des métaux et des creusets.',
  Astrologie: 'L\'Astrologie lit dans la danse des astres la carte de ton destin et le rythme de tes saisons intérieures. Elle t\'apprend à reconnaître l\'heure juste pour agir et celle pour te recueillir.',
  Tarot: 'Le Tarot est un livre muet de vingt-deux arcanes où se reflète tout le voyage de l\'âme. Chaque lame est un miroir et un seuil, une clé pour interroger l\'invisible en toi.',
  Numérologie: 'La Numérologie révèle la vibration cachée des nombres qui tissent ton nom et ton chemin. Elle t\'enseigne que tout, dans l\'univers, parle le langage sacré du compte et de la mesure.',
  Hermétisme: 'L\'Hermétisme repose sur la table d\'émeraude et la grande loi : ce qui est en haut est comme ce qui est en bas. Il t\'ouvre les sept principes par lesquels le sage gouverne sa propre nature.',
  Chamanisme: 'Le Chamanisme est la voie de celui qui marche entre les mondes pour rapporter guérison et vision. Il t\'enseigne le dialogue avec les esprits, la nature et les puissances animales.',
  Vodou: 'Le Vodou est la danse vivante des esprits et des forces sacrées, héritée des traditions ancestrales. Il t\'initie à servir les énergies invisibles avec respect, rythme et offrande.',
  'Eso-psychologie': 'L\'Éso-psychologie marie la sagesse des traditions à la connaissance des profondeurs de l\'âme. Elle t\'aide à guérir tes blessures et à reconnaître l\'ombre comme la porte de ta lumière.',
  Rituels: 'Les Rituels sont les gestes consacrés qui ouvrent le passage entre le visible et l\'invisible. Ils t\'enseignent l\'art opératif : tracer le cercle, allumer la flamme, et changer le réel par l\'acte juste.',
  Gnose: 'La Gnose est la connaissance qui sauve, l\'éveil soudain qui déchire le voile de l\'illusion. Elle te révèle l\'étincelle divine prisonnière de la matière et le chemin de son retour.',
  'Tantra / Magie Sexuelle': 'Le Tantra et la Magie Sexuelle sacralisent le feu de l\'union et la montée du serpent intérieur. Ils t\'enseignent à transmuer le désir en énergie d\'éveil et la chair en temple du sacré.',
  'Franc-Maçonnerie': 'La Franc-Maçonnerie est l\'art royal des bâtisseurs, où l\'équerre et le compas façonnent l\'homme intérieur. Elle te convie à tailler ta pierre brute jusqu\'à la rendre digne de l\'édifice de lumière.',
  Rosicrucianisme: 'Le Rosicrucianisme unit la rose de l\'âme à la croix de la matière dans une discipline secrète et lumineuse. Il t\'ouvre une fraternité invisible vouée à la régénération de l\'être et du monde.',
};

const allCategories = Object.keys(descriptions) as Category[];

export default function CheminQuiz() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Scores>({});
  const [finished, setFinished] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const total = questions.length;

  function choose(option: Option) {
    if (transitioning) return;
    setTransitioning(true);
    const nextScores: Scores = { ...scores };
    for (const cat of Object.keys(option.scores) as Category[]) {
      nextScores[cat] = (nextScores[cat] || 0) + (option.scores[cat] || 0);
    }
    setTimeout(() => {
      setScores(nextScores);
      if (step + 1 >= total) {
        setFinished(true);
      } else {
        setStep(step + 1);
      }
      setTransitioning(false);
    }, 350);
  }

  function restart() {
    setTransitioning(true);
    setTimeout(() => {
      setScores({});
      setStep(0);
      setFinished(false);
      setTransitioning(false);
    }, 350);
  }

  function computeResult(): Category {
    let best: Category = allCategories[0];
    let bestScore = -1;
    for (const cat of allCategories) {
      const s = scores[cat] || 0;
      if (s > bestScore) {
        bestScore = s;
        best = cat;
      }
    }
    return best;
  }

  if (finished) {
    const result = computeResult();
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className={`card-dark rounded-2xl p-8 md:p-12 text-center shadow-[0_0_60px_rgba(201,168,76,0.12)] transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100 animate-slide-up'}`}>
          <p className="ornament text-3xl text-gold-500 mb-4">✦</p>
          <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Ta voie se révèle</p>
          <h2 className="font-serif text-4xl md:text-5xl text-gold-400 mb-2">Ta voie : {result}</h2>
          <div className="divider-gold my-6 mx-auto max-w-xs" />
          <p className="text-silver-400 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            {descriptions[result]}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/boutique?categorie=${encodeURIComponent(result)}`}
              className="btn-gold px-8 py-4 rounded-xl text-base font-medium flex items-center gap-2 group"
            >
              Explorer cette voie
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button onClick={restart} className="btn-ghost-gold px-6 py-4 rounded-xl text-sm inline-flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Refaire le test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[step];

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gold-600 uppercase tracking-[0.3em] text-xs">Question {step + 1} / {total}</span>
          <span className="text-silver-500 text-xs tracking-widest">{Math.round(((step) / total) * 100)}%</span>
        </div>
        <div className="h-px w-full bg-ash/60 relative overflow-hidden rounded-full">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-gold-700 to-gold-400 transition-all duration-500"
            style={{ width: `${((step) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100 animate-fade-in'}`}>
        <h2 className="font-serif text-3xl md:text-4xl text-silver-200 text-center mb-10 leading-snug">
          {question.prompt}
        </h2>

        <div className="space-y-4">
          {question.options.map((option, i) => (
            <button
              key={i}
              onClick={() => choose(option)}
              className="w-full text-left card-dark rounded-xl px-6 py-5 flex items-center gap-4 gold-border-hover hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <span className="text-2xl text-gold-500/70 group-hover:text-gold-400 transition-colors select-none flex-shrink-0">
                {option.symbol}
              </span>
              <span className="text-silver-300 group-hover:text-gold-200 transition-colors text-base md:text-lg leading-snug">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
