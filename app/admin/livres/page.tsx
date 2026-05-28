import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { formatPrice, formatDate } from '@/lib/utils';
import { Plus, Edit, Eye, EyeOff } from 'lucide-react';

async function getAllBooks() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export default async function AdminLivresPage() {
  const books = await getAllBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Livres</h1>
          <p className="text-silver-500 text-sm">{books.length} livre{books.length !== 1 ? 's' : ''} au total</p>
        </div>
        <Link href="/admin/livres/nouveau" className="btn-gold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Ajouter
        </Link>
      </div>

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/50">
              {['Titre', 'Auteur', 'Catégorie', 'Prix', 'Statut', 'Ajouté le', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id} className="border-b border-ash/20 hover:bg-charcoal/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-silver-300 text-sm font-medium line-clamp-1 max-w-[200px]">{book.title}</p>
                </td>
                <td className="px-4 py-3 text-silver-500 text-sm">{book.author}</td>
                <td className="px-4 py-3">
                  <span className="text-gold-600 text-xs border border-gold-700/30 px-2 py-0.5 rounded-full">
                    {book.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-silver-300 text-sm">{formatPrice(book.price)}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs ${book.is_published ? 'text-emerald-400' : 'text-silver-500'}`}>
                    {book.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {book.is_published ? 'Publié' : 'Masqué'}
                  </span>
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(book.created_at)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/livres/${book.id}`} className="flex items-center gap-1 text-gold-500 hover:text-gold-300 text-xs transition-colors">
                    <Edit className="w-3 h-3" />
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-silver-500 text-sm">
                  Aucun livre. <Link href="/admin/livres/nouveau" className="text-gold-400 hover:underline">Ajouter le premier</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
