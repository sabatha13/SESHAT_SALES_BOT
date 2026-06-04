'use client';

import { useState } from 'react';
import { Check, AlertCircle, Loader2, Plus, Trash2, Upload } from 'lucide-react';

interface AuthorProfile {
  id: string;
  name: string;
  title: string;
  photo_url: string;
  intro: string;
  biography: string;
  specializations: string[];
  publications: string[];
  affiliations: string[];
  languages: string[];
}

export default function AuteurClient({ profile }: { profile: AuthorProfile }) {
  const [form, setForm] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const setArrayItem = (key: string, index: number, value: string) => {
    setForm(f => {
      const arr = [...(f[key as keyof typeof f] as string[])];
      arr[index] = value;
      return { ...f, [key]: arr };
    });
  };

  const addItem = (key: string) => setForm(f => ({ ...f, [key]: [...(f[key as keyof typeof f] as string[]), ''] }));
  const removeItem = (key: string, index: number) => setForm(f => {
    const arr = [...(f[key as keyof typeof f] as string[])];
    arr.splice(index, 1);
    return { ...f, [key]: arr };
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await fetch('/api/admin/author-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMsg(res.ok
      ? { type: 'success', text: 'Profil mis à jour avec succès !' }
      : { type: 'error', text: data.error || 'Erreur lors de la sauvegarde.' }
    );
    setLoading(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload-photo', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok && data.url) {
      set('photo_url', data.url);
    } else {
      setMsg({ type: 'error', text: data.error || 'Erreur lors du téléchargement.' });
    }
    setPhotoUploading(false);
    e.target.value = '';
  }

  const inputClass = 'w-full bg-charcoal border border-ash/50 rounded-xl px-3 py-2.5 text-sm text-silver-200 focus:outline-none focus:border-gold-600/50';
  const labelClass = 'block text-silver-400 text-xs uppercase tracking-wide mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Infos de base */}
      <div className="card-dark p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-lg text-gold-300">Informations de base</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nom</label>
            <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Titre / Sous-titre</label>
            <input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Photo de profil</label>
          <div className="flex items-center gap-4">
            {form.photo_url && (
              <img src={form.photo_url} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gold-500/30 shrink-0" />
            )}
            <div className="flex-1 space-y-2">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ash/50 bg-charcoal hover:border-gold-600/50 cursor-pointer transition-all text-sm text-silver-400 hover:text-gold-400 w-fit">
                {photoUploading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />
                }
                {photoUploading ? 'Téléchargement...' : 'Choisir une photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                  className="hidden"
                />
              </label>
              {form.photo_url && (
                <p className="text-silver-600 text-xs truncate max-w-xs">{form.photo_url}</p>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>Introduction (sous le nom)</label>
          <textarea rows={3} className={inputClass} value={form.intro} onChange={e => set('intro', e.target.value)} />
        </div>
      </div>

      {/* Biographie */}
      <div className="card-dark p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-lg text-gold-300">Biographie</h2>
        <p className="text-silver-500 text-xs">Séparez les paragraphes avec une ligne vide.</p>
        <textarea rows={10} className={inputClass} value={form.biography} onChange={e => set('biography', e.target.value)} />
      </div>

      {/* Spécialisations */}
      <div className="card-dark p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-lg text-gold-300">Domaines de Spécialisation</h2>
        {form.specializations.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input className={inputClass} value={s} onChange={e => setArrayItem('specializations', i, e.target.value)} />
            <button type="button" onClick={() => removeItem('specializations', i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addItem('specializations')} className="flex items-center gap-2 text-gold-400 text-sm hover:text-gold-300">
          <Plus className="w-4 h-4" /> Ajouter une spécialisation
        </button>
      </div>

      {/* Publications */}
      <div className="card-dark p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-lg text-gold-300">Publications</h2>
        {form.publications.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input className={inputClass} value={p} onChange={e => setArrayItem('publications', i, e.target.value)} />
            <button type="button" onClick={() => removeItem('publications', i)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button type="button" onClick={() => addItem('publications')} className="flex items-center gap-2 text-gold-400 text-sm hover:text-gold-300">
          <Plus className="w-4 h-4" /> Ajouter une publication
        </button>
      </div>

      {/* Affiliations */}
      <div className="card-dark p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-lg text-gold-300">Initiations & Affiliations</h2>
        <div className="flex flex-wrap gap-2">
          {form.affiliations.map((a, i) => (
            <div key={i} className="flex items-center gap-1 bg-charcoal border border-ash/50 rounded-full px-3 py-1">
              <input className="bg-transparent text-silver-300 text-xs outline-none w-40" value={a} onChange={e => setArrayItem('affiliations', i, e.target.value)} />
              <button type="button" onClick={() => removeItem('affiliations', i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => addItem('affiliations')} className="flex items-center gap-1 text-gold-400 text-xs border border-gold-700/30 px-3 py-1 rounded-full hover:border-gold-500">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
      </div>

      {/* Langues */}
      <div className="card-dark p-6 rounded-2xl space-y-4">
        <h2 className="font-serif text-lg text-gold-300">Langues</h2>
        <div className="flex flex-wrap gap-2">
          {form.languages.map((l, i) => (
            <div key={i} className="flex items-center gap-1 bg-charcoal border border-ash/50 rounded-full px-3 py-1">
              <input className="bg-transparent text-silver-300 text-xs outline-none w-28" value={l} onChange={e => setArrayItem('languages', i, e.target.value)} />
              <button type="button" onClick={() => removeItem('languages', i)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <button type="button" onClick={() => addItem('languages')} className="flex items-center gap-1 text-gold-400 text-xs border border-gold-700/30 px-3 py-1 rounded-full hover:border-gold-500">
            <Plus className="w-3 h-3" /> Ajouter
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-gold px-8 py-3 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Sauvegarder le profil
      </button>
    </form>
  );
}
