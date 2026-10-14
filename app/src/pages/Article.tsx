import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  Share2,
  Type,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useNavigationType, useParams, useSearchParams } from 'react-router-dom';
import { ArticleCard } from '../components/ArticleCard';
import { BottomSheet } from '../components/BottomSheet';
import { CoverArt } from '../components/CoverArt';
import { GlossaryContext } from '../components/GlossaryTerm';
import { HighlightLayer } from '../components/HighlightLayer';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Page } from '../components/Page';
import { Quiz } from '../components/Quiz';
import { ReaderSettings } from '../components/ReaderSettings';
import { ReadingProgressBar } from '../components/ReadingProgressBar';
import { ArticleSkeleton, Skeleton } from '../components/Skeleton';
import { celebrateTrack } from '../lib/celebrate';
import { loadArticleBody, relatedArticles } from '../lib/content';
import { normalizeTerm } from '../lib/frontmatter';
import { offsetsToRange } from '../lib/highlights';
import { haptic, openExternal, share } from '../lib/native';
import { completeArticle, justFinishedTrack, recordReading, saveScroll } from '../lib/progress';
import { store, toggleSaved, useStore } from '../lib/storage';
import { toast } from '../lib/toast';
import { useContent } from '../lib/useContent';

const DIFFICULTY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

