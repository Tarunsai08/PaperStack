import { Minus, Plus } from 'lucide-react';
import { haptic } from '../lib/native';
import { setPrefs, useStore, type ThemePref } from '../lib/storage';

const THEMES: { id: ThemePref; label: string; bg: string; fg: string }[] = [
  { id: 'light', label: 'Light', bg: '#FFFFFF', fg: '#1A1A1A' },
  { id: 'sepia', label: 'Sepia', bg: '#F7F1E3', fg: '#3B2F2A' },
  { id: 'dark', label: 'Dark', bg: '#111111', fg: '#ECECEC' },
  { id: 'system', label: 'System', bg: 'linear-gradient(135deg, #FFFFFF 50%, #111111 50%)', fg: '#888' },
];

const LEADING = [
  { v: 1.5, label: 'Compact' },
  { v: 1.7, label: 'Normal' },
  { v: 1.9, label: 'Airy' },
];

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex rounded-full bg-surface-2 p-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => {
            haptic('selection');
            onChange(o.v);
          }}
          className={`press h-10 flex-1 rounded-full text-[14px] font-semibold transition-colors ${
            value === o.v ? 'bg-surface text-ink shadow-card' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ReaderSettings() {
  const prefs = useStore('prefs');
  const setSize = (n: number) => {
    const v = Math.max(16, Math.min(24, n));
    if (v !== prefs.fontSize) haptic('selection');
    setPrefs({ fontSize: v });
  };
  return (
    <div className="space-y-6 pb-3">
      <div>
        <p className="mb-2.5 text-[13px] font-semibold text-muted">Theme</p>
        <div className="grid grid-cols-4 gap-2.5" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={prefs.theme === t.id}
              onClick={() => {
                haptic('selection');
                setPrefs({ theme: t.id });
                try {
                  localStorage.setItem('ps-theme', t.id);
                } catch {
                  /* private mode */
                }
              }}
              className="press flex flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-12 w-full items-center justify-center rounded-xl border font-serif text-[18px] font-semibold ${
                  prefs.theme === t.id ? 'border-brand ring-2 ring-brand/40' : 'border-line'
                }`}
                style={{ background: t.bg, color: t.fg }}
              >
                Aa
              </span>
              <span className="text-[12.5px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[13px] font-semibold text-muted">Font</p>
        <Segmented
          label="Font"
          value={prefs.font}
          options={[
            { v: 'serif', label: 'Serif' },
            { v: 'sans', label: 'Sans' },
          ]}
          onChange={(v) => setPrefs({ font: v })}
        />
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-muted">Text size</p>
          <p className="text-[13px] font-semibold">{prefs.fontSize}px</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSize(prefs.fontSize - 1)}
            className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line"
            aria-label="Smaller text"
          >
            <Minus size={18} />
          </button>
          <input
            type="range"
            min={16}
            max={24}
            step={1}
            value={prefs.fontSize}
            onChange={(e) => setSize(Number(e.target.value))}
            className="h-11 flex-1 accent-[rgb(var(--brand))]"
            aria-label="Text size"
          />
          <button
            onClick={() => setSize(prefs.fontSize + 1)}
            className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line"
            aria-label="Larger text"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-[13px] font-semibold text-muted">Line spacing</p>
        <Segmented
          label="Line spacing"
          value={prefs.lineHeight}
          options={LEADING.map((l) => ({ v: l.v, label: l.label }))}
          onChange={(v) => setPrefs({ lineHeight: v })}
        />
      </div>

      <p className="rounded-xl bg-surface-2 p-3.5 text-center font-[var(--read-font)] text-[var(--read-size)] leading-[var(--read-leading)]" style={{ fontFamily: 'var(--read-font)' }}>
        The quick brown fox learns a little more every day.
      </p>
    </div>
  );
}
