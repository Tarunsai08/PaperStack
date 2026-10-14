import { useEffect, useState } from 'react';
import { setStatusBar } from './native';
import { useStore, type Prefs } from './storage';

export type ResolvedTheme = 'light' | 'dark' | 'sepia';

export const THEME_BG: Record<ResolvedTheme, string> = {
  light: '#FFFFFF',
  dark: '#111111',
  sepia: '#F7F1E3',
};

const darkQuery = () => (typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : undefined);

export function resolveTheme(pref: Prefs['theme'], systemDark: boolean): ResolvedTheme {
  if (pref === 'system') return systemDark ? 'dark' : 'light';
  return pref;
}

export function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => !!darkQuery()?.matches);
  useEffect(() => {
    const q = darkQuery();
    if (!q) return;
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return dark;
}

export function useResolvedTheme(): ResolvedTheme {
  const prefs = useStore('prefs');
  const systemDark = useSystemDark();
  return resolveTheme(prefs.theme, systemDark);
}

/** Applies theme + reading preferences to <html>. Mount once. */
export function useApplyTheme(): ResolvedTheme {
  const prefs = useStore('prefs');
  const theme = useResolvedTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    setStatusBar(theme, THEME_BG[theme]);
    try {
      localStorage.setItem('ps-theme', prefs.theme);
    } catch {
      /* private mode */
    }
  }, [theme, prefs.theme]);

  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty('--read-size', `${prefs.fontSize}px`);
    s.setProperty('--read-leading', String(prefs.lineHeight));
    s.setProperty(
      '--read-font',
      prefs.font === 'serif'
        ? "'Literata Variable', Literata, Georgia, serif"
        : "'Inter Variable', Inter, system-ui, sans-serif",
    );
  }, [prefs.fontSize, prefs.lineHeight, prefs.font]);

  return theme;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const q = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!q) return;
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return reduced;
}
