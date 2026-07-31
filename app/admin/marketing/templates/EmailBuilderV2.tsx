'use client';

import { useReducer, useRef, useState, useCallback } from 'react';
import {
  Undo2, Redo2, Eye, Sparkles, ChevronUp, ChevronDown, Copy, Trash2,
  GripVertical, Plus, Monitor, Tablet, Smartphone, X, RefreshCw,
  AlertCircle, CheckCircle2, Moon, Sun, Upload, FileCode2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Block, BlockType, BuilderData, BLOCK_DEFAULTS, BLOCK_META, AVAILABLE_VARS,
} from './builderTypes';
import { generateEmailHTML } from './htmlGenerator';
import { htmlToBlocks } from './htmlConverter';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BookOption {
  id:        string;
  title:     string;
  author:    string;
  price:     number;
  cover_url: string | null;
}

interface Props {
  initialData:     BuilderData;
  initialSubject:  string;
  initialHtmlBody?: string;
  templateId:      string | null;
  books:           BookOption[];
  onSaved:         (html: string, data: BuilderData, subject: string, status: 'draft' | 'active') => Promise<void>;
  onCancel:        () => void;
}

// ── Reducer ───────────────────────────────────────────────────────────────────

interface BuilderState {
  history: Block[][];
  histIdx: number;
  selId:   string | null;
  subject: string;
}

type Action =
  | { type: 'LOAD';       blocks: Block[]; subject: string }
  | { type: 'ADD_BLOCK';  blockType: BlockType; afterIdx?: number }
  | { type: 'DEL_BLOCK';  id: string }
  | { type: 'DUP_BLOCK';  id: string }
  | { type: 'MOVE';       id: string; dir: 'up' | 'down' }
  | { type: 'REORDER';    from: number; to: number }
  | { type: 'UPD';        id: string; patch: Record<string, unknown> }
  | { type: 'SNAPSHOT' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SELECT';     id: string | null }
  | { type: 'SUBJECT';    v: string };

function uid(): string { return Math.random().toString(36).slice(2, 10); }
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }
function mkBlock(t: BlockType): Block { return { id: uid(), type: t, data: clone(BLOCK_DEFAULTS[t]) }; }

function withHistory(s: BuilderState, next: Block[]): BuilderState {
  const h = [...s.history.slice(0, s.histIdx + 1), next].slice(-50);
  return { ...s, history: h, histIdx: h.length - 1 };
}

function reducer(s: BuilderState, a: Action): BuilderState {
  const cur = s.history[s.histIdx];
  switch (a.type) {
    case 'LOAD': {
      const h = [a.blocks];
      return { history: h, histIdx: 0, subject: a.subject, selId: null };
    }
    case 'ADD_BLOCK': {
      const b = mkBlock(a.blockType);
      const arr = [...cur];
      arr.splice(a.afterIdx !== undefined ? a.afterIdx + 1 : arr.length, 0, b);
      return { ...withHistory(s, arr), selId: b.id };
    }
    case 'DEL_BLOCK': {
      const arr = cur.filter(b => b.id !== a.id);
      return { ...withHistory(s, arr), selId: s.selId === a.id ? null : s.selId };
    }
    case 'DUP_BLOCK': {
      const i = cur.findIndex(b => b.id === a.id);
      if (i === -1) return s;
      const copy = { ...clone(cur[i]), id: uid() };
      const arr = [...cur]; arr.splice(i + 1, 0, copy);
      return { ...withHistory(s, arr), selId: copy.id };
    }
    case 'MOVE': {
      const i = cur.findIndex(b => b.id === a.id);
      const j = a.dir === 'up' ? i - 1 : i + 1;
      if (i === -1 || j < 0 || j >= cur.length) return s;
      const arr = [...cur]; [arr[i], arr[j]] = [arr[j], arr[i]];
      return withHistory(s, arr);
    }
    case 'REORDER': {
      const arr = [...cur];
      const [r] = arr.splice(a.from, 1);
      arr.splice(a.to, 0, r);
      return withHistory(s, arr);
    }
    case 'UPD': {
      const updated = cur.map(b => b.id === a.id ? { ...b, data: { ...b.data, ...a.patch } } : b);
      const h = s.history.map((entry, i) => i === s.histIdx ? updated : entry);
      return { ...s, history: h };
    }
    case 'SNAPSHOT': {
      const h = [...s.history.slice(0, s.histIdx + 1), cur].slice(-50);
      return { ...s, history: h, histIdx: h.length - 1 };
    }
    case 'UNDO': return s.histIdx > 0 ? { ...s, histIdx: s.histIdx - 1 } : s;
    case 'REDO': return s.histIdx < s.history.length - 1 ? { ...s, histIdx: s.histIdx + 1 } : s;
    case 'SELECT': return { ...s, selId: a.id };
    case 'SUBJECT': return { ...s, subject: a.v };
    default: return s;
  }
}

// ── Variable insertion hook ───────────────────────────────────────────────────

