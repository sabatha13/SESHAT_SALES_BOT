import { Lock } from 'lucide-react';

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen py-20 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-10">
        <Lock className="w-6 h-6 text-gold-400" />
        <h1 className="font-serif text-3xl gold-text">Politique de Confidentialité</h1>
      </div>
      <div className="card-dark rounded-2xl p-8 space-y-6 text-silver-400 text-sm leading-relaxed">
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Données collectées</h2>
          <p>Nous collectons votre adresse email, nom, et données de paiement (via Stripe) lors de la création de votre compte et de vos achats.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Utilisation des données</h2>
          <p>Vos données sont utilisées pour gérer votre compte, traiter vos paiements, et vous donner accès à vos livres. Nous ne vendons jamais vos données.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Cookies</h2>
          <p>Ce site utilise des cookies fonctionnels nécessaires au bon fonctionnement de la plateforme (authentification, préférences). Aucun cookie publicitaire n'est utilisé.</p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-silver-200 mb-2">Vos droits</h2>
          <p>Vous pouvez demander la suppression de votre compte et de vos données à tout moment via notre formulaire de contact.</p>
        </section>
      </div>
    </div>
  );
}
