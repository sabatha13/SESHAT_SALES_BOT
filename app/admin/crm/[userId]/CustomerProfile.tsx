'use client';
import { useState, useEffect } from 'react';
import {
  BookOpen, DollarSign, Clock, Mail, Download, RefreshCcw, AlertTriangle,
  CheckCircle, Info, TrendingUp, Activity, ShoppingCart, MessageSquare,
  BarChart2, User, ExternalLink, Crown, Zap, Send, ChevronRight, Copy, Check,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

// ── Types (mirrors API response) ─────────────────────────────────

interface ApiResponse {
  profile: { id: string; email: string; full_name: string; created_at: string };
  kpis: {
    booksOwned: number; lifetimeValue: number; completedPurchases: number;
    pendingPurchases: number; recoveryEmailsSent: number; downloads: number;
    refunds: number; lastActivityAt: string | null;
  };
  purchases: Array<{
    id: string; book_id: string; book_title: string; book_category: string;
    amount: number; status: string; created_at: string;
    recovery_email_count: number; stripe_payment_intent: string | null;
  }>;
  timeline: Array<{
    id: string; event_type: string; event_source: string; purchase_id: string | null;
    created_at: string; metadata: any; new_status: string | null; previous_status: string | null;
  }>;
  communications: Array<{
    id: string; event_type: string; created_at: string; purchase_id: string | null; metadata: any;
  }>;
  analytics: {
    revenue: number; avgOrderValue: number; purchaseFrequencyDays: number | null;
    recoverySuccessRate: number; favoriteCategory: string | null; lastActivityAt: string | null;
  };
  healthScore: { value: number; label: string };
  insights: Array<{ type: 'positive' | 'warning' | 'neutral'; text: string }>;
  books: Array<{ id: string; title: string; author: string }>;
  pendingPurchaseId: string | null;
  latestCompletedPurchId: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────

const fmt = (dt: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dt));

const fmtDate = (dt: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dt));

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  external:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
  refunded:  'bg-red-500/15 text-red-400 border-red-500/20',
};
const STATUS_LABEL: Record<string, string> = {
  completed: 'Complété', external: 'Externe', pending: 'En attente', refunded: 'Remboursé',
};

const EVENT_ICON: Record<string, { icon: React.ElementType; cls: string }> = {
  checkout_created:      { icon: ShoppingCart, cls: 'text-blue-400' },
  payment_completed:     { icon: CheckCircle,  cls: 'text-emerald-400' },
  payment_failed:        { icon: AlertTriangle, cls: 'text-red-400' },
  recovery_email_sent:   { icon: Mail,         cls: 'text-purple-400' },
  status_changed:        { icon: RefreshCcw,   cls: 'text-amber-400' },
  newsletter_sent:       { icon: Send,         cls: 'text-blue-400' },
  access_granted:        { icon: Crown,        cls: 'text-gold-400' },
};

const TABS = [
  { key: 'overview',       label: 'Vue d\'ensemble', icon: User },
  { key: 'purchases',      label: 'Achats',          icon: ShoppingCart },
  { key: 'timeline',       label: 'Timeline',         icon: Activity },
  { key: 'communications', label: 'Communications',  icon: MessageSquare },
  { key: 'analytics',      label: 'Analytiques',     icon: BarChart2 },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Health Gauge (SVG) ───────────────────────────────────────────

function HealthGauge({ value, label }: { value: number; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : value >= 40 ? '#f97316' : '#f87171';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
          <circle cx="45" cy="45" r={r} fill="none" stroke="#2a2a2a" strokeWidth="8" />
          <circle
            cx="45" cy="45" r={r} fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-2xl text-silver-200">{value}</span>
        </div>
      </div>
      <span className="text-silver-500 text-xs">{label}</span>
    </div>
  );
}

// ── Quick Actions bar ─────────────────────────────────────────────

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text via execCommand
      const el = document.createElement('textarea');
      el.value = email;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copié !' : 'Copier l\'email'}
    </button>
  );
}

