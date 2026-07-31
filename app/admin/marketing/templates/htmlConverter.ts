// HTML → Builder blocks converter.
// Runs client-side only (uses DOMParser). Called for legacy template conversion and Import HTML.
// Best-effort: known elements convert cleanly; unrecognised structures fall back to custom_html.

import type { Block, BlockType } from './builderTypes';
import { BLOCK_DEFAULTS } from './builderTypes';

function uid(): string { return Math.random().toString(36).slice(2, 10); }
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

function mkBlock(type: BlockType, overrides: Record<string, unknown> = {}): Block {
  return { id: uid(), type, data: { ...clone(BLOCK_DEFAULTS[type]), ...overrides } };
}

function textOf(el: Element): string {
  return el.textContent?.trim() ?? '';
}

const SKIP_TAGS = new Set(['html', 'head', 'meta', 'title', 'link', 'style', 'script', 'noscript']);

function processElement(el: Element, depth: number): Block[] {
  const tag = el.tagName.toLowerCase();

  if (SKIP_TAGS.has(tag)) return [];
  if (depth > 3) return [mkBlock('custom_html', { html: el.outerHTML })];

  const text = textOf(el);

  switch (tag) {
    case 'h1':
      return [mkBlock('title', { text, tag: 'h1', fontSize: 36 })];
    case 'h2':
      return [mkBlock('title', { text, tag: 'h2', fontSize: 28 })];
    case 'h3':
      return [mkBlock('title', { text, tag: 'h3', fontSize: 22 })];

    case 'p': {
      if (!text && !el.querySelector('img')) return [];
      const imgEl = el.querySelector('img') as HTMLImageElement | null;
      if (imgEl && !text) {
        return [mkBlock('image', { imageUrl: imgEl.getAttribute('src') ?? '', alt: imgEl.getAttribute('alt') ?? '' })];
      }
      const linkEl = el.querySelector('a');
      if (linkEl && linkEl.textContent?.trim() === text && el.children.length === 1) {
        return [mkBlock('cta_button', { label: text, url: linkEl.getAttribute('href') ?? '' })];
      }
      return text ? [mkBlock('paragraph', { text })] : [];
    }

    case 'img': {
      const src = el.getAttribute('src') ?? '';
      const alt = el.getAttribute('alt') ?? '';
      return src ? [mkBlock('image', { imageUrl: src, alt })] : [];
    }

    case 'a': {
      const href = el.getAttribute('href') ?? '';
      return text ? [mkBlock('cta_button', { label: text, url: href })] : [];
    }

    case 'hr':
      return [mkBlock('divider')];

    case 'blockquote':
      return text ? [mkBlock('quote', { text })] : [];

    case 'footer':
      return [mkBlock('footer', { copyright: text.slice(0, 200) })];

    case 'table': {
      // Walk <tr> elements and process each <td>'s children
      const rows = Array.from(el.querySelectorAll(':scope > tbody > tr, :scope > tr'));
      if (rows.length === 0) {
        return text ? [mkBlock('custom_html', { html: el.outerHTML })] : [];
      }
      const result: Block[] = [];
      for (const tr of rows) {
        const cells = Array.from(tr.querySelectorAll(':scope > td'));
        for (const td of cells) {
          const meaningful = Array.from(td.children).filter((c) => {
            const t = c.tagName.toLowerCase();
            return !SKIP_TAGS.has(t) && !['br'].includes(t)
              && (c.textContent?.trim() || c.querySelector('img'));
          });
          if (meaningful.length === 1) {
            result.push(...processElement(meaningful[0], depth + 1));
          } else if (meaningful.length > 1) {
            for (const child of meaningful) {
              result.push(...processElement(child, depth + 1));
            }
          } else {
            const cellText = td.textContent?.trim() ?? '';
            if (cellText) result.push(mkBlock('paragraph', { text: cellText }));
          }
        }
      }
      if (result.length > 0) return result;
      // Table too complex to parse — preserve as-is
      return [mkBlock('custom_html', { html: el.outerHTML })];
    }

    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'center': {
      const children = Array.from(el.children).filter((c) => {
        const t = c.tagName.toLowerCase();
        return !SKIP_TAGS.has(t) && !['br'].includes(t)
          && (c.textContent?.trim() || c.querySelector('img'));
      });
      if (children.length === 0) {
        return text ? [mkBlock('paragraph', { text })] : [];
      }
      const result: Block[] = [];
      for (const child of children) {
        result.push(...processElement(child, depth + 1));
      }
      return result;
    }

    default:
      return text ? [mkBlock('custom_html', { html: el.outerHTML })] : [];
  }
}

export function htmlToBlocks(html: string): Block[] {
  if (typeof window === 'undefined' || !html.trim()) return [];

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  if (!body) return [];

  const blocks: Block[] = [];
  const children = Array.from(body.children).filter((c) => {
    const t = c.tagName.toLowerCase();
    return !SKIP_TAGS.has(t);
  });

  for (const child of children) {
    blocks.push(...processElement(child, 0));
  }

  // Deduplicate consecutive identical custom_html blocks (can happen with nested wrappers)
  const deduped: Block[] = [];
  for (const b of blocks) {
    const prev = deduped[deduped.length - 1];
    if (
      prev && prev.type === 'custom_html' && b.type === 'custom_html' &&
      String(prev.data.html) === String(b.data.html)
    ) continue;
    deduped.push(b);
  }

  return deduped;
}