function useVarInsert(dispatch: React.Dispatch<Action>) {
  const ref = useRef<{
    el: HTMLTextAreaElement | HTMLInputElement;
    id: string; field: string; start: number; end: number;
  } | null>(null);

  const track = useCallback((
    e: React.SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>,
    id: string, field: string,
  ) => {
    const el = e.currentTarget;
    ref.current = { el, id, field, start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  }, []);

  const insert = useCallback((varKey: string) => {
    if (!ref.current) return;
    const { el, id, field, start, end } = ref.current;
    const s = `{{${varKey}}}`;
    const nv = el.value.slice(0, start) + s + el.value.slice(end);
    dispatch({ type: 'UPD', id, patch: { [field]: nv } });
    setTimeout(() => { el.focus(); el.setSelectionRange(start + s.length, start + s.length); }, 0);
  }, [dispatch]);

  return { track, insert };
}

// ── Block palette ─────────────────────────────────────────────────────────────

const PALETTE_ORDER: BlockType[] = [
  'logo', 'banner', 'title', 'paragraph', 'image',
  'book_card', 'divider', 'quote', 'cta_button',
  'coupon', 'social_links', 'footer', 'custom_html',
];

function BlockPalette({ onAdd, dragRef }: {
  onAdd:   (t: BlockType) => void;
  dragRef: React.MutableRefObject<{ src: 'palette'; blockType: BlockType } | { src: 'canvas'; fromIdx: number } | null>;
}) {
  return (
    <aside className="w-52 shrink-0 bg-obsidian border-r border-ash/30 overflow-y-auto flex flex-col">
      <p className="px-3 py-3 text-silver-500 text-xs uppercase tracking-widest font-medium border-b border-ash/30 shrink-0">
        Blocs
      </p>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {PALETTE_ORDER.map((t) => {
          const m = BLOCK_META[t];
          return (
            <div
              key={t}
              draggable
              onDragStart={() => { dragRef.current = { src: 'palette', blockType: t }; }}
              onClick={() => onAdd(t)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-charcoal border border-transparent hover:border-ash/50 transition-all group select-none"
            >
              <span className="text-base shrink-0 w-5 text-center">{m.icon}</span>
              <div className="min-w-0">
                <p className="text-silver-300 text-xs font-medium truncate">{m.label}</p>
                <p className="text-silver-600 text-[10px] truncate hidden group-hover:block">{m.description}</p>
              </div>
              <Plus className="w-3 h-3 text-silver-600 ml-auto shrink-0 opacity-0 group-hover:opacity-100" />
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ── Canvas block card ─────────────────────────────────────────────────────────

function BlockCard({ block, index, selected, total, dispatch, dragRef, dropIdx, onDragOver, onDrop }: {
  block:       Block;
  index:       number;
  selected:    boolean;
  total:       number;
  dispatch:    React.Dispatch<Action>;
  dragRef:     React.MutableRefObject<{ src: 'palette'; blockType: BlockType } | { src: 'canvas'; fromIdx: number } | null>;
  dropIdx:     number | null;
  onDragOver:  (i: number) => void;
  onDrop:      (i: number) => void;
}) {
  const m = BLOCK_META[block.type];
  const d = block.data;

  const excerpt = (): string => {
    switch (block.type) {
      case 'logo':         return `Alignement : ${d.alignment ?? 'center'}`;
      case 'banner':       return String(d.headline || '(titre non défini)').slice(0, 55);
      case 'title':        return String(d.text || '(texte vide)').slice(0, 55);
      case 'paragraph':    return String(d.text || '(texte vide)').slice(0, 75);
      case 'image':        return d.imageUrl ? 'Image configurée' : '⚠ URL non définie';
      case 'book_card':    return String(d.title || '{{book_title}}');
      case 'divider':      return `Style ${d.style} · ${d.widthPct ?? 80}% de largeur`;
      case 'quote':        return `"${String(d.text || '').slice(0, 50)}"`;
      case 'cta_button':   return String(d.label || '(sans label)');
      case 'coupon':       return `Code : ${d.code || '{{coupon_code}}'}`;
      case 'social_links': return 'Facebook · Instagram · YouTube · Site';
      case 'footer':       return String(d.company || 'CDS Librairie');
      default:             return '';
    }
  };

  return (
    <>
      {/* Drop zone above */}
      <div
        className={cn(
          'h-1 rounded-full mx-4 transition-all',
          dropIdx === index ? 'bg-yellow-400 h-0.5 mx-2 my-0.5' : 'bg-transparent'
        )}
        onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
        onDrop={(e) => { e.preventDefault(); onDrop(index); }}
      />

      <div
        draggable
        onDragStart={() => { dragRef.current = { src: 'canvas', fromIdx: index }; }}
        onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
        onDrop={(e) => { e.preventDefault(); onDrop(index); }}
        onClick={() => dispatch({ type: 'SELECT', id: block.id })}
        className={cn(
          'mx-3 rounded-xl border transition-all cursor-pointer group',
          selected
            ? 'border-yellow-500/60 bg-yellow-500/5 shadow-[0_0_0_2px_rgba(229,167,0,0.15)]'
            : 'border-ash/40 bg-charcoal hover:border-ash/70 hover:bg-onyx'
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Drag handle */}
          <GripVertical className="w-3.5 h-3.5 text-silver-600 shrink-0 cursor-grab" />

          {/* Block type indicator */}
          <span className="text-sm shrink-0 w-5 text-center">{m.icon}</span>

          {/* Content preview */}
          <div className="flex-1 min-w-0">
            <p className="text-silver-400 text-[10px] uppercase tracking-wider">{m.label}</p>
            <p className="text-silver-200 text-xs truncate">{excerpt()}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MOVE', id: block.id, dir: 'up' }); }}
              disabled={index === 0}
              className="p-1 rounded text-silver-500 hover:text-silver-200 disabled:opacity-20 transition-colors"
              title="Monter"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MOVE', id: block.id, dir: 'down' }); }}
              disabled={index === total - 1}
              className="p-1 rounded text-silver-500 hover:text-silver-200 disabled:opacity-20 transition-colors"
              title="Descendre"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DUP_BLOCK', id: block.id }); }}
              className="p-1 rounded text-silver-500 hover:text-blue-400 transition-colors"
              title="Dupliquer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DEL_BLOCK', id: block.id }); }}
              className="p-1 rounded text-silver-500 hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Property panel ────────────────────────────────────────────────────────────

interface PP {
  block:    Block;
  books:    BookOption[];
  dispatch: React.Dispatch<Action>;
  track:    ReturnType<typeof useVarInsert>['track'];
  insert:   ReturnType<typeof useVarInsert>['insert'];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-silver-500 text-[10px] uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function TxtInput({ value, onChange, onBlur, placeholder, className }: {
  value: string; onChange: (v: string) => void; onBlur?: () => void;
  placeholder?: string; className?: string;
}) {
  return (
    <input
      className={cn('input-dark text-xs', className)}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  );
}

function TxtArea({ value, onChange, onFocus, onSelect, onBlur, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onSelect?: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      className="w-full bg-obsidian border border-ash/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-600/50 transition-colors resize-y"
      style={{ color: '#E2E2E5' }}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onSelect={onSelect}
      onBlur={onBlur}
    />
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-ash/50 cursor-pointer bg-transparent" />
        <input className="input-dark text-xs flex-1 font-mono" value={value}
          onChange={(e) => onChange(e.target.value)} placeholder="#FFFFFF" />
      </div>
    </Field>
  );
}

function NumRow({ label, value, onChange, min = 0, max = 999 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <Field label={label}>
      <input type="number" min={min} max={max}
        className="input-dark text-xs w-full"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}

function AlignRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Alignement">
      <div className="flex gap-1">
        {(['left', 'center', 'right'] as const).map((a) => (
          <button key={a} onClick={() => onChange(a)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
              value === a ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' : 'text-silver-500 bg-charcoal border-ash/50'
            )}
          >
            {a === 'left' ? '←' : a === 'center' ? '↔' : '→'}
          </button>
        ))}
      </div>
    </Field>
  );
}

// Per-block property components
function PropLogo({ block, dispatch }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  return (
    <div className="space-y-4">
      <Field label="URL du logo">
        <TxtInput value={String(d.logoUrl ?? '')} onChange={(v) => upd({ logoUrl: v })} placeholder="https://..." />
      </Field>
      <AlignRow value={String(d.alignment ?? 'center')} onChange={(v) => upd({ alignment: v })} />
      <ColorRow label="Fond" value={String(d.bg ?? '#0A0800')} onChange={(v) => upd({ bg: v })} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 20)} onChange={(v) => upd({ paddingY: v })} />
      <NumRow label="Padding horizontal (px)" value={Number(d.paddingX ?? 24)} onChange={(v) => upd({ paddingX: v })} />
    </div>
  );
}

function PropBanner({ block, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="URL image">
        <TxtInput value={String(d.imageUrl ?? '')} onChange={(v) => upd({ imageUrl: v })} placeholder="https://..." />
      </Field>
      <Field label="Titre principal">
        <TxtArea value={String(d.headline ?? '')} onChange={(v) => upd({ headline: v })}
          onFocus={(e) => track(e, block.id, 'headline')} onSelect={(e) => track(e, block.id, 'headline')} onBlur={snap} rows={2} />
      </Field>
      <Field label="Sous-titre">
        <TxtArea value={String(d.subheadline ?? '')} onChange={(v) => upd({ subheadline: v })}
          onFocus={(e) => track(e, block.id, 'subheadline')} onSelect={(e) => track(e, block.id, 'subheadline')} onBlur={snap} rows={2} />
      </Field>
      <Field label="Label CTA">
        <TxtInput value={String(d.ctaLabel ?? '')} onChange={(v) => upd({ ctaLabel: v })} placeholder="Explorer maintenant" />
      </Field>
      <Field label="URL CTA">
        <TxtInput value={String(d.ctaUrl ?? '')} onChange={(v) => upd({ ctaUrl: v })} placeholder="{{site_url}}" />
      </Field>
      <ColorRow label="Fond" value={String(d.bg ?? '#1a1a1a')} onChange={(v) => upd({ bg: v })} />
      <ColorRow label="Couleur du texte" value={String(d.textColor ?? '#FFFFFF')} onChange={(v) => upd({ textColor: v })} />
    </div>
  );
}

function PropTitle({ block, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="Texte">
        <TxtArea value={String(d.text ?? '')} onChange={(v) => upd({ text: v })}
          onFocus={(e) => track(e, block.id, 'text')} onSelect={(e) => track(e, block.id, 'text')} onBlur={snap} rows={2} />
      </Field>
      <Field label="Niveau">
        <div className="flex gap-1">
          {(['h1', 'h2', 'h3'] as const).map((t) => (
            <button key={t} onClick={() => upd({ tag: t })}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all uppercase',
                d.tag === t ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' : 'text-silver-500 bg-charcoal border-ash/50'
              )}>{t}</button>
          ))}
        </div>
      </Field>
      <NumRow label="Taille police (px)" value={Number(d.fontSize ?? 28)} onChange={(v) => upd({ fontSize: v })} min={12} max={72} />
      <AlignRow value={String(d.alignment ?? 'center')} onChange={(v) => upd({ alignment: v })} />
      <ColorRow label="Couleur texte" value={String(d.color ?? '#000000')} onChange={(v) => upd({ color: v })} />
      <ColorRow label="Fond" value={String(d.bg ?? '#FFFFFF')} onChange={(v) => upd({ bg: v })} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 24)} onChange={(v) => upd({ paddingY: v })} />
    </div>
  );
}

function PropParagraph({ block, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="Texte (variables supportées)">
        <TxtArea value={String(d.text ?? '')} onChange={(v) => upd({ text: v })}
          onFocus={(e) => track(e, block.id, 'text')} onSelect={(e) => track(e, block.id, 'text')} onBlur={snap} rows={5} />
      </Field>
      <NumRow label="Taille police (px)" value={Number(d.fontSize ?? 16)} onChange={(v) => upd({ fontSize: v })} min={10} max={36} />
      <ColorRow label="Couleur texte" value={String(d.color ?? '#333333')} onChange={(v) => upd({ color: v })} />
      <ColorRow label="Fond" value={String(d.bg ?? '#FFFFFF')} onChange={(v) => upd({ bg: v })} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 12)} onChange={(v) => upd({ paddingY: v })} />
      <NumRow label="Padding horizontal (px)" value={Number(d.paddingX ?? 24)} onChange={(v) => upd({ paddingX: v })} />
    </div>
  );
}

function PropImage({ block, dispatch }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  return (
    <div className="space-y-4">
      <Field label="URL image">
        <TxtInput value={String(d.imageUrl ?? '')} onChange={(v) => upd({ imageUrl: v })} placeholder="https://..." />
      </Field>
      <Field label="Texte alternatif">
        <TxtInput value={String(d.alt ?? '')} onChange={(v) => upd({ alt: v })} placeholder="Description de l'image" />
      </Field>
      <NumRow label="Largeur (px)" value={Number(d.width ?? 560)} onChange={(v) => upd({ width: v })} min={100} max={600} />
      <AlignRow value={String(d.alignment ?? 'center')} onChange={(v) => upd({ alignment: v })} />
      <NumRow label="Border radius (px)" value={Number(d.borderRadius ?? 8)} onChange={(v) => upd({ borderRadius: v })} min={0} max={32} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 16)} onChange={(v) => upd({ paddingY: v })} />
    </div>
  );
}

