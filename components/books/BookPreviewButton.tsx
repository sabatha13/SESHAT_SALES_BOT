'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, X, ChevronLeft, ChevronRight, Loader2, Lock } from 'lucide-react';

interface Props {
  bookId: string;
  bookTitle: string;
  className?: string;
}

export default function BookPreviewButton({ bookId, bookTitle, className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'btn-ghost-gold w-full py-2.5 flex items-center justify-center gap-2 text-sm'}
      >
        <Eye className="w-4 h-4" />
        Feuilleter un extrait
      </button>
      {open && <PreviewModal bookId={bookId} bookTitle={bookTitle} onClose={() => setOpen(false)} />}
    </>
  );
}

function PreviewModal({ bookId, bookTitle, onClose }: { bookId: string; bookTitle: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Load the preview PDF (first pages only, generated server-side)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const doc = await pdfjsLib.getDocument({ url: `/api/pdf-preview?bookId=${bookId}` }).promise;
        if (cancelled) return;
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setLoading(false);
      } catch {
        if (!cancelled) { setError('Aperçu indisponible pour le moment.'); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [bookId]);

  const renderPage = useCallback(async (num: number) => {
    const doc = pdfDocRef.current;
    if (!doc || !canvasRef.current) return;
    if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch {} }
    try {
      const page = await doc.getPage(num);
      const canvas = canvasRef.current;
      const containerWidth = canvas.parentElement?.clientWidth || 600;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(2, (containerWidth - 16) / baseViewport.width);
      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') setError('Erreur d\'affichage.');
    }
  }, []);

  useEffect(() => { if (!loading && !error) renderPage(currentPage); }, [loading, error, currentPage, renderPage]);

  // Disable right-click within modal
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === 'ArrowRight') setCurrentPage(p => Math.min(totalPages, p + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('contextmenu', prevent); window.removeEventListener('keydown', onKey); };
  }, [onClose, totalPages]);

  const atEnd = totalPages > 0 && currentPage >= totalPages;

  return (
    <div className="fixed inset-0 z-[9999] bg-void/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-obsidian border border-ash/50 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ash/40">
          <div className="min-w-0">
            <p className="text-gold-400 text-[10px] uppercase tracking-widest">Aperçu gratuit</p>
            <h3 className="font-serif text-silver-200 text-sm truncate">{bookTitle}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-silver-500 hover:text-gold-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-charcoal/20 min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-72 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-gold-500" />
              <p className="text-silver-500 text-sm">Préparation de l'extrait…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-72 gap-3 text-center">
              <Lock className="w-8 h-8 text-silver-600" />
              <p className="text-silver-400 text-sm">{error}</p>
            </div>
          ) : (
            <canvas ref={canvasRef} className="block max-w-full shadow-xl rounded" style={{ pointerEvents: 'none' }} />
          )}
        </div>

        {/* End-of-preview CTA */}
        {atEnd && !loading && !error && (
          <div className="px-5 py-4 border-t border-gold-600/20 bg-gold-500/5 text-center space-y-2">
            <p className="text-silver-300 text-sm font-serif">Vous avez atteint la fin de l'extrait.</p>
            <p className="text-silver-500 text-xs">Procurez-vous l'œuvre complète pour poursuivre la lecture.</p>
          </div>
        )}

        {/* Footer nav */}
        {!loading && !error && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-ash/40">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 text-silver-400 hover:text-gold-400 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-silver-500">
              Page <span className="text-gold-400">{currentPage}</span> / {totalPages}
              <span className="text-mist ml-2">(extrait)</span>
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={atEnd}
              className="p-2 text-silver-400 hover:text-gold-400 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
