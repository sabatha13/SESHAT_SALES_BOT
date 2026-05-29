'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, BookOpen,
  Bookmark, BookmarkCheck, Maximize2, Minimize2, Download, Sun, Moon,
  Coffee, Keyboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFReaderProps {
  pdfUrl: string;
  userEmail: string;
  userId: string;
  bookId: string;
  bookTitle: string;
  canDownload?: boolean;
  isSubscriptionAccess?: boolean;
  initialPage?: number;
  estimatedMinutes?: number | null;
}

type Theme = 'dark' | 'sepia' | 'light';

const THEME_STYLES: Record<Theme, { bg: string; canvas: string; label: string }> = {
  dark: { bg: 'bg-charcoal/30', canvas: '', label: 'Sombre' },
  sepia: { bg: 'bg-[#f0e6d3]/10', canvas: 'sepia(60%) brightness(0.9)', label: 'Sépia' },
  light: { bg: 'bg-white/5', canvas: 'brightness(1.05) contrast(0.95)', label: 'Clair' },
};

export default function PDFReader({
  pdfUrl, userEmail, userId, bookId, bookTitle,
  canDownload = false, isSubscriptionAccess = false,
  initialPage = 1, estimatedMinutes,
}: PDFReaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [isCurrentPageBookmarked, setIsCurrentPageBookmarked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const remainingMinutes = estimatedMinutes && totalPages > 0 && currentPage > 0
    ? Math.round((estimatedMinutes * (totalPages - currentPage)) / totalPages)
    : null;

  // Load PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const doc = await pdfjsLib.getDocument({ url: pdfUrl, withCredentials: true }).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      } catch {
        setError('Impossible de charger le document. Veuillez réessayer.');
        setLoading(false);
      }
    };
    loadPDF();
  }, [pdfUrl]);

  // Load bookmarks
  useEffect(() => {
    fetch(`/api/reader/bookmarks?bookId=${bookId}`)
      .then(r => r.json())
      .then(d => setBookmarks((d.bookmarks || []).map((b: any) => b.page_number)))
      .catch(() => {});
  }, [bookId]);

  useEffect(() => {
    setIsCurrentPageBookmarked(bookmarks.includes(currentPage));
  }, [bookmarks, currentPage]);

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = '#D4AF37';
    ctx.font = `${Math.max(12, w * 0.018)}px serif`;
    ctx.textAlign = 'center';
    const angle = -30 * (Math.PI / 180);
    const step = 200;
    const line2 = isSubscriptionAccess ? 'Lecture en abonnement' : 'Usage personnel uniquement';
    for (let x = -step; x < w + step; x += step) {
      for (let y = 0; y < h + step; y += step) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(userEmail, 0, 0);
        ctx.fillText(line2, 0, 20);
        ctx.fillText(new Date().toLocaleDateString('fr-FR'), 0, 40);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
      renderTaskRef.current = null;
    }
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
      drawWatermark(ctx, canvas.width, canvas.height);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') console.error('Render error:', err);
    }
  }, [pdfDoc, scale, userEmail, isSubscriptionAccess]);

  useEffect(() => {
    renderPage(currentPage);
  }, [renderPage, currentPage]);

  // Auto-save progress every 30s
  const saveProgress = useCallback(() => {
    if (!totalPages) return;
    fetch('/api/reader/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        currentPage,
        totalPages,
        completed: currentPage >= totalPages,
      }),
    }).catch(() => {});
  }, [bookId, currentPage, totalPages]);

  useEffect(() => {
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    saveTimerRef.current = setInterval(saveProgress, 30000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [saveProgress]);

  // Save on unmount
  useEffect(() => () => { saveProgress(); }, []);

  const changePage = useCallback((delta: number) => {
    setCurrentPage(prev => Math.max(1, Math.min(totalPages, prev + delta)));
  }, [totalPages]);

  const changeScale = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(3.0, parseFloat((prev + delta).toFixed(1)))));
  };

  const toggleBookmark = async () => {
    if (isCurrentPageBookmarked) {
      // find and remove
      const res = await fetch(`/api/reader/bookmarks?bookId=${bookId}`)
        .then(r => r.json());
      const bm = (res.bookmarks || []).find((b: any) => b.page_number === currentPage);
      if (bm) {
        await fetch(`/api/reader/bookmarks?id=${bm.id}`, { method: 'DELETE' });
        setBookmarks(prev => prev.filter(p => p !== currentPage));
      }
    } else {
      await fetch('/api/reader/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, pageNumber: currentPage }),
      });
      setBookmarks(prev => [...prev, currentPage]);
    }
  };

  const handleDownload = async () => {
    if (!canDownload) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/download`, { method: 'POST' });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+P, Ctrl+U
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        changePage(e.key === 'ArrowLeft' ? -1 : 1);
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'b') {
        toggleBookmark();
      } else if (e.key === '+' || e.key === '=') {
        changeScale(0.2);
      } else if (e.key === '-') {
        changeScale(-0.2);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [changePage, currentPage, isCurrentPageBookmarked]);

  // Disable right-click
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) changePage(dx > 0 ? 1 : -1);
  };

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

  const themeOrder: Theme[] = ['dark', 'sepia', 'light'];
  const ThemeIcons: Record<Theme, any> = { dark: Moon, sepia: Coffee, light: Sun };

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col h-full select-none', fullscreen ? 'fixed inset-0 z-[9999] bg-void' : '')}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-obsidian border-b border-ash/50 sticky top-0 z-10 gap-2 flex-wrap">
        {/* Left: zoom + bookmark */}
        <div className="flex items-center gap-1">
          <button onClick={() => changeScale(-0.2)} className="p-1.5 text-silver-400 hover:text-gold-400 rounded" title="Réduire (-)">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-silver-500 text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => changeScale(0.2)} className="p-1.5 text-silver-400 hover:text-gold-400 rounded" title="Agrandir (+)">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-ash/50 mx-1" />
          <button onClick={toggleBookmark} className={cn('p-1.5 rounded transition-colors', isCurrentPageBookmarked ? 'text-gold-400' : 'text-silver-400 hover:text-gold-400')} title="Marque-page (B)">
            {isCurrentPageBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Center: title + time */}
        <div className="flex flex-col items-center flex-1 min-w-0 hidden sm:flex">
          <span className="font-serif text-xs text-silver-400 truncate max-w-[200px]">{bookTitle}</span>
          {remainingMinutes !== null && (
            <span className="text-mist text-[10px]">~{remainingMinutes} min restantes</span>
          )}
        </div>

        {/* Right: nav + theme + fullscreen + download */}
        <div className="flex items-center gap-1">
          <button onClick={() => changePage(-1)} disabled={currentPage <= 1} className="p-1.5 text-silver-400 hover:text-gold-400 disabled:opacity-30 rounded" title="Page précédente (←)">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-silver-400">
            <span className="text-gold-400">{currentPage}</span>
            <span className="text-mist">/{totalPages}</span>
          </span>
          <button onClick={() => changePage(1)} disabled={currentPage >= totalPages} className="p-1.5 text-silver-400 hover:text-gold-400 disabled:opacity-30 rounded" title="Page suivante (→)">
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-ash/50 mx-1" />
          {/* Theme cycle */}
          {(() => {
            const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length];
            const Icon = ThemeIcons[theme];
            return (
              <button onClick={() => setTheme(nextTheme)} className="p-1.5 text-silver-400 hover:text-gold-400 rounded" title={`Thème: ${THEME_STYLES[theme].label}`}>
                <Icon className="w-4 h-4" />
              </button>
            );
          })()}
          <button onClick={toggleFullscreen} className="p-1.5 text-silver-400 hover:text-gold-400 rounded" title="Plein écran (F)">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {canDownload && (
            <button onClick={handleDownload} disabled={downloading} className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded" title="Télécharger">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          )}
          <button onClick={() => setShowShortcuts(s => !s)} className="p-1.5 text-silver-500 hover:text-silver-300 rounded" title="Raccourcis clavier">
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts panel */}
      {showShortcuts && (
        <div className="absolute top-14 right-4 z-50 card-dark rounded-xl p-4 text-xs text-silver-400 space-y-1 shadow-xl border border-ash/50 w-52">
          <p className="text-gold-400 font-medium mb-2">Raccourcis clavier</p>
          {[['← →', 'Page précédente/suivante'], ['+ / -', 'Zoom'], ['F', 'Plein écran'], ['B', 'Marque-page']].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <kbd className="bg-charcoal px-1.5 py-0.5 rounded text-gold-400">{k}</kbd>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div
        className={cn('flex-1 overflow-auto flex items-start justify-center p-4 md:p-8', THEME_STYLES[theme].bg)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
            <p className="text-silver-500 text-sm">Chargement du livre…</p>
          </div>
        ) : (
          <div className="relative shadow-2xl">
            <canvas
              ref={canvasRef}
              className="block max-w-full"
              style={{
                pointerEvents: 'none',
                filter: THEME_STYLES[theme].canvas || undefined,
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="flex items-center justify-center gap-6 py-3 bg-obsidian border-t border-ash/50 sm:hidden">
        <button onClick={() => changePage(-1)} disabled={currentPage <= 1} className="p-2 text-silver-400 hover:text-gold-400 disabled:opacity-30">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-silver-400 text-sm">
          <span className="text-gold-400">{currentPage}</span> / {totalPages}
        </span>
        <button onClick={() => changePage(1)} disabled={currentPage >= totalPages} className="p-2 text-silver-400 hover:text-gold-400 disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

