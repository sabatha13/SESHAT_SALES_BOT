import { createServerClient } from '@/lib/supabase/server';
import BookGrid from '@/components/books/BookGrid';
import { Book } from '@/lib/types';
import { Search } from 'lucide-react';

interface Props {
  searchParams: { categorie?: string; q?: string };
}

const categories = ['Tous', 'Magie', 'Kabbale', 'Alchimie', 'Astrologie', 'Tarot', 'Numérologie', 'Hermétisme', 'Chamanisme'];

async function getBooks(category?: string, query?: string): Promise<Book[]> {
  try {
    const supabase = createServerClient();
    let q = supabase.from('books').select('*').eq('is_published', true);

    if (category && category !== 'Tous') {
      q = q.eq('category', category);
    }
    if (query) {
      q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`);
    }

    const { data } = await q.order('created_at', { ascending: false });
    return data || [];
  } catch {
    return [];
  }
}

export default async function BoutiquePage({ searchParams }: Props) {
  const { categorie, q } = searchParams;
  const books = await getBooks(categorie, q);

  return (
    <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-gold-600 uppercase tracking-[0.3em] text-xs mb-3">Notre collection</p>
        <h1 className="section-title">La Boutique</h1>
        <div className="divider-gold mt-4 mb-6" />
        <p className="text-silver-500 text-sm max-w-xl mx-auto">
          Découvrez notre sélection de livres numériques ésotériques, disponibles à la lecture instantanée dans votre bibliothèque personnelle.
        </p>
      </div>

      {/* Search */}
      <form className="max-w-lg mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un titre, auteur…"
            className="w-full bg-charcoal border border-ash text-silver-300 placeholder-silver-500 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-gold-600/50 focus:ring-1 focus:ring-gold-600/20 transition-all"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-gold px-4 py-1.5 rounded-lg text-xs">
            Chercher
          </button>
        </div>
      </form>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map(cat => {
          const active = (!categorie && cat === 'Tous') || categorie === cat;
          return (
            <a
              key={cat}
              href={cat === 'Tous' ? '/boutique' : `/boutique?categorie=${encodeURIComponent(cat)}`}
              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-300 ${
                active
                  ? 'bg-gold-600 text-void font-medium shadow-gold-sm'
                  : 'border border-ash text-silver-500 hover:border-gold-600/40 hover:text-silver-300'
              }`}
            >
              {cat}
            </a>
          );
        })}
      </div>

      {/* Results count */}
      {(categorie || q) && (
        <p className="text-silver-500 text-sm mb-6">
          {books.length} livre{books.length !== 1 ? 's' : ''} trouvé{books.length !== 1 ? 's' : ''}
          {categorie ? ` dans "${categorie}"` : ''}
          {q ? ` pour "${q}"` : ''}
        </p>
      )}

      <BookGrid
        books={books}
        emptyMessage="Aucun livre ne correspond à votre recherche."
      />
    </div>
  );
}
