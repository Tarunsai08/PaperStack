import { Bookmark, Download, FilePlus2, Highlighter, History, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { stringify as yamlStringify } from 'yaml';
import { ArticleCard } from '../components/ArticleCard';
import { EmptyState, TabHeader } from '../components/Headers';
import { SWATCH } from '../components/HighlightLayer';
import { Page } from '../components/Page';
import { stringifyArticle } from '../lib/frontmatter';
import { haptic, shareFile } from '../lib/native';
import { store, useStore } from '../lib/storage';
import { toast } from '../lib/toast';
import { useContent } from '../lib/useContent';

const TABS = [
  { id: 'saved', label: 'Saved' },
  { id: 'highlights', label: 'Highlights' },
  { id: 'history', label: 'History' },
  { id: 'imported', label: 'Imported' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function timeAgo(iso: string): string {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

export default function Library() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'saved') as TabId;
  const content = useContent();
  const saved = useStore('saved');
  const highlights = useStore('highlights');
  const progress = useStore('progress');
  const imports = useStore('imports');
  const [subject, setSubject] = useState<string | null>(null);
  const inSubject = (id: string) => !subject || (content.byId.get(id)?.subject ?? 'ml') === subject;

  const savedArticles = saved.filter(inSubject).map((id) => content.byId.get(id)).filter((a) => !!a);
  const history = useMemo(
    () =>
      Object.entries(progress)
        .sort((a, b) => b[1].lastReadAt.localeCompare(a[1].lastReadAt))
        .map(([id, p]) => ({ a: content.byId.get(id), p }))
        .filter((x) => !!x.a && inSubject(x.a.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [progress, content.byId, subject],
  );
  const hlGroups = Object.entries(highlights)
    .map(([id, list]) => ({ a: content.byId.get(id), list }))
    .filter((g) => g.a && g.list.length && inSubject(g.a.id))
    .sort((x, y) => (y.list.at(-1)?.createdAt ?? '').localeCompare(x.list.at(-1)?.createdAt ?? ''));
  const importList = Object.values(imports).sort((a, b) => b.importedAt.localeCompare(a.importedAt));

  return (
    <Page>
      <TabHeader title="Library" />
      <div className="chrome sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-xl">
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-3" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                haptic('selection');
                setParams({ tab: t.id }, { replace: true });
              }}
              className={`relative h-12 shrink-0 px-3 text-[15px] font-semibold ${tab === t.id ? 'text-ink' : 'text-muted'}`}
            >
              {t.label}
              {tab === t.id && <span className="absolute inset-x-3 bottom-0 h-[2.5px] rounded-full bg-ink" />}
            </button>
          ))}
        </div>
      </div>

      {tab !== 'imported' && (
        <div className="chrome no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4" aria-label="Filter by subject">
          {[{ id: null, short: 'All', accent: undefined as string | undefined }, ...content.subjects.filter((x) => x.status === 'active')].map((sub) => {
            const active = subject === sub.id;
            return (
              <button
                key={sub.id ?? 'all'}
                onClick={() => {
                  haptic('selection');
                  setSubject(sub.id);
                }}
                aria-pressed={active}
                className={`press flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-medium transition-colors ${
                  active ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-ink'
                }`}
              >
                {sub.accent && <span className="h-2 w-2 rounded-full" style={{ background: sub.accent }} />}
                {sub.short}
              </button>
            );
          })}
        </div>
      )}

      <div className="px-5 pt-5">
        {tab === 'saved' &&
          (savedArticles.length ? (
            <div className="space-y-6">
              {savedArticles.map((a) => (
                <ArticleCard key={a.id} article={a} variant="row" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Bookmark size={28} />}
              title="Nothing saved yet"
              body="Tap the bookmark on any article to keep it here for later."
              action={<Link to="/learn" className="press inline-flex h-11 items-center rounded-full bg-brand-btn px-5 text-[14px] font-semibold text-white">Browse the path</Link>}
            />
          ))}

        {tab === 'highlights' &&
          (hlGroups.length ? (
            <div className="space-y-8">
              {hlGroups.map(({ a, list }) => (
                <section key={a!.id}>
                  <Link to={`/article/${a!.id}`} className="chrome block font-serif text-[17px] font-semibold leading-snug">
                    {a!.title}
                  </Link>
                  <div className="mt-3 space-y-3">
                    {list.map((h) => (
                      <Link
                        key={h.id}
                        to={`/article/${a!.id}?hl=${h.id}`}
                        className="press block rounded-xl border-l-[3px] bg-surface-2 px-4 py-3"
                        style={{ borderColor: SWATCH[h.color] }}
                      >
                        <p className="font-serif text-[15.5px] leading-relaxed">“{h.text}”</p>
                        {h.note && <p className="mt-2 text-[14px] leading-snug text-muted">{h.note}</p>}
                        <p className="mt-2 text-[12px] text-muted">{timeAgo(h.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Highlighter size={28} />}
              title="No highlights yet"
              body="Long-press any sentence in an article, then pick a color. Add notes to remember why it mattered."
            />
          ))}

        {tab === 'history' &&
          (history.length ? (
            <div className="space-y-6">
              {history.map(({ a, p }) => (
                <div key={a!.id}>
                  <ArticleCard article={a!} variant="compact" />
                  <p className="chrome mt-1.5 text-[12px] text-muted">
                    {p.completedAt ? 'Finished' : `${Math.round(p.scrollPct * 100)}% read`} · {timeAgo(p.lastReadAt)}
                    {p.timeSpentSec >= 60 ? ` · ${Math.round(p.timeSpentSec / 60)} min reading` : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<History size={28} />} title="No reading history" body="Articles you open will show up here." />
          ))}

        {tab === 'imported' && (
          <div>
            <Link
              to="/import"
              className="press chrome flex h-12 items-center justify-center gap-2 rounded-full bg-brand-btn text-[15px] font-semibold text-white"
            >
              <FilePlus2 size={18} /> Import an article
            </Link>
            {importList.length ? (
              <div className="mt-6 space-y-6">
                {importList.map((imp) => {
                  const a = content.byId.get(imp.frontmatter.id);
                  return (
                    <div key={imp.frontmatter.id}>
                      {a ? <ArticleCard article={a} variant="compact" /> : <p className="font-semibold">{imp.frontmatter.title}</p>}
                      <div className="chrome mt-2 flex gap-2">
                        <button
                          onClick={() =>
                            shareFile(`${imp.frontmatter.slug}.md`, stringifyArticle(imp.frontmatter, imp.body, (v) => yamlStringify(v, { lineWidth: 0 })))
                          }
                          className="press flex h-11 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold"
                        >
                          <Download size={15} /> Export .md
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`Delete "${imp.frontmatter.title}"?`)) return;
                            store.update('imports', (all) => {
                              const next = { ...all };
                              delete next[imp.frontmatter.id];
                              return next;
                            });
                            toast('Imported article deleted');
                          }}
                          className="press flex h-11 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-semibold text-[#E5484D]"
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-center text-[14px] leading-relaxed text-muted">
                Ask any free chatbot to write a PaperStack article about a paper you care about, paste it in, and it joins your learning path.
              </p>
            )}
          </div>
        )}
      </div>
    </Page>
  );
}
