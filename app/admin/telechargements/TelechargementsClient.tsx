'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function Avatar({ name }: { name: string }) {
  const initials = (name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-gold-700/40', 'bg-purple-700/40', 'bg-emerald-700/40', 'bg-blue-700/40', 'bg-rose-700/40'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color} border border-white/10`}>
      <span className="text-silver-200 text-xs font-medium">{initials}</span>
    </div>
  );
}

const PAGE_SIZE = 50;

export default function TelechargementsClient({ downloads }: { downloads: any[] }) {
  const [search, setSearch] = useState('');
  const [bookFilter, setBookFilter] = useState('all');
  const [page, setPage] = useState(1);

  const books = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; title: string }[] = [];
    for (const dl of downloads) {
      if (dl.book?.title && !seen.has(dl.book_id)) {
        seen.add(dl.book_id);
        list.push({ id: dl.book_id, title: dl.book.title });
      }
    }
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [downloads]);

  const downloadsByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const dl of downloads) {
      const key = dl.profile?.email || dl.user_id || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [downloads]);

  const filtered = useMemo(() => {
    let result = downloads;
    if (bookFilter !== 'all') result = result.filter(dl => dl.book_id === bookFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(dl =>
        (dl.book?.title || '').toLowerCase().includes(q) ||
        (dl.profile?.full_name || '').toLowerCase().includes(q) ||
        (dl.profile?.email || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [downloads, bookFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }
  function handleBook(v: string) { setBookFilter(v); setPage(1); }

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-500" />
          <input
            type="text"
            placeholder="Rechercher par livre, utilisateur ou email..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-charcoal border border-ash/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
          />
        </div>
        <select
          value={bookFilter}
          onChange={e => handleBook(e.target.value)}
          className="bg-charcoal border border-ash/50 rounded-xl px-4 py-2.5 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50"
        >
          <option value="all">Tous les livres</option>
          {books.map(b => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-ash/50">
            <tr className="text-left">
              {['Livre', 'Utilisateur', 'Téléchargements', 'IP', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-silver-500 text-xs uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ash/30">
            {paginated.map((dl: any) => {
              const userKey = dl.profile?.email || dl.user_id || 'unknown';
              const count = downloadsByUser[userKey] || 1;
              return (
                <tr key={dl.id} className="hover:bg-charcoal/40 transition-colors">
                  {/* Livre */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                      <span className="text-silver-200 text-sm">{dl.book?.title || '—'}</span>
                    </div>
                  </td>

                  {/* Utilisateur */}
                  <td className="px-4 py-3">
                    <Link href={`/admin/utilisateurs/${dl.user_id}`} className="flex items-center gap-2.5">
                      <Avatar name={dl.profile?.full_name || '?'} />
                      <div>
                        <p className="text-silver-300 text-sm hover:text-gold-400 transition-colors font-medium">
                          {dl.profile?.full_name || '—'}
                        </p>
                        <a
                          href={`mailto:${dl.profile?.email}`}
                          onClick={e => e.stopPropagation()}
                          className="text-silver-500 text-xs hover:text-gold-400 transition-colors"
                        >
                          {dl.profile?.email || '—'}
                        </a>
                      </div>
                    </Link>
                  </td>

                  {/* Compteur */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${count > 3 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : count > 1 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {count} dl
                    </span>
                  </td>

                  {/* IP */}
                  <td className="px-4 py-3">
                    {dl.ip_address ? (
                      <span className="font-mono text-xs bg-ash/40 border border-ash/60 px-2 py-0.5 rounded text-silver-400">
                        {dl.ip_address}
                      </span>
                    ) : (
                      <span className="text-silver-600 text-xs">—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-silver-500 text-xs">{formatDate(dl.created_at)}</td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-silver-500 text-sm">
                  Aucun téléchargement trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-ash/20 flex items-center justify-between">
          <p className="text-silver-600 text-xs">{filtered.length} téléchargement{filtered.length !== 1 ? 's' : ''}</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg bg-charcoal border border-ash/50 text-silver-400 text-xs disabled:opacity-40 hover:border-gold-500/30 transition-all"
              >
                ← Préc.
              </button>
              <span className="text-silver-500 text-xs">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg bg-charcoal border border-ash/50 text-silver-400 text-xs disabled:opacity-40 hover:border-gold-500/30 transition-all"
              >
                Suiv. →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
