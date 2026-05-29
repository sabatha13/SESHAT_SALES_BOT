'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSent(true);
      else setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="w-12 h-12 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-6 h-6 text-gold-400" />
        </div>
        <h1 className="font-serif text-4xl gold-text mb-3">Contact & Support</h1>
        <p className="text-silver-400">Notre équipe vous répond sous 24-48h.</p>
      </div>

      {sent ? (
        <div className="card-dark rounded-2xl p-10 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="font-serif text-xl text-silver-200 mb-2">Message envoyé !</h2>
          <p className="text-silver-400 text-sm">Nous vous répondrons à l'adresse indiquée dans les plus brefs délais.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card-dark rounded-2xl p-8 space-y-5">
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1.5">
              <Mail className="w-3 h-3 inline mr-1" /> Adresse email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="vous@exemple.com"
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-3 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1.5">Sujet *</label>
            <input
              required
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="Problème d'accès, question sur un livre..."
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-3 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50"
            />
          </div>
          <div>
            <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1.5">Message *</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Décrivez votre demande en détail..."
              className="w-full bg-charcoal border border-ash/50 rounded-xl px-4 py-3 text-sm text-silver-200 placeholder-silver-600 focus:outline-none focus:border-gold-600/50 resize-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold flex items-center gap-2 px-6 py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Envoyer le message
          </button>
        </form>
      )}
    </div>
  );
}
