import { memo, useId, useMemo, type ReactElement } from 'react';

/** Deterministic PRNG so the same seed always draws the same cover. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.replace(/./g, '$&$&') : m, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsla(${((h % 360) + 360) % 360}, ${Math.max(0, Math.min(100, s))}%, ${Math.max(0, Math.min(100, l))}%, ${a})`;

export const MOTIFS = ['rings', 'dots', 'waves', 'network', 'blocks', 'arcs'] as const;
export type Motif = (typeof MOTIFS)[number];

const W = 320;
const H = 180;

function drawMotif(motif: Motif, rnd: () => number, ink: string): ReactElement[] {
  const els: ReactElement[] = [];
  switch (motif) {
    case 'rings': {
      const cx = W * (0.55 + rnd() * 0.35);
      const cy = H * (0.3 + rnd() * 0.5);
      const step = 14 + rnd() * 10;
      const n = 9;
      for (let i = 1; i <= n; i++) {
        els.push(
          <circle key={i} cx={cx} cy={cy} r={i * step} fill="none" stroke={ink} strokeWidth={1.4} opacity={0.75 - i * 0.065} />,
        );
      }
      els.push(<circle key="c" cx={cx} cy={cy} r={step * 0.45} fill={ink} opacity={0.85} />);
      break;
    }
    case 'dots': {
      const fx = W * (0.5 + rnd() * 0.4);
      const fy = H * rnd();
      const gap = 14 + Math.floor(rnd() * 4);
      for (let x = gap / 2; x < W; x += gap) {
        for (let y = gap / 2; y < H; y += gap) {
          const d = Math.hypot(x - fx, y - fy) / Math.hypot(W, H);
          const r = Math.max(0, 4.6 * (1 - d * 1.7));
          if (r > 0.35) els.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={ink} opacity={0.8} />);
        }
      }
      break;
    }
    case 'waves': {
      const lines = 9;
      const amp = 10 + rnd() * 14;
      const freq = 1.2 + rnd() * 1.6;
      const phase = rnd() * Math.PI * 2;
      for (let i = 0; i < lines; i++) {
        const y0 = H * 0.18 + i * (H * 0.09);
        let d = `M 0 ${y0}`;
        for (let x = 0; x <= W; x += 8) {
          const y = y0 + Math.sin((x / W) * Math.PI * 2 * freq + phase + i * 0.35) * amp * (0.5 + i / lines);
          d += ` L ${x} ${y.toFixed(1)}`;
        }
        els.push(<path key={i} d={d} fill="none" stroke={ink} strokeWidth={1.6} opacity={0.25 + (i / lines) * 0.6} />);
      }
      break;
    }
    case 'network': {
      const n = 11 + Math.floor(rnd() * 5);
      const pts = Array.from({ length: n }, () => [W * (0.08 + rnd() * 0.9), H * (0.08 + rnd() * 0.84)] as const);
      pts.forEach((p, i) => {
        pts.forEach((q, j) => {
          if (j <= i) return;
          const dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
          if (dist < 105) {
            els.push(
              <line key={`l${i}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={ink} strokeWidth={1.1} opacity={0.55 - dist / 260} />,
            );
          }
        });
      });
      pts.forEach((p, i) =>
        els.push(<circle key={`n${i}`} cx={p[0]} cy={p[1]} r={2.5 + rnd() * 4} fill={ink} opacity={0.9} />),
      );
      break;
    }
    case 'blocks': {
      const x0 = W * (0.42 + rnd() * 0.2);
      const y0 = H * 0.2;
      const bw = 110 + rnd() * 40;
      const bh = 62;
      for (let i = 0; i < 5; i++) {
        els.push(
          <rect
            key={i}
            x={x0 + i * 12}
            y={y0 + i * 16}
            width={bw}
            height={bh}
            rx={9}
            fill={ink}
            opacity={0.14 + i * 0.13}
            stroke={ink}
            strokeOpacity={0.4}
          />,
        );
      }
      break;
    }
    case 'arcs': {
      const cx = W * (0.1 + rnd() * 0.25);
      const cy = H * (0.95 + rnd() * 0.1);
      for (let i = 0; i < 12; i++) {
        const r = 40 + i * 20;
        const sweep = 0.45 + rnd() * 0.5;
        const a0 = -Math.PI / 2 - sweep;
        const a1 = -Math.PI / 2 + sweep * 0.9;
        const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
        const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
        els.push(
          <path
            key={i}
            d={`M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${r} ${r} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`}
            fill="none"
            stroke={ink}
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={0.85 - i * 0.055}
          />,
        );
      }
      break;
    }
  }
  return els;
}

export interface CoverArtProps {
  seed: string;
  accent: string;
  className?: string;
  /** Rounded corners are applied by the parent; this only controls the SVG. */
  title?: string;
}

function CoverArtImpl({ seed, accent, className, title }: CoverArtProps) {
  const uid = useId().replace(/:/g, '');
  const art = useMemo(() => {
    const rnd = seededRandom(seed);
    const [h, s, l] = hexToHsl(accent);
    const shift = (rnd() - 0.5) * 60;
    const angle = Math.floor(rnd() * 360);
    const motif = MOTIFS[Math.floor(rnd() * MOTIFS.length)];
    const c1 = hsl(h, s * 0.95, Math.max(18, l - 20));
    const c2 = hsl(h + shift, Math.min(95, s + 5), Math.min(68, l + 6));
    const c3 = hsl(h - shift * 0.6, s * 0.9, Math.max(14, l - 28));
    const glow = { x: 0.2 + rnd() * 0.6, y: 0.1 + rnd() * 0.5 };
    const els = drawMotif(motif, rnd, 'white');
    return { angle, c1, c2, c3, glow, els, motif };
  }, [seed, accent]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-motif={art.motif}
    >
      <defs>
        <linearGradient id={`g${uid}`} gradientTransform={`rotate(${art.angle} 0.5 0.5)`}>
          <stop offset="0" stopColor={art.c1} />
          <stop offset="0.55" stopColor={art.c2} />
          <stop offset="1" stopColor={art.c3} />
        </linearGradient>
        <radialGradient id={`r${uid}`} cx={art.glow.x} cy={art.glow.y} r="0.7">
          <stop offset="0" stopColor="white" stopOpacity="0.38" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`v${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor="black" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#g${uid})`} />
      <rect width={W} height={H} fill={`url(#r${uid})`} />
      <g opacity={0.5}>{art.els}</g>
      <rect width={W} height={H} fill={`url(#v${uid})`} />
    </svg>
  );
}

export const CoverArt = memo(CoverArtImpl);
export default CoverArt;
