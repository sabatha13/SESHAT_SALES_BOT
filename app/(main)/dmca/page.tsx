import { Shield } from 'lucide-react';

export default function DmcaPage() {
  return (
    <div className="min-h-screen py-20 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <Shield className="w-6 h-6 text-gold-400" />
        <h1 className="font-serif text-3xl gold-text">DMCA & Droits d'auteur</h1>
      </div>
      <div className="card-dark rounded-2xl p-8 space-y-6 text-silver-400 text-sm leading-relaxed">
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Protection des œuvres</h2>
          <p>Tous les livres numériques disponibles sur CDS Librairie Ésotérique sont protégés par le droit d'auteur. Toute reproduction, distribution, ou partage non autorisé constitue une violation de ces droits.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Signaler une violation</h2>
          <p>Si vous êtes titulaire de droits et estimez que votre œuvre est utilisée sans autorisation, contactez-nous immédiatement via notre formulaire de support avec les informations suivantes :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Identification de l'œuvre protégée</li>
            <li>Preuve de votre droit de propriété</li>
            <li>Localisation du contenu litigieux</li>
            <li>Vos coordonnées</li>
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Mesures DRM</h2>
          <p>Nos livres numériques incluent un filigrane personnalisé avec l'adresse email et l'identifiant de l'acheteur. Toute copie non autorisée est traçable et passible de poursuites.</p>
        </section>
      </div>
    </div>
  );
}
