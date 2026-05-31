import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Globe, Award, Users } from 'lucide-react';

export const metadata = {
  title: 'L\'Auteur — Le Comte de Sabatha | CDS Librairie Ésotérique',
  description: 'Biographie du Comte de Sabatha, chercheur autodidacte spécialisé dans les traditions ésotériques et mystiques.',
};

const specializations = [
  "L'étude des phénomènes culturels et spirituels haïtiens, avec un accent particulier sur leur signification historique et contemporaine.",
  "L'exploration des traditions ésotériques occidentales et orientales, en retraçant leurs fondements philosophiques et pratiques avec précision.",
  "L'analyse du syncrétisme religieux dans les sociétés postcoloniales, en examinant les interactions entre diverses pratiques spirituelles.",
  "L'examen de l'impact transformateur des héritages culturels sur les expressions spirituelles modernes en Haïti.",
  "La création d'égregores avec facilité et exactitude.",
  "Le coaching spirituel destiné à accompagner les individus dans la résolution de leurs conflits intérieurs.",
  "Le cœur de son travail, fondé sur la connaissance du soi supérieur.",
];

const publications = [
  "Les secrets des maîtres : mort, où est ton aiguillon ? enfer, où est ta victoire ?",
  "Derrière le voile de marie-madeleine : les deux faces cachées de la sexualité – féminin sacré et pouvoirs de la sexualité",
  "La domination des égrégores : quand le créateur adore ses créatures – libération ultime",
  "La loi des cycles : les séquelles spirituelles des conflits identitaires",
  "Du vodou colonial au vodou transcendantal : dépasser les héritages coloniaux et s'ouvrir à l'amour de la déesse freda",
  "Les lois occultes de l'influence magique : le mage n'agit pas : il réoriente les courants subtils",
  "Vivre au-dessus du bien et du mal : la voie de l'élévation spirituelle",
  "L'art de créer des ponts astraux : pour guérir et protéger sans contact physique",
  "Rencontres karmiques : un rendez-vous éternel",
];

const institutions = [
  { name: "Communauté Mystique Eyeh Asher Eyeh", year: "2016", desc: "Comptant aujourd'hui une minorité de membres actifs." },
  { name: "Tradition Mystique Echo Cosmique", year: "2018", desc: "Considérée comme la matrice de tous les ordres créés par lui." },
  { name: "Temple Reiki Usui d'Haïti (TRUH)", year: "2018", desc: "Ayant formé plus de 2 000 praticiens certifiés." },
  { name: "Ordre de Myriam (Temy)", year: "2020", desc: "Dédié à l'initiation féminine." },
  { name: "Ordre des Adeptes Noirs (ODAN)", year: "2021", desc: "Créé pour contribuer à régulariser l'égregore mystique d'Haïti." },
  { name: "Temple des 13 Mères (Temsu-13)", year: "2022", desc: "Axé sur les hautes initiations des 13 mères de la T-MEC." },
];

