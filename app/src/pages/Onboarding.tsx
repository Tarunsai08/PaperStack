import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { BellOff, BookOpenCheck, Brain, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoverArt } from '../components/CoverArt';
import { haptic } from '../lib/native';
import { requestNotificationPermission } from '../lib/notifications';
import { setPrefs } from '../lib/storage';
import { useContent } from '../lib/useContent';
import { Logo } from './Home';

const TIMES = [
  { t: '08:00', label: 'Morning', sub: '8:00' },
  { t: '13:00', label: 'Lunch', sub: '13:00' },
  { t: '19:30', label: 'Evening', sub: '19:30' },
  { t: '22:00', label: 'Night', sub: '22:00' },
];

export default function Onboarding() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [time, setTime] = useState<string | null>('19:30');
  const navigate = useNavigate();
  const { tracks, path } = useContent();

  const go = (n: number) => {
    if (n < 0 || n > 2) return;
    setDir(n > i ? 1 : -1);
    setI(n);
    haptic('selection');
  };

  const finish = async () => {
    if (time) await requestNotificationPermission().catch(() => false);
    setPrefs({ onboarded: true, reminderTime: time });
    haptic('success');
    navigate('/', { replace: true });
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) go(i + 1);
    else if (info.offset.x > 60) go(i - 1);
  };

  const slides = [
    <div key="0" className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="absolute -inset-10 rounded-full bg-brand/15 blur-3xl" />
        <Logo size={96} />
      </div>
      <h1 className="mt-10 font-serif text-[32px] font-semibold leading-[1.15] tracking-[-0.015em]">
        Learn AI from the papers that built it
      </h1>
      <p className="mt-4 max-w-[340px] text-[16px] leading-relaxed text-muted">
        {path.length || 52} short, story-driven articles take you from Turing's 1950 question to the systems behind today's chatbots. No
        background needed.
      </p>
    </div>,
    <div key="1" className="flex flex-col items-center text-center">
      <div className="w-full max-w-[320px] space-y-2.5">
        {tracks.slice(0, 5).map((t, n) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * n }}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-left shadow-card"
          >
            <CoverArt seed={`track-${t.id}`} accent={t.accent} className="h-10 w-10 shrink-0 rounded-xl" />
            <span className="text-[14.5px] font-semibold">{t.title}</span>
          </motion.div>
        ))}
      </div>
      <h1 className="mt-10 font-serif text-[30px] font-semibold leading-[1.15] tracking-[-0.015em]">One path, one article at a time</h1>
      <div className="mt-5 max-w-[340px] space-y-3 text-left text-[15px] leading-snug text-muted">
        <p className="flex gap-3">
          <Brain size={20} className="mt-0.5 shrink-0 text-brand" /> Ten primers build your intuition before the first paper.
        </p>
        <p className="flex gap-3">
          <Sparkles size={20} className="mt-0.5 shrink-0 text-brand" /> Tap underlined terms for instant definitions. Long-press to
          highlight.
        </p>
        <p className="flex gap-3">
          <BookOpenCheck size={20} className="mt-0.5 shrink-0 text-brand" /> Each article ends with a 3-question quiz to lock it in.
        </p>
      </div>
    </div>,
    <div key="2" className="flex flex-col items-center text-center">
      <h1 className="font-serif text-[30px] font-semibold leading-[1.15] tracking-[-0.015em]">Make it a habit</h1>
      <p className="mt-3 max-w-[330px] text-[16px] leading-relaxed text-muted">
        Ten minutes a day gets you through the whole path in about two months. When should we remind you?
      </p>
      <div className="mt-8 grid w-full max-w-[340px] grid-cols-2 gap-3" role="radiogroup" aria-label="Reminder time">
        {TIMES.map((o) => (
          <button
            key={o.t}
            role="radio"
            aria-checked={time === o.t}
            onClick={() => {
              haptic('selection');
              setTime(o.t);
            }}
            className={`press flex h-[74px] flex-col items-center justify-center rounded-2xl border text-[15px] font-semibold ${
              time === o.t ? 'border-brand bg-brand/10 ring-1 ring-brand' : 'border-line bg-surface'
            }`}
          >
            {o.label}
            <span className="mt-0.5 text-[13px] font-medium text-muted">{o.sub}</span>
          </button>
        ))}
      </div>
      <button
        role="radio"
        aria-checked={time === null}
        onClick={() => setTime(null)}
        className={`press mt-3 flex h-12 w-full max-w-[340px] items-center justify-center gap-2 rounded-2xl border text-[14px] font-semibold ${
          time === null ? 'border-ink' : 'border-line text-muted'
        }`}
      >
        <BellOff size={16} /> No reminders
      </button>
    </div>,
  ];

  return (
    <main className="chrome flex min-h-[100dvh] flex-col bg-bg pt-safe pb-safe">
      <div className="flex h-14 items-center justify-end px-3">
        {i < 2 && (
          <button onClick={() => go(2)} className="press h-11 px-4 text-[15px] font-semibold text-muted">
            Skip
          </button>
        )}
      </div>
      <div className="relative flex flex-1 items-center overflow-hidden px-7">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={i}
            custom={dir}
            className="w-full touch-pan-y"
            initial={{ opacity: 0, x: 60 * dir }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 * dir }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={onDragEnd}
          >
            {slides[i]}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="px-7 pb-8 pt-4">
        <div className="mb-6 flex justify-center gap-2" aria-hidden>
          {[0, 1, 2].map((n) => (
            <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-ink' : 'w-2 bg-line'}`} />
          ))}
        </div>
        <button
          onClick={() => (i < 2 ? go(i + 1) : finish())}
          className="press mx-auto flex h-14 w-full max-w-[400px] items-center justify-center rounded-full bg-brand-btn text-[16px] font-semibold text-white"
        >
          {i < 2 ? 'Continue' : 'Start reading'}
        </button>
      </div>
    </main>
  );
}
