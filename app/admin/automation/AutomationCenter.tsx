'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Play, Pause, Copy, Eye, Plus, CheckCircle2, XCircle, Clock,
  AlertTriangle, Activity, BarChart2, ChevronRight, Timer, DollarSign,
  TrendingUp, Settings, Trash2, RefreshCw, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { cn, formatPrice } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AutomationStatus = 'active' | 'paused' | 'draft' | 'archived';

export interface Condition {
  key:      string;
  operator: string;
  value:    string;
}

export interface AutomationItem {
  id:            string;
  name:          string;
  description:   string;
  status:        AutomationStatus;
  trigger_type:  string;
  campaign:      { id: string; name: string; type: string } | null;
  delay_minutes: number;
  conditions:    Condition[];
  metadata:      Record<string, unknown>;
  created_at:    string;
  updated_at:    string;
  runsCount:     number;
  successCount:  number;
  failedCount:   number;
  successRate:   number | null;
  revenue:       number;
}

export interface ExecutionLogItem {
  id:             string;
  automationId:   string;
  automationName: string;
  profileId:      string | null;
  campaignRunId:  string | null;
  status:         string;
  startedAt:      string | null;
  completedAt:    string | null;
  errorMessage:   string | null;
  createdAt:      string;
}

export interface AutomationData {
  kpis: {
    activeAutomations: number;
    runsToday:         number;
    successfulRuns:    number;
    failedRuns:        number;
    pendingRuns:       number;
    revenueGenerated:  number;
    successRate:       number;
    avgExecutionSec:   number;
  };
  automations:  AutomationItem[];
  campaigns:    { id: string; name: string; type: string; status: string }[];
  executionLog: ExecutionLogItem[];
  monitoring: {
    runsPerDay:           { date: string; total: number; completed: number; failed: number }[];
    revenueByAutomation:  { name: string; revenue: number }[];
    failureReasons:       { reason: string; count: number }[];
  };
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

const TRIGGER_COLOR: Record<string, string> = {
  purchase_completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  purchase_failed:    'text-red-400     bg-red-500/10     border-red-500/20',
  abandoned_checkout: 'text-amber-400   bg-amber-500/10   border-amber-500/20',
  new_customer:       'text-blue-400    bg-blue-500/10    border-blue-500/20',
  vip_customer:       'text-gold-400    bg-gold-500/10    border-gold-500/20',
  inactive_30:        'text-orange-400  bg-orange-500/10  border-orange-500/20',
  inactive_90:        'text-red-400     bg-red-500/10     border-red-500/20',
  book_published:     'text-purple-400  bg-purple-500/10  border-purple-500/20',
  coupon_expiring:    'text-amber-400   bg-amber-500/10   border-amber-500/20',
  scheduled_time:     'text-silver-400  bg-ash/50          border-ash/30',
};

const STATUS_CONFIG: Record<AutomationStatus, { label: string; cls: string }> = {
  active:   { label: 'Actif',     cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  paused:   { label: 'En pause',  cls: 'text-amber-400   bg-amber-500/10   border-amber-500/25' },
  draft:    { label: 'Brouillon', cls: 'text-silver-400  bg-ash/50          border-ash/50' },
  archived: { label: 'Archivé',   cls: 'text-silver-600  bg-charcoal        border-ash/30' },
};

const RUN_STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  pending:   { label: 'En attente', dot: 'bg-amber-400' },
  running:   { label: 'En cours',   dot: 'bg-blue-400 animate-pulse' },
  completed: { label: 'Terminé',    dot: 'bg-emerald-400' },
  failed:    { label: 'Échoué',     dot: 'bg-red-400' },
  cancelled: { label: 'Annulé',     dot: 'bg-silver-500' },
};

const CONDITION_KEYS = [
  { value: 'min_spending',     label: 'Dépenses minimales (cts)' },
  { value: 'book_purchased',   label: 'Livre acheté (ID)' },
  { value: 'coupon_used',      label: 'Coupon utilisé (code)' },
  { value: 'vip_only',         label: 'Client VIP seulement' },
  { value: 'country',          label: 'Pays (code ISO)' },
  { value: 'purchase_count',   label: "Nombre d'achats" },
  { value: 'customer_segment', label: 'Segment client' },
];

const OPERATORS = [
  { value: 'eq',  label: '= égal' },
  { value: 'gte', label: '>= supérieur ou égal' },
  { value: 'lte', label: '<= inférieur ou égal' },
  { value: 'ne',  label: '≠ différent' },
];

const TABS = [
  { key: 'dashboard',   label: 'Dashboard' },
  { key: 'automations', label: 'Automations' },
  { key: 'builder',     label: '+ Nouvelle' },
  { key: 'logs',        label: 'Logs' },
  { key: 'monitoring',  label: 'Monitoring' },
] as const;
type TabKey = typeof TABS[number]['key'];

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

function fmtShort(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function fmtSec(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}min ${sec % 60}s`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, color = 'gold', sub }: {
  label: string;
  value: string;
  icon:  React.ElementType;
  color?: 'gold' | 'green' | 'red' | 'blue' | 'amber' | 'silver';
  sub?:  string;
}) {
  const iconCls: Record<string, string> = {
    gold:   'text-gold-400',
    green:  'text-emerald-400',
    red:    'text-red-400',
    blue:   'text-blue-400',
    amber:  'text-amber-400',
    silver: 'text-silver-400',
  };
  return (
    <div className="card-dark p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-silver-500 text-xs uppercase tracking-widest">{label}</span>
        <Icon className={cn('w-4 h-4', iconCls[color])} />
      </div>
      <p className="text-2xl font-semibold text-silver-200 tabular-nums">{value}</p>
      {sub && <p className="text-silver-500 text-xs">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: AutomationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function TriggerBadge({ trigger }: { trigger: string }) {
  const cls = TRIGGER_COLOR[trigger] ?? 'text-silver-400 bg-ash/50 border-ash/30';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', cls)}>
      {TRIGGER_LABELS[trigger] ?? trigger}
    </span>
  );
}

function RunDot({ status }: { status: string }) {
  const cfg = RUN_STATUS_CONFIG[status] ?? { dot: 'bg-silver-500', label: status };
  return <span title={cfg.label} className={cn('inline-block w-2 h-2 rounded-full', cfg.dot)} />;
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-silver-600">
      <Zap className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{msg}</p>
    </div>
  );
}

// ── Dashboard Tab ──────────────────────────────────────────────────────────────

function DashboardTab({ data, automations }: { data: AutomationData; automations: AutomationItem[] }) {
  const { kpis } = data;
  const top5 = [...automations].sort((a, b) => b.runsCount - a.runsCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Automations actives" value={String(kpis.activeAutomations)} icon={Zap}          color="gold"   />
        <KpiCard label="Runs aujourd'hui"     value={String(kpis.runsToday)}         icon={Activity}     color="blue"   />
        <KpiCard label="Runs réussis"         value={String(kpis.successfulRuns)}    icon={CheckCircle2} color="green"  />
        <KpiCard label="Runs échoués"         value={String(kpis.failedRuns)}        icon={XCircle}      color="red"    />
        <KpiCard label="En attente"           value={String(kpis.pendingRuns)}       icon={Clock}        color="amber"  />
        <KpiCard label="Revenus générés"      value={formatPrice(kpis.revenueGenerated)} icon={DollarSign} color="gold" />
        <KpiCard
          label="Taux de succès"
          value={`${kpis.successRate}%`}
          icon={TrendingUp}
          color="green"
          sub="runs complétés / total"
        />
        <KpiCard label="Durée moy. exéc." value={fmtSec(kpis.avgExecutionSec)} icon={Timer} color="silver" />
      </div>

      <div className="card-dark p-6">
        <h3 className="text-silver-300 font-medium mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gold-400" />
          Top automations par volume
        </h3>
        {top5.length === 0 ? (
          <EmptyState msg="Aucune automation avec des runs" />
        ) : (
          <div className="space-y-4">
            {top5.map((a) => (
              <div key={a.id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm text-silver-200 truncate">{a.name}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="w-full h-1.5 bg-ash/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${top5[0].runsCount > 0 ? (a.runsCount / top5[0].runsCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0 w-24">
                  <p className="text-sm tabular-nums text-silver-200">{a.runsCount} runs</p>
                  <p className="text-xs text-silver-500">
                    {a.successRate != null ? `${a.successRate}% ok` : '—'}
                  </p>
                </div>
                <Link
                  href={`/admin/automation/${a.id}`}
                  className="text-silver-500 hover:text-gold-400 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Automations Tab ────────────────────────────────────────────────────────────

function AutomationsTab({ automations, campaigns, onStatusChange, onDuplicate }: {
  automations:    AutomationItem[];
  campaigns:      { id: string; name: string; type: string; status: string }[];
  onStatusChange: (id: string, status: AutomationStatus) => void;
  onDuplicate:    (a: AutomationItem) => void;
}) {
  const [filter, setFilter] = useState<AutomationStatus | 'all'>('all');

  const filtered = filter === 'all'
    ? automations
    : automations.filter((a) => a.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'paused', 'draft', 'archived'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
              filter === s
                ? 'bg-gold-500/15 text-gold-400 border-gold-500/25'
                : 'text-silver-500 hover:text-silver-300 bg-charcoal border-ash/50'
            )}
          >
            {s === 'all' ? 'Tous' : STATUS_CONFIG[s as AutomationStatus].label}
            {' '}({s === 'all'
              ? automations.length
              : automations.filter((a) => a.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState msg="Aucune automation dans ce filtre" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ash/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ash/50 bg-obsidian">
                {['Automation', 'Déclencheur', 'Statut', 'Runs', 'Succès', 'Revenus', 'Délai', ''].map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      'px-4 py-3 text-silver-500 text-xs uppercase tracking-wider font-medium',
                      i >= 3 && i <= 6 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ash/30">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-charcoal/40 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-silver-200 font-medium truncate max-w-[180px]">{a.name}</p>
                    {a.description && (
                      <p className="text-silver-500 text-xs truncate max-w-[180px]">{a.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TriggerBadge trigger={a.trigger_type} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-silver-300">{a.runsCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {a.successRate != null ? (
                      <span className={
                        a.successRate >= 90 ? 'text-emerald-400' :
                        a.successRate >= 70 ? 'text-amber-400'   : 'text-red-400'
                      }>
                        {a.successRate}%
                      </span>
                    ) : (
                      <span className="text-silver-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-silver-300">
                    {a.revenue > 0 ? formatPrice(a.revenue) : <span className="text-silver-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-silver-500 text-xs">{fmtDelay(a.delay_minutes)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/automation/${a.id}`}
                        className="p-1.5 rounded-lg text-silver-500 hover:text-gold-400 hover:bg-gold-500/10 transition-all"
                        title="Voir le détail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {a.status === 'active' ? (
                        <button
                          onClick={() => onStatusChange(a.id, 'paused')}
                          className="p-1.5 rounded-lg text-silver-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="Mettre en pause"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      ) : (a.status === 'paused' || a.status === 'draft') ? (
                        <button
                          onClick={() => onStatusChange(a.id, 'active')}
                          className="p-1.5 rounded-lg text-silver-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          title="Activer"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                      <button
                        onClick={() => onDuplicate(a)}
                        className="p-1.5 rounded-lg text-silver-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        title="Dupliquer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {a.status !== 'archived' && (
                        <button
                          onClick={() => onStatusChange(a.id, 'archived')}
                          className="p-1.5 rounded-lg text-silver-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Archiver"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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

// ── Builder Tab ────────────────────────────────────────────────────────────────

interface BuilderForm {
  name:         string;
  description:  string;
  trigger_type: string;
  campaign_id:  string;
  delay_value:  string;
  delay_unit:   'minutes' | 'hours' | 'days';
  status:       'draft' | 'active';
  conditions:   Condition[];
}

const BUILDER_DEFAULTS: BuilderForm = {
  name: '', description: '', trigger_type: '', campaign_id: '',
  delay_value: '0', delay_unit: 'minutes', status: 'draft', conditions: [],
};

function BuilderTab({ campaigns, onCreated }: {
  campaigns: { id: string; name: string; type: string; status: string }[];
  onCreated: (a: AutomationItem) => void;
}) {
  const [form, setForm]     = useState<BuilderForm>(BUILDER_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set<K extends keyof BuilderForm>(k: K, v: BuilderForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function addCondition() {
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { key: 'min_spending', operator: 'gte', value: '' }],
    }));
  }

  function updateCondition(i: number, partial: Partial<Condition>) {
    setForm((prev) => {
      const conds = [...prev.conditions];
      conds[i] = { ...conds[i], ...partial };
      return { ...prev, conditions: conds };
    });
  }

  function removeCondition(i: number) {
    setForm((prev) => ({ ...prev, conditions: prev.conditions.filter((_, j) => j !== i) }));
  }

  function computeDelayMinutes(): number {
    const val = parseInt(form.delay_value) || 0;
    if (form.delay_unit === 'hours') return val * 60;
    if (form.delay_unit === 'days')  return val * 1440;
    return val;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim())  { setError('Le nom est requis.');           return; }
    if (!form.trigger_type) { setError('Sélectionnez un déclencheur.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/automations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name.trim(),
          description:   form.description.trim() || null,
          trigger_type:  form.trigger_type,
          campaign_id:   form.campaign_id || null,
          delay_minutes: computeDelayMinutes(),
          conditions:    form.conditions,
          status:        form.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Erreur serveur'); return; }

      const created = json.data;
      onCreated({
        id:            created.id,
        name:          created.name,
        description:   created.description ?? '',
        status:        created.status,
        trigger_type:  created.trigger_type,
        campaign:      null,
        delay_minutes: created.delay_minutes,
        conditions:    created.conditions ?? [],
        metadata:      created.metadata ?? {},
        created_at:    created.created_at,
        updated_at:    created.updated_at,
        runsCount:     0,
        successCount:  0,
        failedCount:   0,
        successRate:   null,
        revenue:       0,
      });
      setForm(BUILDER_DEFAULTS);
    } finally {
      setSaving(false);
    }
  }

  const delayMin = computeDelayMinutes();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="card-dark p-6 space-y-5">
        <h3 className="text-silver-200 font-medium flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold-400" />
          Nouvelle automation
        </h3>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-silver-400 text-xs uppercase tracking-wider">Nom *</label>
          <input
            className="input-dark"
            placeholder="Ex. : Email relance panier abandonné"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-silver-400 text-xs uppercase tracking-wider">Description</label>
          <textarea
            className="input-dark resize-none h-20"
            placeholder="Décrivez l'objectif de cette automation…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-silver-400 text-xs uppercase tracking-wider">Déclencheur *</label>
          <select
            className="input-dark"
            value={form.trigger_type}
            onChange={(e) => set('trigger_type', e.target.value)}
          >
            <option value="">— Sélectionner un déclencheur —</option>
            {Object.entries(TRIGGER_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-silver-400 text-xs uppercase tracking-wider">Campagne liée (optionnel)</label>
          <select
            className="input-dark"
            value={form.campaign_id}
            onChange={(e) => set('campaign_id', e.target.value)}
          >
            <option value="">— Aucune campagne —</option>
            {campaigns.filter((c) => c.status !== 'archived').map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-silver-400 text-xs uppercase tracking-wider">Délai d&apos;exécution</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              className="input-dark w-28"
              value={form.delay_value}
              onChange={(e) => set('delay_value', e.target.value)}
            />
            <select
              className="input-dark flex-1"
              value={form.delay_unit}
              onChange={(e) => set('delay_unit', e.target.value as BuilderForm['delay_unit'])}
            >
              <option value="minutes">minutes</option>
              <option value="hours">heures</option>
              <option value="days">jours</option>
            </select>
          </div>
          <p className="text-silver-600 text-xs">
            {delayMin === 0 ? 'Exécution immédiate' : `Délai calculé : ${fmtDelay(delayMin)}`}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-silver-400 text-xs uppercase tracking-wider">Statut initial</label>
          <div className="flex gap-2">
            {(['draft', 'active'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                  form.status === s
                    ? 'bg-gold-500/15 text-gold-400 border-gold-500/30'
                    : 'text-silver-500 bg-charcoal border-ash/50 hover:text-silver-300'
                )}
              >
                {s === 'draft' ? 'Brouillon' : 'Actif immédiatement'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-dark p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-silver-200 font-medium text-sm">Conditions de déclenchement</h3>
          <button
            type="button"
            onClick={addCondition}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gold-400 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20 transition-all"
          >
            <Plus className="w-3 h-3" />
            Ajouter
          </button>
        </div>

        {form.conditions.length === 0 ? (
          <p className="text-silver-600 text-sm">
            Aucune condition — l&apos;automation se déclenchera pour tous les profils.
          </p>
        ) : (
          <div className="space-y-3">
            {form.conditions.map((cond, i) => (
              <div key={i} className="flex gap-2 items-start flex-wrap sm:flex-nowrap">
                <select
                  className="input-dark flex-1 min-w-[140px]"
                  value={cond.key}
                  onChange={(e) => updateCondition(i, { key: e.target.value })}
                >
                  {CONDITION_KEYS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
                <select
                  className="input-dark w-36"
                  value={cond.operator}
                  onChange={(e) => updateCondition(i, { operator: e.target.value })}
                >
                  {OPERATORS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  className="input-dark w-28"
                  placeholder="Valeur"
                  value={cond.value}
                  onChange={(e) => updateCondition(i, { value: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeCondition(i)}
                  className="p-2 text-silver-500 hover:text-red-400 transition-colors mt-0.5 shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setForm(BUILDER_DEFAULTS)}
          className="px-4 py-2.5 rounded-xl text-sm text-silver-500 hover:text-silver-300 border border-ash/50 hover:border-ash transition-all"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-gold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Création…</>
            : <><Zap className="w-4 h-4" />Créer l&apos;automation</>}
        </button>
      </div>
    </form>
  );
}

// ── Logs Tab ───────────────────────────────────────────────────────────────────

function LogsTab({ executionLog }: { executionLog: ExecutionLogItem[] }) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? executionLog.filter((e) =>
        e.automationName.toLowerCase().includes(search.toLowerCase()) ||
        e.status.includes(search.toLowerCase())
      )
    : executionLog;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="input-dark max-w-xs"
          placeholder="Rechercher par automation, statut…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-silver-500 text-sm">{filtered.length} entrées</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState msg="Aucun log d'exécution" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ash/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ash/50 bg-obsidian">
                <th className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Automation</th>
                <th className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Statut</th>
                <th className="text-right px-4 py-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Durée</th>
                <th className="text-right px-4 py-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Démarré le</th>
                <th className="text-left px-4 py-3 text-silver-500 text-xs uppercase tracking-wider font-medium">Erreur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ash/30">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-charcoal/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-silver-200 text-sm truncate max-w-[200px]">{e.automationName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RunDot status={e.status} />
                      <span className="text-silver-300 text-xs">
                        {RUN_STATUS_CONFIG[e.status]?.label ?? e.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-silver-400 text-xs">
                    {fmtDuration(e.startedAt, e.completedAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-silver-500 text-xs whitespace-nowrap">
                    {e.startedAt
                      ? fmtShort(e.startedAt)
                      : e.createdAt
                      ? fmtShort(e.createdAt)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-red-400 text-xs max-w-[200px] truncate">
                    {e.errorMessage ?? '—'}
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

// ── Monitoring Tab ─────────────────────────────────────────────────────────────

function MonitoringTab({ data, automations }: { data: AutomationData; automations: AutomationItem[] }) {
  const { monitoring } = data;

  return (
    <div className="space-y-6">
      <div className="card-dark p-6">
        <h3 className="text-silver-300 font-medium mb-5 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-gold-400" />
          Runs sur 14 jours
        </h3>
        {monitoring.runsPerDay.every((d) => d.total === 0) ? (
          <EmptyState msg="Aucun run sur les 14 derniers jours" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monitoring.runsPerDay} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" />
              <XAxis dataKey="date" tick={{ fill: '#8E8E95', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8E8E95', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0D0D0F', border: '1px solid #2A2A2E', borderRadius: 8 }}
                labelStyle={{ color: '#C8C8CC' }}
                itemStyle={{ color: '#ADADB3' }}
              />
              <Bar dataKey="completed" name="Réussis"  stackId="a" fill="#34D399" radius={[0, 0, 0, 0]} />
              <Bar dataKey="failed"    name="Échoués"  stackId="a" fill="#F87171" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {monitoring.revenueByAutomation.length > 0 && (
        <div className="card-dark p-6">
          <h3 className="text-silver-300 font-medium mb-5 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gold-400" />
            Revenus par automation (top 5)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={monitoring.revenueByAutomation}
              layout="vertical"
              margin={{ top: 5, right: 40, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#8E8E95', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={((v: number) => formatPrice(v)) as any}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fill: '#ADADB3', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#0D0D0F', border: '1px solid #2A2A2E', borderRadius: 8 }}
                labelStyle={{ color: '#C8C8CC' }}
                formatter={((v: number) => [formatPrice(v), 'Revenus']) as any}
              />
              <Bar dataKey="revenue" name="Revenus" radius={[0, 3, 3, 0]}>
                {monitoring.revenueByAutomation.map((_, i) => (
                  <Cell key={i} fill={`rgba(212,175,55,${1 - i * 0.15})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {monitoring.failureReasons.length > 0 && (
        <div className="card-dark p-6">
          <h3 className="text-silver-300 font-medium mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Top raisons d&apos;échec
          </h3>
          <div className="space-y-3">
            {monitoring.failureReasons.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-red-400 text-xs font-mono w-5 text-right tabular-nums">{f.count}</span>
                <p className="text-silver-300 text-xs flex-1 min-w-0 truncate">{f.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-dark p-6">
        <h3 className="text-silver-300 font-medium mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-silver-400" />
          Répartition des automations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['active', 'paused', 'draft', 'archived'] as const).map((s) => {
            const count = automations.filter((a) => a.status === s).length;
            const cfg   = STATUS_CONFIG[s];
            return (
              <div key={s} className="bg-charcoal rounded-xl p-4 text-center border border-ash/30">
                <p className="text-2xl font-semibold tabular-nums text-silver-200">{count}</p>
                <p className="text-xs mt-1 text-silver-500">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function AutomationCenter({ data }: { data: AutomationData }) {
  const [activeTab, setActiveTab]     = useState<TabKey>('dashboard');
  const [automations, setAutomations] = useState<AutomationItem[]>(data.automations);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleStatusChange(id: string, status: AutomationStatus) {
    const res = await fetch(`/api/admin/automations/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      const labels: Record<string, string> = {
        active: 'activée', paused: 'mise en pause', archived: 'archivée',
      };
      showToast(`Automation ${labels[status] ?? 'mise à jour'}`);
    } else {
      const e = await res.json();
      showToast(e.error ?? 'Erreur', false);
    }
  }

  async function handleDuplicate(automation: AutomationItem) {
    const res = await fetch('/api/admin/automations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          `${automation.name} (copie)`,
        description:   automation.description || null,
        trigger_type:  automation.trigger_type,
        campaign_id:   automation.campaign?.id ?? null,
        delay_minutes: automation.delay_minutes,
        conditions:    automation.conditions,
        status:        'draft',
        metadata:      automation.metadata,
      }),
    });
    if (res.ok) {
      const { data: newA } = await res.json();
      setAutomations((prev) => [{
        ...automation,
        id:           newA.id,
        name:         newA.name,
        status:       'draft',
        runsCount:    0,
        successCount: 0,
        failedCount:  0,
        successRate:  null,
        revenue:      0,
        created_at:   newA.created_at,
        updated_at:   newA.updated_at,
      }, ...prev]);
      showToast('Automation dupliquée');
    } else {
      showToast('Erreur lors de la duplication', false);
    }
  }

  function handleCreated(newA: AutomationItem) {
    setAutomations((prev) => [newA, ...prev]);
    setActiveTab('automations');
    showToast('Automation créée avec succès');
  }

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl border animate-fade-in',
          toast.ok
            ? 'bg-onyx text-emerald-300 border-emerald-500/30'
            : 'bg-onyx text-red-300 border-red-500/30'
        )}>
          {toast.msg}
        </div>
      )}

      <div className="flex gap-1 bg-obsidian rounded-xl p-1 border border-ash/30 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25'
                : 'text-silver-500 hover:text-silver-300 hover:bg-charcoal'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard'   && <DashboardTab   data={data} automations={automations} />}
      {activeTab === 'automations' && (
        <AutomationsTab
          automations={automations}
          campaigns={data.campaigns}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
        />
      )}
      {activeTab === 'builder'     && <BuilderTab campaigns={data.campaigns} onCreated={handleCreated} />}
      {activeTab === 'logs'        && <LogsTab executionLog={data.executionLog} />}
      {activeTab === 'monitoring'  && <MonitoringTab data={data} automations={automations} />}
    </div>
  );
}
