'use client';
import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Users, Mail, Clock, RefreshCcw,
  DollarSign, Star, AlertTriangle, CheckCircle, Info,
  Download, FileText, BarChart2,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────

interface KPIs {
  revenue: number;         // cents
  sales: number;
  readers: number;
  recoveryRate: number;
  pendingOrders: number;
  refunds: number;
  avgSellingPrice: number; // cents
  lastSaleAt: string | null;
}

interface ChartPoint { date: string; revenue: number; sales: number; }

interface Funnel {
  checkout_started: number;
  pending: number;
  completed: number;
  refunded: number;
}

interface Buyer {
  user_id: string;
  email: string;
  full_name: string;
  amount: number; // cents
  status: string;
  created_at: string;
  recovery_email_count: number;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  event_source: string;
  purchase_id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  new_status: string;
  previous_status: string;
}

interface Score { value: number; label: string; }
interface Insight { type: 'positive' | 'warning' | 'neutral'; text: string; }

interface AnalyticsData {
  kpis: KPIs;
  revenueChart: ChartPoint[];
  funnel: Funnel;
  recentBuyers: Buyer[];
  timeline: TimelineEvent[];
  score: Score;
  insights: Insight[];
}

// ── Constants ────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  external:  'bg-blue-500/15 text-blue-400 border-blue-500/20',
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
  refunded:  'bg-red-500/15 text-red-400 border-red-500/20',
  expired:   'bg-ash/20 text-silver-500 border-ash/30',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Complété',
  external:  'Externe',
  pending:   'En attente',
  refunded:  'Remboursé',
  expired:   'Expiré',
};

const EVENT_LABELS: Record<string, string> = {
  checkout_created:        'Paiement initié',
  checkout_resumed:        'Session reprise',
  checkout_expired:        'Session expirée',
  payment_completed:       'Paiement complété',
  payment_refunded:        'Remboursement',
  external_grant:          'Accès externe accordé',
  book_granted:            'Livre offert',
  download_requested:      'Téléchargement demandé',
  download_completed:      'Téléchargement complété',
  recovery_email_sent:     'Email de relance envoyé',
  recovery_tracking_failed:'Suivi relance échoué',
};

const EVENT_GLYPHS: Record<string, string> = {
  payment_completed:   '✓',
  payment_refunded:    '↩',
  recovery_email_sent: '✉',
  checkout_created:    '→',
  checkout_expired:    '✕',
  download_completed:  '↓',
  external_grant:      '⊕',
  book_granted:        '⊕',
};

const EVENT_COLORS: Record<string, string> = {
  checkout_created:         'text-gold-400',
  checkout_resumed:         'text-gold-500',
  payment_completed:        'text-emerald-400',
  payment_refunded:         'text-red-400',
  recovery_email_sent:      'text-purple-400',
  recovery_tracking_failed: 'text-red-400',
  external_grant:           'text-blue-400',
  book_granted:             'text-blue-400',
  download_requested:       'text-silver-400',
  download_completed:       'text-silver-400',
  checkout_expired:         'text-silver-600',
};

// ── Print styles (inject once) ───────────────────────────────────

