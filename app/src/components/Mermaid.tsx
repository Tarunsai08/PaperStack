import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { pushBackHandler } from '../lib/backStack';
import { useResolvedTheme, type ResolvedTheme } from '../lib/theme';

const THEMES: Record<ResolvedTheme, Record<string, string>> = {
  light: {
    background: '#FFFFFF',
    primaryColor: '#FFF1E8',
    primaryBorderColor: '#FF8A4C',
    primaryTextColor: '#1A1A1A',
    secondaryColor: '#F1EEFF',
    secondaryBorderColor: '#8E7CF0',
    tertiaryColor: '#F6F6F4',
    tertiaryBorderColor: '#CFCFCF',
    lineColor: '#8A8A8A',
    textColor: '#1A1A1A',
    edgeLabelBackground: '#FFFFFF',
    clusterBkg: '#FAFAF8',
    clusterBorder: '#E2E2E2',
  },
  dark: {
    background: '#111111',
    primaryColor: '#2A1C14',
    primaryBorderColor: '#FF7A33',
    primaryTextColor: '#ECECEC',
    secondaryColor: '#1F1B33',
    secondaryBorderColor: '#8E7CF0',
    tertiaryColor: '#1E1E1E',
    tertiaryBorderColor: '#3A3A3A',
    lineColor: '#9A9A9A',
    textColor: '#ECECEC',
    edgeLabelBackground: '#111111',
    clusterBkg: '#181818',
    clusterBorder: '#333333',
  },
  sepia: {
    background: '#F7F1E3',
    primaryColor: '#F8E3CF',
    primaryBorderColor: '#D27A3A',
    primaryTextColor: '#3B2F2A',
    secondaryColor: '#EDE5F5',
    secondaryBorderColor: '#8E7CB8',
    tertiaryColor: '#EFE6D3',
    tertiaryBorderColor: '#D3C3A6',
    lineColor: '#8C7A6B',
    textColor: '#3B2F2A',
    edgeLabelBackground: '#F7F1E3',
    clusterBkg: '#F2EAD8',
    clusterBorder: '#DCCDB1',
  },
};

// mermaid.render is not safe to call concurrently, so renders are queued.
let queue: Promise<unknown> = Promise.resolve();
let counter = 0;

async function renderDiagram(code: string, theme: ResolvedTheme): Promise<string> {
  const job = queue.then(async () => {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: "'Inter Variable', Inter, system-ui, sans-serif",
      themeVariables: { ...THEMES[theme], fontSize: '15px' },
      flowchart: { curve: 'basis', padding: 14, htmlLabels: false, nodeSpacing: 36, rankSpacing: 40 },
      htmlLabels: false,
      sequence: { useMaxWidth: true },
    });
    const id = `mmd-${++counter}`;
    try {
      const { svg } = await mermaid.render(id, code);
      return svg;
    } finally {
      document.getElementById(id)?.remove();
      document.getElementById(`d${id}`)?.remove();
    }
  });
  queue = job.catch(() => undefined);
  return job;
}

export function Mermaid({ code }: { code: string }) {
  const theme = useResolvedTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    let alive = true;
    renderDiagram(code.trim(), theme)
      .then((s) => {
        if (!alive) return;
        setSvg(s);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [code, theme]);

  if (failed) {
    return (
      <figure className="chrome rounded-xl border border-dashed border-line p-4 font-sans text-sm text-muted" data-hl-skip>
        <p className="mb-2 font-medium">This diagram couldn't be drawn.</p>
        <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{code}</pre>
      </figure>
    );
  }

  return (
    <figure className="chrome relative -mx-1" data-hl-skip>
      {svg ? (
        <button
          type="button"
          className="mermaid-wrap press block w-full rounded-xl border border-line bg-bg px-3 pb-9 pt-5 text-left"
          onClick={() => setFull(true)}
          aria-label="Open diagram full screen"
        >
          <div dangerouslySetInnerHTML={{ __html: svg }} />
          <span className="absolute bottom-2 right-2.5 flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 font-sans text-[11px] font-semibold text-muted">
            <Maximize2 size={12} /> Tap to zoom
          </span>
        </button>
      ) : (
        <div className="skeleton h-48 w-full rounded-xl" />
      )}
      {svg && <DiagramViewer open={full} svg={svg} onClose={() => setFull(false)} />}
    </figure>
  );
}

function DiagramViewer({ open, svg, onClose }: { open: boolean; svg: string; onClose: () => void }) {
  const [t, setT] = useState({ x: 0, y: 0, s: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; s: number; cx: number; cy: number; x: number; y: number } | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    if (!open) return;
    setT({ x: 0, y: 0, s: 1 });
    return pushBackHandler(onClose);
  }, [open, onClose]);

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      const now = Date.now();
      if (now - lastTap.current < 280) setT((p) => (p.s > 1.2 ? { x: 0, y: 0, s: 1 } : { ...p, s: 2.2 }));
      lastTap.current = now;
    }
    const pts = [...pointers.current.values()];
    const [a, b] = pts;
    gesture.current = {
      dist: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
      s: t.s,
      cx: b ? (a.x + b.x) / 2 : a.x,
      cy: b ? (a.y + b.y) / 2 : a.y,
      x: t.x,
      y: t.y,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;
    if (pts.length >= 2 && g.dist > 0) {
      const [a, b] = pts;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const s = Math.min(6, Math.max(0.6, g.s * (dist / g.dist)));
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      setT({ s, x: g.x + (cx - g.cx), y: g.y + (cy - g.cy) });
    } else if (pts.length === 1) {
      const [a] = pts;
      setT((p) => ({ ...p, x: g.x + (a.x - g.cx), y: g.y + (a.y - g.cy) }));
    }
  };

  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    const pts = [...pointers.current.values()];
    gesture.current = pts.length
      ? { dist: 0, s: t.s, cx: pts[0].x, cy: pts[0].y, x: t.x, y: t.y }
      : null;
  };

  const onWheel = (e: React.WheelEvent) => {
    setT((p) => ({ ...p, s: Math.min(6, Math.max(0.6, p.s * (e.deltaY < 0 ? 1.1 : 0.9))) }));
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="chrome fixed inset-0 z-[60] flex flex-col bg-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Diagram"
        >
          <div className="pt-safe flex items-center justify-between px-3 py-2">
            <span className="pl-2 text-sm text-muted">Pinch or scroll to zoom · double-tap to reset</span>
            <button onClick={onClose} className="press flex h-11 w-11 items-center justify-center rounded-full" aria-label="Close diagram">
              <X size={22} />
            </button>
          </div>
          <div
            className="relative flex-1 touch-none overflow-hidden"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onWheel={onWheel}
          >
            <div
              className="mermaid-wrap absolute inset-0 flex items-center justify-center p-4"
              style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`, transformOrigin: 'center' }}
            >
              <div className="w-full [&_svg]:!max-h-none [&_svg]:!max-w-none [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default Mermaid;
