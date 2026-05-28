'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFReaderProps {
  pdfUrl: string;
  userEmail: string;
  bookTitle: string;
}

export default function PDFReader({ pdfUrl, userEmail, bookTitle }: PDFReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const doc = await pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
        }).promise;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      } catch (err) {
        console.error('PDF load error:', err);
        setError('Impossible de charger le document. Veuillez réessayer.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any ongoing render
    if (renderTaskRef.current) {
      await renderTaskRef.current.cancel().catch(() => {});
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;

      // Draw watermark
      drawWatermark(ctx, canvas.width, canvas.height, userEmail);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Render error:', err);
      }
    }
  }, [pdfDoc, scale, userEmail]);

  useEffect(() => {
    renderPage(currentPage);
  }, [renderPage, currentPage]);

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number, email: string) => {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#D4AF37';
    ctx.font = `${Math.max(14, w * 0.022)}px serif`;
    ctx.textAlign = 'center';

    const angle = -30 * (Math.PI / 180);
    const step = 220;
    for (let x = -step; x < w + step; x += step) {
      for (let y = 0; y < h + step; y += step) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(email, 0, 0);
        ctx.fillText('CDS Librairie Ésotérique', 0, 24);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  const changePage = (delta: number) => {
    const next = Math.max(1, Math.min(totalPages, currentPage + delta));
    setCurrentPage(next);
  };

  const changeScale = (delta: number) => {
    setScale(prev => Math.max(0.6, Math.min(2.5, prev + delta)));
  };

  // Disable right-click and keyboard shortcuts
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('keydown', preventKeys);
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('keydown', preventKeys);
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <BookOpen className="w-12 h-12 text-gold-700/50" />
        <p className="text-silver-400">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-ghost-gold px-4 py-2 rounded-lg text-sm">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-void select-none" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-obsidian border-b border-ash/50 sticky top-0 z-10">
        <div className="flex items-center gap-1">
          <button onClick={() => changeScale(-0.2)} className="p-1.5 text-silver-400 hover:text-gold-400 transition-colors rounded" title="Réduire">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-silver-500 text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => changeScale(0.2)} className="p-1.5 text-silver-400 hover:text-gold-400 transition-colors rounded" title="Agrandir">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <h2 className="font-serif text-sm text-silver-400 truncate max-w-xs hidden sm:block">{bookTitle}</h2>

        <div className="flex items-center gap-2">
          <button onClick={() => changePage(-1)} disabled={currentPage <= 1} className="p-1.5 text-silver-400 hover:text-gold-400 disabled:opacity-30 transition-colors rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-silver-400 text-xs">
            <span className="text-gold-400">{currentPage}</span>
            <span className="text-mist"> / {totalPages}</span>
          </span>
          <button onClick={() => changePage(1)} disabled={currentPage >= totalPages} className="p-1.5 text-silver-400 hover:text-gold-400 disabled:opacity-30 transition-colors rounded">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4 md:p-8 bg-charcoal/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            <p className="text-silver-500 text-sm">Chargement du livre…</p>
          </div>
        ) : (
          <div className="relative shadow-card-hover">
            <canvas
              ref={canvasRef}
              className="block max-w-full"
              style={{ pointerEvents: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Bottom nav for mobile */}
      <div className="flex items-center justify-center gap-6 py-3 bg-obsidian border-t border-ash/50 sm:hidden">
        <button onClick={() => changePage(-1)} disabled={currentPage <= 1} className="p-2 text-silver-400 hover:text-gold-400 disabled:opacity-30 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-silver-400 text-sm">
          <span className="text-gold-400">{currentPage}</span> / {totalPages}
        </span>
        <button onClick={() => changePage(1)} disabled={currentPage >= totalPages} className="p-2 text-silver-400 hover:text-gold-400 disabled:opacity-30 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
