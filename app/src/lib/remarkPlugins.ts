/**
 * Small remark plugins for PaperStack's markdown dialect:
 *   :::insight ... :::   -> <callout type="insight">
 *   [[Term]]             -> <gloss-term term="Term">
 *   [[Term|shown]]       -> <gloss-term term="Term">shown</gloss-term>
 */
import type { Root, Text, Parent, RootContent } from 'mdast';
import { visit, SKIP } from 'unist-util-visit';
import { DIRECTIVES } from './frontmatter';

interface DirectiveNode {
  type: 'containerDirective' | 'leafDirective' | 'textDirective';
  name: string;
  attributes?: Record<string, string>;
  children: RootContent[];
  data?: Record<string, unknown>;
}

function textOf(n: { children?: unknown[]; value?: string }): string {
  if (typeof n.value === 'string') return n.value;
  return (n.children ?? []).map((c) => textOf(c as { children?: unknown[]; value?: string })).join('');
}

export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      const n = node as unknown as DirectiveNode;
      if (n.type === 'containerDirective') {
        if ((DIRECTIVES as readonly string[]).includes(n.name)) {
          n.data = { ...(n.data ?? {}), hName: 'callout', hProperties: { type: n.name } };
        } else {
          n.data = { ...(n.data ?? {}), hName: 'div' };
        }
        return;
      }
      if ((n.type === 'textDirective' || n.type === 'leafDirective') && parent && index !== undefined) {
        // Not a PaperStack directive: put the original text back (e.g. "ratio 3:to").
        const label = n.children?.length ? `[${textOf(n)}]` : '';
        const replacement: Text = { type: 'text', value: `${n.type === 'leafDirective' ? '::' : ':'}${n.name}${label}` };
        (parent as Parent).children.splice(index, 1, replacement as RootContent);
        return [SKIP, index];
      }
    });
  };
}

const TERM_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

export function remarkGlossary() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('[[')) return;
      const parts: RootContent[] = [];
      let last = 0;
      for (const m of node.value.matchAll(TERM_RE)) {
        const at = m.index ?? 0;
        if (at > last) parts.push({ type: 'text', value: node.value.slice(last, at) });
        const term = m[1].trim();
        const shown = (m[2] ?? m[1]).trim();
        parts.push({
          type: 'emphasis',
          children: [{ type: 'text', value: shown }],
          data: { hName: 'gloss-term', hProperties: { term } },
        } as RootContent);
        last = at + m[0].length;
      }
      if (!parts.length) return;
      if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
      (parent as Parent).children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });
  };
}
