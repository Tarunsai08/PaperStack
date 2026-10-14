/**
 * Article parsing and validation.
 *
 * These rules mirror pipeline/build_index.py exactly. Both sides are tested
 * against the shared fixtures in /tests/fixtures (see cases.json), so if you
 * change a rule here, change it there too.
 */
import { parse as parseYaml } from 'yaml';
import type { Frontmatter } from './types';

export const PAPER_SECTIONS = [
  'The hook',
  'Before you start',
  'The world before this paper',
  'The big idea',
  'How it works',
  'What they found',
  'What it got wrong (or left open)',
  'What happened next',
  'Key takeaways',
] as const;

export const PRIMER_SECTIONS = [
  'The hook',
  'The intuition',
  "Let's build it up",
  'A tiny example',
  "Where you'll see this again",
  'Key takeaways',
] as const;

export const DIRECTIVES = ['insight', 'analogy', 'history', 'warning', 'try-this'] as const;
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export const KINDS = ['paper', 'primer'] as const;

export const WORD_LIMITS = {
  paper: [1400, 2200],
  primer: [1000, 1600],
} as const;

export const WORDS_PER_MINUTE = 220;

export interface Issue {
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
}

export interface ValidationContext {
  trackIds: Iterable<string>;
  /** When given, prerequisites and article: links are checked against it. */
  articleIds?: Iterable<string>;
}

export interface ParsedArticle {
  data: Record<string, unknown>;
  body: string;
}

const FM_RE = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

