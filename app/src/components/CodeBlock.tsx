import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyText, haptic } from '../lib/native';

type Highlighter = (code: string) => string;
let loader: Promise<Highlighter> | null = null;

/** highlight.js core + C++ only, loaded on first use and bundled (works offline). */
function loadHighlighter(): Promise<Highlighter> {
  loader ??= Promise.all([import('highlight.js/lib/core'), import('highlight.js/lib/languages/cpp')]).then(
    ([core, cpp]) => {
      const hljs = core.default;
      hljs.registerLanguage('cpp', cpp.default);
      return (code: string) => hljs.highlight(code, { language: 'cpp', ignoreIllegals: true }).value;
    },
  );
  return loader;
}

export default function CodeBlock({ code, partial, language = 'cpp' }: { code: string; partial?: boolean; language?: 'cpp' | 'pseudo' }) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (language !== 'cpp') return;
    let alive = true;
    loadHighlighter()
      .then((hl) => alive && setHtml(hl(code)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [code, language]);

  return (
    <div className="code-block chrome relative">
      <div className="flex items-center justify-between px-4 pt-1 font-sans text-[12.5px] font-semibold text-muted">
        <span>{language === 'cpp' ? `C++${partial ? ' · snippet' : ''}` : 'Pseudocode'}</span>
        <button
          type="button"
          onClick={async () => {
            if (await copyText(code)) {
              haptic('light');
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }
          }}
          className="press -mr-2 flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2"
          aria-label="Copy code"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className={`selectable ${language === 'pseudo' ? 'pseudo' : ''}`}>
        {html === null ? <code>{code}</code> : <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />}
      </pre>
    </div>
  );
}
