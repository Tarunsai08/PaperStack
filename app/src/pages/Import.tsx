import { AlertCircle, CheckCircle2, ClipboardCopy, ClipboardPaste, Eye, Share2, Wand2 } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { CoverArt } from '../components/CoverArt';
import { BackHeader } from '../components/Headers';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Page } from '../components/Page';
import { MY_ADDITIONS } from '../lib/content';
import { parseAndValidate } from '../lib/frontmatter';
import { autoFix, canAutoFix } from '../lib/importFix';
import { haptic, share } from '../lib/native';
import { localDay } from '../lib/progress';
import { buildImportPrompt } from '../lib/prompts';
import { store } from '../lib/storage';
import { toast } from '../lib/toast';
import type { Frontmatter } from '../lib/types';
import { useContent } from '../lib/useContent';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="relative pl-11">
      <span className="chrome absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[14px] font-bold text-bg">
        {n}
      </span>
      <h2 className="chrome pt-1 text-[17px] font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function Import() {
  const content = useContent();
  const navigate = useNavigate();
  const [paper, setPaper] = useState('');
  const [trackId, setTrackId] = useState(MY_ADDITIONS.id);
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState(false);
  const deferredRaw = useDeferredValue(raw);

  const allTracks = useMemo(
    () => [...content.tracks.filter((t) => t.id !== MY_ADDITIONS.id), MY_ADDITIONS],
    [content.tracks],
  );
  const articleIds = useMemo(() => content.path.map((a) => a.id), [content.path]);
  const trackIds = useMemo(() => allTracks.map((t) => t.id), [allTracks]);

  const result = useMemo(
    () => (deferredRaw.trim() ? parseAndValidate(deferredRaw, { trackIds, articleIds }) : null),
    [deferredRaw, trackIds, articleIds],
  );
  const fm = result?.frontmatter;
  const clash = fm && content.byId.has(fm.id) && content.byId.get(fm.id)?.source !== 'imported';

  const prompt = () =>
    buildImportPrompt({
      paper: paper || '(the paper I describe next)',
      trackId: trackId === MY_ADDITIONS.id ? 'useful-llms' : trackId,
      tracks: allTracks,
      articles: content.path,
      today: localDay(),
    });

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt());
      haptic('success');
      toast('Prompt copied. Paste it into any chatbot.');
    } catch {
      share({ title: 'PaperStack prompt', text: prompt() });
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t) setRaw(t);
    } catch {
      toast('Long-press the box below and choose Paste');
    }
  };

  const fix = () => {
    try {
      setRaw(autoFix(raw, { articleIds, trackId, today: localDay() }));
      haptic('light');
      toast('Fixed what could be fixed automatically');
    } catch {
      toast("Couldn't fix this one automatically");
    }
  };

  const save = () => {
    if (!result?.ok || !result.frontmatter || result.body === undefined) return;
    const f: Frontmatter = { ...result.frontmatter, track: trackId };
    if (clash) {
      f.id = `${f.id}-mine`;
      f.slug = `${f.slug}-mine`;
    }
    store.update('imports', (all) => ({
      ...all,
      [f.id]: { frontmatter: f, body: result.body!, importedAt: new Date().toISOString() },
    }));
    haptic('success');
    toast('Imported! It is now part of your path.');
    navigate(`/article/${f.id}`, { replace: true });
  };

  return (
    <Page>
      <BackHeader title="Import an article" />
      <div className="mx-auto max-w-read space-y-9 px-5 pb-16 pt-6">
        <p className="text-[15px] leading-relaxed text-muted">
          Want a paper that isn't in PaperStack yet? Any free chatbot (ChatGPT, Gemini, Claude) can write it in PaperStack's format. You
          copy a prompt, paste the answer back, and it joins your learning path.
        </p>

        <Step n={1} title="Pick a paper">
          <input
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
            placeholder="Paper title or link, e.g. arxiv.org/abs/2106.09685"
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-brand"
            aria-label="Paper title or link"
          />
          <label className="mt-4 block text-[13px] font-semibold text-muted" htmlFor="track">
            Add it to
          </label>
          <select
            id="track"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3 text-[15px] outline-none focus:border-brand"
          >
            {allTracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </Step>

        <Step n={2} title="Copy the prompt into a chatbot">
          <p className="text-[14px] leading-relaxed text-muted">
            The prompt includes PaperStack's full writing guide and file format, so the chatbot knows exactly what to produce.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={copyPrompt}
              className="press flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand-btn text-[15px] font-semibold text-white"
            >
              <ClipboardCopy size={18} /> Copy prompt
            </button>
            <button
              onClick={() => share({ title: 'PaperStack prompt', text: prompt() })}
              className="press flex h-12 w-12 items-center justify-center rounded-full border border-line"
              aria-label="Share prompt to another app"
            >
              <Share2 size={18} />
            </button>
          </div>
        </Step>

        <Step n={3} title="Paste the answer here">
          <div className="relative">
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={'---\nid: "paper-..."\n...'}
              rows={9}
              spellCheck={false}
              className="w-full rounded-xl border border-line bg-surface p-4 font-mono text-[13px] leading-relaxed outline-none focus:border-brand"
              aria-label="Article markdown"
            />
            {!raw && (
              <button
                onClick={pasteFromClipboard}
                className="press absolute bottom-4 right-3 flex h-11 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[13px] font-semibold"
              >
                <ClipboardPaste size={16} /> Paste
              </button>
            )}
          </div>

          {result && !result.ok && (
            <div className="mt-4 rounded-xl border border-[#E5484D]/40 bg-[#E5484D]/[0.07] p-4" role="alert">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-[#C4373B] dark:text-[#FF7A7E]">
                <AlertCircle size={17} /> {result.errors.length} thing{result.errors.length === 1 ? '' : 's'} to fix
              </p>
              <ul className="mt-2 space-y-1.5 text-[13.5px] leading-snug">
                {result.errors.map((e, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted">•</span>
                    <span>{e.message}</span>
                  </li>
                ))}
              </ul>
              {canAutoFix(result.errors) ? (
                <button
                  onClick={fix}
                  className="press mt-3 flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-semibold text-bg"
                >
                  <Wand2 size={16} /> Fix automatically
                </button>
              ) : (
                <p className="mt-3 text-[13px] leading-snug text-muted">
                  Tip: paste these messages back to the chatbot and ask it to fix the file.
                </p>
              )}
            </div>
          )}

          {result?.ok && fm && (
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-[#0B7A5E] dark:text-[#4FD1A8]">
                <CheckCircle2 size={17} /> Looks great. Ready to import.
              </p>
              {result.warnings.length > 0 && (
                <p className="text-[13px] text-muted">Note: {result.warnings.map((w) => w.message).join(' ')}</p>
              )}
              {clash && (
                <p className="text-[13px] text-muted">
                  PaperStack already has an article with this id, so yours will be saved as “{fm.id}-mine”.
                </p>
              )}
              <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
                <CoverArt
                  seed={fm.cover_seed}
                  accent={allTracks.find((t) => t.id === trackId)?.accent ?? '#FF6719'}
                  className="h-16 w-20 shrink-0 rounded-xl"
                />
                <div className="min-w-0">
                  <p className="font-serif text-[16px] font-semibold leading-snug">{fm.title}</p>
                  <p className="line-clamp-2 text-[13px] text-muted">{fm.subtitle}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreview(true)}
                  className="press flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line text-[15px] font-semibold"
                >
                  <Eye size={18} /> Preview
                </button>
                <button onClick={save} className="press h-12 flex-1 rounded-full bg-brand-btn text-[15px] font-semibold text-white">
                  Import
                </button>
              </div>
            </div>
          )}
        </Step>
      </div>

      <BottomSheet open={preview} onClose={() => setPreview(false)} title={fm?.title}>
        {result?.body && (
          <div className="prose-read pb-6 text-[17px]">
            <MarkdownRenderer body={result.body} />
          </div>
        )}
      </BottomSheet>
    </Page>
  );
}
