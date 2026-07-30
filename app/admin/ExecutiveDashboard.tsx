'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, Calendar, BarChart2,
  ShoppingCart, CreditCard, RefreshCcw, RotateCcw,
  Users, UserPlus, Activity, Crown,
  BookOpen, AlertTriangle, AlertCircle, CheckCircle,
  Download, Mail, XCircle, ChevronRight, ArrowRight,
  Zap,
} from 'lucide-react';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────

export interface ExecutiveData {
  kpis: {
    revenueToday: number; revenueTodayPrev: number;
    revenueWeek: number; revenueWeekPrev: number;
    revenueMonth: number; revenueMonthPrev: number;
    revenueYear: number; revenueYearPrev: number;
    ordersToday: number; ordersTodayPrev: number;
    avgOrderValue: number; avgOrderValuePrev: number;
    recoveryRate: number; recoveryRatePrev: number;
    refundRate: number; refundRatePrev: number;
    totalCustomers: number;
    newCustomers30d: number; newCustomersPrev: number;
    activeCustomers30d: number; activeCustomersPrev: number;
    vipCustomers: number;
  };
  dailyChart: { date: string; revenue: number; orders: number }[];
  monthlyChart: { date: string; revenue: number; orders: number }[];
  topBooks: {
    id: string; title: string; author: string; cover_url: string | null;
    revenue: number; sales: number; readers: number;
    conversionRate: number; trend: 'up' | 'flat' | 'down';
    contributionPct: number;
  }[];
  attentionBooks: {
    id: string; title: string;
    severity: 'critical' | 'warning' | 'healthy';
    reason: string;
  }[];
  highlights: {
    topCustomer:    { user_id: string; name: string; email: string; ltv: number } | null;
    newestCustomer: { user_id: string; name: string; email: string; created_at: string } | null;
    mostActive:     { user_id: string; name: string; email: string; orders: number } | null;
    recovered:      { user_id: string; name: string; email: string; ltv: number } | null;
  };
  financial: {
    grossRevenue: number; refundsTotal: number; netRevenue: number;
    avgOrderValue: number; avgCustomerLtv: number;
  };
  marketing: {
    recoveryEmailsSent: number; recoveredOrders: number;
    recoverySuccessRate: number; pendingOrders: number;
    estimatedLostRevenue: number;
  };
  activityFeed: {
    id: string; event_type: string; created_at: string;
    user_name: string | null; book_title: string | null;
    amount: number | null; new_status: string | null;
  }[];
  insights: { type: 'positive' | 'warning' | 'neutral'; text: string }[];
  alerts: { severity: 'critical' | 'warning' | 'healthy'; title: string; message: string }[];
}

// ── Helpers ────────────────────────────────────────────────────────────

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function trendPct(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return Math.round((current - prev) / prev * 100);
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

// ── KpiCard ────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: number;
  trendBad?: boolean;
  sub?: string;
}

function KpiCard({ label, value, icon: Icon, iconColor, trend, trendBad, sub }: KpiCardProps) {
  const isUp   = trend !== undefined && trend > 0;
  const isDown = trend !== undefined && trend < 0;
  const isGood = trendBad ? isDown : isUp;
  const isBad  = trendBad ? isUp  : isDown;
  const trendColor = isGood ? 'text-emerald-400' : isBad ? 'text-red-400' : 'text-silver-500';
  const arrow = isUp ? '↑' : isDown ? '↓' : '→';

  return (
    <div className="card-dark p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-silver-500 text-xs uppercase tracking-wide truncate pr-1">{label}</p>
        <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
      </div>
      <p className="text-2xl font-semibold text-silver-200 mb-1.5 tabular-nums">{value}</p>
      {trend !== undefined ? (
        <p className={`text-xs ${trendColor}`}>
          {arrow} {trend > 0 ? '+' : ''}{trend}% vs préc.
        </p>
      ) : sub ? (
        <p className="text-xs text-silver-600">{sub}</p>
      ) : null}
    </div>
  );
}

// ── RevenueChart ───────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d' | '12m';

