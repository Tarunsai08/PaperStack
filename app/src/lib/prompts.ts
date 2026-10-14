/**
 * The manual-import prompt. The writing guide and format spec are shared with
 * the Python pipeline (pipeline/prompts/*.md), so every content source follows
 * the same rules.
 */
import formatSpec from '../../../pipeline/prompts/format.md?raw';
import writingGuide from '../../../pipeline/prompts/writing_guide.md?raw';
import type { Article, Track } from './types';

export interface PromptInput {
  paper: string;
  trackId: string;
  tracks: Track[];
  articles: Pick<Article, 'id' | 'title' | 'track'>[];
  today?: string;
}

export function buildImportPrompt({ paper, trackId, tracks, articles, today }: PromptInput): string {
  const date = today ?? new Date().toISOString().slice(0, 10);
  const trackList = tracks
    .filter((t) => t.id !== 'my-additions')
    .map((t) => `- ${t.id}: ${t.title} (${t.subtitle})`)
    .join('\n');
  const idList = articles.map((a) => `- ${a.id}: ${a.title}`).join('\n');
  const track = tracks.some((t) => t.id === trackId && t.id !== 'my-additions') ? trackId : tracks[0]?.id ?? 'foundations';

  return `You are writing an article for PaperStack, an app that teaches AI and machine learning from scratch through engaging articles about landmark research papers.

Write a PaperStack article about this paper:
${paper.trim()}

Use track "${track}". Use generated_by "manual-chatbot" and generated_at "${date}". Choose prerequisites only from the existing article ids below.

${writingGuide.trim()}

${formatSpec.trim()}

## Track ids
${trackList}

## Existing article ids (for prerequisites and article: links)
${idList}

Now write the complete article file. Start your reply with the line --- and end it with the last takeaway bullet.`;
}
