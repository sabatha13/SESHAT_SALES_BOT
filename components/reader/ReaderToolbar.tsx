'use client';

import { useState } from 'react';
import {
  ZoomIn, ZoomOut, Bookmark, BookmarkCheck, PanelRight, List,
  Maximize2, Minimize2, Download, Loader2, Keyboard, Sun, Moon, Coffee,
} from 'lucide-react';
import ReaderNavigation from './ReaderNavigation';
import { READER_COLORS, THEME_STYLES } from './types';
import type { SidebarTab, Theme } from './types';

const THEME_ICON: Record<Theme, any> = { dark: Moon, sepia: Coffee, light: Sun };

interface Props {
  bookTitle: string;
  remainingMinutes: number | null;
  scale: number;
  theme: Theme;
  fullscreen: boolean;
  isCurrentPageBookmarked: boolean;
  bookmarksCount: number;
  canDownload: boolean;
  downloading: boolean;
  currentPage: number;
  totalPages: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCycleTheme: () => void;
  onToggleFullscreen: () => void;
  onToggleBookmark: () => void;
  onOpenSidebar: (tab: SidebarTab) => void;
  onDownload: () => void;
  onChangePage: (delta: number) => void;
  onGoToPage: (page: number) => void;
}

export default function ReaderToolbar({
  bookTitle, remainingMinutes, scale, theme, fullscreen,
  isCurrentPageBookmarked, bookmarksCount, canDownload, downloading,
  currentPage, totalPages,
  onZoomIn, onZoomOut, onCycleTheme, onToggleFullscreen, onToggleBookmark,
  onOpenSidebar, onDownload, onChangePage, onGoToPage,
}: Props) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const gold = READER_COLORS.gold;
  const ThemeIcon = THEME_ICON[theme];
  const iconBtn = 'p-1.5 rounded transition-opacity hover:opacity-70';
  const sep = <div className="w-px h-4 mx-1" style={{ background: 'rgba(229,167,0,0.25)' }} />;

  return (
    <div
      className="relative flex items-center justify-between px-3 gap-2 flex-wrap shrink-0"
      style={{ height: 56, background: READER_COLORS.chrome, borderBottom: '1px solid rgba(229,167,0,0.15)' }}
    >
      {/* Gauche : zoom + marque-page + panneaux */}
      <div className="flex items-center gap-1">
        <button onClick={onZoomOut} className={iconBtn} style={{ color: gold }} title="Réduire (-)"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-xs w-10 text-center" style={{ color: gold, opacity: 0.8 }}>{Math.round(scale * 100)}%</span>
        <button onClick={onZoomIn} className={iconBtn} style={{ color: gold }} title="Agrandir (+)"><ZoomIn className="w-4 h-4" /></button>
        {sep}
        <button onClick={onToggleBookmark} className={iconBtn} style={{ color: gold }} title="Marque-page (B)">
          {isCurrentPageBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
        <button onClick={() => onOpenSidebar('bookmarks')} className={`${iconBtn} relative`} style={{ color: gold }} title="Mes marque-pages">
          <PanelRight className="w-4 h-4" />
          {bookmarksCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center" style={{ background: gold, color: READER_COLORS.chrome }}>
              {bookmarksCount}
            </span>
          )}
        </button>
        <button onClick={() => onOpenSidebar('toc')} className={iconBtn} style={{ color: gold }} title="Table des matières"><List className="w-4 h-4" /></button>
      </div>

      {/* Centre : titre + temps restant */}
      <div className="flex-col items-center flex-1 min-w-0 hidden sm:flex">
        <span className="text-xs truncate max-w-[220px]" style={{ color: gold, fontFamily: 'ui-serif, Georgia, serif' }}>{bookTitle}</span>
        {remainingMinutes !== null && <span className="text-[10px]" style={{ color: gold, opacity: 0.6 }}>~{remainingMinutes} min restantes</span>}
      </div>

      {/* Droite : navigation + thème + plein écran + download + aide */}
      <div className="flex items-center gap-1">
        <ReaderNavigation currentPage={currentPage} totalPages={totalPages} onChangePage={onChangePage} onGoToPage={onGoToPage} />
        {sep}
        <button onClick={onCycleTheme} className={iconBtn} style={{ color: gold }} title={`Thème : ${THEME_STYLES[theme].label}`}><ThemeIcon className="w-4 h-4" /></button>
        <button onClick={onToggleFullscreen} className={iconBtn} style={{ color: gold }} title="Plein écran (F)">
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        {canDownload && (
          <button onClick={onDownload} disabled={downloading} className={iconBtn} style={{ color: gold }} title="Télécharger">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
        )}
        <button onClick={() => setShowShortcuts((s) => !s)} className={iconBtn} style={{ color: gold, opacity: 0.7 }} title="Raccourcis clavier"><Keyboard className="w-4 h-4" /></button>
      </div>

      {showShortcuts && (
        <div className="absolute top-14 right-4 z-50 rounded-xl p-4 text-xs space-y-1 shadow-xl w-56" style={{ background: '#12100a', border: '1px solid rgba(229,167,0,0.3)', color: '#cbb98a' }}>
          <p className="font-medium mb-2" style={{ color: gold }}>Raccourcis clavier</p>
          {[['← →', 'Page précédente/suivante'], ['⇤ ⇥', 'Début / Fin'], ['+ / -', 'Zoom'], ['F', 'Plein écran'], ['B', 'Marque-page']].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <kbd className="px-1.5 py-0.5 rounded" style={{ background: '#1a1400', color: gold }}>{k}</kbd>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
