/**
 * Highlights are stored as character offsets into the article's readable text
 * (diagrams and math are skipped, so their async rendering never shifts offsets).
 * They are painted with the CSS Custom Highlight API, which leaves the DOM alone.
 */
import { store, type Highlight, type HighlightColor } from './storage';

export const HIGHLIGHT_COLORS: HighlightColor[] = ['yellow', 'green', 'blue', 'pink'];

const SKIP_SELECTOR = '[data-hl-skip], .katex, script, style, svg';

function textNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const el = n.parentElement;
      if (el && el.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** Offset of (node, offset) inside root's readable text, or -1. */
function pointToOffset(nodes: Text[], node: Node, offset: number): number {
  let total = 0;
  for (const t of nodes) {
    if (t === node) return total + offset;
    total += t.data.length;
  }
  // The point is in an element (or a skipped node): find the first text node after it.
  if (node.nodeType === Node.ELEMENT_NODE) {
    const target = node.childNodes[offset] ?? null;
    total = 0;
    for (const t of nodes) {
      if (target && (target === t || target.contains(t) || target.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        return total;
      }
      total += t.data.length;
    }
    return total;
  }
  return -1;
}

export function rangeToOffsets(root: Element, range: Range): { start: number; end: number; text: string } | null {
  if (!root.contains(range.commonAncestorContainer)) return null;
  const nodes = textNodes(root);
  const start = pointToOffset(nodes, range.startContainer, range.startOffset);
  const end = pointToOffset(nodes, range.endContainer, range.endOffset);
  if (start < 0 || end <= start) return null;
  const full = nodes.map((n) => n.data).join('');
  const text = full.slice(start, end);
  if (!text.trim()) return null;
  // Trim whitespace at the edges so highlights look tidy.
  const lead = text.length - text.trimStart().length;
  const trail = text.length - text.trimEnd().length;
  return { start: start + lead, end: end - trail, text: text.trim() };
}

export function offsetsToRange(root: Element, start: number, end: number): Range | null {
  const nodes = textNodes(root);
  let total = 0;
  let sNode: Text | null = null;
  let sOff = 0;
  for (const t of nodes) {
    const len = t.data.length;
    if (!sNode && start < total + len) {
      sNode = t;
      sOff = start - total;
    }
    if (sNode && end <= total + len) {
      const r = document.createRange();
      r.setStart(sNode, sOff);
      r.setEnd(t, end - total);
      return r;
    }
    total += len;
  }
  return null;
}

/** Find the highlight under a text offset. */
export function highlightAt(list: Highlight[], offset: number): Highlight | undefined {
  return list.find((h) => offset >= h.start && offset <= h.end);
}

export function caretOffset(root: Element, x: number, y: number): number {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  let node: Node | null = null;
  let off = 0;
  if (doc.caretPositionFromPoint) {
    const p = doc.caretPositionFromPoint(x, y);
    if (p) {
      node = p.offsetNode;
      off = p.offset;
    }
  } else if (doc.caretRangeFromPoint) {
    const r = doc.caretRangeFromPoint(x, y);
    if (r) {
      node = r.startContainer;
      off = r.startOffset;
    }
  }
  if (!node || !root.contains(node)) return -1;
  return pointToOffset(textNodes(root), node, off);
}

export function supportsCssHighlights(): boolean {
  return typeof CSS !== 'undefined' && 'highlights' in CSS && typeof (window as unknown as { Highlight?: unknown }).Highlight === 'function';
}

type HighlightRegistry = Map<string, unknown>;
type HighlightCtor = new (...ranges: Range[]) => unknown;

export function paintHighlights(root: Element, list: Highlight[]): void {
  if (!supportsCssHighlights()) return;
  const registry = (CSS as unknown as { highlights: HighlightRegistry }).highlights;
  const Ctor = (window as unknown as { Highlight: HighlightCtor }).Highlight;
  for (const color of HIGHLIGHT_COLORS) {
    const ranges = list
      .filter((h) => h.color === color)
      .map((h) => offsetsToRange(root, h.start, h.end))
      .filter((r): r is Range => !!r);
    if (ranges.length) registry.set(`hl-${color}`, new Ctor(...ranges));
    else registry.delete(`hl-${color}`);
  }
}

export function clearHighlights(): void {
  if (!supportsCssHighlights()) return;
  const registry = (CSS as unknown as { highlights: HighlightRegistry }).highlights;
  for (const c of HIGHLIGHT_COLORS) registry.delete(`hl-${c}`);
}

export function addHighlight(articleId: string, h: Omit<Highlight, 'id' | 'createdAt'>): Highlight {
  const full: Highlight = { ...h, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() };
  store.update('highlights', (all) => {
    // Overlapping highlights are replaced by the new one.
    const kept = (all[articleId] ?? []).filter((x) => x.end <= h.start || x.start >= h.end);
    return { ...all, [articleId]: [...kept, full].sort((a, b) => a.start - b.start) };
  });
  return full;
}

export function updateHighlight(articleId: string, id: string, patch: Partial<Highlight>): void {
  store.update('highlights', (all) => ({
    ...all,
    [articleId]: (all[articleId] ?? []).map((h) => (h.id === id ? { ...h, ...patch } : h)),
  }));
}

export function removeHighlight(articleId: string, id: string): void {
  store.update('highlights', (all) => {
    const list = (all[articleId] ?? []).filter((h) => h.id !== id);
    const next = { ...all };
    if (list.length) next[articleId] = list;
    else delete next[articleId];
    return next;
  });
}
