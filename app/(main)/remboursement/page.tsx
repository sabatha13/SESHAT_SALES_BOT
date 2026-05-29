import { RefreshCw } from 'lucide-react';

export default function RemboursementPage() {
  return (
    <div className="min-h-screen py-20 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <RefreshCw className="w-6 h-6 text-gold-400" />
        <h1 className="font-serif text-3xl gold-text">Politique de Remboursement</h1>
      </div>
      <div className="card-dark rounded-2xl p-8 space-y-6 text-silver-400 text-sm leading-relaxed">
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Achats de livres numériques</h2>
          <p>Conformément à l'article L221-28 du Code de la consommation, les biens numériques dont la fourniture a commencé avec l'accord du consommateur ne peuvent faire l'objet d'un remboursement. Néanmoins, nous examinons chaque demande au cas par cas.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Abonnements</h2>
          <p>Vous pouvez annuler votre abonnement à tout moment. L'accès reste actif jusqu'à la fin de la période en cours. Aucun remboursement partiel n'est accordé pour les jours restants.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Contact</h2>
          <p>Pour toute demande, contactez-nous via notre formulaire de support. Nous répondons sous 48h ouvrées.</p>
        </section>
      </div>
    </div>
  );
}
