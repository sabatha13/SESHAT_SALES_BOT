'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  Plus, Edit, Eye, EyeOff, BookOpen, Check, AlertCircle,
  Mail, Search, TrendingUp, Users, Tag,
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  is_published: boolean;
  created_at: string;
  read_count: number;
  cover_url: string | null;
}

interface Props {
  books: Book[];
  totalRevenue: number;
}

export default function BooksClient({ books: initialBooks, totalRevenue }: Props) {
  const [books, setBooks] = useState(initialBooks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');

  const publishedCount = books.filter(b => b.is_published).length;
  const totalReaders = books.reduce((sum, b) => sum + b.read_count, 0);
  const freeCount = books.filter(b => b.price === 0).length;

  const filteredBooks = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }, [books, search]);

  const allSelected = filteredBooks.length > 0 && filteredBooks.every(b => selected.has(b.id));

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(filteredBooks.map(b => b.id)));
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

  const kpis = [
    {
      label: 'Livres',
      value: books.length.toString(),
      icon: BookOpen,
    },
    {
      label: 'Publiés',
      value: publishedCount.toString(),
      icon: Eye,
    },
    {
      label: 'Revenus',
      value: formatPrice(totalRevenue),
      icon: TrendingUp,
    },
    {
      label: 'Lecteurs',
      value: totalReaders.toLocaleString('fr-FR'),
      icon: Users,
    },
    {
      label: 'Livres gratuits',
      value: freeCount.toString(),
      icon: Tag,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Livres</h1>
          <p className="text-silver-500 text-sm">Gérez votre catalogue de publications.</p>
          <p className="text-silver-600 text-xs mt-1">
            {books.length} livre{books.length !== 1 ? 's' : ''}
            {' '}•{' '}
            {publishedCount} publié{publishedCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-dark px-5 py-4 rounded-xl flex flex-col gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-gold-500" />
            </div>
            <div>
              <p className="font-serif text-2xl text-silver-200 leading-none tabular-nums">{value}</p>
              <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Feedback ───────────────────────────────────────────── */}
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
        <input
          type="text"
          placeholder="Rechercher par titre, auteur ou catégorie..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-charcoal border border-ash/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50 transition-colors"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
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
                {['Livre', 'Catégorie', 'Prix', 'Lectures', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map(book => (
                <tr
                  key={book.id}
                  className={`border-b border-ash/20 hover:bg-charcoal/30 transition-colors ${selected.has(book.id) ? 'bg-gold-900/10' : ''}`}
                >
                  <td className="px-4 py-3 align-top pt-4">
                    <input
                      type="checkbox"
                      checked={selected.has(book.id)}
                      onChange={() => toggleSelect(book.id)}
                      className="w-4 h-4 rounded border-ash/50 bg-charcoal accent-gold-500 cursor-pointer"
                    />
                  </td>

                  {/* Livre — cover + title + author + date */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {/* Cover thumbnail */}
                      <div
                        className="shrink-0 rounded-lg overflow-hidden border border-ash/30"
                        style={{ width: 60, height: 90, boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                      >
                        {book.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(145deg, #1C1C1F 0%, #141416 100%)' }}
                          >
                            <BookOpen className="w-5 h-5 text-gold-700/60" />
                          </div>
                        )}
                      </div>

                      {/* Text info */}
                      <div className="min-w-0 pt-0.5">
                        <p className="text-silver-200 text-sm font-medium line-clamp-2 max-w-[180px] leading-snug">
                          {book.title}
                        </p>
                        <p className="text-silver-500 text-xs mt-1">{book.author}</p>
                        <p className="text-silver-600 text-[10px] mt-1.5 font-mono tabular-nums">
                          {formatDate(book.created_at)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top pt-4">
                    <span className="text-gold-600 text-xs border border-gold-700/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {book.category}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top pt-4 text-silver-300 text-sm tabular-nums">
                    {formatPrice(book.price)}
                  </td>

                  <td className="px-4 py-3 align-top pt-4">
                    <span className="flex items-center gap-1 text-silver-400 text-sm tabular-nums">
                      <BookOpen className="w-3 h-3 text-gold-600 shrink-0" />
                      {book.read_count}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top pt-4">
                    <span className={`flex items-center gap-1 text-xs ${book.is_published ? 'text-emerald-400' : 'text-silver-500'}`}>
                      {book.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {book.is_published ? 'Publié' : 'Masqué'}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top pt-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/livres/${book.id}`}
                        className="flex items-center gap-1 text-gold-500 hover:text-gold-300 text-xs transition-colors"
                      >
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
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-silver-500 text-sm">
                    {search
                      ? 'Aucun livre ne correspond à la recherche.'
                      : <><span>Aucun livre. </span><Link href="/admin/livres/nouveau" className="text-gold-400 hover:underline">Ajouter le premier</Link></>
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-ash/20 text-right">
          <p className="text-silver-600 text-xs">
            {filteredBooks.length} livre{filteredBooks.length !== 1 ? 's' : ''} affiché{filteredBooks.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
