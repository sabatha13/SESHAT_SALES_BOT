'use client';
import { useState } from 'react';
import BookForm from '@/components/admin/BookForm';
import BookAnalytics from './BookAnalytics';

type Tab = 'overview' | 'content' | 'newsletter' | 'analytics';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Vue d\'ensemble' },
  { key: 'content', label: 'Contenu' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'analytics', label: 'Analytics' },
];

export default function BookDetailTabs({ book }: { book: any }) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-ash/30">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px ${
              tab === key
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-silver-500 hover:text-silver-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="max-w-3xl">
          <BookForm book={book} />
        </div>
      )}
      {tab === 'content' && (
        <div className="card-dark rounded-2xl p-6 max-w-3xl">
          <p className="text-silver-500 text-sm">Gestion du contenu bientôt disponible.</p>
        </div>
      )}
      {tab === 'newsletter' && (
        <div className="card-dark rounded-2xl p-6 max-w-3xl">
          <p className="text-silver-500 text-sm">Gestion des newsletters bientôt disponible.</p>
        </div>
      )}
      {tab === 'analytics' && (
        <BookAnalytics bookId={book.id} bookTitle={book.title} />
      )}
    </div>
  );
}
