import 'katex/dist/katex.min.css';
import { lazy, memo, Suspense, type ReactNode } from 'react';
import ReactMarkdown, { defaultUrlTransform, type Components, type Options } from 'react-markdown';
import { Link } from 'react-router-dom';
import rehypeKatex from 'rehype-katex';
import remarkDirective from 'remark-directive';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkSmartypants from 'remark-smartypants';
import type { Element, ElementContent } from 'hast';
import { openExternal } from '../lib/native';
import { remarkCallouts, remarkGlossary } from '../lib/remarkPlugins';
import { Callout } from './Callout';
import { GlossaryTerm } from './GlossaryTerm';

const Mermaid = lazy(() => import('./Mermaid'));

const remarkPlugins = [remarkGfm, remarkMath, remarkDirective, remarkCallouts, remarkGlossary, [remarkSmartypants, { dashes: 'oldschool' }]] as Options['remarkPlugins'];
const rehypePlugins: [typeof rehypeKatex, { throwOnError: boolean; strict: boolean }][] = [
  [rehypeKatex, { throwOnError: false, strict: false }],
];

function hastText(nodes: ElementContent[]): string {
  return nodes
    .map((n) => (n.type === 'text' ? n.value : n.type === 'element' ? hastText(n.children) : ''))
    .join('');
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function textOfChildren(c: ReactNode): string {
  if (typeof c === 'string' || typeof c === 'number') return String(c);
  if (Array.isArray(c)) return c.map(textOfChildren).join('');
  return '';
}

const components = {
  pre({ node, children }) {
    const code = node?.children?.[0] as Element | undefined;
    const cls = (code?.properties?.className as string[] | undefined) ?? [];
    if (code && cls.includes('language-mermaid')) {
      return (
        <Suspense fallback={<div className="skeleton h-48 w-full rounded-xl" />}>
          <Mermaid code={hastText(code.children)} />
        </Suspense>
      );
    }
    return <pre>{children}</pre>;
  },
  a({ href, children }) {
    if (href?.startsWith('article:')) {
      return <Link to={`/article/${href.slice(8)}`}>{children}</Link>;
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!href || href.startsWith('#')) return;
          e.preventDefault();
          openExternal(href);
        }}
      >
        {children}
      </a>
    );
  },
  h2({ children }) {
    return <h2 id={slugify(textOfChildren(children))}>{children}</h2>;
  },
  table({ children }) {
    return <table>{children}</table>;
  },
  callout({ type, children }: { type?: string; children?: ReactNode }) {
    return <Callout type={type ?? 'insight'}>{children}</Callout>;
  },
  'gloss-term'({ term, children }: { term?: string; children?: ReactNode }) {
    return <GlossaryTerm term={term}>{children}</GlossaryTerm>;
  },
} as Components;

const urlTransform = (url: string) => (url.startsWith('article:') ? url : defaultUrlTransform(url));

function MarkdownRendererImpl({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
      urlTransform={urlTransform}
    >
      {body}
    </ReactMarkdown>
  );
}

/** Memoized so highlight ranges stay valid: it only re-renders when the text changes. */
export const MarkdownRenderer = memo(MarkdownRendererImpl);
export default MarkdownRenderer;
