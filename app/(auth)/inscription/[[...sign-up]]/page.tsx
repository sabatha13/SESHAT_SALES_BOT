import { SignUp } from '@clerk/nextjs';

export default function InscriptionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-void">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="ornament text-2xl mb-3">✦</p>
          <h1 className="font-serif text-3xl gold-text mb-2">Créer un compte</h1>
          <p className="text-silver-500 text-sm">Rejoignez la bibliothèque ésotérique CDS</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
