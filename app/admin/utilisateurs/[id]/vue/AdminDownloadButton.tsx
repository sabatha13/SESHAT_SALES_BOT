'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';

export default function AdminDownloadButton({ bookId, bookTitle }: { bookId: string; bookTitle: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    const win = window.open('', '_blank');
    try {
      const res = await fetch('/api/admin/download-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId }),
      });
      const data = await res.json();
      if (data.url && win) {
        win.location.href = data.url;
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        win?.close();
        setError(data.error || 'Erreur');
      }
    } catch {
      win?.close();
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        title={`Télécharger "${bookTitle}" (admin)`}
        className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors disabled:opacity-50 w-full"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : success ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        {loading ? 'Génération…' : success ? 'Ouvert' : 'PDF (admin)'}
      </button>
      {error && <p className="text-red-400 text-[10px] text-center mt-0.5">{error}</p>}
    </div>
  );
}
