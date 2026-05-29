'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

export default function DownloadButton({ bookId }: { bookId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/books/${bookId}/download`, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        setError(data.error || 'Erreur telechargement');
      }
    } catch {
      setError('Erreur reseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2 border-t border-ash/50">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? 'Preparation...' : 'Telecharger le PDF'}
      </button>
      {error && <p className="text-red-400 text-xs text-center mt-1">{error}</p>}
    </div>
  );
}