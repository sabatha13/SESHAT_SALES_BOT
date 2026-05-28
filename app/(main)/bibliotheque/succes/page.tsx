import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SuccesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-emerald-900/30 border border-emerald-700/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="font-serif text-4xl text-silver-200 mb-3">Achat confirmé !</h1>
        <p className="text-silver-500 mb-8 leading-relaxed">
          Votre paiement a été accepté. Le livre est maintenant disponible dans votre bibliothèque personnelle.
        </p>
        <Link href="/bibliotheque" className="btn-gold px-8 py-3 rounded-xl inline-block">
          Accéder à ma bibliothèque
        </Link>
      </div>
    </div>
  );
}