export class ParseError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Split a markdown file into YAML frontmatter data and body. Throws ParseError. */
export function parseArticle(raw: string): ParsedArticle {
  const text = raw.replace(/^\s*```(?:markdown|md)?\s*\n(?=---)/, '').replace(/\n```\s*$/, '\n');
  const m = FM_RE.exec(text.trimStart());
  if (!m) {
    throw new ParseError(
      'frontmatter_missing',
      'The file must start with a YAML frontmatter block between two lines of three dashes (---).',
    );
  }
  let data: unknown;
  try {
    data = parseYaml(m[1]);
  } catch (e) {
    throw new ParseError('yaml_invalid', `The frontmatter is not valid YAML: ${(e as Error).message.split('\n')[0]}`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ParseError('yaml_invalid', 'The frontmatter must be a YAML mapping of fields.');
  }
  const body = text.trimStart().slice(m[0].length);
  return { data: data as Record<string, unknown>, body };
}

/** Remove fenced code blocks (``` and ~~~) from markdown. */
function stripFences(md: string): string {
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

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStrList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

/** Validate parsed frontmatter + body. Never throws. */
export function validateArticle(
  data: Record<string, unknown>,
  body: string,
  ctx: ValidationContext,
): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const err = (code: string, message: string) => errors.push({ code, message });
  const warn = (code: string, message: string) => warnings.push({ code, message });

  const required: Record<string, (v: unknown) => boolean> = {
    id: isStr,
    kind: isStr,
    slug: isStr,
    title: isStr,
    subtitle: isStr,
    track: isStr,
    track_order: isInt,
    prerequisites: (v) => Array.isArray(v) && v.every(isStr),
    difficulty: isStr,
    read_minutes: isInt,
    topics: (v) => isStrList(v) && v.length > 0,
    glossary: Array.isArray,
    quiz: Array.isArray,
    cover_seed: isStr,
    generated_by: isStr,
    generated_at: isStr,
    importance_score: isNum,
  };
  const paperRequired: Record<string, (v: unknown) => boolean> = {
    paper_title: isStr,
    authors: (v) => isStrList(v) && v.length > 0,
    year: isInt,
    venue: isStr,
    paper_url: isStr,
  };

  const check = (fields: Record<string, (v: unknown) => boolean>) => {
    for (const [field, ok] of Object.entries(fields)) {
      const v = data[field];
      if (v === undefined || v === null || v === '') err('field_missing', `Missing required field "${field}".`);
      else if (!ok(v)) err('field_type', `Field "${field}" has the wrong type or is empty.`);
    }
  };
  check(required);

  const kind = data.kind;
  if (isStr(kind) && !(KINDS as readonly string[]).includes(kind)) {
    err('kind_invalid', `"kind" must be "paper" or "primer", not "${kind}".`);
  }
  if (kind === 'paper') check(paperRequired);

  const id = data.id;
  if (isStr(id)) {
    if (!ID_RE.test(id)) err('id_format', `"id" must be lowercase words joined by dashes, got "${id}".`);
    else if (isStr(kind) && !id.startsWith(`${kind}-`)) err('id_format', `"id" must start with "${kind}-".`);
  }
  if (isStr(data.slug) && !ID_RE.test(data.slug)) err('id_format', '"slug" must be lowercase words joined by dashes.');

  if (isStr(data.difficulty) && !(DIFFICULTIES as readonly string[]).includes(data.difficulty)) {
    err('difficulty_invalid', '"difficulty" must be beginner, intermediate or advanced.');
  }

  const trackIds = new Set(ctx.trackIds);
  if (isStr(data.track) && !trackIds.has(data.track)) {
    err('track_unknown', `Unknown track "${data.track}". Use one of: ${[...trackIds].join(', ')}.`);
  }
  if (isInt(data.track_order) && data.track_order < 1) err('field_type', '"track_order" must be 1 or more.');
  if (isInt(data.read_minutes) && (data.read_minutes < 1 || data.read_minutes > 60)) {
    err('field_type', '"read_minutes" must be between 1 and 60.');
  }

  if (isStr(data.generated_at) && !DATE_RE.test(data.generated_at)) {
    err('date_format', '"generated_at" must look like 2026-10-14 (put it in quotes).');
  }
  if (isNum(data.importance_score) && (data.importance_score < 0 || data.importance_score > 1)) {
    err('importance_range', '"importance_score" must be between 0 and 1.');
  }
  if (kind === 'paper' && isStr(data.paper_url) && !/^https?:\/\/\S+$/.test(data.paper_url)) {
    err('paper_url', '"paper_url" must be a full http(s) link.');
  }
  if (kind === 'paper' && isInt(data.year) && (data.year < 1900 || data.year > 2100)) {
    err('field_type', '"year" looks wrong.');
  }

  // Glossary
  const glossary = Array.isArray(data.glossary) ? data.glossary : [];
  if (Array.isArray(data.glossary) && (glossary.length < 3 || glossary.length > 8)) {
    err('glossary_count', `The glossary needs 3 to 8 terms (found ${glossary.length}).`);
  }
  glossary.forEach((g, i) => {
    const item = g as Record<string, unknown>;
    if (!item || typeof item !== 'object' || !isStr(item.term) || !isStr(item.definition)) {
      err('glossary_item', `Glossary item ${i + 1} needs a "term" and a "definition".`);
    }
  });

  // Quiz
  const quiz = Array.isArray(data.quiz) ? data.quiz : [];
  if (Array.isArray(data.quiz) && quiz.length !== 3) {
    err('quiz_count', `The quiz needs exactly 3 questions (found ${quiz.length}).`);
  }
  quiz.forEach((q, i) => {
    const item = q as Record<string, unknown>;
    if (!item || typeof item !== 'object' || !isStr(item.q) || !isStr(item.explain)) {
      err('quiz_item', `Quiz question ${i + 1} needs "q" and "explain" text.`);
      return;
    }
    if (!Array.isArray(item.options) || item.options.length !== 4 || !item.options.every(isStr)) {
      err('quiz_options', `Quiz question ${i + 1} needs exactly 4 text options.`);
    }
    if (!isInt(item.answer) || item.answer < 0 || item.answer > 3) {
      err('quiz_answer', `Quiz question ${i + 1} needs "answer" as a number from 0 to 3.`);
    }
  });

  // Body
  if (kind === 'paper' || kind === 'primer') {
    const expected = kind === 'paper' ? PAPER_SECTIONS : PRIMER_SECTIONS;
    const found = extractH2(body);
    if (found.length !== expected.length || found.some((h, i) => h !== expected[i])) {
      const missing = expected.filter((h) => !found.includes(h));
      const extra = found.filter((h) => !(expected as readonly string[]).includes(h));
      const parts = [`Sections must be these "## " headings in order: ${expected.join(' | ')}.`];
      if (missing.length) parts.push(`Missing: ${missing.join(', ')}.`);
      if (extra.length) parts.push(`Unexpected: ${extra.join(', ')}.`);
      if (!missing.length && !extra.length) parts.push('They are out of order.');
      err('sections', parts.join(' '));
    }
    if (kind === 'paper' && !hasMermaid(body)) {
      err('mermaid_missing', 'Paper articles need at least one ```mermaid diagram.');
    }
    const words = wordCount(body);
    const [lo, hi] = WORD_LIMITS[kind];
    if (words < lo) warn('length_short', `Body is ${words} words; aim for ${lo}-${hi}.`);
    if (words > hi) warn('length_long', `Body is ${words} words; aim for ${lo}-${hi}.`);
  }

  for (const name of directiveNames(body)) {
    if (!(DIRECTIVES as readonly string[]).includes(name)) {
      err('directive_unknown', `Unknown block ":::${name}". Use one of: ${DIRECTIVES.join(', ')}.`);
    }
  }

  const terms = new Set(
    glossary
      .map((g) => (g as GlossaryLike)?.term)
      .filter(isStr)
      .map(normalizeTerm),
  );
  const unknownRefs = [...new Set(glossaryRefs(body).filter((r) => !terms.has(normalizeTerm(r))))];
  if (unknownRefs.length) {
    err(
      'glossary_ref_unknown',
      `These [[terms]] are not in the glossary: ${unknownRefs.join(', ')}. Add them to the glossary or remove the brackets.`,
    );
  }

  if (isStr(data.title) && data.title.split(/\s+/).length > 12) {
    warn('title_long', 'Titles read best under 10 words.');
  }

  // Cross references
  const prereqs = Array.isArray(data.prerequisites) ? data.prerequisites.filter(isStr) : [];
  if (isStr(id) && prereqs.includes(id)) err('self_prerequisite', 'An article cannot be its own prerequisite.');
  if (ctx.articleIds) {
    const ids = new Set(ctx.articleIds);
    const unknownPre = prereqs.filter((p) => !ids.has(p));
    if (unknownPre.length) err('prerequisite_unknown', `Unknown prerequisite ids: ${unknownPre.join(', ')}.`);
    const unknownLinks = [...new Set(articleLinks(body).filter((l) => !ids.has(l)))];
    if (unknownLinks.length) err('article_link_unknown', `Links to unknown articles: ${unknownLinks.join(', ')}.`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

type GlossaryLike = { term?: unknown } | null;

/** Parse + validate in one go. Returns typed frontmatter only when valid. */
export function parseAndValidate(
  raw: string,
  ctx: ValidationContext,
): ValidationResult & { frontmatter?: Frontmatter; body?: string } {
  let parsed: ParsedArticle;
  try {
    parsed = parseArticle(raw);
  } catch (e) {
    const pe = e as ParseError;
    return { ok: false, errors: [{ code: pe.code ?? 'yaml_invalid', message: pe.message }], warnings: [] };
  }
  const res = validateArticle(parsed.data, parsed.body, ctx);
  if (!res.ok) return { ...res, body: parsed.body };
  return { ...res, frontmatter: parsed.data as unknown as Frontmatter, body: parsed.body };
}

/** Serialize an article back to a markdown file. */
export function stringifyArticle(fm: Frontmatter, body: string, yamlStringify: (v: unknown) => string): string {
  return `---\n${yamlStringify(fm).trimEnd()}\n---\n\n${body.trimStart()}`;
}
