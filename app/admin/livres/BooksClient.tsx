'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  Plus, Edit, Eye, EyeOff, BookOpen, Check, AlertCircle, Info,
  Mail, Search, TrendingUp, Users, Tag, MoreHorizontal, Loader2,
  ExternalLink, Copy, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

type SortKey = 'title' | 'category' | 'price' | 'read_count' | 'is_published' | 'created_at';
type FilterKey = 'all' | 'published' | 'draft' | 'paid' | 'free' | string;

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

// ─── Sub-components ──────────────────────────────────────────

function StatusBadge({ is_published }: { is_published: boolean }) {
  if (is_published) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        Publié
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      Brouillon
    </span>
  );
}

function SortHeader({
  label, sortKey, current, dir, onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey | null;
  dir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} className="px-4 py-3 text-left cursor-pointer select-none">
      <span className="flex items-center gap-1 text-silver-500 text-xs uppercase tracking-wide font-medium hover:text-silver-300 transition-colors duration-150">
        {label}
        {active
          ? dir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-gold-500" />
            : <ChevronDown className="w-3 h-3 text-gold-500" />
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />
        }
      </span>
    </th>
  );
}

function IconBtn({
  label, onClick, disabled, href, newTab, className = '', children,
}: {
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  href?: string;
  newTab?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const base = `w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200
    hover:bg-ash/40 disabled:opacity-40 disabled:cursor-not-allowed
    text-silver-500 hover:text-silver-200 ${className}`;
  if (href) {
    return (
      <Link href={href} title={label} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined} className={base}>
        {children}
      </Link>
    );
  }
  return (
    <button title={label} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  );
}

function SkeletonKpi() {
  return (
    <div className="card-dark px-5 py-4 rounded-xl flex flex-col gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-ash/40" />
      <div className="space-y-2">
        <div className="w-16 h-6 rounded bg-ash/40" />
        <div className="w-10 h-2 rounded bg-ash/25" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-ash/20 animate-pulse">
      <td className="px-4 py-3 align-top pt-4"><div className="w-4 h-4 rounded bg-ash/30" /></td>
      <td className="px-4 py-3">
        <div className="flex gap-3 items-start">
          <div className="w-[60px] h-[90px] rounded-lg bg-ash/30 shrink-0" />
          <div className="space-y-2 pt-1">
            <div className="w-32 h-3 rounded bg-ash/30" />
            <div className="w-20 h-2 rounded bg-ash/20" />
            <div className="w-14 h-2 rounded bg-ash/15" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top pt-4"><div className="w-20 h-5 rounded-full bg-ash/30" /></td>
      <td className="px-4 py-3 align-top pt-4"><div className="w-12 h-3 rounded bg-ash/30" /></td>
      <td className="px-4 py-3 align-top pt-4"><div className="w-8 h-3 rounded bg-ash/30" /></td>
      <td className="px-4 py-3 align-top pt-4"><div className="w-16 h-6 rounded-full bg-ash/30" /></td>
      <td className="px-4 py-3 align-top pt-4">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => <div key={i} className="w-9 h-9 rounded-lg bg-ash/30" />)}
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────

