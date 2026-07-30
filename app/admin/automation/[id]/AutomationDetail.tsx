'use client';

import Link from 'next/link';
import {
  ArrowLeft, Zap, CheckCircle2, XCircle, Clock, AlertTriangle, Calendar,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export type AutomationStatus = 'active' | 'paused' | 'draft' | 'archived';

export interface RecentRun {
  id:            string;
  status:        string;
  startedAt:     string | null;
  completedAt:   string | null;
  errorMessage:  string | null;
  campaignRunId: string | null;
  profileId:     string | null;
  createdAt:     string;
}

export interface AutomationDetailData {
  id:            string;
  name:          string;
  description:   string;
  status:        AutomationStatus;
  trigger_type:  string;
  campaign:      { id: string; name: string; type: string; status: string } | null;
  delay_minutes: number;
  conditions:    Array<{ key: string; operator: string; value: string }>;
  metadata:      Record<string, unknown>;
  created_at:    string;
  updated_at:    string;
  created_by:    string | null;
  metrics: {
    totalRuns:    number;
    successCount: number;
    failedCount:  number;
    revenue:      number;
    successRate:  number;
  };
  recentRuns: RecentRun[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  purchase_completed: 'Achat complété',
  purchase_failed:    'Achat échoué',
  abandoned_checkout: 'Panier abandonné',
  new_customer:       'Nouveau client',
  vip_customer:       'Client VIP',
  inactive_30:        'Inactif 30j',
  inactive_90:        'Inactif 90j',
  book_published:     'Livre publié',
  coupon_expiring:    'Coupon expirant',
  scheduled_time:     'Heure planifiée',
};

const STATUS_CONFIG: Record<AutomationStatus, { label: string; cls: string }> = {
  active:   { label: 'Actif',     cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  paused:   { label: 'En pause',  cls: 'text-amber-400   bg-amber-500/10   border-amber-500/25' },
  draft:    { label: 'Brouillon', cls: 'text-silver-400  bg-ash/50          border-ash/50' },
  archived: { label: 'Archivé',   cls: 'text-silver-600  bg-charcoal        border-ash/30' },
};

const RUN_CONFIG: Record<string, {
  label: string;
  dot:   string;
  icon:  React.ElementType;
  textCls: string;
}> = {
  pending:   { label: 'En attente', dot: 'bg-amber-400',               icon: Clock,        textCls: 'text-amber-400'  },
  running:   { label: 'En cours',   dot: 'bg-blue-400 animate-pulse',  icon: Zap,          textCls: 'text-blue-400'   },
  completed: { label: 'Terminé',    dot: 'bg-emerald-400',             icon: CheckCircle2, textCls: 'text-emerald-400'},
  failed:    { label: 'Échoué',     dot: 'bg-red-400',                 icon: XCircle,      textCls: 'text-red-400'    },
  cancelled: { label: 'Annulé',     dot: 'bg-silver-500',              icon: AlertTriangle,textCls: 'text-silver-500' },
};

const CONDITION_LABELS: Record<string, string> = {
  min_spending:     'Dépenses min.',
  book_purchased:   'Livre acheté',
  coupon_used:      'Coupon utilisé',
  vip_only:         'VIP seulement',
  country:          'Pays',
  purchase_count:   "Nb d'achats",
  customer_segment: 'Segment client',
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: '=', gte: '≥', lte: '≤', ne: '≠',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDelay(mins: number): string {
  if (mins === 0) return 'Immédiat';
  if (mins < 60)  return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000)  return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}min`;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AutomationDetail({ data }: { data: AutomationDetailData }) {
  const statusCfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/automation"
            className="mt-1 p-1.5 rounded-lg text-silver-500 hover:text-gold-400 hover:bg-gold-500/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-gold-400 shrink-0" />
              <h1 className="font-serif text-2xl text-silver-200">{data.name}</h1>
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                statusCfg.cls
              )}>
                {statusCfg.label}
              </span>
            </div>
            {data.description && (
              <p className="text-silver-500 text-sm ml-7">{data.description}</p>
            )}
          </div>
        </div>
        <p className="text-silver-600 text-xs ml-10 sm:ml-0 sm:text-right shrink-0">
          Créée le {fmtDateTime(data.created_at)}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-dark p-5">
          <p className="text-silver-500 text-xs uppercase tracking-wider mb-3">Runs totaux</p>
          <p className="text-3xl font-semibold text-silver-200 tabular-nums">{data.metrics.totalRuns}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-xs text-emerald-400">{data.metrics.successCount} réussis</span>
            <span className="text-xs text-red-400">{data.metrics.failedCount} échoués</span>
          </div>
        </div>

        <div className="card-dark p-5">
          <p className="text-silver-500 text-xs uppercase tracking-wider mb-3">Taux de succès</p>
          <p className={cn(
            'text-3xl font-semibold tabular-nums',
            data.metrics.successRate >= 90 ? 'text-emerald-400' :
            data.metrics.successRate >= 70 ? 'text-amber-400'   : 'text-red-400'
          )}>
            {data.metrics.successRate}%
          </p>
        </div>

        <div className="card-dark p-5">
          <p className="text-silver-500 text-xs uppercase tracking-wider mb-3">Revenus attribués</p>
          <p className="text-3xl font-semibold text-gold-400 tabular-nums">
            {formatPrice(data.metrics.revenue)}
          </p>
        </div>

        <div className="card-dark p-5">
          <p className="text-silver-500 text-xs uppercase tracking-wider mb-3">Délai d&apos;exécution</p>
          <p className="text-3xl font-semibold text-silver-200">{fmtDelay(data.delay_minutes)}</p>
        </div>
      </div>

      {/* Config + Conditions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-dark p-6 space-y-4">
          <h3 className="text-silver-500 text-xs uppercase tracking-wider font-medium">Configuration</h3>
          <dl className="space-y-3">
            <div className="flex justify-between items-center">
              <dt className="text-silver-500 text-sm">Déclencheur</dt>
              <dd className="text-silver-200 text-sm font-medium">
                {TRIGGER_LABELS[data.trigger_type] ?? data.trigger_type}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-silver-500 text-sm">Campagne liée</dt>
              <dd className="text-sm">
                {data.campaign
                  ? <Link href="/admin/marketing" className="text-gold-400 hover:text-gold-300 transition-colors">{data.campaign.name}</Link>
                  : <span className="text-silver-600">—</span>}
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-silver-500 text-sm">Statut</dt>
              <dd>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                  statusCfg.cls
                )}>
                  {statusCfg.label}
                </span>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-silver-500 text-sm">Dernière màj</dt>
              <dd className="text-silver-400 text-xs">{fmtDateTime(data.updated_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="card-dark p-6 space-y-4">
          <h3 className="text-silver-500 text-xs uppercase tracking-wider font-medium">Conditions</h3>
          {data.conditions.length === 0 ? (
            <p className="text-silver-600 text-sm">Aucune condition — déclenche pour tous les profils.</p>
          ) : (
            <div className="space-y-2.5">
              {data.conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-charcoal rounded-lg px-3 py-2">
                  <span className="text-silver-400">{CONDITION_LABELS[c.key] ?? c.key}</span>
                  <span className="text-gold-500 font-mono">{OPERATOR_LABELS[c.operator] ?? c.operator}</span>
                  <span className="text-silver-200 font-medium">{c.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent runs table */}
      <div className="card-dark p-6">
        <h3 className="text-silver-300 font-medium mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold-400" />
          Historique d&apos;exécutions
          <span className="text-silver-600 text-xs ml-auto">{data.recentRuns.length} runs</span>
        </h3>

        {data.recentRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-silver-600">
            <Zap className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">Aucun run enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ash/50">
                  <th className="text-left pb-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Statut</th>
                  <th className="text-right pb-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Durée</th>
                  <th className="text-right pb-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Démarré le</th>
                  <th className="text-left pb-3 pl-4 text-silver-500 text-xs uppercase tracking-wider font-medium">Erreur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ash/20">
                {data.recentRuns.map((run) => {
                  const cfg  = RUN_CONFIG[run.status] ?? RUN_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={run.id} className="hover:bg-charcoal/30 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn('inline-block w-2 h-2 rounded-full', cfg.dot)} />
                          <Icon className={cn('w-3.5 h-3.5', cfg.textCls)} />
                          <span className="text-silver-300 text-xs">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right tabular-nums text-silver-400 text-xs">
                        {fmtDuration(run.startedAt, run.completedAt)}
                      </td>
                      <td className="py-3 text-right text-silver-500 text-xs whitespace-nowrap">
                        {run.startedAt ? fmtDateTime(run.startedAt) : fmtDateTime(run.createdAt)}
                      </td>
                      <td className="py-3 pl-4 text-red-400 text-xs max-w-[200px] truncate">
                        {run.errorMessage ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Timeline */}
      {data.recentRuns.length > 0 && (
        <div className="card-dark p-6">
          <h3 className="text-silver-300 font-medium mb-5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold-400" />
            Timeline des 10 derniers runs
          </h3>
          <div className="relative pl-6">
            <div className="absolute left-6 top-2 bottom-2 w-px bg-ash/50" />
            <div className="space-y-5">
              {data.recentRuns.slice(0, 10).map((run) => {
                const cfg = RUN_CONFIG[run.status] ?? RUN_CONFIG.pending;
                return (
                  <div key={run.id} className="relative flex gap-4">
                    <div className={cn(
                      'absolute -left-[3px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-obsidian shrink-0',
                      cfg.dot
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-silver-300 text-sm font-medium">{cfg.label}</span>
                        <span className="text-silver-600 text-xs">{fmtDuration(run.startedAt, run.completedAt)}</span>
                      </div>
                      <p className="text-silver-500 text-xs mt-0.5">
                        {run.startedAt ? fmtDateTime(run.startedAt) : fmtDateTime(run.createdAt)}
                      </p>
                      {run.errorMessage && (
                        <p className="text-red-400 text-xs mt-0.5 truncate">{run.errorMessage}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
