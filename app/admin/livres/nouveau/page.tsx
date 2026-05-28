import BookForm from '@/components/admin/BookForm';

export default function NouveauLivrePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl text-silver-200 mb-1">Ajouter un livre</h1>
        <p className="text-silver-500 text-sm">Créer un nouveau livre dans le catalogue</p>
      </div>
      <BookForm />
    </div>
  );
}
