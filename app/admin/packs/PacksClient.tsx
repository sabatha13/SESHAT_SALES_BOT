'use client';

import { useState, useMemo } from 'react';
import { Package, Plus, Trash2, Edit, Check, X, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface BookLite {
  id: string;
  title: string;
  price: number; // cents
  cover_url: string | null;
}

interface Bundle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  book_ids: string[];
  price: number; // cents
  cover_url: string | null;
  is_published: boolean;
  created_at: string;
}

interface Props {
  bundles: Bundle[];
  books: BookLite[];
}

const emptyForm = {
  title: '',
  description: '',
  price: '',
  cover_url: '',
  book_ids: [] as string[],
  is_published: false,
};

export default function PacksClient({ bundles: initialBundles, books }: Props) {
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const bookMap = useMemo(() => {
    const m: Record<string, BookLite> = {};
    for (const b of books) m[b.id] = b;
    return m;
  }, [books]);

  const totalValueCents = useMemo(
    () => form.book_ids.reduce((sum, id) => sum + (bookMap[id]?.price || 0), 0),
    [form.book_ids, bookMap]
  );
  const packPriceCents = Math.round((parseFloat(form.price) || 0) * 100);
  const discount = totalValueCents > 0 && packPriceCents > 0
    ? Math.round((1 - packPriceCents / totalValueCents) * 100)
    : 0;

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleBook = (id: string) => {
    setForm(f => ({
      ...f,
      book_ids: f.book_ids.includes(id) ? f.book_ids.filter(x => x !== id) : [...f.book_ids, id],
    }));
  };

  const startEdit = (b: Bundle) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      description: b.description || '',
      price: (b.price / 100).toString(),
      cover_url: b.cover_url || '',
      book_ids: b.book_ids || [],
      is_published: b.is_published,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!form.title.trim()) { alert('Le titre est requis.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        price: parseFloat(form.price) || 0,
        cover_url: form.cover_url,
        book_ids: form.book_ids,
        is_published: form.is_published,
        ...(editingId ? { id: editingId } : {}),
      };
      const res = await fetch('/api/admin/bundles', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      const bundle: Bundle = data.bundle;
      setBundles(prev => editingId ? prev.map(b => b.id === bundle.id ? bundle : b) : [bundle, ...prev]);
      resetForm();
    } catch (err: any) {
      alert(err?.message || 'Une erreur est survenue.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce pack définitivement ?')) return;
    const res = await fetch(`/api/admin/bundles?id=${id}`, { method: 'DELETE' });
    if (res.ok) setBundles(prev => prev.filter(b => b.id !== id));
  };

  const bundleTotalValue = (b: Bundle) =>
    (b.book_ids || []).reduce((sum, id) => sum + (bookMap[id]?.price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {!showForm && (
          <button onClick={() => { setForm({ ...emptyForm }); setEditingId(null); setShowForm(true); }} className="btn-gold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nouveau pack
          </button>
        )}
      </div>

      {showForm && (
        <div className="card-dark rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-silver-200 flex items-center gap-2">
              <Package className="w-5 h-5 text-gold-400" />
              {editingId ? 'Modifier le pack' : 'Nouveau pack'}
            </h2>
            <button onClick={resetForm} className="p-1.5 text-silver-500 hover:text-silver-300 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-silver-400 text-xs uppercase tracking-widest mb-1.5">Titre</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
                placeholder="Ex : Collection Tarot Essentiel"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-silver-400 text-xs uppercase tracking-widest mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50 resize-none"
                placeholder="Décrivez ce que contient ce pack…"
              />
            </div>
            <div>
              <label className="block text-silver-400 text-xs uppercase tracking-widest mb-1.5">Prix du pack ($US)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
                placeholder="49.99"
              />
            </div>
            <div>
              <label className="block text-silver-400 text-xs uppercase tracking-widest mb-1.5">URL de couverture (optionnel)</label>
              <input
                type="text"
                value={form.cover_url}
                onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
                className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-2.5 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
                placeholder="https://…"
              />
            </div>
          </div>

          {/* Book selection */}
          <div>
            <label className="block text-silver-400 text-xs uppercase tracking-widest mb-2">
              Livres inclus ({form.book_ids.length})
            </label>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-auto p-1">
              {books.map(b => {
                const selected = form.book_ids.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBook(b.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all ${selected ? 'bg-gold-500/15 border-gold-500/50 text-gold-300' : 'bg-charcoal border-ash/50 text-silver-400 hover:border-gold-500/30'}`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    <span className="max-w-[180px] truncate">{b.title}</span>
                    <span className="text-silver-600">{formatPrice(b.price)}</span>
                  </button>
                );
              })}
              {books.length === 0 && <p className="text-silver-600 text-sm">Aucun livre publié.</p>}
            </div>
          </div>

          {/* Live value/discount */}
          {form.book_ids.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-charcoal border border-ash/50">
              <div>
                <p className="text-silver-600 text-[10px] uppercase tracking-widest">Valeur totale</p>
                <p className="text-silver-200 text-sm font-medium">{formatPrice(totalValueCents)}</p>
              </div>
              <div>
                <p className="text-silver-600 text-[10px] uppercase tracking-widest">Prix du pack</p>
                <p className="gold-text text-sm font-medium">{formatPrice(packPriceCents)}</p>
              </div>
              {discount > 0 && (
                <span className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <Tag className="w-3.5 h-3.5" /> Économie de {discount}%
                </span>
              )}
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 accent-gold-500"
            />
            <span className="text-silver-300 text-sm">Publié (visible sur le site)</span>
          </label>

          <div className="flex gap-3">
            <button onClick={submit} disabled={saving} className="btn-gold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium disabled:opacity-50">
              <Check className="w-4 h-4" /> {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Créer le pack'}
            </button>
            <button onClick={resetForm} className="btn-ghost-gold px-5 py-2.5 rounded-xl text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* List */}
      {bundles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {bundles.map(b => {
            const totalValue = bundleTotalValue(b);
            const disc = totalValue > 0 && b.price > 0 ? Math.round((1 - b.price / totalValue) * 100) : 0;
            return (
              <div key={b.id} className="card-dark rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg text-silver-200 truncate">{b.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${b.is_published ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {b.is_published ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <p className="text-silver-500 text-xs mt-1">{(b.book_ids || []).length} livre{(b.book_ids || []).length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(b)} className="p-1.5 text-gold-400 hover:bg-gold-500/10 rounded-lg transition-colors" title="Modifier">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(b.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  {totalValue > 0 && <span className="text-silver-500 text-sm line-through">{formatPrice(totalValue)}</span>}
                  <span className="gold-text text-lg font-medium">{formatPrice(b.price)}</span>
                  {disc > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <Tag className="w-3 h-3" /> −{disc}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-dark rounded-2xl p-10 text-center text-silver-500 text-sm flex flex-col items-center gap-2">
          <Package className="w-8 h-8 text-silver-600" />
          Aucun pack pour le moment.
        </div>
      )}
    </div>
  );
}