const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  .analytics-root, .analytics-root * { visibility: visible; }
  .analytics-root {
    position: absolute; top: 0; left: 0;
    width: 100%; padding: 24px;
    background: #0A0800;
  }
  .no-print { display: none !important; }
}
`;

// ── Utilities ────────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)  return 'à l\'instant';
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days < 7)  return `il y a ${days} j`;
  return formatDate(dateStr);
}

function exportCSV(data: AnalyticsData, title: string) {
  const fmtAmt = (cents: number) => (cents / 100).toFixed(2);

  // Summary block — matches KPI values exactly
  const summaryRows: string[][] = [
    ['=== BILAN ANALYTIQUE ==='],
    ['Revenus totaux (USD)', fmtAmt(data.kpis.revenue)],
    ['Ventes complétées', data.kpis.sales.toString()],
    ['Lecteurs uniques', data.kpis.readers.toString()],
    ['Prix moyen (USD)', fmtAmt(data.kpis.avgSellingPrice)],
    ['Remboursements', data.kpis.refunds.toString()],
    ['Taux de relance (%)', data.kpis.recoveryRate.toString()],
    [],
    ['=== 20 ACHATS LES PLUS RÉCENTS ==='],
    ['Email', 'Nom', 'Montant (USD)', 'Statut', 'Date', 'Relances'],
  ];

  const detailRows: string[][] = data.recentBuyers.map(b => [
    b.email,
    b.full_name,
    fmtAmt(b.amount),
    STATUS_LABELS[b.status] ?? b.status,
    b.created_at.slice(0, 10),
    b.recovery_email_count.toString(),
  ]);

  const allRows = [...summaryRows, ...detailRows];
  const csv = allRows
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `analytics-${title.replace(/\s+/g, '-').toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Sub-components ───────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, highlight = false,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; highlight?: boolean;
}) {
  return (
    <div className={`card-dark px-5 py-4 rounded-xl flex flex-col gap-3 ${highlight ? 'border border-gold-500/30' : ''}`}>
      <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gold-500" />
      </div>
      <div>
        <p className="font-serif text-2xl text-silver-200 leading-none tabular-nums">{value}</p>
        <p className="text-silver-500 text-[10px] uppercase tracking-widest mt-1.5">{label}</p>
        {sub && <p className="text-silver-600 text-[10px] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SkeletonCard() {
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

function EmptyChartState({ label }: { label: string }) {
  return (
    <div className="h-[180px] flex flex-col items-center justify-center gap-2">
      <BarChart2 className="w-8 h-8 text-ash/60" />
      <p className="text-silver-600 text-xs">{label}</p>
    </div>
  );
}

function ScoreGauge({ value, label }: Score) {
  const r    = 50;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color =
    value >= 80 ? '#10b981' :
    value >= 60 ? '#E5A700' :
    value >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1C1C1F" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl text-silver-200 leading-none">{value}</span>
          <span className="text-[10px] text-silver-500 uppercase tracking-widest mt-0.5">/100</span>
        </div>
      </div>
      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
        value >= 80 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
        value >= 60 ? 'bg-gold-500/15 text-gold-400 border-gold-500/20' :
        value >= 40 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                     'bg-red-500/15 text-red-400 border-red-500/20'
      }`}>
        {label}
      </span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function BookAnalytics({ bookId, bookTitle }: { bookId: string; bookTitle: string }) {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/book-analytics/${bookId}`)
      .then(res => res.ok
        ? res.json()
        : res.json().then((d: { error?: string }) => Promise.reject(d.error ?? 'Erreur API')))
      .then((d: AnalyticsData) => setData(d))
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [bookId]);

  // ── Derived / memoised values ──────────────────────────────────

  const hasChartData = useMemo(
    () => data?.revenueChart.some(p => p.revenue > 0 || p.sales > 0) ?? false,
    [data?.revenueChart],
  );

  const funnelSteps = useMemo(() => {
    if (!data) return [];
    const { funnel } = data;
    const max = Math.max(funnel.checkout_started, 1);
    return [
      { label: 'Checkout initié',      count: funnel.checkout_started, pct: 100,                                          danger: false },
      { label: 'En attente paiement',  count: funnel.pending,          pct: Math.round((funnel.pending / max) * 100),    danger: false },
      { label: 'Complété',             count: funnel.completed,        pct: Math.round((funnel.completed / max) * 100),  danger: false },
      { label: 'Remboursé',            count: funnel.refunded,         pct: Math.round((funnel.refunded / max) * 100),   danger: true  },
    ];
  }, [data]);

  // ── Render states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="card-dark rounded-2xl h-52 animate-pulse" />
        <div className="card-dark rounded-2xl h-52 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-dark rounded-2xl p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-silver-400 text-sm">{error ?? 'Erreur de chargement'}</p>
      </div>
    );
  }

  const { kpis, revenueChart, funnel, recentBuyers, timeline, score, insights } = data;
  const hasFunnelData = funnel.checkout_started > 0;

  return (
    <>
      {/* Print CSS — hides everything except analytics-root */}
      <style>{PRINT_CSS}</style>

      <div className="space-y-6 analytics-root">

        {/* ── Export bar ────────────────────────────────────────── */}
        <div className="flex justify-end gap-2 no-print">
          <button
            onClick={() => exportCSV(data, bookTitle)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Imprimer PDF
          </button>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Revenus totaux"    value={formatPrice(kpis.revenue)}       icon={TrendingUp} highlight />
          <KpiCard label="Ventes"            value={kpis.sales.toString()}            icon={ShoppingCart} />
          <KpiCard label="Lecteurs uniques"  value={kpis.readers.toString()}          icon={Users} />
          <KpiCard label="Taux de relance"   value={`${kpis.recoveryRate} %`}        icon={Mail} />
          <KpiCard label="En attente"        value={kpis.pendingOrders.toString()}   icon={Clock} />
          <KpiCard label="Remboursements"    value={kpis.refunds.toString()}          icon={RefreshCcw} />
          <KpiCard
            label="Prix moyen"
            value={kpis.sales > 0 ? formatPrice(kpis.avgSellingPrice) : '—'}
            icon={DollarSign}
          />
          <KpiCard
            label="Dernière vente"
            value={kpis.lastSaleAt ? formatRelative(kpis.lastSaleAt) : '—'}
            icon={Star}
            sub={kpis.lastSaleAt ? kpis.lastSaleAt.slice(0, 10) : undefined}
          />
        </div>

        {/* ── Charts ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className="card-dark rounded-2xl p-5">
            <h3 className="text-silver-300 text-sm font-medium mb-4">Revenus — 30 derniers jours</h3>
            {hasChartData ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`revGrad-${bookId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E5A700" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E5A700" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}$`} />
                  <Tooltip
                    contentStyle={{ background: '#141416', border: '1px solid #2A2A2E', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(v: any) => [`${(v ?? 0).toFixed(2)} $`, 'Revenus']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#E5A700" strokeWidth={2} fill={`url(#revGrad-${bookId})`} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState label="Aucun revenu enregistré sur les 30 derniers jours" />
            )}
          </div>

          <div className="card-dark rounded-2xl p-5">
            <h3 className="text-silver-300 text-sm font-medium mb-4">Ventes — 30 derniers jours</h3>
            {hasChartData ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueChart} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#141416', border: '1px solid #2A2A2E', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#9CA3AF' }}
                    formatter={(v: any) => [v ?? 0, 'Ventes']}
                  />
                  <Bar dataKey="sales" fill="#E5A700" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState label="Aucune vente enregistrée sur les 30 derniers jours" />
            )}
          </div>
        </div>

        {/* ── Funnel + Score + Insights ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Funnel */}
          <div className="card-dark rounded-2xl p-5">
            <h3 className="text-silver-300 text-sm font-medium mb-4">Entonnoir d'achat</h3>
            {hasFunnelData ? (
              <div className="space-y-2.5">
                {funnelSteps.map((step, i) => (
                  <div key={step.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-silver-500">{step.label}</span>
                      <span className="text-silver-400 tabular-nums">{step.count} · {step.pct} %</span>
                    </div>
                    <div className="h-5 bg-charcoal rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-700"
                        style={{
                          width: `${Math.max(step.pct, 2)}%`,
                          background: step.danger
                            ? 'linear-gradient(90deg, rgba(239,68,68,0.6), rgba(239,68,68,0.3))'
                            : `linear-gradient(90deg, rgba(229,167,0,${0.85 - i * 0.18}), rgba(229,167,0,${0.4 - i * 0.08}))`,
                        }}
                      />
                    </div>
                    {i < funnelSteps.length - 1 && (
                      <div className="text-center text-silver-700 text-[10px] mt-0.5">↓</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <ShoppingCart className="w-7 h-7 text-ash/60" />
                <p className="text-silver-600 text-xs text-center">Aucune transaction initiée pour ce livre</p>
              </div>
            )}
          </div>

          {/* Score */}
          <div className="card-dark rounded-2xl p-5 flex flex-col items-center gap-4">
            <h3 className="text-silver-300 text-sm font-medium self-start">Score de performance</h3>
            <ScoreGauge value={score.value} label={score.label} />
            <div className="w-full space-y-1">
              {([
                ['Revenus',             '40 %'],
                ['Conversion',          '25 %'],
                ['Remboursements',      '15 %'],
                ['Engagement lecteurs', '10 %'],
                ['Relances',            '10 %'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[10px] text-silver-600">
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="card-dark rounded-2xl p-5">
            <h3 className="text-silver-300 text-sm font-medium mb-4">Insights</h3>
            <div className="space-y-2.5">
              {insights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg ${
                  insight.type === 'positive' ? 'bg-emerald-500/10' :
                  insight.type === 'warning'  ? 'bg-amber-500/10'   : 'bg-charcoal'
                }`}>
                  {insight.type === 'positive'
                    ? <CheckCircle  className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    : insight.type === 'warning'
                      ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      : <Info          className="w-4 h-4 text-silver-500 shrink-0 mt-0.5" />
                  }
                  <p className={`text-xs leading-relaxed ${
                    insight.type === 'positive' ? 'text-emerald-300' :
                    insight.type === 'warning'  ? 'text-amber-300'   : 'text-silver-500'
                  }`}>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Buyers ──────────────────────────────────────── */}
        <div className="card-dark rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-ash/30">
            <h3 className="text-silver-300 text-sm font-medium">Acheteurs récents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ash/30">
                  {['Client', 'Date', 'Montant', 'Statut', 'Relances'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-6 h-6 text-ash/60" />
                        <p className="text-silver-600 text-sm">Aucun acheteur enregistré</p>
                        <p className="text-silver-700 text-xs">Les achats apparaîtront ici après la première vente</p>
                      </div>
                    </td>
                  </tr>
                ) : recentBuyers.map(buyer => (
                  <tr
                    key={`${buyer.user_id}-${buyer.created_at}`}
                    className="border-b border-ash/20 hover:bg-charcoal/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-silver-200 text-sm font-medium leading-tight">{buyer.full_name}</p>
                      <p className="text-silver-600 text-xs mt-0.5">{buyer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-silver-500 text-xs tabular-nums whitespace-nowrap">
                      {buyer.created_at.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-silver-300 text-sm tabular-nums">
                      {formatPrice(buyer.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[buyer.status] ?? 'bg-ash/20 text-silver-500 border-ash/30'}`}>
                        {STATUS_LABELS[buyer.status] ?? buyer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-silver-500 text-sm tabular-nums">
                      {buyer.recovery_email_count > 0 ? (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-purple-400" />
                          {buyer.recovery_email_count}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Purchase Timeline ──────────────────────────────────── */}
        <div className="card-dark rounded-2xl p-5">
          <h3 className="text-silver-300 text-sm font-medium mb-5">Chronologie des événements</h3>
          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Clock className="w-7 h-7 text-ash/60" />
              <p className="text-silver-600 text-sm">Aucun événement enregistré</p>
              <p className="text-silver-700 text-xs">Les événements d'achat apparaîtront ici</p>
            </div>
          ) : (
            <div>
              {timeline.map((event, i) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full bg-charcoal border border-ash/50 flex items-center justify-center shrink-0 text-[10px] font-bold ${EVENT_COLORS[event.event_type] ?? 'text-silver-500'}`}>
                      {EVENT_GLYPHS[event.event_type] ?? '·'}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className="w-px flex-1 bg-ash/25 my-0.5" style={{ minHeight: '1rem' }} />
                    )}
                  </div>
                  <div className="pb-4 pt-0.5 min-w-0">
                    <p className={`text-xs font-medium ${EVENT_COLORS[event.event_type] ?? 'text-silver-400'}`}>
                      {EVENT_LABELS[event.event_type] ?? event.event_type}
                    </p>
                    <p className="text-silver-600 text-[10px] mt-0.5">{formatRelative(event.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