function QuickActions({ data }: { data: ApiResponse }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {data.pendingPurchaseId && (
        <a
          href={`/admin/ventes?focus=${data.pendingPurchaseId}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15 text-xs font-medium transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          Commande en attente
        </a>
      )}
      {data.latestCompletedPurchId && (
        <a
          href={`/admin/ventes?focus=${data.latestCompletedPurchId}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Dernier achat
        </a>
      )}
      <CopyEmailButton email={data.profile.email} />
      <a
        href={`mailto:${data.profile.email}`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-charcoal border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-all"
      >
        <Mail className="w-3.5 h-3.5" />
        Envoyer un email
      </a>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────

function TabOverview({ data }: { data: ApiResponse }) {
  const kpis = data.kpis;

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Livres possédés',   value: kpis.booksOwned.toString(),         icon: BookOpen },
          { label: 'Lifetime Value',    value: formatPrice(kpis.lifetimeValue),      icon: DollarSign },
          { label: 'Commandes complet.', value: kpis.completedPurchases.toString(), icon: CheckCircle },
          { label: 'Téléchargements',   value: kpis.downloads.toString(),           icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-dark px-5 py-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-gold-500/70" />
              <p className="text-silver-500 text-[10px] uppercase tracking-widest">{label}</p>
            </div>
            <p className="font-serif text-2xl text-silver-200 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health score + profile info */}
        <div className="card-dark rounded-2xl p-6 space-y-5">
          <h3 className="text-silver-400 text-xs uppercase tracking-widest font-medium">Santé du compte</h3>
          <div className="flex items-center gap-6">
            <HealthGauge value={data.healthScore.value} label={data.healthScore.label} />
            <div className="space-y-2 text-sm flex-1">
              {[
                { label: 'Email',         value: data.profile.email },
                { label: 'Inscrit le',    value: fmtDate(data.profile.created_at) },
                { label: 'Dernière activ.', value: kpis.lastActivityAt ? fmtDate(kpis.lastActivityAt) : '—' },
                { label: 'Remboursements', value: kpis.refunds > 0 ? `${kpis.refunds} × remboursé` : 'Aucun' },
                { label: 'Relances env.',  value: kpis.recoveryEmailsSent.toString() },
                { label: 'En attente',     value: kpis.pendingPurchases.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-silver-600 text-xs">{label}</span>
                  <span className="text-silver-300 text-xs text-right truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart insights */}
        <div className="card-dark rounded-2xl p-6 space-y-3">
          <h3 className="text-silver-400 text-xs uppercase tracking-widest font-medium">Insights</h3>
          {data.insights.map((ins, i) => (
            <div key={i} className="flex gap-2.5 items-start text-sm">
              {ins.type === 'positive' && <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />}
              {ins.type === 'warning'  && <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />}
              {ins.type === 'neutral'  && <Info className="w-4 h-4 text-silver-500 mt-0.5 shrink-0" />}
              <span className={
                ins.type === 'positive' ? 'text-silver-300' :
                ins.type === 'warning'  ? 'text-amber-300' : 'text-silver-500'
              }>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Purchases tab ─────────────────────────────────────────────────

function TabPurchases({ data }: { data: ApiResponse }) {
  if (data.purchases.length === 0) {
    return (
      <div className="card-dark rounded-2xl py-16 text-center">
        <ShoppingCart className="w-8 h-8 text-ash/40 mx-auto mb-3" />
        <p className="text-silver-600">Aucun achat</p>
      </div>
    );
  }

  return (
    <div className="card-dark rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ash/30">
              {['Livre', 'Catégorie', 'Montant', 'Statut', 'Relances', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-silver-600 text-[10px] uppercase tracking-wide font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.purchases.map(p => (
              <tr key={p.id} className="border-b border-ash/20 hover:bg-charcoal/30 transition-colors">
                <td className="px-4 py-3 text-silver-200 text-sm max-w-[180px]">
                  <p className="truncate">{p.book_title}</p>
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs">{p.book_category}</td>
                <td className="px-4 py-3 text-gold-400 text-sm tabular-nums font-medium">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[p.status] ?? 'bg-ash/20 text-silver-500 border-ash/30'}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs tabular-nums">
                  {p.recovery_email_count > 0 ? <span className="text-purple-400">{p.recovery_email_count}</span> : '—'}
                </td>
                <td className="px-4 py-3 text-silver-500 text-xs whitespace-nowrap">{fmtDate(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Timeline tab ──────────────────────────────────────────────────

function TabTimeline({ data }: { data: ApiResponse }) {
  if (data.timeline.length === 0) {
    return (
      <div className="card-dark rounded-2xl py-16 text-center">
        <Activity className="w-8 h-8 text-ash/40 mx-auto mb-3" />
        <p className="text-silver-600">Aucun événement</p>
      </div>
    );
  }

  return (
    <div className="card-dark rounded-2xl p-6">
      <div className="relative">
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-ash/30" />
        <div className="space-y-5">
          {data.timeline.map(ev => {
            const cfg = EVENT_ICON[ev.event_type] ?? { icon: ChevronRight, cls: 'text-silver-500' };
            const Icon = cfg.icon;
            const label = ev.event_type.replace(/_/g, ' ');
            return (
              <div key={ev.id} className="flex gap-4 items-start relative">
                <div className="w-9 h-9 rounded-full bg-charcoal border border-ash/50 flex items-center justify-center shrink-0 z-10">
                  <Icon className={`w-4 h-4 ${cfg.cls}`} />
                </div>
                <div className="flex-1 min-w-0 pt-1.5">
                  <div className="flex flex-wrap gap-2 items-center mb-0.5">
                    <p className="text-silver-300 text-sm capitalize">{label}</p>
                    {ev.event_source && (
                      <span className="px-1.5 py-0.5 bg-charcoal border border-ash/40 rounded text-[9px] text-silver-600">{ev.event_source}</span>
                    )}
                  </div>
                  {ev.new_status && (
                    <p className="text-silver-500 text-xs">
                      {ev.previous_status && <span>{ev.previous_status} → </span>}
                      <span className="text-silver-300">{ev.new_status}</span>
                    </p>
                  )}
                  <p className="text-silver-600 text-[10px] mt-0.5">{fmt(ev.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Communications tab ────────────────────────────────────────────

function TabCommunications({ data }: { data: ApiResponse }) {
  if (data.communications.length === 0) {
    return (
      <div className="card-dark rounded-2xl py-16 text-center">
        <MessageSquare className="w-8 h-8 text-ash/40 mx-auto mb-3" />
        <p className="text-silver-600">Aucune communication enregistrée</p>
      </div>
    );
  }

  return (
    <div className="card-dark rounded-2xl divide-y divide-ash/20">
      {data.communications.map(c => (
        <div key={c.id} className="flex gap-4 items-start p-5">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            {c.event_type === 'recovery_email_sent' ? (
              <Mail className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Send className="w-3.5 h-3.5 text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-silver-300 text-sm capitalize">
              {c.event_type === 'recovery_email_sent' ? 'Email de relance envoyé' : 'Newsletter envoyée'}
            </p>
            {c.metadata?.subject && (
              <p className="text-silver-500 text-xs mt-0.5 truncate">Sujet : {c.metadata.subject}</p>
            )}
            <p className="text-silver-600 text-[10px] mt-1">{fmt(c.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────

function TabAnalytics({ data }: { data: ApiResponse }) {
  const { analytics } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Revenus totaux',    value: formatPrice(analytics.revenue) },
          { label: 'Panier moyen',      value: analytics.avgOrderValue > 0 ? formatPrice(analytics.avgOrderValue) : '—' },
          { label: 'Fréquence (jours)', value: analytics.purchaseFrequencyDays !== null ? `${analytics.purchaseFrequencyDays} j.` : '—' },
          { label: 'Taux relance → achat', value: `${analytics.recoverySuccessRate} %` },
          { label: 'Catégorie préférée', value: analytics.favoriteCategory ?? '—' },
          { label: 'Dernière activité', value: analytics.lastActivityAt ? fmtDate(analytics.lastActivityAt) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card-dark px-5 py-4 rounded-xl">
            <p className="text-silver-500 text-[10px] uppercase tracking-widest mb-1">{label}</p>
            <p className="font-serif text-xl text-silver-200 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="card-dark rounded-2xl p-6 space-y-3">
        <h3 className="text-silver-400 text-xs uppercase tracking-widest font-medium flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Score de santé détaillé
        </h3>
        <HealthGauge value={data.healthScore.value} label={data.healthScore.label} />
        <p className="text-silver-500 text-xs text-center">
          Activité récente · Taux de remboursement · Téléchargements · Commandes en attente · Taux de récupération
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function CustomerProfile({ userId }: { userId: string }) {
  const [data,    setData]    = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tab,     setTab]     = useState<TabKey>('overview');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/crm/customer/${userId}`);
        if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur');
        setData(await res.json());
      } catch (err: any) {
        setError(err.message ?? 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-dark rounded-2xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-dark rounded-2xl p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 text-sm">{error ?? 'Données introuvables'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Quick actions */}
      <QuickActions data={data} />

      {/* Tab nav */}
      <div className="border-b border-ash/30 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-silver-500 hover:text-silver-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'overview'       && <TabOverview       data={data} />}
      {tab === 'purchases'      && <TabPurchases      data={data} />}
      {tab === 'timeline'       && <TabTimeline       data={data} />}
      {tab === 'communications' && <TabCommunications data={data} />}
      {tab === 'analytics'      && <TabAnalytics      data={data} />}
    </div>
  );
}
