export type Kind = 'paper' | 'primer';
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
}

export type ArticleSource = 'bundled' | 'remote' | 'imported';

/** An article as the app sees it after merging bundled, remote and imported content. */
export interface Article extends IndexEntry {
  source: ArticleSource;
}
