import BookCard from './BookCard';
import { Book } from '@/lib/types';

interface BookGridProps {
  books: Book[];
  ownedBookIds?: string[];
  emptyMessage?: string;
}

export default function BookGrid({ books, ownedBookIds = [], emptyMessage = 'Aucun livre disponible.' }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-gold-700/50 text-6xl font-serif mb-4">✦</div>
        <p className="text-silver-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {books.map(book => (
        <BookCard
          key={book.id}
          book={book}
          owned={ownedBookIds.includes(book.id)}
        />
      ))}
    </div>
  );
}
