'use client';

import { useState, useMemo } from 'react';
import {
  Target, Mail, Users, DollarSign, TrendingUp, TrendingDown, BarChart2,
  Calendar, Zap, Plus, CheckCircle2, Play, Pause,
  Copy, Trash2, Eye, Tag, Download, FileText, Printer, AlertTriangle,
  RefreshCcw, ShoppingBag, Star, ChevronLeft, ChevronRight, Send,
  MousePointer2, Activity, Filter, LayoutGrid,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatPrice } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────

export type CampaignType   = 'recovery' | 'coupon' | 'promotion' | 'newsletter';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'archived';
export type Priority       = 'high' | 'medium' | 'low';

export interface Campaign {
  id: string; name: string; type: CampaignType; status: CampaignStatus;
  audience: string; recipients: number; revenue: number;
  openRate: number | null; conversionRate: number; roi: number | null;
  createdAt: string;
  runsCount: number;
  lastRunAt: string | null;
}

export interface AudienceSegment {
  key: string; label: string; count: number; estimatedRevenue: number; lastUpdated: string;
}

export interface Recommendation {
  id: string; title: string; type: string; reason: string; priority: Priority;
  expectedAudience: number; estimatedRevenue: number;
}

export interface ActivityItem {
  id: string; type: string; description: string; timestamp: string;
}

export interface MarketingData {
  kpis: {
    campaigns: number; emailsSent: number; recipients: number;
    revenueGenerated: number; conversionRate: number;
    scheduledCampaigns: number; draftCampaigns: number;
    revenueTrend: number; emailsTrend: number; campaignsTrend: number;
  };
  campaigns: Campaign[];
  audienceSegments: AudienceSegment[];
  recommendations: Recommendation[];
  activityFeed: ActivityItem[];
  analytics: { daily: { date: string; revenue: number; emails: number; conversions: number }[] };
  books: { id: string; title: string; author: string }[];
  totalCustomers: number;
  totalRevenue: number;
}

// ── Helpers ────────────────────────────────────────────────────────

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });
}
function fmtPct(n: number | null) { return n == null ? '—' : `${n}%`; }
function fmtShort(ts: string) {
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)       return 'À l\'instant';
  if (diff < 3600)     return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)    return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800)   return `Il y a ${Math.floor(diff / 86400)}j`;
  return d.toLocaleDateString('fr-CA');
}

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Brouillon', scheduled: 'Planifiée', running: 'Active',
  completed: 'Terminée', paused: 'Pausée', archived: 'Archivée',
};
const STATUS_COLOR: Record<CampaignStatus, string> = {
  draft:     'bg-silver-500/15 text-silver-400 border-silver-500/20',
  scheduled: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  running:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  completed: 'bg-gold-500/15 text-gold-400 border-gold-500/20',
  paused:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  archived:  'bg-ash/30 text-silver-500 border-ash/40',
};
const TYPE_LABEL: Record<CampaignType, string> = {
  recovery: 'Relance', coupon: 'Coupon', promotion: 'Promotion', newsletter: 'Newsletter',
};
const TYPE_COLOR: Record<CampaignType, string> = {
  recovery:    'bg-rose-500/15 text-rose-400',
  coupon:      'bg-gold-500/15 text-gold-400',
  promotion:   'bg-purple-500/15 text-purple-400',
  newsletter:  'bg-cyan-500/15 text-cyan-400',
};
const PRIORITY_COLOR: Record<Priority, string> = {
  high:   'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low:    'bg-silver-500/15 text-silver-400 border-silver-500/20',
};
const PRIORITY_LABEL: Record<Priority, string> = { high: 'Urgent', medium: 'Moyen', low: 'Faible' };

const ACTIVITY_ICON: Record<string, { icon: React.ComponentType<{className?: string}>; color: string }> = {
  newsletter_sent:     { icon: Mail,         color: 'text-cyan-400' },
  recovery_email_sent: { icon: RefreshCcw,   color: 'text-amber-400' },
  payment_completed:   { icon: CheckCircle2, color: 'text-emerald-400' },
  checkout_created:    { icon: ShoppingBag,  color: 'text-blue-400' },
  coupon_applied:      { icon: Tag,          color: 'text-gold-400' },
};

