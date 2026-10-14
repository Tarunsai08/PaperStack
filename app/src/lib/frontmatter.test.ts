import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  excerpt,
  normalizeTerm,
  parseAndValidate,
  parseArticle,
  readMinutes,
  validateArticle,
  wordCount,
} from './frontmatter';

const FIXTURES = join(__dirname, '../../../tests/fixtures');
const cases = JSON.parse(readFileSync(join(FIXTURES, 'cases.json'), 'utf8')) as {
  tracks: string[];
  articleIds: string[];
  cases: { file: string; ok: boolean; errors: string[] }[];
  wordCounts: { text: string; words: number }[];
};

describe('shared fixtures (same cases as pipeline/tests)', () => {
  for (const c of cases.cases) {
    it(c.file, () => {
      const raw = readFileSync(join(FIXTURES, c.file), 'utf8');
      const res = parseAndValidate(raw, { trackIds: cases.tracks, articleIds: cases.articleIds });
      const codes = res.errors.map((e) => e.code);
      expect(res.ok, JSON.stringify(res.errors)).toBe(c.ok);
      for (const code of c.errors) expect(codes).toContain(code);
    });
  }

  it('counts words the same way as Python', () => {
    for (const w of cases.wordCounts) expect(wordCount(w.text)).toBe(w.words);
  });
});

describe('helpers', () => {
  it('normalizes plurals for glossary matching', () => {
    expect(normalizeTerm('Tokens')).toBe(normalizeTerm('token'));
    expect(normalizeTerm('Embeddings')).toBe('embedding');
    expect(normalizeTerm('Probabilities')).toBe('probability');
    expect(normalizeTerm('Loss')).toBe('loss');
    expect(normalizeTerm('Batches')).toBe('batch');
  });

  it('keeps unquoted dates as strings', () => {
    const { data } = parseArticle(readFileSync(join(FIXTURES, 'valid-primer.md'), 'utf8'));
    expect(data.generated_at).toBe('2026-10-14');
  });

  it('builds excerpts without the hook heading', () => {
    const ex = excerpt(`## The hook\n\n${'word '.repeat(200)}`);
    expect(ex.startsWith('The hook')).toBe(false);
    expect(ex.length).toBeLessThanOrEqual(301);
    expect(ex.endsWith('…')).toBe(true);
  });

  it('rounds read minutes half up', () => {
    expect(readMinutes(330)).toBe(2);
    expect(readMinutes(10)).toBe(1);
  });

  it('skips cross-reference checks when no article ids are given', () => {
    const { data, body } = parseArticle(readFileSync(join(FIXTURES, 'valid-primer.md'), 'utf8'));
    const res = validateArticle({ ...data, prerequisites: ['primer-ghost'] }, body, { trackIds: cases.tracks });
    expect(res.ok).toBe(true);
  });

  it('warns about length but does not fail', () => {
    const res = parseAndValidate(readFileSync(join(FIXTURES, 'valid-paper.md'), 'utf8'), {
      trackIds: cases.tracks,
      articleIds: cases.articleIds,
    });
    expect(res.ok).toBe(true);
    expect(res.warnings.map((w) => w.code)).toContain('length_short');
  });
});
