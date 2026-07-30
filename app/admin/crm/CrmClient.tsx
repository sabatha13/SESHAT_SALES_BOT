'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Download, FileText, ChevronUp, ChevronDown, ChevronsUpDown,
  ExternalLink, Crown, Activity, Clock, RefreshCcw, UserX, Star,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  .crm-list-root, .crm-list-root * { visibility: visible; }
  .crm-list-root { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
  .no-print { display: none !important; }
}`;


// ── Types ────────────────────────────────────────────────────────

export interface Customer {
  user_id: string;
  full_name: string;
  email: string;
  books_owned: number;
  lifetime_value: number; // cents
  pending_orders: number;
  recovery_emails: number;
  last_purchase_at: string | null;
  status: 'vip' | 'active' | 'pending' | 'recovered' | 'inactive';
}

type FilterKey = 'all' | 'active' | 'pending' | 'vip' | 'recovered';
type SortKey = 'full_name' | 'books_owned' | 'lifetime_value' | 'pending_orders' | 'recovery_emails' | 'last_purchase_at' | 'status';

// ── Status config ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<Customer['status'], { label: string; cls: string; icon: React.ElementType }> = {
  vip:       { label: 'VIP',       cls: 'bg-gold-500/15 text-gold-400 border-gold-500/30',       icon: Crown },
  active:    { label: 'Actif',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: Activity },
  pending:   { label: 'En attente', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20',   icon: Clock },
  recovered: { label: 'Récupéré',  cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20',       icon: RefreshCcw },
  inactive:  { label: 'Inactif',   cls: 'bg-ash/20 text-silver-500 border-ash/30',               icon: UserX },
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'active',    label: 'Actifs' },
  { key: 'vip',       label: 'VIP' },
  { key: 'pending',   label: 'En attente' },
  { key: 'recovered', label: 'Récupérés' },
];

// ── CSV Export ───────────────────────────────────────────────────

function exportCSV(customers: Customer[]) {
  const rows: string[][] = [
    ['Nom', 'Email', 'Livres', 'LTV (USD)', 'En attente', 'Relances', 'Dernier achat', 'Statut'],
    ...customers.map(c => [
      c.full_name,
      c.email,
      c.books_owned.toString(),
      (c.lifetime_value / 100).toFixed(2),
      c.pending_orders.toString(),
      c.recovery_emails.toString(),
      c.last_purchase_at ? c.last_purchase_at.slice(0, 10) : '—',
      STATUS_CONFIG[c.status].label,
    ]),
  ];
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'crm-clients.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Sort header ──────────────────────────────────────────────────

function SortTh({ label, sk, current, dir, onSort }: {
  label: string; sk: SortKey; current: SortKey | null; dir: 'asc' | 'desc'; onSort: (k: SortKey) => void;
}) {
  const active = current === sk;
  return (
    <th
      className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium cursor-pointer select-none hover:text-silver-400 transition-colors"
      onClick={() => onSort(sk)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
      </span>
    </th>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function CrmClient({ customers }: { customers: Customer[] }) {
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<FilterKey>('all');
  const [sortKey,   setSortKey]   = useState<SortKey | null>(null);
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let list = customers;

    if (filter !== 'all') list = list.filter(c => c.status === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        let cmp = 0;
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv;
        } else if (av === null && bv !== null) {
          cmp = 1;
        } else if (av !== null && bv === null) {
          cmp = -1;
        } else {
          cmp = String(av).toLowerCase() < String(bv).toLowerCase() ? -1 : 1;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [customers, filter, search, sortKey, sortDir]);

  function handleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  // KPI summary
  const vipCount     = useMemo(() => customers.filter(c => c.status === 'vip').length, [customers]);
  const pendingCount = useMemo(() => customers.reduce((s, c) => s + c.pending_orders, 0), [customers]);
  const activeCount  = useMemo(() => customers.filter(c => c.status === 'active' || c.status === 'vip').length, [customers]);

  return (
    <div className="crm-list-root space-y-6">
      <style>{PRINT_CSS}</style>

      {/* ── Summary KPIs ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Clients totaux',   value: customers.length.toString() },
          { label: 'Clients actifs',   value: activeCount.toString() },
          { label: 'VIP',              value: vipCount.toString() },
          { label: 'Commandes en att.', value: pendingCount.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="card-dark px-5 py-4 rounded-xl">
            <p className="font-serif text-2xl text-silver-200 tabular-nums">{value}</p>
            <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full pl-9 pr-4 py-2.5 bg-charcoal border border-ash/50 rounded-xl text-silver-200 placeholder-silver-600 text-sm focus:outline-none focus:border-gold-600/50"
          />
        </div>

        {/* Export */}
        <div className="no-print flex gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* ── Filter chips ──────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filter === f.key
                ? 'bg-gold-500/20 border-gold-500/50 text-gold-400'
                : 'bg-charcoal border-ash/50 text-silver-500 hover:text-silver-300'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-60">
                ({customers.filter(c => c.status === f.key).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-silver-600 text-xs self-center">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ash/30">
                <SortTh label="Client"          sk="full_name"       current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium">Email</th>
                <SortTh label="Livres"          sk="books_owned"     current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Lifetime Value"  sk="lifetime_value"  current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="En attente"      sk="pending_orders"  current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Relances"        sk="recovery_emails" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Dernier achat"   sk="last_purchase_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Statut"          sk="status"          current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Star className="w-6 h-6 text-ash/50 mx-auto mb-2" />
                    <p className="text-silver-600 text-sm">Aucun client trouvé</p>
                  </td>
                </tr>
              ) : filtered.map(customer => {
                const st = STATUS_CONFIG[customer.status];
                const StIcon = st.icon;
                return (
                  <tr key={customer.user_id} className="border-b border-ash/20 hover:bg-charcoal/30 transition-colors group">
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-silver-200 text-sm font-medium leading-tight">{customer.full_name}</p>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3">
                      <p className="text-silver-500 text-xs">{customer.email}</p>
                    </td>
                    {/* Books */}
                    <td className="px-4 py-3 text-silver-300 text-sm tabular-nums">
                      {customer.books_owned}
                    </td>
                    {/* LTV */}
                    <td className="px-4 py-3">
                      <span className="text-gold-400 text-sm font-medium tabular-nums">
                        {formatPrice(customer.lifetime_value)}
                      </span>
                    </td>
                    {/* Pending */}
                    <td className="px-4 py-3 text-silver-400 text-sm tabular-nums">
                      {customer.pending_orders > 0
                        ? <span className="text-amber-400">{customer.pending_orders}</span>
                        : '—'}
                    </td>
                    {/* Recovery */}
                    <td className="px-4 py-3 text-silver-400 text-sm tabular-nums">
                      {customer.recovery_emails > 0
                        ? <span className="text-purple-400">{customer.recovery_emails}</span>
                        : '—'}
                    </td>
                    {/* Last purchase */}
                    <td className="px-4 py-3 text-silver-500 text-xs whitespace-nowrap">
                      {customer.last_purchase_at ? customer.last_purchase_at.slice(0, 10) : '—'}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${st.cls}`}>
                        <StIcon className="w-2.5 h-2.5" />
                        {st.label}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/crm/${customer.user_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-gold-400 hover:border-gold-500/30 text-xs transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Voir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-ash/30 flex justify-between items-center">
            <span className="text-silver-600 text-xs">{filtered.length} client{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-silver-400 text-xs">
              LTV total visible : <span className="text-gold-400 font-medium">{formatPrice(filtered.reduce((s, c) => s + c.lifetime_value, 0))}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
