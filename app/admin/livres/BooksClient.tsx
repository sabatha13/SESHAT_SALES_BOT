'use client';
import { useState } from 'react';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';
import { Plus, Edit, Eye, EyeOff, BookOpen, Check, AlertCircle, Mail } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  is_published: boolean;
  created_at: string;
  read_count: number;
}

export default function BooksClient({ books: initialBooks }: { books: Book[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const allSelected = books.length > 0 && selected.size === books.length;

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(books.map(b => b.id)));
  }

  async function bulkPublish(is_published: boolean) {
    if (selected.size === 0) return;
    const ids = [...selected];
    setLoading(is_published ? 'publish' : 'unpublish');
    setMsg(null);
    const res = await fetch('/api/admin/toggle-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_ids: ids, is_published }),
    });
    if (res.ok) {
      setBooks(prev => prev.map(b => selected.has(b.id) ? { ...b, is_published } : b));
      setSelected(new Set());
      setMsg({ type: 'success', text: `${ids.length} livre${ids.length > 1 ? 's' : ''} ${is_published ? 'publié' : 'masqué'}${ids.length > 1 ? 's' : ''}.` });
    } else {
      setMsg({ type: 'error', text: 'Erreur lors de la mise à jour.' });
    }
    setLoading('');
  }

  async function sendNewsletter(bookId: string, bookTitle: string) {
    if (!confirm(`Envoyer une newsletter à tous les utilisateurs pour "${bookTitle}" ?`)) return;
    setLoading(`newsletter-${bookId}`);
    setMsg(null);
    const res = await fetch('/api/admin/send-book-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId }),
    });
    const data = await res.json();
    setMsg(res.ok
      ? { type: 'success', text: `Newsletter envoyée à ${data.sent} utilisateur${data.sent > 1 ? 's' : ''} !` }
      : { type: 'error', text: data.error || 'Erreur envoi newsletter.' }
    );
    setLoading('');
  }

  async function sendBulkNewsletter() {
    if (selected.size === 0) return;
    const selectedBooks = books.filter(b => selected.has(b.id));
    const titles = selectedBooks.map(b => `"${b.title}"`).join(', ');
    if (!confirm(`Envoyer une newsletter avec ${selected.size} livre${selected.size > 1 ? 's' : ''} :\n${titles}\n\nÀ tous les utilisateurs ?`)) return;
    setLoading('bulk-newsletter');
    setMsg(null);
    const res = await fetch('/api/admin/send-bulk-newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_ids: [...selected] }),
    });
    const data = await res.json();
    setMsg(res.ok
      ? { type: 'success', text: `Newsletter envoyée à ${data.sent} utilisateur${data.sent > 1 ? 's' : ''} avec ${selected.size} livre${selected.size > 1 ? 's' : ''} !` }
      : { type: 'error', text: data.error || 'Erreur envoi newsletter.' }
    );
    setSelected(new Set());
    setLoading('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Livres</h1>
          <p className="text-silver-500 text-sm">{books.length} livre{books.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <>
              <span className="text-silver-500 text-sm">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
              <button
                onClick={sendBulkNewsletter}
                disabled={!!loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 text-sm hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {loading === 'bulk-newsletter' ? 'Envoi...' : `Newsletter (${selected.size})`}
              </button>
              <button
                onClick={() => bulkPublish(true)}
                disabled={!!loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-all disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                {loading === 'publish' ? '...' : 'Publier'}
              </button>
              <button
                onClick={() => bulkPublish(false)}
                disabled={!!loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ash/20 border border-ash/40 text-silver-400 text-sm hover:bg-ash/30 transition-all disabled:opacity-50"
              >
                <EyeOff className="w-4 h-4" />
                {loading === 'unpublish' ? '...' : 'Masquer'}
              </button>
            </>
          )}
          <Link href="/admin/livres/nouveau" className="btn-gold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Ajouter
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/50">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-ash/50 bg-charcoal accent-gold-500 cursor-pointer"
                />
              </th>
              {['Titre', 'Auteur', 'Catégorie', 'Prix', 'Lectures', 'Statut', 'Ajouté le', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id} className={`border-b border-ash/20 hover:bg-charcoal/30 transition-colors ${selected.has(book.id) ? 'bg-gold-900/10' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(book.id)}
                    onChange={() => toggleSelect(book.id)}
                    className="w-4 h-4 rounded border-ash/50 bg-charcoal accent-gold-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="text-silver-300 text-sm font-medium line-clamp-1 max-w-[200px]" title={book.title}>{book.title}</p>
                </td>
                <td className="px-4 py-3 text-silver-500 text-sm">{book.author}</td>
                <td className="px-4 py-3">
                  <span className="text-gold-600 text-xs border border-gold-700/30 px-2 py-0.5 rounded-full">{book.category}</span>
                </td>
                <td className="px-4 py-3 text-silver-300 text-sm">{formatPrice(book.price)}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-silver-400 text-sm">
                    <BookOpen className="w-3 h-3 text-gold-600" />
                    {book.read_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs ${book.is_published ? 'text-emerald-400' : 'text-silver-500'}`}>
                    {book.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {book.is_published ? 'Publié' : 'Masqué'}
                  </span>
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(book.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/livres/${book.id}`} className="flex items-center gap-1 text-gold-500 hover:text-gold-300 text-xs transition-colors">
                      <Edit className="w-3 h-3" />
                      Modifier
                    </Link>
                    {book.is_published && (
                      <button
                        onClick={() => sendNewsletter(book.id, book.title)}
                        disabled={loading === `newsletter-${book.id}`}
                        title="Envoyer newsletter"
                        className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs transition-colors disabled:opacity-50"
                      >
                        <Mail className="w-3 h-3" />
                        {loading === `newsletter-${book.id}` ? '...' : 'Newsletter'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-silver-500 text-sm">
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
