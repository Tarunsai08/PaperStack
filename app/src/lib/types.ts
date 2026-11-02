export type Kind = 'paper' | 'primer' | 'pattern' | 'problem-walkthrough' | 'concept' | 'deep-dive' | 'case-study';
export type SubjectId = 'ml' | 'dsa' | 'cp' | 'famous-algos' | 'system-design' | 'cs-core';
export type Priority = 'P0' | 'P1' | 'P2';

export interface PracticeProblem {
  name: string;
  platform: string;
  url: string;
  difficulty: string;
}

export interface Subject {
  id: SubjectId;
  title: string;
  short: string;
  subtitle: string;
  description: string;
  order: number;
  accent: string;
  motif: string;
  status: 'active' | 'coming-soon';
}
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface Frontmatter {
  id: string;
  kind: Kind;
  /** Missing on Machine Learning articles written before subjects existed; treated as "ml". */
  subject?: SubjectId;
  priority?: Priority;
  complexity?: { time: string; space: string };
  practice_problems?: PracticeProblem[];
  slug: string;
  title: string;
  subtitle: string;
  track: string;
  track_order: number;
  prerequisites: string[];
  difficulty: Difficulty;
  read_minutes: number;
  topics: string[];
  paper_title?: string;
  authors?: string[];
  year?: number;
  venue?: string;
  paper_url?: string;
  glossary: GlossaryItem[];
  quiz: QuizItem[];
  cover_seed: string;
  generated_by: string;
  generated_at: string;
  importance_score: number;
}

/** One entry in content/index.json: frontmatter plus computed fields, no body. */
export interface IndexEntry extends Frontmatter {
  path: string;
  hash: string;
  word_count: number;
  excerpt: string;
}

export interface ContentIndex {
  content_version: string;
  /** Added with multi-subject support; older indexes do not have it. */
  subjects?: Subject[];
  generated_at: string;
  count: number;
  articles: IndexEntry[];
}

export interface Track {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  order: number;
  accent: string;
  /** Missing on tracks from before subjects existed; treated as "ml". */
  subject?: SubjectId;
}

export type ArticleSource = 'bundled' | 'remote' | 'imported';

/** An article as the app sees it after merging bundled, remote and imported content. */
export interface Article extends IndexEntry {
  source: ArticleSource;
}
