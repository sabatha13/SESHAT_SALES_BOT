// ─────────────────────────────────────────────────────────────────────────────
// Types & constantes partagés du lecteur PDF (CDS Librairie)
// Centralisés ici pour éviter les imports circulaires entre composants/hooks.
// ─────────────────────────────────────────────────────────────────────────────

/** Props du lecteur, transmises par app/lecture/[bookId]/page.tsx */
export interface PDFReaderProps {
  pdfUrl: string;
  userEmail: string;
  userId: string | null;
  bookId: string;
  bookTitle: string;
  canDownload?: boolean;
  isSubscriptionAccess?: boolean;
  initialPage?: number;
  estimatedMinutes?: number | null;
}

/** Thèmes de lecture (teinte de la zone + filtre CSS appliqué au canvas) */
export type Theme = 'dark' | 'sepia' | 'light';

/** Onglet actif du panneau latéral glissant */
export type SidebarTab = 'bookmarks' | 'toc';

/** Marque-page persisté (table reader bookmarks) */
export interface BookmarkItem {
  id: string;
  page_number: number;
  label: string | null;
}

/**
 * Entrée de table des matières, dérivée de pdfDoc.getOutline().
 * `pageNumber` est DÉJÀ résolu (via getDestination + getPageIndex) au chargement —
 * null si la destination n'a pas pu être résolue.
 */
export interface OutlineItem {
  title: string;
  pageNumber: number | null;
  items: OutlineItem[];
}

/** Couleurs du chrome du lecteur (hex bruts — pas de tokens Tailwind, cf. arbitrage) */
export const READER_COLORS = {
  chrome: '#0A0800', // fond barres (toolbar, mobile nav, sidebar header)
  gold: '#E5A700', // icônes, texte, barre de progression, accents
} as const;

/** Configuration par thème : fond de la zone de lecture + filtre canvas + libellé */
export const THEME_STYLES: Record<Theme, { readingBg: string; canvasFilter: string; label: string }> = {
  dark: { readingBg: '#0A0800', canvasFilter: '', label: 'Sombre' },
  sepia: { readingBg: '#F0E6D3', canvasFilter: 'sepia(60%) brightness(0.9)', label: 'Sépia' },
  light: { readingBg: '#FFFFFF', canvasFilter: 'brightness(1.05) contrast(0.95)', label: 'Clair' },
};

/** Ordre de cyclage des thèmes (bouton unique dans la toolbar) */
export const THEME_ORDER: Theme[] = ['dark', 'sepia', 'light'];