function PropBookCard({ block, books, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });

  function selectBook(bookId: string) {
    const b = books.find(b => b.id === bookId);
    if (!b) return;
    upd({
      title:    b.title,
      author:   b.author,
      price:    `${(b.price / 100).toFixed(2).replace('.', ',')} €`,
      coverUrl: b.cover_url ?? '',
    });
    dispatch({ type: 'SNAPSHOT' });
  }

  return (
    <div className="space-y-4">
      {books.length > 0 && (
        <Field label="Sélectionner un livre">
          <select className="input-dark text-xs" onChange={(e) => selectBook(e.target.value)} defaultValue="">
            <option value="">— choisir un livre —</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="URL couverture">
        <TxtInput value={String(d.coverUrl ?? '')} onChange={(v) => upd({ coverUrl: v })} placeholder="https://..." />
      </Field>
      <Field label="Titre">
        <TxtInput value={String(d.title ?? '')} onChange={(v) => upd({ title: v })}
          placeholder="{{book_title}}" />
      </Field>
      <Field label="Auteur">
        <TxtInput value={String(d.author ?? '')} onChange={(v) => upd({ author: v })} placeholder="Nom de l'auteur" />
      </Field>
      <Field label="Description courte">
        <TxtArea value={String(d.description ?? '')} onChange={(v) => upd({ description: v })}
          onFocus={(e) => track(e, block.id, 'description')} onSelect={(e) => track(e, block.id, 'description')} onBlur={snap} rows={3} />
      </Field>
      <Field label="Prix">
        <TxtInput value={String(d.price ?? '')} onChange={(v) => upd({ price: v })} placeholder="{{book_price}}" />
      </Field>
      <Field label="Label bouton">
        <TxtInput value={String(d.buttonLabel ?? '')} onChange={(v) => upd({ buttonLabel: v })} placeholder="Obtenir ce livre" />
      </Field>
      <Field label="URL bouton">
        <TxtInput value={String(d.buttonUrl ?? '')} onChange={(v) => upd({ buttonUrl: v })} placeholder="{{book_url}}" />
      </Field>
      <ColorRow label="Fond carte" value={String(d.bg ?? '#F8F8F6')} onChange={(v) => upd({ bg: v })} />
    </div>
  );
}

function PropDivider({ block, dispatch }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  return (
    <div className="space-y-4">
      <Field label="Style">
        <div className="flex gap-1">
          {(['solid', 'dashed', 'dotted'] as const).map((s) => (
            <button key={s} onClick={() => upd({ style: s })}
              className={cn('flex-1 py-1.5 rounded-lg text-xs border transition-all',
                d.style === s ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' : 'text-silver-500 bg-charcoal border-ash/50'
              )}>{s}</button>
          ))}
        </div>
      </Field>
      <ColorRow label="Couleur" value={String(d.color ?? '#E5E5E5')} onChange={(v) => upd({ color: v })} />
      <NumRow label="Épaisseur (px)" value={Number(d.thickness ?? 1)} onChange={(v) => upd({ thickness: v })} min={1} max={8} />
      <NumRow label="Largeur (%)" value={Number(d.widthPct ?? 80)} onChange={(v) => upd({ widthPct: v })} min={10} max={100} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 16)} onChange={(v) => upd({ paddingY: v })} />
    </div>
  );
}

