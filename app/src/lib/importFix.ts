/**
 * Automatic repairs for the most common problems in chatbot output, so the
 * user does not have to hand-edit YAML on a phone.
 */
import { stringify as yamlStringify } from 'yaml';
import { glossaryRefs, normalizeTerm, parseArticle, type Issue } from './frontmatter';

export const FIXABLE = new Set([
  'prerequisite_unknown',
  'article_link_unknown',
  'glossary_ref_unknown',
  'track_unknown',
  'date_format',
  'id_format',
]);

export function canAutoFix(errors: Issue[]): boolean {
  return errors.length > 0 && errors.every((e) => FIXABLE.has(e.code));
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

export function autoFix(raw: string, opts: { articleIds: Iterable<string>; trackId: string; today: string }): string {
  const { data, body: originalBody } = parseArticle(raw);
  const ids = new Set(opts.articleIds);
  const fm = { ...data } as Record<string, unknown>;
  let body = originalBody;

  if (Array.isArray(fm.prerequisites)) fm.prerequisites = fm.prerequisites.filter((p) => ids.has(String(p)));
  fm.track = opts.trackId;
  if (typeof fm.generated_at !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fm.generated_at)) fm.generated_at = opts.today;

  const kind = fm.kind === 'primer' ? 'primer' : 'paper';
  const slug = slugify(String(fm.slug ?? fm.title ?? 'imported-article')) || 'imported-article';
  fm.slug = slug;
  if (typeof fm.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.id) || !fm.id.startsWith(`${kind}-`)) {
    fm.id = `${kind}-${slug}`;
  }

  // Unknown article: links become plain text.
  body = body.replace(/\[([^\]]+)\]\(article:([a-z0-9-]+)\)/g, (m, text: string, id: string) => (ids.has(id) ? m : text));

  // [[Terms]] that are not in the glossary lose their brackets.
  const terms = new Set(
    (Array.isArray(fm.glossary) ? fm.glossary : [])
      .map((g) => (g as { term?: unknown })?.term)
      .filter((t): t is string => typeof t === 'string')
      .map(normalizeTerm),
  );
  if (glossaryRefs(body).some((r) => !terms.has(normalizeTerm(r)))) {
    body = body.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, term: string, shown?: string) =>
      terms.has(normalizeTerm(term)) ? m : (shown ?? term),
    );
  }

  return `---\n${yamlStringify(fm, { lineWidth: 0 }).trimEnd()}\n---\n${body.startsWith('\n') ? '' : '\n'}${body}`;
}