function RevenueChart({ dailyChart, monthlyChart }: {
  dailyChart: ExecutiveData['dailyChart'];
  monthlyChart: ExecutiveData['monthlyChart'];
}) {
  const [period, setPeriod] = useState<Period>('30d');

  const raw = useMemo(() => {
    if (period === '12m') return monthlyChart;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return dailyChart.slice(-days);
  }, [period, dailyChart, monthlyChart]);

  const chartData = useMemo(() => raw.map(d => ({
    ...d,
    label: period === '12m'
      ? MONTHS_FR[parseInt(d.date.slice(5, 7), 10) - 1]
      : new Date(d.date + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
  })), [raw, period]);

  const totalRevenue = raw.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="card-dark rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-serif text-lg text-gold-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            Revenus
          </h2>
          <p className="text-gold-400 font-semibold tabular-nums mt-0.5">
            {formatPrice(Math.round(totalRevenue * 100))}
          </p>
        </div>
        <div className="flex gap-1 no-print">
          {(['7d', '30d', '90d', '12m'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                period === p
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                  : 'text-silver-500 hover:text-silver-300 border border-transparent hover:border-ash/40'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="label"
            stroke="#6b7280"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="rev"
            orientation="left"
            tickFormatter={v => `$${v}`}
            stroke="#6b7280"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            width={56}
          />
          <YAxis
            yAxisId="ord"
            orientation="right"
            stroke="#6b7280"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e5e7eb', marginBottom: 4 }}
            formatter={(value: any, name: any) => [
              name === 'revenue'
                ? `$${Number(value).toFixed(2)}`
                : value,
              name === 'revenue' ? 'Revenus' : 'Commandes',
            ]}
          />
          <Area
            yAxisId="rev"
            type="monotone"
            dataKey="revenue"
            fill="rgba(229,167,0,0.12)"
            stroke="#e5a700"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#e5a700' }}
          />
          <Bar
            yAxisId="ord"
            dataKey="orders"
            fill="rgba(139,92,246,0.35)"
            radius={[2, 2, 0, 0]}
            maxBarSize={20}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── TopBooksTable ──────────────────────────────────────────────────────

function TopBooksTable({ books }: { books: ExecutiveData['topBooks'] }) {
  return (
    <div className="card-dark rounded-2xl p-6 h-full">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-5 h-5 text-gold-400" />
        <h2 className="font-serif text-lg text-gold-300">Top 10 Livres</h2>
      </div>
      {books.length === 0 ? (
        <p className="text-silver-500 text-sm">Aucune vente enregistrée.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[660px]">
            <thead>
              <tr className="text-silver-600 text-xs uppercase tracking-wide border-b border-ash/30">
                <th className="pb-2 text-left w-5">#</th>
                <th className="pb-2 text-left">Livre</th>
                <th className="pb-2 text-right tabular-nums">Revenus</th>
                <th className="pb-2 text-right tabular-nums">Contrib.</th>
                <th className="pb-2 text-right tabular-nums">Ventes</th>
                <th className="pb-2 text-right tabular-nums">Lecteurs</th>
                <th className="pb-2 text-right tabular-nums">Conv.</th>
                <th className="pb-2 text-center">↕</th>
                <th className="pb-2 w-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ash/20">
              {books.map((b, i) => (
                <tr key={b.id} className="hover:bg-charcoal/30 transition-colors group">
                  <td className="py-2.5 text-gold-600 font-serif text-sm pr-3">{i + 1}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-11 rounded overflow-hidden flex-shrink-0 bg-charcoal border border-ash/20">
                        {b.cover_url ? (
                          <img src={b.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-3 h-3 text-silver-700" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-silver-200 truncate max-w-[180px] text-sm">{b.title}</p>
                        <p className="text-silver-500 text-xs truncate max-w-[180px]">{b.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-right text-gold-400 font-medium tabular-nums">
                    {formatPrice(b.revenue)}
                  </td>
                  <td className="py-2.5 text-right text-silver-500 text-xs tabular-nums">{b.contributionPct}%</td>
                  <td className="py-2.5 text-right text-silver-300 tabular-nums">{b.sales}</td>
                  <td className="py-2.5 text-right text-cyan-400 tabular-nums">{b.readers}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    <span className={
                      b.conversionRate >= 70 ? 'text-emerald-400' :
                      b.conversionRate >= 40 ? 'text-amber-400'   : 'text-red-400'
                    }>
                      {b.conversionRate}%
                    </span>
                  </td>
                  <td className="py-2.5 text-center text-sm">
                    {b.trend === 'up'   && <span className="text-emerald-400">↑</span>}
                    {b.trend === 'down' && <span className="text-red-400">↓</span>}
                    {b.trend === 'flat' && <span className="text-silver-600">→</span>}
                  </td>
                  <td className="py-2.5">
                    <Link
                      href={`/admin/livres/${b.id}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-silver-500 hover:text-gold-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── AttentionBooks ────────────────────────────────────────────────────

function AttentionBooks({ books }: { books: ExecutiveData['attentionBooks'] }) {
  return (
    <div className="card-dark rounded-2xl p-6 h-full">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <h2 className="font-serif text-lg text-gold-300">À surveiller</h2>
      </div>
      {books.length === 0 ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Tous les livres sont dans les normes.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {books.map(b => (
            <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl bg-charcoal/40">
              <div className={`mt-0.5 flex-shrink-0 ${b.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                {b.severity === 'critical'
                  ? <AlertCircle className="w-4 h-4" />
                  : <AlertTriangle className="w-4 h-4" />
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-silver-200 text-sm truncate">{b.title}</p>
                <p className="text-silver-500 text-xs mt-0.5">{b.reason}</p>
              </div>
              <Link
                href={`/admin/livres/${b.id}`}
                className="text-silver-600 hover:text-gold-400 transition-colors flex-shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CustomerHighlights ────────────────────────────────────────────────

function CustomerHighlights({ highlights, vipCount }: {
  highlights: ExecutiveData['highlights'];
  vipCount: number;
}) {
  const cards = [
    highlights.topCustomer ? {
      label: 'Meilleur client', name: highlights.topCustomer.name,
      sub:  formatPrice(highlights.topCustomer.ltv),
      Icon: Crown, iconColor: 'text-gold-400',
      href: `/admin/crm/${highlights.topCustomer.user_id}`,
    } : null,
    highlights.newestCustomer ? {
      label: 'Inscription récente', name: highlights.newestCustomer.name,
      sub: highlights.newestCustomer.email,
      Icon: UserPlus, iconColor: 'text-purple-400',
      href: `/admin/crm/${highlights.newestCustomer.user_id}`,
    } : null,
    highlights.mostActive ? {
      label: 'Plus actif', name: highlights.mostActive.name,
      sub: `${highlights.mostActive.orders} achat${highlights.mostActive.orders !== 1 ? 's' : ''}`,
      Icon: Activity, iconColor: 'text-cyan-400',
      href: `/admin/crm/${highlights.mostActive.user_id}`,
    } : null,
    highlights.recovered ? {
      label: 'Récupéré par relance', name: highlights.recovered.name,
      sub: formatPrice(highlights.recovered.ltv),
      Icon: RefreshCcw, iconColor: 'text-emerald-400',
      href: `/admin/crm/${highlights.recovered.user_id}`,
    } : null,
    {
      label: 'Clients VIP', name: String(vipCount),
      sub: 'LTV ≥ $200 ou ≥ 3 livres',
      Icon: Crown, iconColor: 'text-gold-600',
      href: '/admin/crm',
    },
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="card-dark rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Users className="w-5 h-5 text-purple-400" />
        <h2 className="font-serif text-lg text-gold-300">Clients en vedette</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c, i) => (
          <Link
            key={i}
            href={c.href}
            className="group p-3 rounded-xl bg-charcoal/40 hover:bg-charcoal/70 transition-all border border-transparent hover:border-ash/40"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <c.Icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
              <p className="text-silver-500 text-xs truncate">{c.label}</p>
            </div>
            <p className="text-silver-200 text-sm font-medium truncate group-hover:text-gold-300 transition-colors">
              {c.name}
            </p>
            <p className="text-silver-500 text-xs mt-0.5 truncate">{c.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── FinancialSummary ───────────────────────────────────────────────────

function FinancialSummary({ financial }: { financial: ExecutiveData['financial'] }) {
  const rows = [
    { label: 'Revenu brut',    value: formatPrice(financial.grossRevenue),  color: 'text-gold-400', bold: false },
    { label: 'Remboursements', value: `−${formatPrice(financial.refundsTotal)}`, color: 'text-red-400', bold: false },
    { label: 'Revenu net',     value: formatPrice(financial.netRevenue),     color: 'text-emerald-400', bold: true },
    { label: 'Panier moyen',   value: formatPrice(financial.avgOrderValue),  color: 'text-silver-300', bold: false },
    { label: 'LTV moy. client',value: formatPrice(financial.avgCustomerLtv), color: 'text-silver-300', bold: false },
  ];

  return (
    <div className="card-dark rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <DollarSign className="w-5 h-5 text-gold-400" />
        <h2 className="font-serif text-lg text-gold-300">Bilan financier</h2>
      </div>
      <div className="space-y-0">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between py-2.5 ${i < rows.length - 1 ? 'border-b border-ash/20' : ''} ${row.bold ? 'mt-1' : ''}`}
          >
            <span className={`text-sm ${row.bold ? 'text-silver-200 font-semibold' : 'text-silver-500'}`}>
              {row.label}
            </span>
            <span className={`text-sm tabular-nums ${row.color} ${row.bold ? 'font-semibold' : ''}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MarketingPerformance ───────────────────────────────────────────────

function MarketingPerformance({ marketing }: { marketing: ExecutiveData['marketing'] }) {
  const rateColor =
    marketing.recoverySuccessRate >= 15 ? 'text-emerald-400' :
    marketing.recoverySuccessRate >= 5  ? 'text-amber-400'   : 'text-red-400';

  return (
    <div className="card-dark rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Mail className="w-5 h-5 text-amber-400" />
        <h2 className="font-serif text-lg text-gold-300">Marketing</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-charcoal/40 rounded-xl p-3">
          <p className="text-silver-500 text-xs mb-1">Relances envoyées</p>
          <p className="text-2xl font-semibold text-amber-400 tabular-nums">{marketing.recoveryEmailsSent}</p>
        </div>
        <div className="bg-charcoal/40 rounded-xl p-3">
          <p className="text-silver-500 text-xs mb-1">Récupérées</p>
          <p className="text-2xl font-semibold text-emerald-400 tabular-nums">{marketing.recoveredOrders}</p>
        </div>
      </div>
      <div className="space-y-2.5 border-t border-ash/20 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-silver-500">Taux de récupération</span>
          <span className={`tabular-nums font-medium ${rateColor}`}>{marketing.recoverySuccessRate}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-silver-500">Commandes en attente</span>
          <span className="text-silver-300 tabular-nums">{marketing.pendingOrders}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-silver-500">Revenus potentiels</span>
          <span className="text-red-400 tabular-nums">{formatPrice(marketing.estimatedLostRevenue)}</span>
        </div>
      </div>
    </div>
  );
}

// ── ActivityFeed ───────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  checkout_created:    { label: 'Panier créé',      Icon: ShoppingCart, color: 'text-blue-400' },
  payment_completed:   { label: 'Paiement reçu',    Icon: CheckCircle,  color: 'text-emerald-400' },
  payment_failed:      { label: 'Paiement échoué',  Icon: XCircle,      color: 'text-red-400' },
  recovery_email_sent: { label: 'Relance envoyée',  Icon: Mail,         color: 'text-amber-400' },
  status_changed:      { label: 'Statut modifié',   Icon: RefreshCcw,   color: 'text-purple-400' },
  refund_processed:    { label: 'Remboursement',    Icon: RotateCcw,    color: 'text-red-400' },
};

function ActivityFeed({ events }: { events: ExecutiveData['activityFeed'] }) {
  return (
    <div className="card-dark rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-cyan-400" />
        <h2 className="font-serif text-lg text-gold-300">Activité récente</h2>
      </div>
      {events.length === 0 ? (
        <p className="text-silver-500 text-sm">Aucun événement récent.</p>
      ) : (
        <div className="space-y-1.5 overflow-y-auto max-h-96 pr-1">
          {events.map(ev => {
            const cfg = EVENT_CONFIG[ev.event_type] ?? { label: ev.event_type, Icon: Activity, color: 'text-silver-400' };
            return (
              <div key={ev.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-charcoal/30 transition-colors">
                <cfg.Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-silver-300 text-xs font-medium">{cfg.label}</span>
                    {ev.amount !== null && ev.amount > 0 && (
                      <span className="text-gold-400 text-xs tabular-nums">{formatPrice(ev.amount)}</span>
                    )}
                  </div>
                  {(ev.user_name || ev.book_title) && (
                    <p className="text-silver-500 text-xs truncate mt-0.5">
                      {ev.user_name && <span>{ev.user_name}</span>}
                      {ev.user_name && ev.book_title && <span className="mx-1 text-silver-700">·</span>}
                      {ev.book_title && <span className="italic">{ev.book_title}</span>}
                    </p>
                  )}
                </div>
                <span className="text-silver-600 text-xs flex-shrink-0 whitespace-nowrap">
                  {formatRelativeTime(ev.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── InsightsAndAlerts ─────────────────────────────────────────────────

function InsightsAndAlerts({ insights, alerts }: {
  insights: ExecutiveData['insights'];
  alerts: ExecutiveData['alerts'];
}) {
  return (
    <div className="space-y-6">
      <div className="card-dark rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h2 className="font-serif text-lg text-gold-300">Analyse exécutive</h2>
        </div>
        <div className="space-y-2.5">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 p-3 rounded-xl text-sm ${
                ins.type === 'positive' ? 'bg-emerald-900/20 border border-emerald-700/20' :
                ins.type === 'warning'  ? 'bg-amber-900/20  border border-amber-700/20'   :
                                          'bg-charcoal/40    border border-ash/20'
              }`}
            >
              <span className={`flex-shrink-0 mt-0.5 font-bold ${
                ins.type === 'positive' ? 'text-emerald-400' :
                ins.type === 'warning'  ? 'text-amber-400'   : 'text-silver-500'
              }`}>
                {ins.type === 'positive' ? '✓' : ins.type === 'warning' ? '⚠' : '→'}
              </span>
              <p className={`leading-relaxed ${
                ins.type === 'positive' ? 'text-emerald-200' :
                ins.type === 'warning'  ? 'text-amber-200'   : 'text-silver-400'
              }`}>
                {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h2 className="font-serif text-lg text-gold-300">Alertes</h2>
        </div>
        <div className="space-y-2.5">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border ${
                alert.severity === 'critical' ? 'bg-red-900/20     border-red-700/30' :
                alert.severity === 'warning'  ? 'bg-amber-900/20   border-amber-700/30' :
                                                'bg-emerald-900/20 border-emerald-700/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {alert.severity === 'critical' && <AlertCircle  className="w-3.5 h-3.5 text-red-400     flex-shrink-0" />}
                {alert.severity === 'warning'  && <AlertTriangle className="w-3.5 h-3.5 text-amber-400   flex-shrink-0" />}
                {alert.severity === 'healthy'  && <CheckCircle  className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                <p className={`text-sm font-medium ${
                  alert.severity === 'critical' ? 'text-red-300'     :
                  alert.severity === 'warning'  ? 'text-amber-300'   : 'text-emerald-300'
                }`}>
                  {alert.title}
                </p>
              </div>
              <p className="text-xs text-silver-400 ml-5">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function ExecutiveDashboard({ data }: { data: ExecutiveData }) {
  const { kpis, dailyChart, monthlyChart, topBooks, attentionBooks, highlights, financial, marketing, activityFeed, insights, alerts } = data;

  function p(current: number, prev: number) { return trendPct(current, prev); }

  return (
    <div className="exec-dashboard-root space-y-8">
      <style>{`
        @media print {
          body > * { visibility: hidden; }
          .exec-dashboard-root, .exec-dashboard-root * { visibility: visible; }
          .exec-dashboard-root { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-silver-200 mb-1">Tableau de bord exécutif</h1>
          <p className="text-silver-500 text-sm">Vue d'ensemble · CDS Librairie</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 px-4 py-2 rounded-xl border border-ash/40 text-silver-400 hover:text-silver-200 hover:border-ash/60 transition-all text-sm flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      {/* Section Revenus */}
      <div>
        <p className="text-silver-600 text-xs uppercase tracking-widest mb-3">Revenus</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Aujourd'hui"  value={formatPrice(kpis.revenueToday)}  icon={DollarSign} iconColor="text-gold-400" trend={p(kpis.revenueToday,  kpis.revenueTodayPrev)} />
          <KpiCard label="Cette semaine" value={formatPrice(kpis.revenueWeek)}   icon={TrendingUp} iconColor="text-gold-400" trend={p(kpis.revenueWeek,   kpis.revenueWeekPrev)} />
          <KpiCard label="Ce mois"       value={formatPrice(kpis.revenueMonth)}  icon={BarChart2}  iconColor="text-gold-400" trend={p(kpis.revenueMonth,  kpis.revenueMonthPrev)} />
          <KpiCard label="Cette année"   value={formatPrice(kpis.revenueYear)}   icon={Calendar}   iconColor="text-gold-400" trend={p(kpis.revenueYear,   kpis.revenueYearPrev)} />
        </div>
      </div>

      {/* Section Ventes */}
      <div>
        <p className="text-silver-600 text-xs uppercase tracking-widest mb-3">Ventes</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Commandes auj."  value={String(kpis.ordersToday)}        icon={ShoppingCart} iconColor="text-blue-400"    trend={p(kpis.ordersToday,    kpis.ordersTodayPrev)} />
          <KpiCard label="Panier moyen"    value={formatPrice(kpis.avgOrderValue)}  icon={CreditCard}   iconColor="text-blue-400"    trend={p(kpis.avgOrderValue,  kpis.avgOrderValuePrev)} />
          <KpiCard label="Taux relance"    value={`${kpis.recoveryRate}%`}          icon={RefreshCcw}   iconColor="text-emerald-400"  trend={p(kpis.recoveryRate,   kpis.recoveryRatePrev)} />
          <KpiCard label="Taux remb."      value={`${kpis.refundRate}%`}            icon={RotateCcw}    iconColor="text-red-400"      trend={p(kpis.refundRate,     kpis.refundRatePrev)} trendBad />
        </div>
      </div>

      {/* Section Clients */}
      <div>
        <p className="text-silver-600 text-xs uppercase tracking-widest mb-3">Clients</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard label="Total"         value={String(kpis.totalCustomers)}      icon={Users}    iconColor="text-purple-400"  sub="inscrits" />
          <KpiCard label="Nouveaux (30j)" value={String(kpis.newCustomers30d)}    icon={UserPlus} iconColor="text-purple-400"  trend={p(kpis.newCustomers30d,     kpis.newCustomersPrev)} />
          <KpiCard label="Actifs (30j)"   value={String(kpis.activeCustomers30d)} icon={Activity} iconColor="text-cyan-400"    trend={p(kpis.activeCustomers30d,  kpis.activeCustomersPrev)} />
          <KpiCard label="VIP"            value={String(kpis.vipCustomers)}       icon={Crown}    iconColor="text-gold-600"    sub="LTV ≥ $200 ou ≥ 3 livres" />
        </div>
      </div>

      {/* Graphique Revenus */}
      <RevenueChart dailyChart={dailyChart} monthlyChart={monthlyChart} />

      {/* Top Livres + À surveiller */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2">
          <TopBooksTable books={topBooks} />
        </div>
        <AttentionBooks books={attentionBooks} />
      </div>

      {/* Clients en vedette */}
      <CustomerHighlights highlights={highlights} vipCount={kpis.vipCustomers} />

      {/* Bilan financier + Marketing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinancialSummary financial={financial} />
        <MarketingPerformance marketing={marketing} />
      </div>

      {/* Analyse + Alertes + Activité */}
      <InsightsAndAlerts insights={insights} alerts={alerts} />
      <ActivityFeed events={activityFeed} />
    </div>
  );
}