function PropQuote({ block, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="Citation">
        <TxtArea value={String(d.text ?? '')} onChange={(v) => upd({ text: v })}
          onFocus={(e) => track(e, block.id, 'text')} onSelect={(e) => track(e, block.id, 'text')} onBlur={snap} rows={3} />
      </Field>
      <Field label="Auteur">
        <TxtInput value={String(d.author ?? '')} onChange={(v) => upd({ author: v })} placeholder="Marcel Proust" />
      </Field>
      <ColorRow label="Couleur accentuation" value={String(d.accentColor ?? '#E5A700')} onChange={(v) => upd({ accentColor: v })} />
      <ColorRow label="Couleur texte" value={String(d.color ?? '#222222')} onChange={(v) => upd({ color: v })} />
      <ColorRow label="Fond" value={String(d.bg ?? '#FAFAF8')} onChange={(v) => upd({ bg: v })} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 24)} onChange={(v) => upd({ paddingY: v })} />
      <NumRow label="Padding horizontal (px)" value={Number(d.paddingX ?? 32)} onChange={(v) => upd({ paddingX: v })} />
    </div>
  );
}

function PropCtaButton({ block, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="Label">
        <TxtInput value={String(d.label ?? '')} onChange={(v) => upd({ label: v })}
          placeholder="Voir le livre" />
      </Field>
      <Field label="URL">
        <TxtInput value={String(d.url ?? '')} onChange={(v) => upd({ url: v })}
          placeholder="{{book_url}}" />
      </Field>
      <ColorRow label="Fond bouton" value={String(d.bgColor ?? '#000000')} onChange={(v) => upd({ bgColor: v })} />
      <ColorRow label="Couleur texte" value={String(d.textColor ?? '#FFFFFF')} onChange={(v) => upd({ textColor: v })} />
      <NumRow label="Border radius (px)" value={Number(d.radius ?? 6)} onChange={(v) => upd({ radius: v })} min={0} max={50} />
      <AlignRow value={String(d.alignment ?? 'center')} onChange={(v) => upd({ alignment: v })} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 20)} onChange={(v) => upd({ paddingY: v })} />
    </div>
  );
}