export default function BooksClient({ books: initialBooks, totalRevenue }: Props) {
  const [books, setBooks] = useState(initialBooks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Initial skeleton — true until first client render completes
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setIsReady(true); }, []);

  // Close ⋮ dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const close = () => setOpenDropdown(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openDropdown]);

  const publishedCount = books.filter(b => b.is_published).length;
  const totalReaders = books.reduce((sum, b) => sum + b.read_count, 0);
  const freeCount = books.filter(b => b.price === 0).length;

  const categories = useMemo(
    () => [...new Set(books.map(b => b.category).filter(Boolean))].sort(),
    [books]
  );

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }

    if (activeFilter === 'published') result = result.filter(b => b.is_published);
    else if (activeFilter === 'draft') result = result.filter(b => !b.is_published);
    else if (activeFilter === 'paid') result = result.filter(b => b.price > 0);
    else if (activeFilter === 'free') result = result.filter(b => b.price === 0);
    else if (activeFilter !== 'all') result = result.filter(b => b.category === activeFilter);

    if (sortKey) {
      result.sort((a, b) => {
        const av = a[sortKey as keyof Book];
        const bv = b[sortKey as keyof Book];
        let cmp = 0;
        if (typeof av === 'boolean' && typeof bv === 'boolean') {
          // false (brouillon=0) < true (publié=1) → ASC = brouillons d'abord
          cmp = av === bv ? 0 : av ? 1 : -1;
        } else if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv;
        } else {
          const as = String(av).toLowerCase();
          const bs = String(bv).toLowerCase();
          cmp = as < bs ? -1 : as > bs ? 1 : 0;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [books, search, activeFilter, sortKey, sortDir]);

  const allSelected = filteredBooks.length > 0 && filteredBooks.every(b => selected.has(b.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

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

  async function togglePublish(bookId: string, is_published: boolean) {
    setLoading(`toggle-${bookId}`);
    const res = await fetch('/api/admin/toggle-publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_ids: [bookId], is_published }),
    });
    if (res.ok) {
      setBooks(prev => prev.map(b => b.id === bookId ? { ...b, is_published } : b));
      setMsg({ type: 'success', text: is_published ? 'Livre publié.' : 'Livre masqué.' });
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
    { label: 'Livres', value: books.length.toString(), icon: BookOpen },
    { label: 'Publiés', value: publishedCount.toString(), icon: Eye },
    { label: 'Revenus', value: formatPrice(totalRevenue), icon: TrendingUp },
    { label: 'Lecteurs', value: totalReaders.toLocaleString('fr-FR'), icon: Users },
    { label: 'Livres gratuits', value: freeCount.toString(), icon: Tag },
  ];

  const STATIC_FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'published', label: 'Publiés' },
    { key: 'draft', label: 'Brouillons' },
    { key: 'paid', label: 'Payants' },
    { key: 'free', label: 'Gratuits' },
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
                {loading === 'publish'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Eye className="w-4 h-4" />
                }
                {loading === 'publish' ? 'Publication...' : 'Publier'}
              </button>
              <button
                onClick={() => bulkPublish(false)}
                disabled={!!loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ash/20 border border-ash/40 text-silver-400 text-sm hover:bg-ash/30 transition-all disabled:opacity-50"
              >
                {loading === 'unpublish'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <EyeOff className="w-4 h-4" />
                }
                {loading === 'unpublish' ? 'Masquage...' : 'Masquer'}
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
        {!isReady
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonKpi key={i} />)
          : kpis.map(({ label, value, icon: Icon }) => (
            <div key={label} className="card-dark px-5 py-4 rounded-xl flex flex-col gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gold-500" />
              </div>
              <div>
                <p className="font-serif text-2xl text-silver-200 leading-none tabular-nums">{value}</p>
                <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1.5">{label}</p>
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Feedback ───────────────────────────────────────────── */}
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          msg.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : msg.type === 'info'
              ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg.type === 'success'
            ? <Check className="w-4 h-4" />
            : msg.type === 'info'
              ? <Info className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />
          }
          {msg.text}
        </div>
      )}

      {/* ── Search + Filters ────────────────────────────────────── */}
      <div className="space-y-3">
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

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {STATIC_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                activeFilter === key
                  ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                  : 'bg-charcoal border-ash/40 text-silver-500 hover:border-ash/70 hover:text-silver-300'
              }`}
            >
              {label}
            </button>
          ))}
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
                activeFilter === cat
                  ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                  : 'bg-charcoal border-ash/40 text-silver-500 hover:border-ash/70 hover:text-silver-300'
              }`}
            >
              {cat}
            </button>
          ))}
          {(activeFilter !== 'all' || search) && (
            <button
              onClick={() => { setActiveFilter('all'); setSearch(''); }}
              className="px-3 py-1 rounded-full text-xs font-medium border border-ash/30 text-silver-600 hover:text-silver-400 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Effacer
            </button>
          )}
        </div>
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
                <SortHeader label="Livre" sortKey="title" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Catégorie" sortKey="category" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Prix" sortKey="price" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Lectures" sortKey="read_count" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortHeader label="Statut" sortKey="is_published" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-silver-500 text-xs uppercase tracking-wide font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {!isReady
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filteredBooks.map(book => (
                  <tr
                    key={book.id}
                    className={`group border-b border-ash/20 transition-colors duration-200 ${
                      selected.has(book.id)
                        ? 'bg-gold-900/10 hover:bg-gold-900/15'
                        : 'hover:bg-charcoal/40'
                    }`}
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
                        {/* Cover — scales 103% on row hover */}
                        <div
                          className="shrink-0 rounded-lg overflow-hidden border border-ash/30 transition-transform duration-200 group-hover:scale-[1.03]"
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

                        <div className="min-w-0 pt-0.5">
                          <p className="text-silver-200 text-sm font-medium line-clamp-2 max-w-[180px] leading-snug group-hover:text-silver-100 transition-colors duration-200">
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
                      {book.price === 0
                        ? <span className="text-emerald-500 font-medium text-xs">Gratuit</span>
                        : formatPrice(book.price)
                      }
                    </td>

                    <td className="px-4 py-3 align-top pt-4">
                      <span className="flex items-center gap-1 text-silver-400 text-sm tabular-nums">
                        <BookOpen className="w-3 h-3 text-gold-600 shrink-0" />
                        {book.read_count.toLocaleString('fr-FR')}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top pt-4">
                      <StatusBadge is_published={book.is_published} />
                    </td>

                    {/* Actions — fade in on row hover */}
                    <td className="px-4 py-3 align-top pt-3">
                      <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200">

                        {/* ✏ Edit */}
                        <IconBtn label="Modifier" href={`/admin/livres/${book.id}`}>
                          <Edit className="w-4 h-4" />
                        </IconBtn>

                        {/* 👁 Preview */}
                        <IconBtn label="Aperçu public" href={`/livre/${book.id}`} newTab>
                          <ExternalLink className="w-4 h-4" />
                        </IconBtn>

                        {/* 📧 Newsletter */}
                        <IconBtn
                          label={book.is_published ? 'Envoyer newsletter' : 'Livre non publié'}
                          onClick={() => sendNewsletter(book.id, book.title)}
                          disabled={!book.is_published || loading === `newsletter-${book.id}`}
                          className={book.is_published ? 'hover:text-purple-300' : ''}
                        >
                          <Mail className={`w-4 h-4 ${book.is_published ? 'text-purple-400/80' : 'text-silver-700'}`} />
                        </IconBtn>

                        {/* ⋮ More */}
                        <div className="relative">
                          <IconBtn
                            label="Plus d'actions"
                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(p => p === book.id ? null : book.id); }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </IconBtn>

                          {openDropdown === book.id && (
                            <div
                              onClick={e => e.stopPropagation()}
                              className="absolute right-0 top-10 z-50 w-44 rounded-xl bg-obsidian border border-ash/50 shadow-2xl py-1 overflow-hidden"
                            >
                              {/* Toggle publish */}
                              <button
                                onClick={() => { setOpenDropdown(null); togglePublish(book.id, !book.is_published); }}
                                disabled={!!loading}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-silver-400 hover:text-silver-200 hover:bg-ash/30 transition-colors text-left disabled:opacity-50"
                              >
                                {book.is_published
                                  ? <><EyeOff className="w-4 h-4 shrink-0" /> Masquer</>
                                  : <><Eye className="w-4 h-4 shrink-0" /> Publier</>
                                }
                              </button>

                              {/* Duplicate */}
                              <button
                                onClick={() => { setOpenDropdown(null); setMsg({ type: 'info', text: 'Duplication bientôt disponible.' }); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-silver-400 hover:text-silver-200 hover:bg-ash/30 transition-colors text-left"
                              >
                                <Copy className="w-4 h-4 shrink-0" />
                                Dupliquer
                              </button>

                              <div className="my-1 border-t border-ash/30" />

                              {/* Delete */}
                              <button
                                onClick={() => { setOpenDropdown(null); setMsg({ type: 'info', text: 'Suppression bientôt disponible.' }); }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                              >
                                <Trash2 className="w-4 h-4 shrink-0" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              }

              {/* Empty state */}
              {isReady && filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-gold-500/50" />
                      </div>
                      <div>
                        <p className="text-silver-200 font-medium text-base mb-1">
                          {search || activeFilter !== 'all' ? 'Aucun résultat' : 'Aucun livre'}
                        </p>
                        <p className="text-silver-500 text-sm">
                          {search || activeFilter !== 'all'
                            ? 'Essayez une autre recherche ou supprimez les filtres.'
                            : 'Créez votre première publication.'}
                        </p>
                      </div>
                      {!search && activeFilter === 'all' && (
                        <Link href="/admin/livres/nouveau" className="btn-gold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm mt-1">
                          <Plus className="w-4 h-4" />
                          Ajouter un livre
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-4 py-2.5 border-t border-ash/20 flex items-center justify-between">
          <p className="text-silver-600 text-xs">
            {filteredBooks.length} / {books.length} livre{books.length !== 1 ? 's' : ''}
          </p>
          {sortKey && (
            <button
              onClick={() => { setSortKey(null); setSortDir('asc'); }}
              className="text-xs text-silver-600 hover:text-silver-400 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Réinitialiser le tri
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