// ── Sub-components ─────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, iconColor, trend, trendBad, sub }: {
  label: string; value: string; icon: React.ComponentType<{className?: string}>;
  iconColor: string; trend?: number; trendBad?: boolean; sub?: string;
}) {
  const up = (trend ?? 0) >= 0;
  return (
    <div className="card-dark p-4 rounded-2xl flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <span className="text-silver-500 text-xs uppercase tracking-wide">{label}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-2xl font-semibold text-silver-200 tabular-nums">{value}</p>
      <div className="flex items-center gap-2 min-h-[18px]">
        {trend !== undefined && trend !== 0 ? (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trendBad ? (up ? 'text-red-400' : 'text-emerald-400') : (up ? 'text-emerald-400' : 'text-red-400')}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? '+' : ''}{trend}%
          </span>
        ) : null}
        {sub && <span className="text-xs text-silver-500">{sub}</span>}
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${color}`}>
      {label}
    </span>
  );
}

// ── TAB: DASHBOARD ──────────────────────────────────────────────────

function DashboardTab({ data }: { data: MarketingData }) {
  const { kpis, recommendations, activityFeed } = data;
  return (
    <div className="space-y-6">
      {/* KPI row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Campagnes" value={String(kpis.campaigns)} icon={Target} iconColor="text-gold-400" trend={kpis.campaignsTrend} />
        <KpiCard label="Emails envoyés" value={kpis.emailsSent.toLocaleString('fr')} icon={Mail} iconColor="text-cyan-400" trend={kpis.emailsTrend} />
        <KpiCard label="Destinataires" value={kpis.recipients.toLocaleString('fr')} icon={Users} iconColor="text-purple-400" />
        <KpiCard label="Revenu généré" value={formatPrice(kpis.revenueGenerated)} icon={DollarSign} iconColor="text-emerald-400" trend={kpis.revenueTrend} />
        <KpiCard label="Taux conversion" value={fmtPct(kpis.conversionRate)} icon={TrendingUp} iconColor="text-blue-400" sub="via relances" />
      </div>
      {/* KPI row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Taux ouverture" value="—" icon={Eye} iconColor="text-amber-400" sub="Non mesuré" />
        <KpiCard label="Taux de clic" value="—" icon={MousePointer2} iconColor="text-rose-400" sub="Non mesuré" />
        <KpiCard label="ROI" value={kpis.revenueGenerated > 0 ? `+${formatPrice(kpis.revenueGenerated)}` : '—'} icon={BarChart2} iconColor="text-gold-400" sub="revenu récupéré" />
        <KpiCard label="Planifiées" value={String(kpis.scheduledCampaigns)} icon={Calendar} iconColor="text-sky-400" />
        <KpiCard label="Brouillons" value={String(kpis.draftCampaigns)} icon={FileText} iconColor="text-silver-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations */}
        <div className="card-dark rounded-2xl p-5">
          <h2 className="font-serif text-lg text-gold-300 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Campagnes recommandées
          </h2>
          {recommendations.length === 0 ? (
            <EmptyState icon={Zap} message="Aucune recommandation pour le moment." sub="Revenez quand votre catalogue aura plus d'activité." />
          ) : (
            <div className="space-y-3">
              {recommendations.map(r => (
                <div key={r.id} className="bg-charcoal/50 rounded-xl p-3 flex items-start gap-3">
                  <Badge label={PRIORITY_LABEL[r.priority]} color={PRIORITY_COLOR[r.priority]} />
                  <div className="flex-1 min-w-0">
                    <p className="text-silver-200 text-sm font-medium">{r.title}</p>
                    <p className="text-silver-500 text-xs mt-0.5">{r.reason}</p>
                    <div className="flex gap-3 mt-1.5 text-xs text-silver-500">
                      <span><Users className="w-3 h-3 inline mr-0.5" />{r.expectedAudience} dest.</span>
                      {r.estimatedRevenue > 0 && <span><DollarSign className="w-3 h-3 inline mr-0.5" />~{formatPrice(r.estimatedRevenue)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity preview */}
        <div className="card-dark rounded-2xl p-5">
          <h2 className="font-serif text-lg text-gold-300 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Activité récente
          </h2>
          {activityFeed.length === 0 ? (
            <EmptyState icon={Activity} message="Aucune activité marketing récente." sub="Les relances et newsletters apparaîtront ici." />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activityFeed.slice(0, 12).map(ev => {
                const cfg = ACTIVITY_ICON[ev.type] ?? { icon: Activity, color: 'text-silver-400' };
                return (
                  <div key={ev.id} className="flex items-start gap-3 text-sm">
                    <cfg.icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-silver-300 leading-snug">{ev.description}</p>
                      <p className="text-silver-500 text-xs mt-0.5">{fmtShort(ev.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAB: CAMPAIGNS ──────────────────────────────────────────────────

function CampaignsTab({ campaigns }: { campaigns: Campaign[] }) {
  const [filter, setFilter] = useState<'all' | CampaignStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CampaignType>('all');

  const visible = useMemo(() => campaigns.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    return true;
  }), [campaigns, filter, typeFilter]);

  const statuses: (CampaignStatus | 'all')[] = ['all', 'running', 'scheduled', 'completed', 'paused', 'archived'];
  const types: (CampaignType | 'all')[]       = ['all', 'recovery', 'newsletter', 'coupon', 'promotion'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="w-3.5 h-3.5 text-silver-500" />
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filter === s ? 'bg-gold-500/15 text-gold-400 border-gold-500/30' : 'border-ash/50 text-silver-500 hover:text-silver-300'}`}>
            {s === 'all' ? 'Tous les statuts' : STATUS_LABEL[s]}
          </button>
        ))}
        <span className="w-px h-4 bg-ash/50" />
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${typeFilter === t ? 'bg-gold-500/15 text-gold-400 border-gold-500/30' : 'border-ash/50 text-silver-500 hover:text-silver-300'}`}>
            {t === 'all' ? 'Tous les types' : TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Target} message="Aucune campagne correspondante." sub="Modifiez les filtres ou créez une nouvelle campagne." cta="Créer une campagne" />
      ) : (
        <div className="card-dark rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="border-b border-ash/50">
                  <th className="text-left py-3 px-4 text-silver-500 text-xs uppercase tracking-wide font-medium">Campagne</th>
                  <th className="py-3 px-3 text-silver-500 text-xs uppercase tracking-wide font-medium">Statut</th>
                  <th className="py-3 px-3 text-silver-500 text-xs uppercase tracking-wide font-medium">Type</th>
                  <th className="py-3 px-3 text-right text-silver-500 text-xs uppercase tracking-wide font-medium">Destinataires</th>
                  <th className="py-3 px-3 text-right text-silver-500 text-xs uppercase tracking-wide font-medium">Revenus</th>
                  <th className="py-3 px-3 text-right text-silver-500 text-xs uppercase tracking-wide font-medium">Ouverture</th>
                  <th className="py-3 px-3 text-right text-silver-500 text-xs uppercase tracking-wide font-medium">Conversion</th>
                  <th className="py-3 px-3 text-right text-silver-500 text-xs uppercase tracking-wide font-medium">ROI</th>
                  <th className="py-3 px-3 text-right text-silver-500 text-xs uppercase tracking-wide font-medium">Créée</th>
                  <th className="py-3 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ash/30">
                {visible.map(c => (
                  <tr key={c.id} className="hover:bg-charcoal/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-silver-200 font-medium">{c.name}</p>
                      <p className="text-silver-500 text-xs mt-0.5">{c.audience}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge label={STATUS_LABEL[c.status]} color={STATUS_COLOR[c.status]} />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${TYPE_COLOR[c.type]}`}>
                        {TYPE_LABEL[c.type]}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-silver-300 tabular-nums">{c.recipients.toLocaleString('fr')}</td>
                    <td className="py-3 px-3 text-right text-emerald-400 tabular-nums font-medium">{c.revenue > 0 ? formatPrice(c.revenue) : '—'}</td>
                    <td className="py-3 px-3 text-right text-silver-400 tabular-nums">{fmtPct(c.openRate)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span className={c.conversionRate > 0 ? 'text-emerald-400' : 'text-silver-500'}>{fmtPct(c.conversionRate)}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-silver-400 tabular-nums">{c.roi != null ? `+${formatPrice(c.roi)}` : '—'}</td>
                    <td className="py-3 px-3 text-right text-silver-500 text-xs tabular-nums">{fmtDate(c.createdAt)}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 justify-end">
                        <ActionBtn icon={Eye}  title="Voir" />
                        <ActionBtn icon={Copy} title="Dupliquer" />
                        {c.status === 'running' && <ActionBtn icon={Pause}   title="Pauser" />}
                        {c.status === 'paused'  && <ActionBtn icon={Play}    title="Reprendre" />}
                        {c.status !== 'archived' && c.status !== 'running' && <ActionBtn icon={Trash2} title="Supprimer" danger />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, title, danger }: { icon: React.ComponentType<{className?: string}>; title: string; danger?: boolean }) {
  return (
    <button title={title} className={`p-1.5 rounded-lg transition-colors ${danger ? 'text-silver-500 hover:text-red-400 hover:bg-red-500/10' : 'text-silver-500 hover:text-silver-300 hover:bg-charcoal'}`}>
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

// ── TAB: AUDIENCE ───────────────────────────────────────────────────

function AudienceTab({ segments }: { segments: AudienceSegment[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-silver-500 text-sm">{segments.length} segments dynamiques — mis à jour en temps réel</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ash/50 text-silver-400 hover:text-silver-200 text-xs transition-colors">
          <Plus className="w-3.5 h-3.5" /> Nouveau segment
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map(seg => (
          <div key={seg.key} className="card-dark rounded-2xl p-4 hover:border-gold-500/20 transition-all cursor-pointer group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-silver-200 font-medium group-hover:text-gold-300 transition-colors">{seg.label}</p>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-silver-500 hover:text-gold-400">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-2xl font-semibold text-silver-100 tabular-nums">{seg.count.toLocaleString('fr')}</p>
            <p className="text-xs text-silver-500 mt-0.5">client{seg.count !== 1 ? 's' : ''}</p>
            {seg.estimatedRevenue > 0 && (
              <p className="text-xs text-emerald-400 mt-2">
                <DollarSign className="w-3 h-3 inline" /> ~{formatPrice(seg.estimatedRevenue)} potentiel
              </p>
            )}
            <p className="text-[10px] text-silver-600 mt-2 uppercase tracking-wide">Mis à jour maintenant</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB: BUILDER ────────────────────────────────────────────────────

const CAMPAIGN_TYPES = ['Newsletter', 'Lancement', 'Promotion', 'Coupon', 'Relance', 'Récupération', 'Annonce'];

function BuilderTab({ books }: { books: { id: string; title: string; author: string }[] }) {
  const [form, setForm] = useState({
    name: '', subject: '', preview: '', audience: 'all', type: 'newsletter',
    book: '', coupon: '', cta: 'Acheter maintenant', schedule: '', notes: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card-dark rounded-2xl p-5 space-y-4">
        <h3 className="font-serif text-lg text-gold-300">Informations générales</h3>
        <Field label="Nom de la campagne">
          <input value={form.name} onChange={set('name')} placeholder="Ex : Lancement Tarot Initiatique" className="input-dark" />
        </Field>
        <Field label="Sujet de l'email">
          <input value={form.subject} onChange={set('subject')} placeholder="Ex : 🔮 Découvrez notre nouveau titre" className="input-dark" />
        </Field>
        <Field label="Texte d'aperçu">
          <input value={form.preview} onChange={set('preview')} placeholder="Court texte visible dans la boîte mail..." className="input-dark" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type de campagne">
            <select value={form.type} onChange={set('type')} className="input-dark">
              {CAMPAIGN_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </Field>
          <Field label="Audience cible">
            <select value={form.audience} onChange={set('audience')} className="input-dark">
              <option value="all">Tous les clients</option>
              <option value="vip">Clients VIP</option>
              <option value="new">Nouveaux clients</option>
              <option value="inactive_30">Inactifs 30j</option>
              <option value="inactive_90">Inactifs 90j</option>
              <option value="pending">Achats en attente</option>
              <option value="never">Jamais acheté</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="card-dark rounded-2xl p-5 space-y-4">
        <h3 className="font-serif text-lg text-gold-300">Contenu & CTA</h3>
        <Field label="Livre associé (optionnel)">
          <select value={form.book} onChange={set('book')} className="input-dark">
            <option value="">— Aucun livre spécifique —</option>
            {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code coupon (optionnel)">
            <input value={form.coupon} onChange={set('coupon')} placeholder="EX : PROMO20" className="input-dark uppercase" />
          </Field>
          <Field label="Texte du bouton CTA">
            <input value={form.cta} onChange={set('cta')} placeholder="Acheter maintenant" className="input-dark" />
          </Field>
        </div>
      </div>

      <div className="card-dark rounded-2xl p-5 space-y-4">
        <h3 className="font-serif text-lg text-gold-300">Planification</h3>
        <Field label="Date et heure d'envoi">
          <input type="datetime-local" value={form.schedule} onChange={set('schedule')} className="input-dark" />
        </Field>
        <Field label="Notes internes">
          <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Contexte, objectifs, points d'attention..." className="input-dark resize-none" />
        </Field>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 btn-gold flex items-center justify-center gap-2 py-3 rounded-xl font-medium">
          <Send className="w-4 h-4" /> Planifier la campagne
        </button>
        <button className="px-5 py-3 rounded-xl border border-ash/50 text-silver-400 hover:text-silver-200 transition-colors text-sm">
          Sauvegarder brouillon
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-silver-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// ── TAB: CALENDAR ───────────────────────────────────────────────────

function CalendarTab({ campaigns }: { campaigns: Campaign[] }) {
  const today  = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DOW    = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  const byDate: Record<string, Campaign[]> = useMemo(() => {
    const m: Record<string, Campaign[]> = {};
    campaigns.forEach(c => {
      const ds = c.createdAt.slice(0, 10);
      if (!m[ds]) m[ds] = [];
      m[ds].push(c);
    });
    return m;
  }, [campaigns]);

  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysCount = new Date(year, month + 1, 0).getDate();
  const todayStr  = today.toISOString().slice(0, 10);
  const cells     = [...Array(firstDow).fill(null), ...Array.from({ length: daysCount }, (_, i) => i + 1)];

  const prev = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  return (
    <div className="card-dark rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-gold-300">{MONTHS[month]} {year}</h2>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-charcoal text-silver-400 hover:text-silver-200 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }} className="text-xs text-silver-500 hover:text-gold-400 transition-colors px-2">Aujourd'hui</button>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-charcoal text-silver-400 hover:text-silver-200 transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DOW.map(d => <div key={d} className="text-center text-[11px] text-silver-500 py-2 uppercase tracking-wide">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="min-h-[64px]" />;
          const ds  = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const evs = byDate[ds] ?? [];
          const isToday = ds === todayStr;
          return (
            <div key={ds} className={`min-h-[64px] p-1.5 rounded-lg border text-xs cursor-default transition-colors hover:bg-charcoal/60 ${isToday ? 'border-gold-500/40 bg-gold-500/5' : 'border-ash/30 bg-onyx/40'}`}>
              <span className={`font-medium text-[11px] ${isToday ? 'text-gold-400' : 'text-silver-500'}`}>{day}</span>
              <div className="mt-1 space-y-0.5">
                {evs.slice(0, 2).map(c => (
                  <div key={c.id} className={`text-[9px] px-1 py-0.5 rounded truncate ${TYPE_COLOR[c.type]}`} title={c.name}>{c.name}</div>
                ))}
                {evs.length > 2 && <div className="text-[9px] text-silver-500 px-1">+{evs.length - 2}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-ash/30">
        {(Object.entries(TYPE_COLOR) as [CampaignType, string][]).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls.split(' ')[0]}`} />
            <span className="text-xs text-silver-500">{TYPE_LABEL[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB: ANALYTICS ──────────────────────────────────────────────────

type Period = '7j' | '30j' | '90j' | '12m';

function AnalyticsTab({ analytics, campaigns }: { analytics: MarketingData['analytics']; campaigns: Campaign[] }) {
  const [period, setPeriod] = useState<Period>('30j');
  const periods: Period[] = ['7j', '30j', '90j', '12m'];

  const sliced = useMemo(() => {
    const n = period === '7j' ? 7 : period === '30j' ? 30 : period === '90j' ? 90 : 365;
    return analytics.daily.slice(-Math.min(n, analytics.daily.length));
  }, [analytics, period]);

  const topCampaigns   = [...campaigns].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const worstCampaigns = [...campaigns].filter(c => c.revenue === 0 && c.status !== 'draft').slice(0, 3);

  const tickFmt = (ds: string) => ds.slice(5); // MM-DD

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex gap-2">
        {periods.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${period === p ? 'bg-gold-500/15 text-gold-400 border-gold-500/30' : 'border-ash/50 text-silver-500 hover:text-silver-300'}`}>
            {p === '12m' ? '12 mois' : p}
          </button>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card-dark rounded-2xl p-5">
        <h2 className="font-serif text-lg text-gold-300 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" /> Revenus générés par marketing
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={sliced} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#D4AF37" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2A2A2E" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickFormatter={tickFmt} tick={{ fill: '#8E8E95', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `$${(v / 100).toFixed(0)}`} tick={{ fill: '#8E8E95', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip contentStyle={{ background: '#141416', border: '1px solid #2A2A2E', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#C8C8CC' }} formatter={((v: number) => [formatPrice(v), 'Revenus']) as any} />
            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Emails + Conversions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-dark rounded-2xl p-5">
          <h2 className="font-serif text-lg text-gold-300 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-cyan-400" /> Emails envoyés
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sliced} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#2A2A2E" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={tickFmt} tick={{ fill: '#8E8E95', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8E8E95', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#141416', border: '1px solid #2A2A2E', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#C8C8CC' }} />
              <Bar dataKey="emails" fill="#22D3EE" opacity={0.8} radius={[2, 2, 0, 0]} name="Emails" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-dark rounded-2xl p-5">
          <h2 className="font-serif text-lg text-gold-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Conversions
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sliced} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#2A2A2E" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickFormatter={tickFmt} tick={{ fill: '#8E8E95', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8E8E95', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#141416', border: '1px solid #2A2A2E', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#C8C8CC' }} />
              <Bar dataKey="conversions" fill="#34D399" opacity={0.8} radius={[2, 2, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top / Worst campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-dark rounded-2xl p-5">
          <h2 className="font-serif text-lg text-gold-300 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-gold-400" /> Meilleures campagnes
          </h2>
          {topCampaigns.length === 0 ? (
            <p className="text-silver-500 text-sm">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {topCampaigns.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-silver-500 text-xs w-4 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-silver-200 text-sm truncate">{c.name}</p>
                    <p className="text-silver-500 text-xs">{TYPE_LABEL[c.type]}</p>
                  </div>
                  <span className="text-emerald-400 text-sm font-medium tabular-nums">{c.revenue > 0 ? formatPrice(c.revenue) : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-dark rounded-2xl p-5">
          <h2 className="font-serif text-lg text-gold-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> À améliorer
          </h2>
          {worstCampaigns.length === 0 ? (
            <p className="text-silver-500 text-sm">Toutes les campagnes génèrent des revenus.</p>
          ) : (
            <div className="space-y-3">
              {worstCampaigns.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-silver-200 text-sm truncate">{c.name}</p>
                    <p className="text-silver-500 text-xs">Aucun revenu · {TYPE_LABEL[c.type]}</p>
                  </div>
                  <Badge label={STATUS_LABEL[c.status]} color={STATUS_COLOR[c.status]} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAB: ACTIVITY ───────────────────────────────────────────────────

function ActivityTab({ feed }: { feed: ActivityItem[] }) {
  return (
    <div className="card-dark rounded-2xl p-5">
      <h2 className="font-serif text-lg text-gold-300 mb-5 flex items-center gap-2">
        <Activity className="w-4 h-4 text-cyan-400" /> Activité marketing
      </h2>
      {feed.length === 0 ? (
        <EmptyState icon={Activity} message="Aucune activité pour le moment." sub="Les newsletters et relances apparaîtront ici au fur et à mesure." />
      ) : (
        <div className="relative">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-ash/40" />
          <div className="space-y-4">
            {feed.map(ev => {
              const cfg = ACTIVITY_ICON[ev.type] ?? { icon: Activity, color: 'text-silver-400' };
              return (
                <div key={ev.id} className="flex items-start gap-4 relative">
                  <div className={`w-9 h-9 rounded-full bg-charcoal border border-ash/50 flex items-center justify-center flex-shrink-0 z-10`}>
                    <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5">
                    <p className="text-silver-200 text-sm">{ev.description}</p>
                    <p className="text-silver-500 text-xs mt-0.5">{fmtShort(ev.timestamp)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message, sub, cta }: {
  icon: React.ComponentType<{className?: string}>; message: string; sub?: string; cta?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-charcoal border border-ash/50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-silver-500" />
      </div>
      <p className="text-silver-300 font-medium">{message}</p>
      {sub && <p className="text-silver-500 text-sm max-w-xs">{sub}</p>}
      {cta && (
        <button className="mt-2 btn-gold px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> {cta}
        </button>
      )}
    </div>
  );
}

// ── Export helpers ──────────────────────────────────────────────────

function downloadCSV(campaigns: Campaign[]) {
  const headers = 'Nom,Type,Statut,Destinataires,Revenus,Conversion,Créée';
  const rows = campaigns.map(c =>
    [c.name, TYPE_LABEL[c.type], STATUS_LABEL[c.status], c.recipients, c.revenue / 100, `${c.conversionRate}%`, fmtDate(c.createdAt)].join(',')
  );
  const csv  = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = 'marketing-campaigns.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Main component ──────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',   label: 'Tableau de bord', icon: LayoutGrid },
  { id: 'campaigns',   label: 'Campagnes',        icon: Target },
  { id: 'audience',    label: 'Audience',          icon: Users },
  { id: 'builder',     label: 'Créer',             icon: Plus },
  { id: 'calendar',    label: 'Calendrier',        icon: Calendar },
  { id: 'analytics',   label: 'Analytique',        icon: BarChart2 },
  { id: 'activity',    label: 'Activité',          icon: Activity },
] as const;

type TabId = typeof TABS[number]['id'];

export default function MarketingCenter({ data }: { data: MarketingData }) {
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <div className="space-y-6">
      {/* Tab bar + export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-onyx border border-ash/50 rounded-xl p-1 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20' : 'text-silver-500 hover:text-silver-300'}`}>
              <t.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCSV(data.campaigns)} title="Exporter CSV"
            className="p-2 rounded-lg border border-ash/50 text-silver-500 hover:text-silver-300 hover:bg-charcoal transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => window.print()} title="Imprimer"
            className="p-2 rounded-lg border border-ash/50 text-silver-500 hover:text-silver-300 hover:bg-charcoal transition-colors">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={() => setTab('builder')}
            className="btn-gold flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-3.5 h-3.5" /> Nouvelle campagne
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'dashboard' && <DashboardTab data={data} />}
      {tab === 'campaigns' && <CampaignsTab campaigns={data.campaigns} />}
      {tab === 'audience'  && <AudienceTab  segments={data.audienceSegments} />}
      {tab === 'builder'   && <BuilderTab   books={data.books} />}
      {tab === 'calendar'  && <CalendarTab  campaigns={data.campaigns} />}
      {tab === 'analytics' && <AnalyticsTab analytics={data.analytics} campaigns={data.campaigns} />}
      {tab === 'activity'  && <ActivityTab  feed={data.activityFeed} />}
    </div>
  );
}
