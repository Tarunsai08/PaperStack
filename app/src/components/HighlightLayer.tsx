import { AnimatePresence, motion } from 'framer-motion';
import { Highlighter, MessageSquarePlus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type RefObject } from 'react';
import {
  addHighlight,
  caretOffset,
  clearHighlights,
  HIGHLIGHT_COLORS,
  highlightAt,
  paintHighlights,
  rangeToOffsets,
  removeHighlight,
  updateHighlight,
} from '../lib/highlights';
import { haptic } from '../lib/native';
import { useStore, type Highlight, type HighlightColor } from '../lib/storage';
import { toast } from '../lib/toast';
import { BottomSheet } from './BottomSheet';

export const SWATCH: Record<HighlightColor, string> = {
  yellow: 'rgb(255 214 10)',
  green: 'rgb(52 199 89)',
  blue: 'rgb(10 132 255)',
  pink: 'rgb(255 55 140)',
};

interface Props {
  articleId: string;
  containerRef: RefObject<HTMLElement | null>;
  /** Changes whenever the rendered body changes, so ranges are rebuilt. */
  renderKey: string;
}

export function HighlightLayer({ articleId, containerRef, renderKey }: Props) {
  const all = useStore('highlights');
  const list = all[articleId];
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [editing, setEditing] = useState<Highlight | null>(null);
  const [note, setNote] = useState('');
  const [noteMode, setNoteMode] = useState(false);

  // Paint
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const id = requestAnimationFrame(() => paintHighlights(root, list ?? []));
    return () => cancelAnimationFrame(id);
  }, [list, containerRef, renderKey]);

  useEffect(() => () => clearHighlights(), []);

  // Watch the text selection
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onChange = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const root = containerRef.current;
        const sel = document.getSelection();
        if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) {
          setSelection(null);
          return;
        }
        const offs = rangeToOffsets(root, sel.getRangeAt(0));
        setSelection(offs);
      }, 120);
    };
    document.addEventListener('selectionchange', onChange);
    return () => {
      clearTimeout(t);
      document.removeEventListener('selectionchange', onChange);
    };
  }, [containerRef]);

  // Tap on an existing highlight
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      if (!list?.length) return;
      const target = e.target as Element;
      if (target.closest('a, button, [role="button"]')) return;
      const sel = document.getSelection();
      if (sel && !sel.isCollapsed) return;
      const off = caretOffset(root, e.clientX, e.clientY);
      if (off < 0) return;
      const h = highlightAt(list, off);
      if (h) {
        setEditing(h);
        setNote(h.note ?? '');
        setNoteMode(false);
        haptic('selection');
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [containerRef, list]);

  const create = useCallback(
    (color: HighlightColor, withNote = false) => {
      if (!selection) return;
      const h = addHighlight(articleId, { ...selection, color });
      document.getSelection()?.removeAllRanges();
      setSelection(null);
      haptic('light');
      if (withNote) {
        setEditing(h);
        setNote('');
        setNoteMode(true);
      } else {
        toast('Highlighted. Find it in Library → Highlights.');
      }
    },
    [selection, articleId],
  );

  const closeEditor = useCallback(() => setEditing(null), []);

  return (
    <>
      <AnimatePresence>
        {selection && (
          <motion.div
            className="chrome fixed inset-x-0 z-40 flex justify-center px-4"
            style={{ bottom: 'calc(var(--sab) + 20px)' }}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          >
            <div
              className="flex items-center gap-1 rounded-full border border-line bg-surface p-1.5 shadow-float"
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className="flex h-11 items-center gap-1.5 pl-3 pr-2 text-[13px] font-semibold text-muted">
                <Highlighter size={16} /> Highlight
              </span>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => create(c)}
                  className="press flex h-11 w-11 items-center justify-center rounded-full"
                  aria-label={`Highlight ${c}`}
                >
                  <span className="h-6 w-6 rounded-full ring-2 ring-white/60" style={{ background: SWATCH[c] }} />
                </button>
              ))}
              <button
                onClick={() => create('yellow', true)}
                className="press flex h-11 w-11 items-center justify-center rounded-full text-ink"
                aria-label="Highlight and add note"
              >
                <MessageSquarePlus size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet open={!!editing} onClose={closeEditor} title="Highlight">
        {editing && (
          <div className="space-y-4 pb-2">
            <blockquote
              className="rounded-xl border-l-[3px] bg-surface-2 px-4 py-3 font-serif text-[16px] leading-relaxed"
              style={{ borderColor: SWATCH[editing.color] }}
            >
              {editing.text}
            </blockquote>
            <div className="flex items-center gap-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    updateHighlight(articleId, editing.id, { color: c });
                    setEditing({ ...editing, color: c });
                  }}
                  className={`press flex h-11 w-11 items-center justify-center rounded-full ${editing.color === c ? 'ring-2 ring-ink' : ''}`}
                  aria-label={`Change to ${c}`}
                >
                  <span className="h-7 w-7 rounded-full" style={{ background: SWATCH[c] }} />
                </button>
              ))}
              <button
                onClick={() => {
                  removeHighlight(articleId, editing.id);
                  setEditing(null);
                  haptic('light');
                  toast('Highlight removed');
                }}
                className="press ml-auto flex h-11 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-[#E5484D]"
              >
                <Trash2 size={17} /> Remove
              </button>
            </div>
            {noteMode || editing.note ? (
              <div>
                <label htmlFor="hl-note" className="text-[13px] font-semibold text-muted">
                  Note
                </label>
                <textarea
                  id="hl-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  autoFocus={noteMode}
                  placeholder="Why does this matter to you?"
                  className="mt-1.5 w-full resize-none rounded-xl border border-line bg-bg p-3 text-[15px] outline-none focus:border-brand"
                />
                <button
                  onClick={() => {
                    updateHighlight(articleId, editing.id, { note: note.trim() || undefined });
                    setEditing(null);
                    toast('Note saved');
                  }}
                  className="press mt-3 h-12 w-full rounded-full bg-brand-btn text-[15px] font-semibold text-white"
                >
                  Save note
                </button>
              </div>
            ) : (
              <button
                onClick={() => setNoteMode(true)}
                className="press flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line text-[15px] font-semibold"
              >
                <MessageSquarePlus size={18} /> Add a note
              </button>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
