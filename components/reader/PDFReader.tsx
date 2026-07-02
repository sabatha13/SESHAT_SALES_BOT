'use client';

import { useRef, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PDFReaderProps } from './types';
import { READER_COLORS } from './types';
import { usePDFLoader } from './hooks/usePDFLoader';
import { useReaderState } from './hooks/useReaderState';
import { useReaderShortcuts } from './hooks/useReaderShortcuts';
import ReaderToolbar from './ReaderToolbar';
import ReaderCanvas from './ReaderCanvas';
import ReaderSidebar from './ReaderSidebar';
import ReaderMobileNav from './ReaderMobileNav';

export default function PDFReader({
  pdfUrl,
  userEmail,
  bookId,
  bookTitle,
  canDownload = false,
  isSubscriptionAccess = false,
  initialPage = 1,
  estimatedMinutes,
}: PDFReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const { totalPages, outline, loading, error, getPage, prefetch } = usePDFLoader(pdfUrl);
  const state = useReaderState({ bookId, totalPages, initialPage });

  const onToggleFullscreen = () => state.toggleFullscreen(containerRef.current);

  const touch = useReaderShortcuts({
    changePage: state.changePage,
    goToPage: state.goToPage,
    changeScale: state.changeScale,
    toggleBookmark: state.toggleBookmark,
    onToggleFullscreen,
    totalPages,
  });

  const progress = totalPages > 0 ? Math.round((state.currentPage / totalPages) * 100) : 0;
  const remainingMinutes =
    estimatedMinutes && totalPages > 0 && state.currentPage > 0
      ? Math.round((estimatedMinutes * (totalPages - state.currentPage)) / totalPages)
      : null;

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
        <BookOpen className="w-12 h-12" style={{ color: 'rgba(229,167,0,0.5)' }} />
        <p style={{ color: 'rgba(203,185,138,0.85)' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ border: `1px solid ${READER_COLORS.gold}`, color: READER_COLORS.gold }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col h-full select-none relative', state.fullscreen ? 'fixed inset-0 z-[9999]' : '')}
      style={{ background: READER_COLORS.chrome }}
    >
      {/* Barre de progression 2px collée en haut */}
      <div className="w-full" style={{ height: 2, background: 'rgba(229,167,0,0.15)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: READER_COLORS.gold, transition: 'width 300ms ease' }} />
      </div>

      <ReaderToolbar
        bookTitle={bookTitle}
        remainingMinutes={remainingMinutes}
        scale={state.scale}
        theme={state.theme}
        fullscreen={state.fullscreen}
        isCurrentPageBookmarked={state.isCurrentPageBookmarked}
        bookmarksCount={state.bookmarks.length}
        canDownload={canDownload}
        downloading={downloading}
        currentPage={state.currentPage}
        totalPages={totalPages}
        onZoomIn={() => state.changeScale(0.2)}
        onZoomOut={() => state.changeScale(-0.2)}
        onCycleTheme={state.cycleTheme}
        onToggleFullscreen={onToggleFullscreen}
        onToggleBookmark={state.toggleBookmark}
        onOpenSidebar={state.openSidebar}
        onDownload={handleDownload}
        onChangePage={state.changePage}
        onGoToPage={state.goToPage}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <ReaderCanvas
          getPage={getPage}
          prefetch={prefetch}
          currentPage={state.currentPage}
          scale={state.scale}
          theme={state.theme}
          userEmail={userEmail}
          isSubscriptionAccess={isSubscriptionAccess}
          loading={loading}
          onTouchStart={touch.onTouchStart}
          onTouchEnd={touch.onTouchEnd}
        />

        <ReaderSidebar
          open={state.showSidebar}
          activeTab={state.sidebarTab}
          onTabChange={state.openSidebar}
          onClose={state.closeSidebar}
          bookmarks={state.bookmarks}
          outline={outline}
          onGoToPage={(p) => {
            state.goToPage(p);
            state.closeSidebar();
          }}
          onDeleteBookmark={state.deleteBookmark}
        />
      </div>

      <ReaderMobileNav
        currentPage={state.currentPage}
        totalPages={totalPages}
        onChangePage={state.changePage}
        onGoToPage={state.goToPage}
      />
    </div>
  );
}
