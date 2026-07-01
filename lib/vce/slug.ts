/**
 * Génère un slug URL-safe à partir d'une chaîne.
 * - minuscules
 * - accents retirés (décomposition NFD + suppression des diacritiques U+0300–U+036F)
 * - tout caractère non alphanumérique → tiret
 * - tirets multiples réduits, tirets de bord supprimés
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
