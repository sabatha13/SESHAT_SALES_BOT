'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { OutlineItem } from '../types';

interface UsePDFLoaderResult {
  pdfDoc: any;
  totalPages: number;
  outline: OutlineItem[];
  loading: boolean;
  error: string | null;
  /** Récupère une page (depuis le cache si déjà chargée). */
  getPage: (n: number) => Promise<any | null>;
  /** Réchauffe le cache d'une page en arrière-plan (prefetch léger). */
  prefetch: (n: number) => void;
}

/** Nœud brut renvoyé par pdfDoc.getOutline() avant résolution des destinations. */
interface RawOutlineNode {
  title: string;
  dest: string | any[] | null;
  items?: RawOutlineNode[];
}

/**
 * Résout une destination pdf.js (chaîne nommée OU tableau explicite) en numéro
 * de page 1-based. `dest` n'est jamais un numéro de page directement :
 *   string        → getDestination(dest) → tableau explicite
 *   tableau[0]    → ref de page → getPageIndex(ref) → index 0-based → +1
 */
async function resolveDest(doc: any, dest: string | any[] | null): Promise<number | null> {
  if (!dest) return null;
  try {
    const explicit = typeof dest === 'string' ? await doc.getDestination(dest) : dest;
    if (!Array.isArray(explicit) || explicit.length === 0) return null;
    const pageIndex = await doc.getPageIndex(explicit[0]); // 0-based
    return pageIndex + 1;
  } catch {
    return null;
  }
}

/** Extrait et résout récursivement toute la table des matières au chargement. */
async function resolveOutline(doc: any): Promise<OutlineItem[]> {
  let raw: RawOutlineNode[] | null = null;
  try {
    raw = await doc.getOutline();
  } catch {
    raw = null;
  }
  if (!raw || raw.length === 0) return [];

  const resolveNode = async (node: RawOutlineNode): Promise<OutlineItem> => {
    const pageNumber = await resolveDest(doc, node.dest);
    const children = node.items && node.items.length > 0 ? await Promise.all(node.items.map(resolveNode)) : [];
    return { title: node.title, pageNumber, items: children };
  };

  return Promise.all(raw.map(resolveNode));
}

export function usePDFLoader(pdfUrl: string): UsePDFLoaderResult {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageCache = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        pageCache.current.clear();

        const pdfjsLib = await import('pdfjs-dist');
        // Worker hébergé en local (copié via postinstall) — plus de dépendance CDN unpkg
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const doc = await pdfjsLib.getDocument({ url: pdfUrl, withCredentials: true }).promise;
        if (cancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);

        const resolved = await resolveOutline(doc);
        if (cancelled) return;
        setOutline(resolved);

        setLoading(false);
      } catch {
        if (cancelled) return;
        setError('Impossible de charger le document. Veuillez réessayer.');
        setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const getPage = useCallback(
    async (n: number) => {
      if (!pdfDoc) return null;
      const cached = pageCache.current.get(n);
      if (cached) return cached;
      try {
        const page = await pdfDoc.getPage(n);
        pageCache.current.set(n, page);
        return page;
      } catch {
        return null;
      }
    },
    [pdfDoc],
  );

  const prefetch = useCallback(
    (n: number) => {
      if (!pdfDoc || n < 1 || n > totalPages) return;
      if (pageCache.current.has(n)) return;
      pdfDoc
        .getPage(n)
        .then((page: any) => pageCache.current.set(n, page))
        .catch(() => {});
    },
    [pdfDoc, totalPages],
  );

  return { pdfDoc, totalPages, outline, loading, error, getPage, prefetch };
}