export default function AuteurPage() {
  return (
    <div className="min-h-screen py-16 px-4 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-silver-500 hover:text-gold-400 text-sm transition-colors mb-10">
        ← Retour à l'accueil
      </Link>

      {/* Hero */}
      <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
        <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-gold-500/40 shadow-[0_0_40px_rgba(201,168,76,0.25)] flex-shrink-0">
          <img
            src="https://oriiunftyumqcrniepux.supabase.co/storage/v1/object/public/IMAGE/3b0d1-my-pic-5-1-819x1024-1.webp"
            alt="Le Comte de Sabatha"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-2">L'Auteur</p>
          <h1 className="font-serif text-4xl md:text-5xl text-silver-200 font-light leading-tight mb-3">
            Le Comte de Sabatha
          </h1>
          <p className="text-gold-400 font-serif italic text-lg mb-4">Maître de la Connaissance Alchimique</p>
          <p className="text-silver-400 text-sm leading-relaxed max-w-xl">
            Auteur prolifique, il a publié plusieurs ouvrages ainsi que de nombreux articles sur le mysticisme, la spiritualité comparée et l'anthropologie spirituelle, disponibles sur des plateformes académiques telles que Harvard Dataverse, Academia.edu et Zenodo.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {['Harvard Dataverse', 'Academia.edu', 'Zenodo'].map(p => (
              <span key={p} className="text-xs border border-gold-700/40 text-gold-500 px-3 py-1 rounded-full">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="divider-gold mb-12" />

      {/* Biographie */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-gold-300 mb-6">Biographie</h2>
        <div className="card-dark p-6 rounded-2xl border-l-2 border-gold-600/50">
          <p className="text-silver-400 text-sm leading-relaxed">
            Le Comte de Sabatha, né à Port-au-Prince, Haïti, est un chercheur autodidacte de renom, spécialisé dans les traditions ésotériques et mystiques. Son engagement intellectuel se distingue par un profond dévouement à l'approfondissement de la compréhension des phénomènes spirituels et culturels grâce à une recherche rigoureuse et à une expérience personnelle enrichissante.
          </p>
          <p className="text-silver-400 text-sm leading-relaxed mt-4">
            Élevé dans un environnement influencé par le protestantisme et le catholicisme, son parcours spirituel l'a conduit à s'immerger dans un large éventail de traditions religieuses, incluant le christianisme, le bouddhisme, l'hindouisme et le vodou haïtien. Après des études classiques en Haïti, il a obtenu un certificat en technologie de l'information à l'Ivy Tech Community College de Fort Wayne, Indiana, États-Unis, en 2005.
          </p>
          <p className="text-silver-400 text-sm leading-relaxed mt-4">
            Initié à diverses traditions mystiques, il apporte une perspective unique à ses recherches, alliant des insights personnels à une rigueur académique. Il collabore régulièrement avec des loges maçonniques et des temples en Amérique et en Europe, participant à des symposiums annuels sur les traditions ésotériques depuis 2023.
          </p>
        </div>
      </section>

      {/* Domaines */}
      <section className="mb-12">
        <h2 className="font-serif text-2xl text-gold-300 mb-6">Domaines de Spécialisation</h2>
        <div className="space-y-3">
          {specializations.map((s, i) => (
            <div key={i} className="flex gap-4 card-dark p-4 rounded-xl">
              <span className="text-gold-600 font-serif text-sm w-6 flex-shrink-0">{i + 1}.</span>
              <p className="text-silver-400 text-sm leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Publications */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-5 h-5 text-gold-400" />
          <h2 className="font-serif text-2xl text-gold-300">Publications</h2>
        </div>
        <div className="space-y-3">
          {publications.map((pub, i) => (
            <div key={i} className="flex gap-4 items-start card-dark p-4 rounded-xl hover:border-gold-600/30 border border-transparent transition-colors">
              <span className="text-gold-600 font-serif text-sm w-6 flex-shrink-0">{i + 1}.</span>
              <p className="text-silver-300 text-sm leading-relaxed italic">"{pub}"</p>
            </div>
          ))}
          <div className="flex gap-4 items-start card-dark p-4 rounded-xl border border-gold-600/20">
            <span className="text-gold-600 font-serif text-sm w-6 flex-shrink-0">✦</span>
            <div>
              <p className="text-silver-300 text-sm leading-relaxed italic">"Les Portes de la Supraconscience : Une Synthèse des Traditions Mystiques Globales"</p>
              <span className="text-gold-500/70 text-xs mt-1 inline-block">Prévu pour 2027</span>
            </div>
          </div>
        </div>
        <Link href="/boutique" className="mt-6 inline-flex items-center gap-2 btn-gold px-5 py-2.5 rounded-xl text-sm">
          <BookOpen className="w-4 h-4" />
          Voir tous les livres
        </Link>
      </section>

      {/* Institutions */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-gold-400" />
          <h2 className="font-serif text-2xl text-gold-300">Engagements & Institutions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {institutions.map((inst, i) => (
            <div key={i} className="card-dark p-5 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-silver-300 text-sm font-medium leading-snug flex-1 pr-3">{inst.name}</h3>
                <span className="text-gold-600 text-xs border border-gold-700/30 px-2 py-0.5 rounded-full flex-shrink-0">{inst.year}</span>
              </div>
              <p className="text-silver-500 text-xs leading-relaxed">{inst.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Affiliations */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-5 h-5 text-gold-400" />
          <h2 className="font-serif text-2xl text-gold-300">Initiations & Affiliations</h2>
        </div>
        <div className="card-dark p-6 rounded-2xl">
          <div className="flex flex-wrap gap-2">
            {[
              'Maître Reiki (2015)', 'Franc-maçonnerie (2012)', 'Golden Dawn (2015)',
              'Rose-Croix (2016)', 'Martinisme (2016)', 'MONAY KI — Chamanisme (2015)',
              'IAOT — Guérison angélique',
            ].map(a => (
              <span key={a} className="text-silver-400 text-xs border border-ash px-3 py-1.5 rounded-full">{a}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Langues */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-gold-400" />
          <h2 className="font-serif text-2xl text-gold-300">Langues</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          {['Français', 'Créole haïtien', 'Anglais'].map(l => (
            <span key={l} className="text-silver-300 text-sm border border-gold-700/30 px-4 py-2 rounded-full">{l}</span>
          ))}
        </div>
      </section>

      <div className="divider-gold mb-10" />

      {/* CTA */}
      <div className="text-center">
        <p className="text-silver-500 text-sm mb-4">Découvrez les œuvres du Comte de Sabatha</p>
        <Link href="/boutique" className="btn-gold px-8 py-3 rounded-xl text-sm">
          Explorer la boutique
        </Link>
      </div>
    </div>
  );
}
