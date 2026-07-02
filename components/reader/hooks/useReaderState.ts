'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BookmarkItem, SidebarTab, Theme } from '../types';
import { THEME_ORDER } from '../types';

const SCALE_MIN = 0.5;
const SCALE_MAX = 3.0;
const PROGRESS_SAVE_INTERVAL_MS = 30000;

interface UseReaderStateArgs {
  bookId: string;
  totalPages: number;
  initialPage: number;
}

interface UseReaderStateResult {
  currentPage: number;
  scale: number;
  theme: Theme;
  bookmarks: BookmarkItem[];
  isCurrentPageBookmarked: boolean;
  showSidebar: boolean;
  sidebarTab: SidebarTab;
  fullscreen: boolean;
  changePage: (delta: number) => void;
  goToPage: (page: number) => void;
  changeScale: (delta: number) => void;
  cycleTheme: () => void;
  toggleBookmark: () => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  openSidebar: (tab: SidebarTab) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleFullscreen: (el: HTMLElement | null) => void;
}

export function useReaderState({ bookId, totalPages, initialPage }: UseReaderStateArgs): UseReaderStateResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [scale, setScale] = useState(1.2);
  const [theme, setTheme] = useState<Theme>('dark');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('bookmarks');
  const [fullscreen, setFullscreen] = useState(false);

  const isCurrentPageBookmarked = bookmarks.some((b) => b.page_number === currentPage);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const changePage = useCallback(
    (delta: number) => {
      setCurrentPage((prev) => Math.max(1, Math.min(totalPages || prev, prev + delta)));
    },
    [totalPages],
  );

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(totalPages || page, page)));
    },
    [totalPages],
  );

  // ── Zoom & thème ─────────────────────────────────────────────────────────────
  const changeScale = useCallback((delta: number) => {
    setScale((prev) => Math.max(SCALE_MIN, Math.min(SCALE_MAX, parseFloat((prev + delta).toFixed(1)))));
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => THEME_ORDER[(THEME_ORDER.indexOf(prev) + 1) % THEME_ORDER.length]);
  }, []);

  // ── Panneau latéral ──────────────────────────────────────────────────────────
  const openSidebar = useCallback((tab: SidebarTab) => {
    setSidebarTab(tab);
    setShowSidebar(true);
  }, []);
  const toggleSidebar = useCallback(() => setShowSidebar((s) => !s), []);
  const closeSidebar = useCallback(() => setShowSidebar(false), []);

  // ── Plein écran (l'élément appartient à l'orchestrateur, passé au moment du clic) ─
  const toggleFullscreen = useCallback((el: HTMLElement | null) => {
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Marque-pages : chargement initial ────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/reader/bookmarks?bookId=${bookId}`)
      .then((r) => r.json())
      .then((d) => setBookmarks(d.bookmarks || []))
      .catch(() => {});
  }, [bookId]);

  const toggleBookmark = useCallback(async () => {
    const existing = bookmarks.find((b) => b.page_number === currentPage);
    if (existing) {
      await fetch(`/api/reader/bookmarks?id=${existing.id}`, { method: 'DELETE' }).catch(() => {});
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
    } else {
      try {
        const res = await fetch('/api/reader/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId, pageNumber: currentPage }),
        });
        const data = await res.json();
        if (data.bookmark) setBookmarks((prev) => [...prev, data.bookmark]);
      } catch {
        /* silencieux */
      }
    }
  }, [bookmarks, currentPage, bookId]);

  const deleteBookmark = useCallback(async (id: string) => {
    await fetch(`/api/reader/bookmarks?id=${id}`, { method: 'DELETE' }).catch(() => {});
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // ── Sauvegarde de progression (intervalle 30 s + au démontage) ───────────────
  const progressRef = useRef({ currentPage, totalPages });
  progressRef.current = { currentPage, totalPages };

  const saveProgress = useCallback(() => {
    const { currentPage: cp, totalPages: tp } = progressRef.current;
    if (!tp) return;
    fetch('/api/reader/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, currentPage: cp, totalPages: tp, completed: cp >= tp }),
    }).catch(() => {});
  }, [bookId]);

  useEffect(() => {
    const id = setInterval(saveProgress, PROGRESS_SAVE_INTERVAL_MS);
    return () => {
      clearInterval(id);
      saveProgress();
    };
  }, [saveProgress]);

  return {
    currentPage,
    scale,
    theme,
    bookmarks,
    isCurrentPageBookmarked,
    showSidebar,
    sidebarTab,
    fullscreen,
    changePage,
    goToPage,
    changeScale,
    cycleTheme,
    toggleBookmark,
    deleteBookmark,
    openSidebar,
    toggleSidebar,
    closeSidebar,
    toggleFullscreen,
  };
}