function PropCoupon({ block, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="Code promo">
        <TxtInput value={String(d.code ?? '')} onChange={(v) => upd({ code: v })} placeholder="{{coupon_code}}" />
      </Field>
      <Field label="Réduction (ex. 20%)">
        <TxtInput value={String(d.discount ?? '')} onChange={(v) => upd({ discount: v })} placeholder="{{discount}}%" />
      </Field>
      <Field label="Date d'expiration">
        <TxtInput value={String(d.expiration ?? '')} onChange={(v) => upd({ expiration: v })} placeholder="31 août 2026" />
      </Field>
      <Field label="Label bouton">
        <TxtInput value={String(d.buttonLabel ?? '')} onChange={(v) => upd({ buttonLabel: v })} placeholder="Utiliser ce coupon" />
      </Field>
      <Field label="URL bouton">
        <TxtInput value={String(d.buttonUrl ?? '')} onChange={(v) => upd({ buttonUrl: v })} placeholder="{{site_url}}" />
      </Field>
      <ColorRow label="Fond" value={String(d.bg ?? '#FFF8E8')} onChange={(v) => upd({ bg: v })} />
      <ColorRow label="Couleur accentuation" value={String(d.accentColor ?? '#E5A700')} onChange={(v) => upd({ accentColor: v })} />
    </div>
  );
}

function PropSocialLinks({ block, dispatch }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  return (
    <div className="space-y-4">
      <Field label="Facebook URL"><TxtInput value={String(d.facebook ?? '')} onChange={(v) => upd({ facebook: v })} placeholder="https://facebook.com/..." /></Field>
      <Field label="Instagram URL"><TxtInput value={String(d.instagram ?? '')} onChange={(v) => upd({ instagram: v })} placeholder="https://instagram.com/..." /></Field>
      <Field label="YouTube URL"><TxtInput value={String(d.youtube ?? '')} onChange={(v) => upd({ youtube: v })} placeholder="https://youtube.com/..." /></Field>
      <Field label="Site web URL"><TxtInput value={String(d.website ?? '')} onChange={(v) => upd({ website: v })} placeholder="{{site_url}}" /></Field>
      <ColorRow label="Couleur texte" value={String(d.color ?? '#555555')} onChange={(v) => upd({ color: v })} />
      <AlignRow value={String(d.alignment ?? 'center')} onChange={(v) => upd({ alignment: v })} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 16)} onChange={(v) => upd({ paddingY: v })} />
    </div>
  );
}

function PropFooter({ block, dispatch, track }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="Nom de la société"><TxtInput value={String(d.company ?? '')} onChange={(v) => upd({ company: v })} placeholder="CDS Librairie" /></Field>
      <Field label="Adresse"><TxtInput value={String(d.address ?? '')} onChange={(v) => upd({ address: v })} placeholder="Paris, France" /></Field>
      <Field label="URL désabonnement"><TxtInput value={String(d.unsubscribeUrl ?? '')} onChange={(v) => upd({ unsubscribeUrl: v })} placeholder="{{unsubscribe_url}}" /></Field>
      <Field label="Copyright"><TxtInput value={String(d.copyright ?? '')} onChange={(v) => upd({ copyright: v })} placeholder="© 2026 CDS Librairie" /></Field>
      <ColorRow label="Fond" value={String(d.bg ?? '#1a1a1a')} onChange={(v) => upd({ bg: v })} />
      <ColorRow label="Couleur texte" value={String(d.color ?? '#999999')} onChange={(v) => upd({ color: v })} />
      <NumRow label="Padding vertical (px)" value={Number(d.paddingY ?? 24)} onChange={(v) => upd({ paddingY: v })} />
    </div>
  );
}

function PropCustomHtml({ block, dispatch }: PP) {
  const d = block.data;
  const upd = (patch: Record<string, unknown>) => dispatch({ type: 'UPD', id: block.id, patch });
  const snap = () => dispatch({ type: 'SNAPSHOT' });
  return (
    <div className="space-y-4">
      <Field label="Code HTML brut">
        <textarea
          className="input-dark w-full font-mono text-xs resize-y"
          rows={12}
          value={String(d.html ?? '')}
          onChange={(e) => upd({ html: e.target.value })}
          onBlur={snap}
          placeholder="<table>…</table>"
          spellCheck={false}
        />
      </Field>
      <p className="text-silver-600 text-[11px] leading-relaxed">
        Ce contenu sera inséré tel quel dans l'email généré. Utilisez uniquement des styles inline pour garantir la compatibilité email.
      </p>
    </div>
  );
}

const PROP_PANELS: Record<BlockType, React.FC<PP>> = {
  logo: PropLogo, banner: PropBanner, title: PropTitle,
  paragraph: PropParagraph, image: PropImage, book_card: PropBookCard,
  divider: PropDivider, quote: PropQuote, cta_button: PropCtaButton,
  coupon: PropCoupon, social_links: PropSocialLinks, footer: PropFooter,
  custom_html: PropCustomHtml,
};

