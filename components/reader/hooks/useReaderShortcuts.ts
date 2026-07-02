'use client';

import { useEffect, useRef } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';

interface UseReaderShortcutsArgs {
  changePage: (delta: number) => void;
  goToPage: (page: number) => void;
  changeScale: (delta: number) => void;
  toggleBookmark: () => void;
  onToggleFullscreen: () => void;
  totalPages: number;
}

interface UseReaderShortcutsResult {
  onTouchStart: (e: ReactTouchEvent) => void;
  onTouchEnd: (e: ReactTouchEvent) => void;
}

/**
 * Raccourcis clavier + swipe tactile + protections anti-copie du lecteur.
 * Les listeners clavier/contextmenu sont posés au niveau document/window ;
 * les handlers tactiles sont retournés pour être attachés à la zone de lecture.
 */
export function useReaderShortcuts({
  changePage,
  goToPage,
  changeScale,
  toggleBookmark,
  onToggleFullscreen,
  totalPages,
}: UseReaderShortcutsArgs): UseReaderShortcutsResult {
  const touchStartX = useRef(0);

  // ── Clavier ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Anti-sauvegarde / impression / vue-source
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      // Ne pas capturer quand l'utilisateur tape dans un champ (ex. saut de page)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        changePage(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        changePage(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToPage(totalPages);
      } else if (e.key === 'f') {
        onToggleFullscreen();
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
  }, [changePage, goToPage, changeScale, toggleBookmark, onToggleFullscreen, totalPages]);

  // ── Désactivation du clic droit ──────────────────────────────────────────────
  useEffect(() => {
    const prevent = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  // ── Swipe tactile ────────────────────────────────────────────────────────────
  const onTouchStart = (e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: ReactTouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) changePage(dx > 0 ? 1 : -1);
  };

  return { onTouchStart, onTouchEnd };
}
