'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/lib/types';
import { Upload, Loader2 } from 'lucide-react';

interface BookFormProps {
  book?: Book;
}

const categories = ['Magie', 'Kabbale', 'Alchimie', 'Astrologie', 'Tarot', 'Numérologie', 'Hermétisme', 'Chamanisme', 'Autre'];

export default function BookForm({ book }: BookFormProps) {
  const router = useRouter();
  const isEdit = !!book;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: book?.title || '',
    author: book?.author || '',
    short_description: book?.short_description || '',
    description: book?.description || '',
    price: book ? String(book.price / 100) : '',
    category: book?.category || categories[0],
    tags: book?.tags?.join(', ') || '',
    page_count: book ? String(book.page_count) : '',
    language: book?.language || 'fr',
    is_featured: book?.is_featured ?? false,
    is_published: book?.is_published ?? true,
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (pdfFile) fd.append('pdf', pdfFile);
      if (coverFile) fd.append('cover', coverFile);

      const url = isEdit ? `/api/admin/books/${book.id}` : '/api/admin/books';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erreur');

      router.push('/admin/livres');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-charcoal border border-ash text-silver-300 placeholder-silver-500 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-gold-600/50 focus:ring-1 focus:ring-gold-600/20 transition-all';
  const labelClass = 'block text-silver-400 text-xs uppercase tracking-wide mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="card-dark p-6 rounded-2xl space-y-5">
      {error && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-400 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Titre *</label>
          <input required className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Le Grand Grimoire" />
        </div>
        <div>
          <label className={labelClass}>Auteur *</label>
          <input required className={inputClass} value={form.author} onChange={e => set('author', e.target.value)} placeholder="Auteur inconnu" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Accroche courte *</label>
        <input required className={inputClass} value={form.short_description} onChange={e => set('short_description', e.target.value)} placeholder="Une phrase captivante sur ce livre…" />
      </div>

      <div>
        <label className={labelClass}>Description complète *</label>
        <textarea required rows={5} className={inputClass} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description détaillée du livre…" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelClass}>Prix (€) *</label>
          <input required type="number" min="0.5" step="0.01" className={inputClass} value={form.price} onChange={e => set('price', e.target.value)} placeholder="9.99" />
        </div>
        <div>
          <label className={labelClass}>Catégorie</label>
          <select className={inputClass} value={form.category} onChange={e => set('category', e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Pages</label>
          <input type="number" className={inputClass} value={form.page_count} onChange={e => set('page_count', e.target.value)} placeholder="200" />
        </div>
        <div>
          <label className={labelClass}>Langue</label>
          <select className={inputClass} value={form.language} onChange={e => set('language', e.target.value)}>
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="la">Latin</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Tags (séparés par des virgules)</label>
        <input className={inputClass} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="magie noire, rituels, invocations" />
      </div>

      {/* File uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            {isEdit ? 'Remplacer le PDF' : 'Fichier PDF *'}
          </label>
          <label className="flex items-center gap-3 bg-charcoal border border-ash border-dashed rounded-xl px-4 py-3 cursor-pointer hover:border-gold-600/40 transition-colors">
            <Upload className="w-4 h-4 text-silver-500 shrink-0" />
            <span className="text-silver-500 text-sm truncate">
              {pdfFile ? pdfFile.name : (isEdit ? 'Nouveau PDF (optionnel)' : 'Choisir un PDF')}
            </span>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => setPdfFile(e.target.files?.[0] || null)}
              required={!isEdit}
            />
          </label>
        </div>

        <div>
          <label className={labelClass}>
            {isEdit ? 'Remplacer la couverture' : 'Image de couverture'}
          </label>
          <label className="flex items-center gap-3 bg-charcoal border border-ash border-dashed rounded-xl px-4 py-3 cursor-pointer hover:border-gold-600/40 transition-colors">
            <Upload className="w-4 h-4 text-silver-500 shrink-0" />
            <span className="text-silver-500 text-sm truncate">
              {coverFile ? coverFile.name : (isEdit ? 'Nouvelle image (optionnel)' : 'Choisir une image')}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setCoverFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        {[
          { key: 'is_published', label: 'Publié' },
          { key: 'is_featured', label: 'Coup de cœur' },
        ].map(toggle => (
          <label key={toggle.key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form[toggle.key as keyof typeof form] as boolean}
              onChange={e => set(toggle.key, e.target.checked)}
              className="w-4 h-4 rounded accent-gold-500"
            />
            <span className="text-silver-400 text-sm">{toggle.label}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-gold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'Enregistrer les modifications' : 'Créer le livre'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost-gold px-6 py-2.5 rounded-xl text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
