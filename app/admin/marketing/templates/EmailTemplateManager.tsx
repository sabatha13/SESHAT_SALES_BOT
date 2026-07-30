'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mail, FileText, Plus, Eye, Copy, Trash2, Play, Pause, Pencil, Send,
  Monitor, Smartphone, CheckCircle2, AlertCircle, RefreshCw, X, Tag, Activity, Code, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TemplateCategory = 'welcome' | 'recovery' | 'newsletter' | 'promotion' | 'vip' | 'notification' | 'general';
export type TemplateStatus   = 'active' | 'draft' | 'archived';

export interface TemplateItem {
  id:                string;
  name:              string;
  description:       string;
  category:          TemplateCategory;
  subject:           string;
  html_body:         string;
  text_body:         string;
  variables:         string[];
  status:            TemplateStatus;
  usage_count:       number;
  last_used_at:      string | null;
  created_at:        string;
  updated_at:        string;
  linkedCampaigns:   { id: string; name: string }[];
  linkedAutomations: { id: string; name: string }[];
}

export interface TemplateData {
  templates:         TemplateItem[];
  kpis: {
    total:      number;
    active:     number;
    draft:      number;
    totalUsage: number;
  };
  categoryBreakdown: Record<string, number>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES: Record<TemplateCategory, { label: string; cls: string }> = {
  general:      { label: 'Général',      cls: 'text-silver-400 bg-ash/50            border-ash/30' },
  welcome:      { label: 'Bienvenue',    cls: 'text-blue-400   bg-blue-500/10       border-blue-500/20' },
  recovery:     { label: 'Récupération', cls: 'text-amber-400  bg-amber-500/10      border-amber-500/20' },
  newsletter:   { label: 'Newsletter',   cls: 'text-emerald-400 bg-emerald-500/10   border-emerald-500/20' },
  promotion:    { label: 'Promotion',    cls: 'text-purple-400 bg-purple-500/10     border-purple-500/20' },
  vip:          { label: 'VIP',          cls: 'text-yellow-400 bg-yellow-500/10     border-yellow-500/20' },
  notification: { label: 'Notification', cls: 'text-red-400    bg-red-500/10        border-red-500/20' },
};

const STATUS_CONFIG: Record<TemplateStatus, { label: string; cls: string }> = {
  active:   { label: 'Actif',     cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
  draft:    { label: 'Brouillon', cls: 'text-silver-400  bg-ash/50          border-ash/50' },
  archived: { label: 'Archivé',   cls: 'text-silver-600  bg-charcoal        border-ash/30' },
};

const AVAILABLE_VARS = [
  { key: 'reader_name',     label: 'reader_name' },
  { key: 'reader_email',    label: 'reader_email' },
  { key: 'book_title',      label: 'book_title' },
  { key: 'book_price',      label: 'book_price' },
  { key: 'book_url',        label: 'book_url' },
  { key: 'coupon_code',     label: 'coupon_code' },
  { key: 'coupon_discount', label: 'coupon_discount' },
  { key: 'campaign_name',   label: 'campaign_name' },
  { key: 'site_url',        label: 'site_url' },
  { key: 'cds_name',        label: 'cds_name' },
  { key: 'unsubscribe_url', label: 'unsubscribe_url' },
];

const SAMPLE_VALUES: Record<string, string> = {
  reader_name:     'Sophie Martin',
  reader_email:    'sophie@exemple.fr',
  book_title:      'Les Mystères du Cosmos',
  book_price:      '14,99 €',
  book_url:        'https://cdslibrairie.com/livre/exemple',
  coupon_code:     'LECTEUR20',
  coupon_discount: '20',
  campaign_name:   'Newsletter Juillet 2026',
  site_url:        'https://cdslibrairie.com',
  cds_name:        'CDS Librairie',
  unsubscribe_url: 'https://cdslibrairie.com/desabonnement',
};

const BUILDER_DEFAULTS = {
  name: '', description: '', category: 'general' as TemplateCategory,
  subject: '', html_body: '', text_body: '', status: 'draft' as TemplateStatus,
};

const TABS = [
  { key: 'overview',  label: 'Vue d\'ensemble' },
  { key: 'templates', label: 'Templates' },
  { key: 'builder',   label: '+ Nouveau' },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function renderWithSamples(html: string): string {
  return html.replace(/\{\{([a-z_]+)\}\}/g, (_, key) =>
    SAMPLE_VALUES[key] ??
    `<mark style="background:#ffe066;color:#000;padding:1px 4px;border-radius:3px">{{${key}}}</mark>`
  );
}

function detectVariables(text: string): string[] {
  const matches = text.match(/\{\{([a-z_]+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Mini components ────────────────────────────────────────────────────────────

function CatBadge({ cat }: { cat: TemplateCategory }) {
  const cfg = CATEGORIES[cat] ?? CATEGORIES.general;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: TemplateStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab({ data, onNewTemplate }: { data: TemplateData; onNewTemplate: () => void }) {
  const { kpis, categoryBreakdown } = data;
  const maxCat = Math.max(...Object.values(categoryBreakdown), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total templates', value: kpis.total,      color: 'text-silver-200' },
          { label: 'Actifs',          value: kpis.active,     color: 'text-emerald-400' },
          { label: 'Brouillons',      value: kpis.draft,      color: 'text-amber-400' },
          { label: 'Usages totaux',   value: kpis.totalUsage, color: 'text-yellow-400' },
        ].map((k) => (
          <div key={k.label} className="card-dark p-5">
            <p className="text-silver-500 text-xs uppercase tracking-widest mb-3">{k.label}</p>
            <p className={cn('text-3xl font-semibold tabular-nums', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-dark p-6">
          <h3 className="text-silver-300 font-medium mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-yellow-400" />
            Répartition par catégorie
          </h3>
          {Object.keys(categoryBreakdown).length === 0 ? (
            <p className="text-silver-600 text-sm">Aucun template</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <CatBadge cat={cat as TemplateCategory} />
                    <div className="flex-1 h-1.5 bg-ash/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500/50 rounded-full"
                        style={{ width: `${(count / maxCat) * 100}%` }}
                      />
                    </div>
                    <span className="text-silver-400 text-xs tabular-nums w-4 text-right">{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card-dark p-6">
          <h3 className="text-silver-300 font-medium mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-yellow-400" />
            Actions rapides
          </h3>
          <div className="space-y-3">
            <button
              onClick={onNewTemplate}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/15 border border-yellow-500/20 hover:border-yellow-500/30 text-yellow-400 text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Créer un nouveau template
            </button>
            <div className="px-4 py-3 rounded-xl bg-charcoal border border-ash/30">
              <p className="text-silver-400 text-xs leading-relaxed">
                Les templates sont réutilisables par plusieurs campagnes et automations.
                Modifiez un template une fois — toutes les campagnes liées bénéficient de la mise à jour.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Templates Tab ──────────────────────────────────────────────────────────────

function TemplatesTab({ templates, onEdit, onStatusChange, onDuplicate }: {
  templates:      TemplateItem[];
  onEdit:         (t: TemplateItem) => void;
  onStatusChange: (id: string, status: TemplateStatus) => Promise<void>;
  onDuplicate:    (t: TemplateItem) => Promise<void>;
}) {
  const [catFilter,    setCatFilter]    = useState<TemplateCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>('all');
  const [previewItem,  setPreviewItem]  = useState<TemplateItem | null>(null);

  const filtered = templates.filter((t) =>
    (catFilter    === 'all' || t.category === catFilter) &&
    (statusFilter === 'all' || t.status   === statusFilter)
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {(['all', ...Object.keys(CATEGORIES)] as (TemplateCategory | 'all')[]).map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                catFilter === c
                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
                  : 'text-silver-500 hover:text-silver-300 bg-charcoal border-ash/50'
              )}
            >
              {c === 'all' ? `Tous (${templates.length})` : CATEGORIES[c as TemplateCategory]?.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'draft', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                statusFilter === s
                  ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
                  : 'text-silver-500 hover:text-silver-300 bg-charcoal border-ash/50'
              )}
            >
              {s === 'all' ? 'Tous statuts' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-onyx border border-ash/50 rounded-2xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-ash/50 shrink-0">
              <div>
                <p className="text-silver-200 font-medium text-sm">{previewItem.name}</p>
                <p className="text-silver-500 text-xs font-mono mt-0.5">{previewItem.subject}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-silver-500 hover:text-silver-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-white" style={{ minHeight: 400 }}>
              <iframe
                srcDoc={renderWithSamples(previewItem.html_body)}
                title="Aperçu template"
                className="w-full border-0"
                style={{ minHeight: 480, display: 'block' }}
              />
            </div>
            <div className="px-5 py-2 border-t border-ash/50 shrink-0">
              <p className="text-silver-600 text-xs">
                Aperçu avec données de test · {previewItem.variables.length} variable{previewItem.variables.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-silver-600">
          <Mail className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">Aucun template dans ce filtre</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ash/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ash/50 bg-obsidian">
                {['Template', 'Catégorie', 'Statut', 'Variables', 'Usages', 'Liés', 'Modifié', 'Actions'].map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      'px-4 py-3 text-silver-500 text-xs uppercase tracking-wider font-medium',
                      i >= 3 && i <= 5 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ash/30">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-charcoal/40 transition-colors group">
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-silver-200 font-medium truncate">{t.name}</p>
                    {t.description && (
                      <p className="text-silver-500 text-xs truncate">{t.description}</p>
                    )}
                    <p className="text-silver-600 text-xs font-mono truncate mt-0.5">{t.subject}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <CatBadge cat={t.category} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-silver-400 text-xs">
                    {t.variables.length}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-silver-300">
                    {t.usage_count}
                  </td>
                  <td className="px-4 py-3 text-right text-silver-500 text-xs">
                    {t.linkedCampaigns.length + t.linkedAutomations.length}
                  </td>
                  <td className="px-4 py-3 text-silver-600 text-xs whitespace-nowrap">
                    {fmtDate(t.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewItem(t)}
                        title="Aperçu"
                        className="p-1.5 rounded-lg text-silver-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEdit(t)}
                        title="Modifier"
                        className="p-1.5 rounded-lg text-silver-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(t)}
                        title="Dupliquer"
                        className="p-1.5 rounded-lg text-silver-500 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {t.status !== 'archived' && (
                        <button
                          onClick={() => onStatusChange(t.id, t.status === 'active' ? 'draft' : 'active')}
                          title={t.status === 'active' ? 'Désactiver' : 'Activer'}
                          className="p-1.5 rounded-lg text-silver-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        >
                          {t.status === 'active'
                            ? <Pause className="w-3.5 h-3.5" />
                            : <Play  className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {t.status !== 'archived' && (
                        <button
                          onClick={() => onStatusChange(t.id, 'archived')}
                          title="Archiver"
                          className="p-1.5 rounded-lg text-silver-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
  name:        string;
  description: string;
  category:    TemplateCategory;
  subject:     string;
  html_body:   string;
  text_body:   string;
  status:      TemplateStatus;
}

function BuilderTab({ editingTemplate, templateId, onSaved, onCancel }: {
  editingTemplate: TemplateItem | null;
  templateId:      string | null;
  onSaved:         (t: TemplateItem) => void;
  onCancel:        () => void;
}) {
  const [form, setForm]               = useState<BuilderForm>(BUILDER_DEFAULTS);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [panelView, setPanelView]     = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving]       = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [testEmail, setTestEmail]     = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult]   = useState<'sent' | 'error' | null>(null);
  const [lastFocus, setLastFocus]     = useState<'html' | 'subject'>('html');

  const htmlBodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTemplate) {
      setForm({
        name:        editingTemplate.name,
        description: editingTemplate.description,
        category:    editingTemplate.category,
        subject:     editingTemplate.subject,
        html_body:   editingTemplate.html_body,
        text_body:   editingTemplate.text_body,
        status:      editingTemplate.status,
      });
    } else {
      setForm(BUILDER_DEFAULTS);
    }
    setError(null);
    setTestResult(null);
  }, [editingTemplate?.id]);

  function set<K extends keyof BuilderForm>(k: K, v: BuilderForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function insertVariable(varKey: string) {
    const snippet = `{{${varKey}}}`;
    if (lastFocus === 'subject' && subjectRef.current) {
      const el    = subjectRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd   ?? el.value.length;
      const newVal = el.value.slice(0, start) + snippet + el.value.slice(end);
      set('subject', newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 0);
    } else if (htmlBodyRef.current) {
      const el    = htmlBodyRef.current;
      const start = el.selectionStart ?? el.value.length;
      const end   = el.selectionEnd   ?? el.value.length;
      const newVal = el.value.slice(0, start) + snippet + el.value.slice(end);
      set('html_body', newVal);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 0);
    }
  }

  function handleTabKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el    = e.currentTarget;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const newVal = el.value.slice(0, start) + '  ' + el.value.slice(end);
    set('html_body', newVal);
    setTimeout(() => { el.setSelectionRange(start + 2, start + 2); }, 0);
  }

  const detectedVars = detectVariables(form.html_body + ' ' + form.subject);
  const renderedHtml = renderWithSamples(form.html_body);

  async function handleSave(targetStatus?: TemplateStatus) {
    setError(null);
    if (!form.name.trim())    { setError('Le nom est requis.');    return; }
    if (!form.subject.trim()) { setError('Le sujet est requis.'); return; }

    setIsSaving(true);
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      category:    form.category,
      subject:     form.subject.trim(),
      html_body:   form.html_body,
      text_body:   form.text_body.trim() || null,
      variables:   detectedVars,
      status:      targetStatus ?? form.status,
    };

    try {
      const isEditing = !!templateId;
      const url    = isEditing ? `/api/admin/email-templates/${templateId}` : '/api/admin/email-templates';
      const method = isEditing ? 'PATCH' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Erreur serveur'); return; }

      const saved = json.data as any;
      onSaved({
        id:                saved.id,
        name:              saved.name,
        description:       saved.description       ?? '',
        category:          saved.category,
        subject:           saved.subject,
        html_body:         saved.html_body,
        text_body:         saved.text_body         ?? '',
        variables:         saved.variables         ?? detectedVars,
        status:            saved.status,
        usage_count:       saved.usage_count       ?? 0,
        last_used_at:      saved.last_used_at      ?? null,
        created_at:        saved.created_at,
        updated_at:        saved.updated_at,
        linkedCampaigns:   editingTemplate?.linkedCampaigns   ?? [],
        linkedAutomations: editingTemplate?.linkedAutomations ?? [],
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail.trim() || !testEmail.includes('@')) {
      setTestResult('error');
      return;
    }
    if (!templateId) {
      setError('Sauvegardez d\'abord le template pour envoyer un test.');
      return;
    }
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/admin/email-templates/${templateId}/test`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to: testEmail.trim() }),
      });
      setTestResult(res.ok ? 'sent' : 'error');
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-yellow-400" />
          <span className="text-silver-300 font-medium">
            {editingTemplate ? `Modifier : ${editingTemplate.name}` : 'Nouveau template'}
          </span>
        </div>
        {editingTemplate && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 text-silver-500 hover:text-silver-300 text-sm transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Annuler
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Metadata */}
      <div className="card-dark p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-silver-400 text-xs uppercase tracking-wider">Nom *</label>
            <input
              className="input-dark"
              placeholder="Ex. : Relance panier abandonné"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-silver-400 text-xs uppercase tracking-wider">Description</label>
            <input
              className="input-dark"
              placeholder="Contexte et usage de ce template"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-silver-400 text-xs uppercase tracking-wider">Catégorie</label>
            <select
              className="input-dark"
              value={form.category}
              onChange={(e) => set('category', e.target.value as TemplateCategory)}
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-silver-400 text-xs uppercase tracking-wider">Statut par défaut</label>
            <div className="flex gap-2">
              {(['draft', 'active'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all border',
                    form.status === s
                      ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                      : 'text-silver-500 bg-charcoal border-ash/50 hover:text-silver-300'
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Variable chips */}
      <div className="card-dark p-4">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-yellow-400" />
          <span className="text-silver-400 text-xs uppercase tracking-wider">Insérer une variable</span>
          <span className="text-silver-600 text-xs ml-auto hidden sm:block">
            Cliquez sur une variable pour l&apos;insérer à la position du curseur
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_VARS.map((v) => {
            const isUsed = detectedVars.includes(v.key);
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                title={`Insérer {{${v.key}}}`}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-mono transition-all border',
                  isUsed
                    ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'
                    : 'text-silver-500 bg-charcoal border-ash/50 hover:text-yellow-400 hover:border-yellow-500/25 hover:bg-yellow-500/10'
                )}
              >
                {`{{${v.label}}}`}
              </button>
            );
          })}
        </div>
        {detectedVars.length > 0 && (
          <p className="text-silver-600 text-xs mt-2.5">
            Détectées dans ce template : {detectedVars.map((v) => `{{${v}}}`).join(', ')}
          </p>
        )}
      </div>

      {/* Mobile panel toggle */}
      <div className="flex gap-1 bg-obsidian rounded-xl p-1 border border-ash/30 lg:hidden">
        {(['editor', 'preview'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setPanelView(v)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              panelView === v
                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                : 'text-silver-500 hover:text-silver-300'
            )}
          >
            {v === 'editor' ? 'Éditeur' : 'Aperçu'}
          </button>
        ))}
      </div>

      {/* Editor + Preview split */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

        {/* Editor panel */}
        <div className={cn('space-y-4', panelView === 'preview' && 'hidden lg:block')}>
          {/* Subject */}
          <div className="card-dark p-4 space-y-2">
            <label className="text-silver-400 text-xs uppercase tracking-wider">Objet de l&apos;email *</label>
            <input
              ref={subjectRef}
              className="input-dark font-mono text-sm"
              placeholder="Ex. : {{book_title}} vous attend encore, {{reader_name}} !"
              value={form.subject}
              onFocus={() => setLastFocus('subject')}
              onChange={(e) => set('subject', e.target.value)}
            />
            {form.subject && (
              <p className="text-silver-500 text-xs">
                Aperçu : <em className="text-silver-300">{renderWithSamples(form.subject).replace(/<[^>]*>/g, '')}</em>
              </p>
            )}
          </div>

          {/* HTML body */}
          <div className="card-dark p-4 space-y-2">
            <label className="text-silver-400 text-xs uppercase tracking-wider flex items-center gap-2">
              <Code className="w-3.5 h-3.5" />
              Corps HTML
            </label>
            <textarea
              ref={htmlBodyRef}
              className="w-full bg-obsidian border border-ash/50 rounded-xl px-3 py-3 text-xs font-mono focus:outline-none focus:border-yellow-600/50 transition-colors resize-y"
              style={{ color: '#E2E2E5', minHeight: 380, lineHeight: '1.6' }}
              placeholder={'<!DOCTYPE html>\n<html>\n  <body>\n    <p>Bonjour {{reader_name}},</p>\n    <p>{{book_title}} vous attend sur CDS Librairie.</p>\n    <p><a href="{{book_url}}">Découvrir le livre</a></p>\n  </body>\n</html>'}
              value={form.html_body}
              onFocus={() => setLastFocus('html')}
              onChange={(e) => set('html_body', e.target.value)}
              onKeyDown={handleTabKey}
              spellCheck={false}
            />
            <p className="text-silver-600 text-xs">{form.html_body.length} caractères · Tab = 2 espaces</p>
          </div>

          {/* Text body */}
          <div className="card-dark p-4 space-y-2">
            <label className="text-silver-400 text-xs uppercase tracking-wider">Version texte brut (optionnel)</label>
            <textarea
              className="input-dark resize-y text-xs font-mono"
              style={{ minHeight: 80 }}
              placeholder="Bonjour {{reader_name}}, votre exemplaire de {{book_title}} vous attend..."
              value={form.text_body}
              onChange={(e) => set('text_body', e.target.value)}
            />
          </div>
        </div>

        {/* Preview panel */}
        <div className={cn('space-y-3', panelView === 'editor' && 'hidden lg:block')}>
          <div className="card-dark p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-silver-400 text-xs uppercase tracking-wider">Aperçu en direct</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  title="Bureau"
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    previewMode === 'desktop' ? 'text-yellow-400 bg-yellow-500/10' : 'text-silver-500 hover:text-silver-300'
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  title="Mobile"
                  className={cn(
                    'p-1.5 rounded-lg transition-all',
                    previewMode === 'mobile' ? 'text-yellow-400 bg-yellow-500/10' : 'text-silver-500 hover:text-silver-300'
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div
              className={cn(
                'mx-auto overflow-hidden bg-white rounded-lg transition-all',
                previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
              )}
            >
              {form.html_body ? (
                <iframe
                  srcDoc={renderedHtml}
                  title="Aperçu email"
                  className="w-full border-0"
                  style={{ minHeight: 480, display: 'block' }}
                />
              ) : (
                <div className="flex items-center justify-center h-40 bg-gray-50">
                  <p className="text-gray-400 text-sm">L&apos;aperçu s&apos;affichera ici</p>
                </div>
              )}
            </div>
          </div>

          {/* Test email */}
          <div className="card-dark p-4 space-y-3">
            <label className="text-silver-400 text-xs uppercase tracking-wider flex items-center gap-2">
              <Send className="w-3.5 h-3.5" />
              Envoyer un email de test
            </label>
            <div className="flex gap-2">
              <input
                className="input-dark flex-1 text-xs"
                type="email"
                placeholder="votre@email.com"
                value={testEmail}
                onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
              />
              <button
                onClick={handleSendTest}
                disabled={isSendingTest || !templateId}
                title={!templateId ? 'Sauvegardez d\'abord le template' : 'Envoyer un test'}
                className="px-3 py-2 rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 hover:bg-yellow-500/20 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
              >
                {isSendingTest
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                Test
              </button>
            </div>
            {!templateId && (
              <p className="text-silver-600 text-xs">Sauvegardez le template pour activer l&apos;envoi de test.</p>
            )}
            {testResult === 'sent' && (
              <p className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Email de test envoyé à {testEmail}
              </p>
            )}
            {testResult === 'error' && (
              <p className="flex items-center gap-1.5 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Erreur d&apos;envoi — vérifiez l&apos;adresse
              </p>
            )}
          </div>

          {/* Linked items */}
          {editingTemplate && (
            editingTemplate.linkedCampaigns.length > 0 || editingTemplate.linkedAutomations.length > 0
          ) && (
            <div className="card-dark p-4 space-y-2">
              <p className="text-silver-400 text-xs uppercase tracking-wider mb-3">Utilisé par</p>
              {editingTemplate.linkedCampaigns.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs text-silver-400">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  Campagne : <span className="text-silver-300">{c.name}</span>
                </div>
              ))}
              {editingTemplate.linkedAutomations.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs text-silver-400">
                  <Activity className="w-3 h-3 text-yellow-400" />
                  Automation : <span className="text-silver-300">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save actions */}
      <div className="flex flex-wrap items-center gap-3 justify-end pt-2 border-t border-ash/30">
        <button
          onClick={() => handleSave('draft')}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-silver-400 border border-ash/50 hover:text-silver-200 hover:border-ash transition-all disabled:opacity-50"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Sauvegarder (brouillon)
        </button>
        <button
          onClick={() => handleSave('active')}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {editingTemplate ? 'Mettre à jour' : 'Publier le template'}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function EmailTemplateManager({ data }: { data: TemplateData }) {
  const [activeTab, setActiveTab]             = useState<TabKey>('templates');
  const [templates, setTemplates]             = useState<TemplateItem[]>(data.templates);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [toast, setToast]                     = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleStatusChange(id: string, status: TemplateStatus) {
    const res = await fetch(`/api/admin/email-templates/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) {
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
      showToast('Statut mis à jour');
    } else {
      showToast('Erreur lors de la mise à jour', false);
    }
  }

  async function handleDuplicate(template: TemplateItem) {
    const res = await fetch('/api/admin/email-templates', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:        `${template.name} (copie)`,
        description: template.description || null,
        category:    template.category,
        subject:     template.subject,
        html_body:   template.html_body,
        text_body:   template.text_body || null,
        variables:   template.variables,
        status:      'draft',
      }),
    });
    if (res.ok) {
      const { data: newT } = await res.json() as { data: any };
      setTemplates((prev) => [
        {
          ...template,
          id:                newT.id,
          name:              newT.name,
          status:            'draft' as TemplateStatus,
          usage_count:       0,
          last_used_at:      null,
          created_at:        newT.created_at,
          updated_at:        newT.updated_at,
          linkedCampaigns:   [],
          linkedAutomations: [],
        },
        ...prev,
      ]);
      showToast('Template dupliqué');
    } else {
      showToast('Erreur lors de la duplication', false);
    }
  }

  function handleEdit(template: TemplateItem) {
    setEditingTemplate(template);
    setActiveTab('builder');
  }

  function handleNewTemplate() {
    setEditingTemplate(null);
    setActiveTab('builder');
  }

  function handleSaved(saved: TemplateItem) {
    const isNew = !templates.find((t) => t.id === saved.id);
    setTemplates((prev) => {
      if (isNew) return [saved, ...prev];
      return prev.map((t) => t.id === saved.id ? saved : t);
    });
    setEditingTemplate(saved);
    showToast(isNew ? 'Template créé' : 'Template mis à jour');
    if (isNew) setActiveTab('templates');
  }

  const liveCatCounts: Record<string, number> = {};
  templates.forEach((t) => { liveCatCounts[t.category] = (liveCatCounts[t.category] ?? 0) + 1; });

  const liveKpis = {
    total:      templates.length,
    active:     templates.filter((t) => t.status === 'active').length,
    draft:      templates.filter((t) => t.status === 'draft').length,
    totalUsage: templates.reduce((s, t) => s + t.usage_count, 0),
  };

  return (
    <div className="space-y-4 relative">
      {toast && (
        <div
          className={cn(
            'fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl border',
            toast.ok
              ? 'bg-onyx text-emerald-300 border-emerald-500/30'
              : 'bg-onyx text-red-300    border-red-500/30'
          )}
        >
          {toast.msg}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-obsidian rounded-xl p-1 border border-ash/30">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'builder') handleNewTemplate();
              else setActiveTab(tab.key);
            }}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'
                : 'text-silver-500 hover:text-silver-300 hover:bg-charcoal'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <OverviewTab
          data={{ ...data, templates, kpis: liveKpis, categoryBreakdown: liveCatCounts }}
          onNewTemplate={handleNewTemplate}
        />
      )}
      {activeTab === 'templates' && (
        <TemplatesTab
          templates={templates}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
          onDuplicate={handleDuplicate}
        />
      )}
      {activeTab === 'builder' && (
        <BuilderTab
          editingTemplate={editingTemplate}
          templateId={editingTemplate?.id ?? null}
          onSaved={handleSaved}
          onCancel={() => { setEditingTemplate(null); setActiveTab('templates'); }}
        />
      )}
    </div>
  );
}