// AI actions that map to block types
const AI_ACTIONS_FOR: Partial<Record<BlockType, { key: string; label: string; field: string }[]>> = {
  banner:    [
    { key: 'improve_headline',     label: 'Améliorer le titre',      field: 'headline' },
    { key: 'improve_cta',          label: 'Améliorer le CTA',        field: 'ctaLabel' },
    { key: 'increase_conversion',  label: 'Augmenter la conversion', field: 'headline' },
  ],
  title:     [{ key: 'improve_headline', label: 'Améliorer le titre', field: 'text' }],
  paragraph: [
    { key: 'rewrite_paragraph',   label: 'Réécrire le paragraphe',    field: 'text' },
    { key: 'shorten',             label: 'Raccourcir',                field: 'text' },
    { key: 'increase_conversion', label: 'Augmenter la conversion',  field: 'text' },
  ],
  quote:     [{ key: 'rewrite_paragraph', label: 'Réécrire la citation', field: 'text' }],
  cta_button:[{ key: 'improve_cta', label: 'Améliorer le CTA', field: 'label' }],
};

function AiPanel({ block, dispatch }: { block: Block; dispatch: React.Dispatch<Action> }) {
  const actions = AI_ACTIONS_FOR[block.type];
  const [sel, setSel]     = useState(actions?.[0]?.key ?? '');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');

  if (!actions || actions.length === 0) return null;

  const selAction = actions.find(a => a.key === sel) ?? actions[0];
  const currentContent = String(block.data[selAction.field] ?? '');

  async function run() {
    setLoading(true); setErr(''); setResult('');
    try {
      const res = await fetch('/api/admin/email-templates/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: sel, content: currentContent }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error ?? 'Erreur'); return; }
      setResult(json.improved ?? '');
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!result) return;
    dispatch({ type: 'UPD', id: block.id, patch: { [selAction.field]: result } });
    dispatch({ type: 'SNAPSHOT' });
    setResult('');
  }

  return (
    <div className="border border-yellow-500/20 rounded-xl p-3 bg-yellow-500/5 space-y-3">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-yellow-400 text-xs font-medium">IA — Améliorer</span>
      </div>
      <select className="input-dark text-xs w-full" value={sel} onChange={(e) => { setSel(e.target.value); setResult(''); }}>
        {actions.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
      </select>
      <button
        onClick={run} disabled={loading || !currentContent.trim()}
        className="w-full py-2 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-yellow-500/20 transition-all"
      >
        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading ? 'Génération…' : '✨ Améliorer'}
      </button>
      {err && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{err}</p>}
      {result && (
        <div className="space-y-2">
          <p className="text-silver-300 text-xs p-2 bg-obsidian rounded-lg leading-relaxed">{result}</p>
          <button onClick={apply} className="w-full py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-emerald-500/15 transition-all">
            <CheckCircle2 className="w-3.5 h-3.5" /> Appliquer
          </button>
        </div>
      )}
    </div>
  );
}

function PropertyPanel({ block, books, dispatch, track, insert }: PP) {
  const PanelComp = PROP_PANELS[block.type];
  const [showVars, setShowVars] = useState(false);

  return (
    <aside className="w-72 shrink-0 bg-obsidian border-l border-ash/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ash/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">{BLOCK_META[block.type].icon}</span>
          <div>
            <p className="text-silver-200 text-sm font-medium">{BLOCK_META[block.type].label}</p>
            <p className="text-silver-600 text-xs">{BLOCK_META[block.type].description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Panel */}
        <AiPanel block={block} dispatch={dispatch} />

        {/* Variables */}
        <div>
          <button onClick={() => setShowVars(!showVars)}
            className="flex items-center gap-2 text-silver-500 text-xs hover:text-silver-300 transition-colors w-full mb-2">
            <span className="text-[10px] uppercase tracking-widest">Variables</span>
            <span className="ml-auto">{showVars ? '▲' : '▼'}</span>
          </button>
          {showVars && (
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARS.map((v) => (
                <button key={v.key} onClick={() => insert(v.key)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-charcoal border border-ash/50 text-silver-400 hover:text-yellow-400 hover:border-yellow-500/30 transition-all">
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Block-specific properties */}
        <PanelComp block={block} books={books} dispatch={dispatch} track={track} insert={insert} />
      </div>
    </aside>
  );
}

// ── Legacy screen ─────────────────────────────────────────────────────────────

function LegacyScreen({
  onConvert,
  onContinue,
}: {
  onConvert:  () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-16 text-center bg-charcoal/30">
      <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
        <FileCode2 className="w-7 h-7 text-yellow-400" />
      </div>
      <div>
        <p className="text-silver-200 text-base font-medium mb-2">
          Ce template a été créé avec l'éditeur HTML classique.
        </p>
        <p className="text-silver-500 text-sm leading-relaxed max-w-md">
          Convertissez-le automatiquement en blocs visuels, ou continuez à éditer le HTML source.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onConvert}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-sm font-medium hover:bg-yellow-500/20 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Convertir automatiquement
        </button>
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-silver-400 border border-ash/50 text-sm hover:text-silver-200 hover:border-ash transition-all"
        >
          Continuer en HTML
        </button>
      </div>
    </div>
  );
}

// ── Import HTML modal ─────────────────────────────────────────────────────────

function ImportHtmlModal({
  onImport,
  onClose,
}: {
  onImport: (html: string) => void;
  onClose:  () => void;
}) {
  const [html, setHtml]   = useState('');
  const [err,  setErr]    = useState('');
  const fileRef           = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setHtml(String(ev.target?.result ?? ''));
    reader.readAsText(file, 'utf-8');
  }

  function handleImport() {
    if (!html.trim()) { setErr("Collez ou chargez du HTML d'abord."); return; }
    onImport(html);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-obsidian border border-ash/40 rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ash/30">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-yellow-400" />
            <span className="text-silver-200 text-sm font-medium">Importer du HTML</span>
          </div>
          <button onClick={onClose} className="text-silver-500 hover:text-silver-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-silver-500 text-xs mb-2">Charger un fichier .html</label>
            <input
              ref={fileRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-ash/50 text-silver-400 text-sm hover:text-silver-200 hover:border-ash transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              Choisir un fichier
            </button>
          </div>

          <div>
            <label className="block text-silver-500 text-xs mb-2">ou collez votre HTML directement</label>
            <textarea
              className="input-dark w-full font-mono text-xs resize-none"
              rows={10}
              value={html}
              onChange={(e) => { setHtml(e.target.value); setErr(''); }}
              placeholder="<html>...</html>"
              spellCheck={false}
            />
          </div>

          {err && (
            <p className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{err}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-ash/30">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-silver-500 hover:text-silver-200 border border-ash/50 hover:border-ash transition-all">
            Annuler
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-sm font-medium hover:bg-yellow-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Convertir en blocs
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  const [width, setWidth] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [dark, setDark]   = useState(false);

  const widthMap = { desktop: '100%', tablet: '768px', mobile: '375px' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={onClose}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-ash/40 bg-obsidian shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-silver-300 text-sm font-medium">Aperçu</span>
        <div className="flex gap-1 ml-4">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([w, Icon]) => (
            <button key={w} onClick={() => setWidth(w)}
              className={cn('p-1.5 rounded-lg transition-all', width === w ? 'text-yellow-400 bg-yellow-500/10' : 'text-silver-500 hover:text-silver-300')}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <button onClick={() => setDark(!dark)}
          className="p-1.5 rounded-lg text-silver-500 hover:text-silver-300 transition-colors ml-1">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button onClick={onClose} className="ml-auto p-1.5 text-silver-500 hover:text-silver-200 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className={cn('flex-1 overflow-auto p-6', dark ? 'bg-gray-900' : 'bg-gray-100')} onClick={e => e.stopPropagation()}>
        <div className="mx-auto transition-all" style={{ maxWidth: widthMap[width], width: '100%' }}>
          <iframe
            srcDoc={html}
            title="Aperçu email"
            className="w-full border-0 rounded-xl shadow-2xl"
            style={{ minHeight: 600, display: 'block', background: dark ? '#1a1a1a' : '#FFFFFF' }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmailBuilderV2({
  initialData, initialSubject, initialHtmlBody = '', templateId, books, onSaved, onCancel,
}: Props) {
  const hasBuilderData = initialData.blocks.length > 0;
  const isLegacyOnly  = !hasBuilderData && initialHtmlBody.trim().length > 0;

  const [state, dispatch] = useReducer(reducer, {
    history: [hasBuilderData ? initialData.blocks : []],
    histIdx: 0,
    selId:   null,
    subject: initialSubject,
  });

  const blocks   = state.history[state.histIdx];
  const selBlock = blocks.find(b => b.id === state.selId) ?? null;
  const canUndo  = state.histIdx > 0;
  const canRedo  = state.histIdx < state.history.length - 1;

  const { track, insert } = useVarInsert(dispatch);
  const dragRef = useRef<{ src: 'palette'; blockType: BlockType } | { src: 'canvas'; fromIdx: number } | null>(null);
  const [dropIdx,    setDropIdx]    = useState<number | null>(null);
  const [preview,    setPreview]    = useState(false);
  const [showLegacy, setShowLegacy] = useState(isLegacyOnly);
  const [showImport, setShowImport] = useState(false);
  const [isSaving,   setIsSaving]   = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null);

  function handleConvert() {
    const converted = htmlToBlocks(initialHtmlBody);
    dispatch({ type: 'LOAD', blocks: converted, subject: initialSubject });
    setShowLegacy(false);
  }

  function handleContinueAsHtml() {
    const block = {
      id: Math.random().toString(36).slice(2, 10),
      type: 'custom_html' as const,
      data: { html: initialHtmlBody },
    };
    dispatch({ type: 'LOAD', blocks: [block], subject: initialSubject });
    setShowLegacy(false);
  }

  function handleImportHtml(html: string) {
    const converted = htmlToBlocks(html);
    if (converted.length === 0) {
      const block = {
        id: Math.random().toString(36).slice(2, 10),
        type: 'custom_html' as const,
        data: { html },
      };
      dispatch({ type: 'LOAD', blocks: [block], subject: state.subject });
    } else {
      dispatch({ type: 'LOAD', blocks: converted, subject: state.subject });
    }
  }

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function handleDrop(toIdx: number) {
    const src = dragRef.current;
    if (!src) return;
    if (src.src === 'palette') {
      const nb = mkBlock(src.blockType);
      const arr = [...blocks];
      arr.splice(toIdx, 0, nb);
      dispatch({ type: 'ADD_BLOCK', blockType: src.blockType, afterIdx: toIdx - 1 });
    } else if (src.src === 'canvas') {
      if (src.fromIdx === toIdx || src.fromIdx === toIdx - 1) return;
      const to = src.fromIdx < toIdx ? toIdx - 1 : toIdx;
      dispatch({ type: 'REORDER', from: src.fromIdx, to });
    }
    dragRef.current = null;
    setDropIdx(null);
  }

  async function handleSave(status: 'draft' | 'active') {
    setIsSaving(true);
    const builderData: BuilderData = { version: 1, blocks };
    const html = generateEmailHTML(blocks, state.subject);
    try {
      await onSaved(html, builderData, state.subject, status);
      showToast(status === 'active' ? 'Template publié !' : 'Brouillon sauvegardé');
    } catch {
      showToast('Erreur de sauvegarde', false);
    } finally {
      setIsSaving(false);
    }
  }

  const generatedHtml = generateEmailHTML(blocks, state.subject);

  return (
    <div className="flex flex-col bg-obsidian rounded-2xl border border-ash/30 overflow-hidden" style={{ minHeight: 720 }}>
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-[200] px-4 py-3 rounded-xl text-sm font-medium shadow-xl border',
          toast.ok ? 'bg-onyx text-emerald-300 border-emerald-500/30' : 'bg-onyx text-red-300 border-red-500/30'
        )}>{toast.msg}</div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-ash/30 bg-void shrink-0">
        <div className="flex gap-1">
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
            title="Annuler (Ctrl+Z)"
            className="p-1.5 rounded-lg text-silver-500 hover:text-silver-200 disabled:opacity-25 transition-all">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
            title="Rétablir (Ctrl+Y)"
            className="p-1.5 rounded-lg text-silver-500 hover:text-silver-200 disabled:opacity-25 transition-all">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-5 w-px bg-ash/50 mx-1" />

        {/* Subject */}
        <div className="flex-1 min-w-0">
          <input
            className="w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-600/50 transition-colors"
            style={{ color: '#E2E2E5' }}
            placeholder="Objet de l'email — ex. : {{book_title}} vous attend, {{reader_name}} !"
            value={state.subject}
            onChange={(e) => dispatch({ type: 'SUBJECT', v: e.target.value })}
          />
        </div>

        <div className="h-5 w-px bg-ash/50 mx-1" />

        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-silver-400 hover:text-silver-200 border border-ash/50 hover:border-ash text-xs font-medium transition-all"
        >
          <Upload className="w-4 h-4" />
          Importer HTML
        </button>

        <button onClick={() => setPreview(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-silver-400 hover:text-silver-200 border border-ash/50 hover:border-ash text-xs font-medium transition-all">
          <Eye className="w-4 h-4" />
          Aperçu
        </button>
        <span className="text-silver-600 text-xs tabular-nums">{blocks.length} bloc{blocks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 600 }}>
        {/* Left: Palette */}
        <BlockPalette onAdd={(t) => dispatch({ type: 'ADD_BLOCK', blockType: t })} dragRef={dragRef} />

        {/* Center: Canvas */}
        <main
          className="flex-1 overflow-y-auto bg-charcoal/30 py-4 space-y-1.5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleDrop(dropIdx ?? blocks.length); setDropIdx(null); }}
        >
          {showLegacy ? (
            <LegacyScreen onConvert={handleConvert} onContinue={handleContinueAsHtml} />
          ) : blocks.length === 0 ? (
            <div
              className="mx-6 rounded-2xl border-2 border-dashed border-ash/50 flex flex-col items-center justify-center gap-3 text-silver-600"
              style={{ minHeight: 300 }}
              onDragOver={(e) => { e.preventDefault(); setDropIdx(0); }}
              onDrop={(e) => { e.preventDefault(); handleDrop(0); }}
            >
              <GripVertical className="w-8 h-8 opacity-30" />
              <p className="text-sm">Glissez un bloc ici ou cliquez dans la palette</p>
            </div>
          ) : (
            <>
              {blocks.map((b, i) => (
                <BlockCard
                  key={b.id}
                  block={b}
                  index={i}
                  selected={b.id === state.selId}
                  total={blocks.length}
                  dispatch={dispatch}
                  dragRef={dragRef}
                  dropIdx={dropIdx}
                  onDragOver={(idx) => setDropIdx(idx)}
                  onDrop={handleDrop}
                />
              ))}
              {/* Drop zone at the end */}
              <div
                className={cn('h-2 mx-4 rounded-full transition-all', dropIdx === blocks.length ? 'bg-yellow-400 h-1' : 'bg-transparent')}
                onDragOver={(e) => { e.preventDefault(); setDropIdx(blocks.length); }}
                onDrop={(e) => { e.preventDefault(); handleDrop(blocks.length); }}
              />
              <div
                className="mx-6 mt-2 py-3 rounded-xl border border-dashed border-ash/40 flex items-center justify-center gap-2 text-silver-600 text-xs hover:border-ash/70 transition-colors cursor-pointer"
                onClick={() => {}}
                onDragOver={(e) => { e.preventDefault(); setDropIdx(blocks.length); }}
                onDrop={(e) => { e.preventDefault(); handleDrop(blocks.length); }}
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un bloc ou glisser depuis la palette
              </div>
            </>
          )}
        </main>

        {/* Right: Properties */}
        {selBlock ? (
          <PropertyPanel
            block={selBlock}
            books={books}
            dispatch={dispatch}
            track={track}
            insert={insert}
          />
        ) : (
          <aside className="w-72 shrink-0 bg-obsidian border-l border-ash/30 flex items-center justify-center p-8">
            <div className="text-center text-silver-600">
              <div className="text-4xl mb-3 opacity-30">←</div>
              <p className="text-sm">Sélectionnez un bloc pour modifier ses propriétés</p>
            </div>
          </aside>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-ash/30 bg-void shrink-0">
        <button onClick={onCancel} className="text-silver-500 hover:text-silver-300 text-sm transition-colors flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" /> Annuler
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-silver-400 border border-ash/50 hover:text-silver-200 hover:border-ash transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            Brouillon
          </button>
          <button
            onClick={() => handleSave('active')}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Publier
          </button>
        </div>
      </div>

      {/* Preview modal */}
      {preview && <PreviewModal html={generatedHtml} onClose={() => setPreview(false)} />}

      {/* Import HTML modal */}
      {showImport && (
        <ImportHtmlModal
          onImport={handleImportHtml}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
