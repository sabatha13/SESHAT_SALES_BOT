'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Download, FileText, ChevronUp, ChevronDown, ChevronsUpDown,
  ExternalLink, Crown, Activity, Clock, RefreshCcw, UserX, Star,
  Users, TrendingUp, TrendingDown,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  .crm-list-root, .crm-list-root * { visibility: visible; }
  .crm-list-root { position: absolute; top: 0; left: 0; width: 100%; padding: 24px; }
  .no-print { display: none !important; }
}`;

// ── Types ──────────────────────────────────────────────────────────

export interface Customer {
  user_id: string;
  full_name: string;
  email: string;
  books_owned: number;
  lifetime_value: number;
  pending_orders: number;
  recovery_emails: number;
  last_purchase_at: string | null;
  status: 'vip' | 'active' | 'pending' | 'recovered' | 'inactive';
  health: 'healthy' | 'needs_attention' | 'at_risk';
}

export interface CrmMeta {
  newThisMonth: number;
  newLastMonth: number;
  activeLast30: number;
  activePrev30: number;
  pendingThisWeek: number;
  pendingLastWeek: number;
  vipCount: number;
}

type FilterKey = 'all' | 'active' | 'pending' | 'vip' | 'recovered';
type SortKey   = 'full_name' | 'books_owned' | 'lifetime_value' | 'pending_orders'
               | 'recovery_emails' | 'last_purchase_at' | 'status' | 'health';

// ── Avatar helpers ─────────────────────────────────────────────────

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTE = [
  'bg-purple-500/25 text-purple-300',
  'bg-blue-500/25 text-blue-300',
  'bg-emerald-500/25 text-emerald-300',
  'bg-rose-500/25 text-rose-300',
  'bg-cyan-500/25 text-cyan-300',
  'bg-indigo-500/25 text-indigo-300',
  'bg-teal-500/25 text-teal-300',
];
function getAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// ── Status & health configs ────────────────────────────────────────

const STATUS_CONFIG: Record<Customer['status'], { label: string; cls: string; icon: React.ElementType }> = {
  vip:       { label: 'VIP',        cls: 'bg-gold-500/25 text-gold-300 border-gold-500/60 font-semibold', icon: Crown },
  active:    { label: 'Actif',      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',      icon: Activity },
  pending:   { label: 'En attente', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20',            icon: Clock },
  recovered: { label: 'Récupéré',   cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20',              icon: RefreshCcw },
  inactive:  { label: 'Inactif',    cls: 'bg-zinc-700/70 text-zinc-300 border-zinc-600/70',              icon: UserX },
};

const HEALTH_CONFIG: Record<Customer['health'], { label: string; cls: string; dot: string }> = {
  healthy:         { label: 'Healthy',   cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
  needs_attention: { label: 'Attention', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25',       dot: 'bg-amber-400'   },
  at_risk:         { label: 'At Risk',   cls: 'bg-red-500/15 text-red-400 border-red-500/25',             dot: 'bg-red-400'     },
};

const HEALTH_ORDER: Record<Customer['health'], number> = { healthy: 0, needs_attention: 1, at_risk: 2 };

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'active',    label: 'Actifs' },
  { key: 'vip',       label: 'VIP' },
  { key: 'pending',   label: 'En attente' },
  { key: 'recovered', label: 'Récupérés' },
];

// ── CSV export ─────────────────────────────────────────────────────

function exportCSV(customers: Customer[]) {
  const rows: string[][] = [
    ['Nom', 'Email', 'Livres', 'LTV (USD)', 'En attente', 'Relances', 'Dernier achat', 'Statut', 'Santé'],
    ...customers.map(c => [
      c.full_name,
      c.email,
      c.books_owned.toString(),
      (c.lifetime_value / 100).toFixed(2),
      c.pending_orders.toString(),
      c.recovery_emails.toString(),
      c.last_purchase_at ? c.last_purchase_at.slice(0, 10) : '—',
      STATUS_CONFIG[c.status].label,
      HEALTH_CONFIG[c.health].label,
    ]),
  ];
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'crm-clients.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// ── Sort header ────────────────────────────────────────────────────

function SortTh({ label, sk, current, dir, onSort }: {
  label: string; sk: SortKey; current: SortKey | null; dir: 'asc' | 'desc'; onSort: (k: SortKey) => void;
}) {
  const active = current === sk;
  return (
    <th
      onClick={() => onSort(sk)}
      className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium cursor-pointer select-none hover:text-silver-400 transition-colors"
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
          : <ChevronsUpDown className="w-3 h-3 opacity-40" />}
      </span>
    </th>
  );
}

// ── Trend indicator ────────────────────────────────────────────────

function Trend({ current, prev, suffix, absolute }: {
  current: number; prev?: number; suffix?: string; absolute?: boolean;
}) {
  if (absolute) {
    return (
      <span className="text-[10px] text-silver-500 mt-1 flex items-center gap-0.5">
        {current > 0 && <TrendingUp className="w-2.5 h-2.5 text-emerald-500/70" />}
        {current > 0 ? `+${current}` : current}{suffix ? ` ${suffix}` : ''}
      </span>
    );
  }
  if (prev === undefined || (prev === 0 && current === 0)) {
    return <span className="text-[10px] text-silver-600 mt-1 block">—</span>;
  }
  const pct = prev === 0 ? 100 : Math.round(((current - prev) / prev) * 100);
  const up  = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`text-[10px] mt-1 flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
      <Icon className="w-2.5 h-2.5" />
      {pct >= 0 ? '+' : ''}{pct}% vs mois dernier
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function CrmClient({ customers, meta }: { customers: Customer[]; meta: CrmMeta }) {
  const router    = useRouter();
  const exportRef = useRef<HTMLDivElement>(null);

  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<FilterKey>('all');
  const [sortKey,    setSortKey]    = useState<SortKey | null>(null);
  const [sortDir,    setSortDir]    = useState<'asc' | 'desc'>('asc');
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const filtered = useMemo(() => {
    let list = customers;
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'health') {
          cmp = HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health];
        } else {
          const av = a[sortKey] ?? '';
          const bv = b[sortKey] ?? '';
          if (typeof av === 'number' && typeof bv === 'number') {
            cmp = av - bv;
          } else if (av === null && bv !== null) {
            cmp = 1;
          } else if (av !== null && bv === null) {
            cmp = -1;
          } else {
            cmp = String(av).toLowerCase() < String(bv).toLowerCase() ? -1 : 1;
          }
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

  const vipCount     = useMemo(() => customers.filter(c => c.status === 'vip').length, [customers]);
  const pendingCount = useMemo(() => customers.reduce((s, c) => s + c.pending_orders, 0), [customers]);
  const activeCount  = useMemo(() => customers.filter(c => c.status === 'active' || c.status === 'vip').length, [customers]);

  return (
    <div className="crm-list-root space-y-6">
      <style>{PRINT_CSS}</style>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Clients totaux */}
        <div className="card-dark px-5 py-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="font-serif text-2xl text-silver-200 tabular-nums">{customers.length}</p>
          <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1">Clients totaux</p>
          <Trend current={meta.newThisMonth} prev={meta.newLastMonth} />
        </div>

        {/* Clients actifs */}
        <div className="card-dark px-5 py-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-serif text-2xl text-silver-200 tabular-nums">{activeCount}</p>
          <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1">Clients actifs</p>
          <Trend current={meta.activeLast30} absolute suffix="ces 30j" />
        </div>

        {/* VIP */}
        <div className="card-dark px-5 py-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center mb-3">
            <Crown className="w-4 h-4 text-gold-400" />
          </div>
          <p className="font-serif text-2xl text-silver-200 tabular-nums">{vipCount}</p>
          <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1">Clients VIP</p>
          <span className="text-[10px] text-silver-500 mt-1 block">
            {customers.length > 0 ? `${Math.round(vipCount / customers.length * 100)}% du total` : '—'}
          </span>
        </div>

        {/* Commandes en attente */}
        <div className="card-dark px-5 py-4 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-serif text-2xl text-silver-200 tabular-nums">{pendingCount}</p>
          <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1">Cmdes en attente</p>
          <Trend current={meta.pendingThisWeek} absolute suffix="cette semaine" />
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

        {/* Search — wider */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-silver-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full pl-9 pr-4 py-2.5 bg-charcoal border border-ash/50 rounded-xl text-silver-200 placeholder-silver-600 text-sm focus:outline-none focus:border-gold-600/50"
          />
        </div>

        {/* Export dropdown */}
        <div ref={exportRef} className="no-print relative">
          <button
            onClick={() => setExportOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter
            <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${exportOpen ? 'rotate-180' : ''}`} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-36 bg-obsidian border border-ash/50 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
              <button
                onClick={() => { exportCSV(filtered); setExportOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-silver-400 hover:bg-charcoal hover:text-silver-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={() => { window.print(); setExportOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-silver-400 hover:bg-charcoal hover:text-silver-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter chips ────────────────────────────────────────── */}
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
              <span className="ml-1.5 opacity-60">({customers.filter(c => c.status === f.key).length})</span>
            )}
          </button>
        ))}
        <span className="ml-auto text-silver-600 text-xs self-center">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="card-dark rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ash/30">
                <SortTh label="Client"          sk="full_name"        current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium">Email</th>
                <SortTh label="Livres"          sk="books_owned"      current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Lifetime Value"  sk="lifetime_value"   current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="En attente"      sk="pending_orders"   current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Relances"        sk="recovery_emails"  current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Dernier achat"   sk="last_purchase_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Statut"          sk="status"           current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Santé"           sk="health"           current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <Star className="w-6 h-6 text-ash/50 mx-auto mb-2" />
                    <p className="text-silver-600 text-sm">Aucun client trouvé</p>
                  </td>
                </tr>
              ) : filtered.map(customer => {
                const st     = STATUS_CONFIG[customer.status];
                const StIcon = st.icon;
                const ht     = HEALTH_CONFIG[customer.health];
                const isVip  = customer.status === 'vip';
                const initials  = getInitials(customer.full_name);
                const avatarCls = getAvatarColor(customer.full_name);

                return (
                  <tr
                    key={customer.user_id}
                    onClick={() => router.push(`/admin/crm/${customer.user_id}`)}
                    className={`border-b border-ash/20 cursor-pointer transition-colors group ${
                      isVip ? 'bg-gold-500/[0.04] hover:bg-gold-500/[0.08]' : 'hover:bg-charcoal/30'
                    }`}
                  >
                    {/* Client — avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                          isVip
                            ? 'bg-gold-500/20 ring-1 ring-gold-500/60'
                            : avatarCls
                        }`}>
                          {isVip
                            ? <Crown className="w-4 h-4 text-gold-400" />
                            : initials}
                        </div>
                        <p className={`text-sm font-medium leading-tight ${isVip ? 'text-gold-300' : 'text-silver-200'}`}>
                          {customer.full_name}
                        </p>
                      </div>
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
                      <span className={`text-sm font-medium tabular-nums ${isVip ? 'text-gold-400' : 'text-gold-400/80'}`}>
                        {formatPrice(customer.lifetime_value)}
                      </span>
                    </td>

                    {/* Pending */}
                    <td className="px-4 py-3 text-sm tabular-nums">
                      {customer.pending_orders > 0
                        ? <span className="text-amber-400">{customer.pending_orders}</span>
                        : <span className="text-silver-600">—</span>}
                    </td>

                    {/* Recovery emails */}
                    <td className="px-4 py-3 text-sm tabular-nums">
                      {customer.recovery_emails > 0
                        ? <span className="text-purple-400">{customer.recovery_emails}</span>
                        : <span className="text-silver-600">—</span>}
                    </td>

                    {/* Last purchase */}
                    <td className="px-4 py-3 text-silver-500 text-xs whitespace-nowrap">
                      {customer.last_purchase_at ? customer.last_purchase_at.slice(0, 10) : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${st.cls}`}>
                        <StIcon className="w-2.5 h-2.5" />
                        {st.label}
                      </span>
                    </td>

                    {/* Health */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${ht.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ht.dot}`} />
                        {ht.label}
                      </span>
                    </td>

                    {/* Actions — stop propagation so row click doesn't double-navigate */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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
            <span className="text-silver-600 text-xs">
              {filtered.length} client{filtered.length !== 1 ? 's' : ''}
            </span>
            <span className="text-silver-400 text-xs">
              LTV total visible :{' '}
              <span className="text-gold-400 font-medium">
                {formatPrice(filtered.reduce((s, c) => s + c.lifetime_value, 0))}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
