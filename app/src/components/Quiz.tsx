import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { haptic } from '../lib/native';
import { store, useStore } from '../lib/storage';
import type { QuizItem } from '../lib/types';

interface Props {
  articleId: string;
  quiz: QuizItem[];
  onFinish: (score: number) => void;
}

export function Quiz({ articleId, quiz, onFinish }: Props) {
  const saved = useStore('quiz')[articleId];
  const [retake, setRetake] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);

  const showSummary = saved && !retake;

  if (showSummary) {
    return (
      <section className="chrome rounded-card border border-line bg-surface p-5 shadow-card" aria-label="Quiz result">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Quiz</p>
        <p className="mt-1 text-[20px] font-semibold">
          You scored {saved.score} of {quiz.length}
        </p>
        <p className="mt-1 text-[14px] text-muted">
          {saved.score === quiz.length ? 'Perfect. You clearly got it.' : 'Good effort. A quick re-read of the key sections will lock it in.'}
        </p>
        <button
          onClick={() => {
            setRetake(true);
            setIdx(0);
            setAnswers([]);
            setPicked(null);
          }}
          className="press mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-[14px] font-semibold"
        >
          <RotateCcw size={16} /> Retake quiz
        </button>
      </section>
    );
  }

  const q = quiz[idx];
  const answered = picked !== null;
  const correct = picked === q.answer;

  const choose = (i: number) => {
    if (answered) return;
    setPicked(i);
    haptic(i === q.answer ? 'success' : 'error');
  };

  const next = () => {
    const all = [...answers, picked as number];
    if (idx + 1 < quiz.length) {
      setAnswers(all);
      setIdx(idx + 1);
      setPicked(null);
      return;
    }
    const score = all.filter((a, i) => a === quiz[i].answer).length;
    store.update('quiz', (prev) => ({ ...prev, [articleId]: { score, answers: all, takenAt: new Date().toISOString() } }));
    setRetake(false);
    onFinish(score);
  };

  return (
    <section className="chrome rounded-card border border-line bg-surface p-5 shadow-card" aria-label="Quiz">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Check your understanding</p>
        <p className="text-[12px] font-semibold text-muted">
          {idx + 1} / {quiz.length}
        </p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {quiz.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? 'bg-brand' : 'bg-line'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <p className="mt-4 font-serif text-[19px] font-semibold leading-snug">{q.q}</p>
          <div className="mt-4 space-y-2.5" role="radiogroup">
            {q.options.map((opt, i) => {
              const isAnswer = i === q.answer;
              const isPicked = i === picked;
              let cls = 'border-line bg-bg';
              if (answered && isAnswer) cls = 'border-[#10AC84] bg-[#10AC84]/10';
              else if (answered && isPicked) cls = 'border-[#E5484D] bg-[#E5484D]/10';
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={isPicked}
                  disabled={answered}
                  onClick={() => choose(i)}
                  className={`press flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-snug transition-colors ${cls}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-[12px] font-semibold text-muted">
                    {answered && isAnswer ? (
                      <Check size={14} className="text-[#10AC84]" strokeWidth={3} />
                    ) : answered && isPicked ? (
                      <X size={14} className="text-[#E5484D]" strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-xl bg-surface-2 p-4 text-[14.5px] leading-relaxed" aria-live="polite">
                  <p className="font-semibold">{correct ? 'Correct!' : 'Not quite.'}</p>
                  <p className="mt-1 text-ink/85">{q.explain}</p>
                </div>
                <button
                  onClick={next}
                  className="press mt-4 h-12 w-full rounded-full bg-brand-btn text-[15px] font-semibold text-white"
                >
                  {idx + 1 < quiz.length ? 'Next question' : 'Finish quiz'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
