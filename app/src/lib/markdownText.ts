/**
 * Pure text helpers for article bodies (no YAML parser, so the start-up bundle stays small).
 * Mirrors the helpers in pipeline/build_index.py.
 */

export const WORDS_PER_MINUTE = 220;

/** Remove fenced code blocks (``` and ~~~) from markdown. */
export function stripFences(md: string): string {
  return md.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, '');
}

/** H2 headings outside code fences, in order. */
export function extractH2(body: string): string[] {
  return stripFences(body)
    .split(/\r?\n/)
    .filter((l) => /^##\s+/.test(l) && !/^###/.test(l))
    .map((l) => l.replace(/^##\s+/, '').trim());
}

export function hasMermaid(body: string): boolean {
  return /^```mermaid[ \t]*$/m.test(body);
}

/** Plain text for word counts, excerpts and search. Mirrors build_index.plain_text. */
export function plainText(body: string): string {
  let t = stripFences(body);
  t = t.replace(/\$\$[\s\S]*?\$\$/g, ' ');
  t = t.replace(/^:::.*$/gm, ' ');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, a: string, b?: string) => b ?? a);
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  t = t.replace(/\$([^$\n]+)\$/g, '$1');
  t = t.replace(/[*_`>|]/g, '');
  t = t.replace(/^\s*[-+]\s+/gm, '');
  t = t.replace(/\s+/g, ' ');
  return t.trim();
}

const WORD_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

export function wordCount(body: string): number {
  return (plainText(body).match(WORD_RE) ?? []).length;
}

export function readMinutes(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function excerpt(body: string, length = 300): string {
  // Skip the first H2 heading text ("The hook") so excerpts start with prose.
  const t = plainText(body).replace(/^The hook\s+/, '');
  if (t.length <= length) return t;
  const cut = t.slice(0, length);
  const sp = cut.lastIndexOf(' ');
  return `${cut.slice(0, sp > 200 ? sp : length).trimEnd()}…`;
}

/** Glossary term references written as [[Term]] or [[Term|shown text]]. */
export function glossaryRefs(body: string): string[] {
  const out: string[] = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  for (const m of stripFences(body).matchAll(re)) out.push(m[1].trim());
  return out;
}

export function articleLinks(body: string): string[] {
  const out: string[] = [];
  for (const m of stripFences(body).matchAll(/\]\(article:([a-z0-9-]+)\)/g)) out.push(m[1]);
  return out;
}

export function directiveNames(body: string): string[] {
  const out: string[] = [];
  for (const m of stripFences(body).matchAll(/^:::([A-Za-z][\w-]*)/gm)) out.push(m[1]);
  return out;
}

/** Case-insensitive, tolerant of simple plurals ("Tokens" matches "Token"). */
export function normalizeTerm(t: string): string {
  const s = t.trim().toLowerCase().replace(/\s+/g, ' ');
  if (s.endsWith('ies') && s.length > 4) return `${s.slice(0, -3)}y`;
  if (s.endsWith('es') && /(s|x|ch|sh)es$/.test(s)) return s.slice(0, -2);
  if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) return s.slice(0, -1);
  return s;
}
