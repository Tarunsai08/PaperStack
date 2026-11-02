import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackHeader } from '../components/Headers';
import { Page } from '../components/Page';
import { ProgressRing } from '../components/ProgressRing';
import { ListSkeleton } from '../components/Skeleton';
import { StatusDot } from '../components/StatusDot';
import { BUNDLED_BASE, fetchJson } from '../lib/content';
import { REMOTE_BASE } from '../lib/contentSync';
import { haptic } from '../lib/native';
import { statusOf } from '../lib/progress';
import { extras, planRoadmap, type RoadmapEntry, type RoadmapFile } from '../lib/roadmap';
import { setPrefs, useStore } from '../lib/storage';
import { useContent } from '../lib/useContent';

async function loadRoadmap(): Promise<RoadmapEntry[]> {
  // The deployed site may know about newer articles than this build.
  if (REMOTE_BASE) {
    try {
      return (await fetchJson<RoadmapFile>(`${REMOTE_BASE}/roadmap.json`, { cache: 'no-store' })).entries;
    } catch {
      /* offline: fall back to the bundled copy */
    }
  }
  return (await fetchJson<RoadmapFile>(`${BUNDLED_BASE}roadmap.json`)).entries;
}

export default function Roadmap() {
  const content = useContent();
  const progress = useStore('progress');
  const months = useStore('prefs').roadmapMonths;
  const [entries, setEntries] = useState<RoadmapEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    let alive = true;
    loadRoadmap()
      .then((e) => alive && setEntries(e))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const plan = useMemo(() => (entries ? planRoadmap(entries, months) : []), [entries, months]);
  const extra = useMemo(() => (entries ? extras(entries, months) : []), [entries, months]);
  const all = plan.flatMap((m) => m.entries);
  const done = all.filter((e) => progress[e.id]?.completedAt).length;
  const available = all.filter((e) => content.byId.has(e.id)).length;
  const currentMonth = plan.find((m) => m.entries.some((e) => !progress[e.id]?.completedAt))?.month;

  return (
    <Page>
      <BackHeader title="Placement Roadmap" />
      <div className="mx-auto max-w-read pb-12">
        <section className="chrome mx-5 mt-5 rounded-card border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-5">
            <ProgressRing pct={all.length ? done / all.length : 0} size={72} stroke={7} label="Roadmap progress">
              <span className="text-[17px] font-bold">{all.length ? Math.round((done / all.length) * 100) : 0}%</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold leading-snug">Your {months}-month plan</p>
              <p className="mt-0.5 text-[14px] leading-snug text-muted">
                {done} of {all.length} read · {available} ready to read now
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1" role="radiogroup" aria-label="Plan length">
            {([6, 12] as const).map((m) => (
              <button
                key={m}
                role="radio"
                aria-checked={months === m}
                onClick={() => {
                  haptic('selection');
                  setPrefs({ roadmapMonths: m });
                }}
                className={`press h-11 rounded-full text-[14px] font-semibold ${months === m ? 'bg-bg shadow-card' : 'text-muted'}`}
              >
                {m} months
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-snug text-muted">
            {months === 6
              ? 'Only the must-know (P0) topics, interleaved so every month mixes DSA practice with design and theory.'
              : 'Must-know (P0) and strongly useful (P1) topics, at a steadier pace.'}{' '}
            Prerequisites always come first.
          </p>
        </section>

        {failed ? (
          <p className="px-8 py-10 text-center text-muted">The roadmap could not be loaded.</p>
        ) : !entries || !content.ready ? (
          <div className="px-5 pt-6">
            <ListSkeleton rows={6} />
          </div>
        ) : (
          <>
            <ol className="mt-6 space-y-6 px-5">
              {plan.map((m) => (
                <li key={m.month}>
                  <div className="chrome mb-2 flex items-baseline justify-between">
                    <h2 className="text-[18px] font-bold tracking-[-0.01em]">
                      Month {m.month}
                      {m.month === currentMonth && <span className="ml-2 text-[13px] font-semibold text-brand-ink">You are here</span>}
                    </h2>
                    <span className="text-[13px] text-muted">
                      {m.entries.filter((e) => progress[e.id]?.completedAt).length}/{m.entries.length}
                    </span>
                  </div>
                  <EntryList entries={m.entries} />
                </li>
              ))}
            </ol>
            {extra.length > 0 && (
              <section className="mt-8 px-5">
                <button
                  onClick={() => setShowExtras((v) => !v)}
                  className="chrome press flex h-12 w-full items-center justify-between rounded-2xl bg-surface-2 px-4 text-[15px] font-semibold"
                  aria-expanded={showExtras}
                >
                  Extras when you have time ({extra.length})
                  <ChevronDown size={18} className={`transition-transform ${showExtras ? 'rotate-180' : ''}`} />
                </button>
                {showExtras && (
                  <div className="mt-3">
                    <EntryList entries={extra} />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

function EntryList({ entries }: { entries: RoadmapEntry[] }) {
  const content = useContent();
  const progress = useStore('progress');
  return (
    <ul className="overflow-hidden rounded-card border border-line bg-surface">
      {entries.map((e, i) => {
        const article = content.byId.get(e.id);
        const subject = content.subjectById.get(e.subject);
        const accent = subject?.accent ?? '#FF6719';
        const meta = (
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} aria-hidden />
            <span className="truncate">
              {subject?.short ?? e.subject} · {e.priority}
              {article ? ` · ${article.read_minutes} min` : ' · coming soon'}
            </span>
          </p>
        );
        const row = (
          <>
            {article ? (
              <StatusDot status={statusOf(progress[e.id])} accent={accent} index={i + 1} pct={progress[e.id]?.scrollPct ?? 0} />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line text-[11px] font-semibold text-muted">
                {i + 1}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className={`line-clamp-2 text-[15px] font-medium leading-snug ${article ? '' : 'text-muted'}`}>{article?.title ?? e.title}</p>
              {meta}
            </div>
          </>
        );
        return (
          <li key={e.id} className={i ? 'border-t border-line' : ''}>
            {article ? (
              <Link to={`/article/${e.id}`} className="press flex items-center gap-3 px-3 py-2.5">
                {row}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2.5">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