function scrollPct(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

export default function ArticlePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const navType = useNavigationType();
  const [searchParams] = useSearchParams();
  const jumpTo = searchParams.get('hl');
  const content = useContent();
  const article = content.byId.get(id);
  const track = article ? content.trackById.get(article.track) : undefined;
  const imports = useStore('imports');
  const remote = useStore('remote');
  const saved = useStore('saved').includes(id);
  const progress = useStore('progress')[id];

  const [body, setBody] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pct, setPct] = useState(0);
  const [term, setTerm] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastActive = useRef(Date.now());
  const restored = useRef(false);

  // Load body
  useEffect(() => {
    if (!article) return;
    let alive = true;
    setBody(null);
    setLoadError(null);
    restored.current = false;
    loadArticleBody(article, { imports, remoteArticles: remote.articles })
      .then((b) => alive && setBody(b))
      .catch((e: Error) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article?.id, article?.hash, article?.source]);

  // Restore reading position
  useEffect(() => {
    if (!body || restored.current) return;
    restored.current = true;
    if (jumpTo) {
      // Opened from Library -> Highlights: scroll to that highlight.
      const t = setTimeout(() => {
        const h = store.get('highlights')[id]?.find((x) => x.id === jumpTo);
        const root = bodyRef.current;
        const range = h && root ? offsetsToRange(root, h.start, h.end) : null;
        if (range) {
          const top = range.getBoundingClientRect().top + window.scrollY - 140;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 450);
      return () => clearTimeout(t);
    }
    const startPct = store.get('progress')[id]?.scrollPct ?? 0;
    if (navType === 'POP' || startPct < 0.03 || startPct > 0.97) {
      if (navType !== 'POP') window.scrollTo(0, 0);
      return;
    }
    const t = setTimeout(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: startPct * max, behavior: 'instant' as ScrollBehavior });
      toast('Picked up where you left off');
    }, 380);
    return () => clearTimeout(t);
  }, [body, id, navType, jumpTo]);

  // Track scroll position + reading time
  useEffect(() => {
    if (!article) return;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      lastActive.current = Date.now();
      const p = scrollPct();
      setPct(p);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveScroll(article.id, p), 800);
    };
    const onTouch = () => {
      lastActive.current = Date.now();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    const tick = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastActive.current > 90_000) return;
      recordReading(article.id, 15, scrollPct());
    }, 15_000);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('touchstart', onTouch);
      clearInterval(tick);
      clearTimeout(saveTimer);
    };
  }, [article]);

  const next = useMemo(() => {
    if (!article) return undefined;
    const i = content.path.findIndex((a) => a.id === article.id);
    return i >= 0 ? content.path[i + 1] : undefined;
  }, [article, content.path]);

  const related = useMemo(
    () => (article ? relatedArticles(article, content.path, next ? [next.id] : []) : []),
    [article, content.path, next],
  );

  const glossaryEntry = useMemo(() => {
    if (!article || term === null) return undefined;
    const key = normalizeTerm(term);
    return article.glossary.find((g) => normalizeTerm(g.term) === key);
  }, [article, term]);

  const closeTerm = useCallback(() => setTerm(null), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const finish = useCallback(
    (fromQuiz: boolean, score?: number) => {
      if (!article) return;
      const first = completeArticle(article.id);
      haptic('success');
      if (fromQuiz) toast(score === article.quiz.length ? 'Perfect score. Article complete!' : 'Article complete!');
      else if (first) toast('Marked as complete');
      if (!first) return;
      const t = justFinishedTrack(article.id, content.path, content.tracks, store.get('progress'));
      if (t && !store.get('meta').completedTracks.includes(t.id)) {
        store.update('meta', (m) => ({ ...m, completedTracks: [...m.completedTracks, t.id] }));
        setTimeout(() => celebrateTrack(t), 600);
      }
    },
    [article, content.path, content.tracks],
  );

  if (!content.ready) {
    return (
      <div className="mx-auto max-w-read px-5 pt-safe">
        <div className="h-14" />
        <Skeleton className="aspect-[16/9] w-full rounded-card" />
        <Skeleton className="mt-6 h-8 w-4/5" />
        <Skeleton className="mt-3 h-5 w-3/5" />
        <div className="mt-8">
          <ArticleSkeleton />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <Page className="mx-auto flex min-h-[80dvh] max-w-read flex-col items-center justify-center px-6 text-center pt-safe">
        <p className="font-serif text-[22px] font-semibold">This article isn't here</p>
        <p className="mt-2 text-muted">It may have been removed, or the link is wrong.</p>
        <Link to="/learn" className="press mt-6 rounded-full bg-brand-btn px-5 py-3 font-semibold text-white">
          Back to the learning path
        </Link>
      </Page>
    );
  }

  const minutesLeft = Math.max(1, Math.ceil(article.read_minutes * (1 - pct)));
  const done = !!progress?.completedAt;
  const authors = article.authors ?? [];
  const authorLine = authors.length > 3 ? `${authors.slice(0, 3).filter((a) => a !== 'et al.').join(', ')} et al.` : authors.join(', ');

  return (
    <Page>
      <header className="chrome sticky top-0 z-30 border-b border-line bg-bg pt-safe">
        <div className="mx-auto flex h-14 max-w-[760px] items-center gap-1 px-2">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            className="press flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-[13px] font-semibold">{track?.title}</p>
            <p className="text-[12px] text-muted">{pct > 0.985 ? 'Finished' : `${minutesLeft} min left`}</p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="press flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Reading settings"
          >
            <Type size={20} />
          </button>
          <button
            onClick={() => {
              const now = toggleSaved(article.id);
              haptic('light');
              toast(now ? 'Saved to your library' : 'Removed from saved');
            }}
            className="press flex h-11 w-11 items-center justify-center rounded-full"
            aria-label={saved ? 'Remove from saved' : 'Save article'}
            aria-pressed={saved}
          >
            {saved ? <BookmarkCheck size={21} className="text-brand" /> : <Bookmark size={21} />}
          </button>
          <button
            onClick={() =>
              share({
                title: article.title,
                text: article.paper_title ? `${article.title}: on "${article.paper_title}" (${article.year})` : article.subtitle,
                url: article.paper_url,
              })
            }
            className="press flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Share"
          >
            <Share2 size={20} />
          </button>
        </div>
        <ReadingProgressBar color={track?.accent} />
      </header>

      <article className="mx-auto max-w-read px-5 pb-16">
        <div className="chrome pt-5">
          <CoverArt
            seed={article.cover_seed}
            accent={track?.accent ?? '#FF6719'}
            className="aspect-[16/9] w-full rounded-card"
            title={`Cover for ${article.title}`}
          />
          <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-muted">
            <Link to={`/track/${article.track}`} className="flex items-center gap-1.5 text-ink/80">
              <span className="h-2 w-2 rounded-full" style={{ background: track?.accent }} aria-hidden />
              {track?.title}
            </Link>
            <span aria-hidden>·</span>
            <span>{DIFFICULTY_LABEL[article.difficulty] ?? article.difficulty}</span>
            <span aria-hidden>·</span>
            <span>{article.read_minutes} min read</span>
            {done && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#10AC84]/12 px-2 py-0.5 text-[12px] font-semibold text-[#0B7A5E] dark:text-[#4FD1A8]">
                <CheckCircle2 size={13} /> Read
              </span>
            )}
          </div>
        </div>
        <h1 className="selectable mt-3 font-serif text-[31px] font-semibold leading-[1.18] tracking-[-0.015em] sm:text-[34px]">
          {article.title}
        </h1>
        <p className="selectable mt-3 text-[18.5px] leading-snug text-muted">{article.subtitle}</p>

        {article.kind === 'paper' && article.paper_title && (
          <div className="chrome mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted">Based on the paper</p>
              <p className="mt-1 font-serif text-[16px] font-semibold leading-snug">{article.paper_title}</p>
              <p className="mt-1 text-[13px] leading-snug text-muted">
                {authorLine} · {article.venue} {article.year}
              </p>
            </div>
            {article.paper_url && (
              <button
                onClick={() => openExternal(article.paper_url!)}
                className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-bg"
                aria-label="Open the original paper"
              >
                <ExternalLink size={18} />
              </button>
            )}
          </div>
        )}

        <div className="mt-2">
          {loadError ? (
            <div className="mt-8 rounded-xl border border-line p-5 text-center">
              <p className="font-semibold">Couldn't open this article.</p>
              <p className="mt-1 text-sm text-muted">{loadError}</p>
            </div>
          ) : body === null ? (
            <div className="mt-8">
              <ArticleSkeleton />
            </div>
          ) : (
            <GlossaryContext.Provider value={setTerm}>
              <div ref={bodyRef} className="prose-read selectable">
                <MarkdownRenderer body={body} />
              </div>
              <HighlightLayer articleId={article.id} containerRef={bodyRef} renderKey={`${article.id}:${article.hash}`} />
            </GlossaryContext.Provider>
          )}
        </div>

        {body !== null && (
          <div className="chrome mt-14 space-y-10">
            <div>
              <Quiz articleId={article.id} quiz={article.quiz} onFinish={(s) => finish(true, s)} />
              {!done && (
                <button
                  onClick={() => finish(false)}
                  className="press mx-auto mt-3 flex h-11 items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-muted"
                >
                  <CheckCircle2 size={17} /> Mark as complete without the quiz
                </button>
              )}
            </div>

            {next && (
              <section aria-label="Next in path">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Next in your path</p>
                <Link
                  to={`/article/${next.id}`}
                  className="press flex items-center gap-4 overflow-hidden rounded-card border border-line bg-surface p-3 shadow-card"
                >
                  <CoverArt
                    seed={next.cover_seed}
                    accent={content.trackById.get(next.track)?.accent ?? '#FF6719'}
                    className="h-[84px] w-[112px] shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-muted">
                      {content.trackById.get(next.track)?.title} · {next.read_minutes} min
                    </p>
                    <p className="mt-0.5 line-clamp-2 font-serif text-[17px] font-semibold leading-snug">{next.title}</p>
                  </div>
                  <ArrowRight size={20} className="mr-1 shrink-0 text-muted" />
                </Link>
              </section>
            )}

            {related.length > 0 && (
              <section aria-label="Related articles">
                <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Related reading</p>
                <div className="space-y-5">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </article>

      <BottomSheet open={term !== null} onClose={closeTerm} title={glossaryEntry?.term ?? term ?? ''}>
        <p className="font-serif text-[17px] leading-relaxed">
          {glossaryEntry?.definition ?? 'No definition for this term yet.'}
        </p>
        {article.glossary.length > 1 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Other terms in this article</p>
            <div className="mt-3 flex flex-wrap gap-2 pb-2">
              {article.glossary
                .filter((g) => g !== glossaryEntry)
                .map((g) => (
                  <button
                    key={g.term}
                    onClick={() => setTerm(g.term)}
                    className="press min-h-[40px] rounded-full border border-line px-3.5 text-[14px] font-medium"
                  >
                    {g.term}
                  </button>
                ))}
            </div>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={settingsOpen} onClose={closeSettings} title="Reading settings">
        <ReaderSettings />
      </BottomSheet>
    </Page>
  );
}
