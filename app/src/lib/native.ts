/**
 * Thin wrappers around Capacitor plugins. Every function is safe to call on
 * the web, where it either falls back to a browser API or does nothing.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();

type HapticKind = 'light' | 'medium' | 'success' | 'warning' | 'error' | 'selection';

export async function haptic(kind: HapticKind = 'light'): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (kind === 'light') await Haptics.impact({ style: ImpactStyle.Light });
    else if (kind === 'medium') await Haptics.impact({ style: ImpactStyle.Medium });
    else if (kind === 'selection') await Haptics.selectionChanged();
    else
      await Haptics.notification({
        type:
          kind === 'success'
            ? NotificationType.Success
            : kind === 'warning'
              ? NotificationType.Warning
              : NotificationType.Error,
      });
  } catch {
    /* haptics are a nicety */
  }
}

export async function share(opts: { title: string; text?: string; url?: string }): Promise<boolean> {
  try {
    if (isNative()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: opts.title, text: opts.text, url: opts.url, dialogTitle: 'Share article' });
      return true;
    }
    if (navigator.share) {
      await navigator.share(opts);
      return true;
    }
    await navigator.clipboard?.writeText([opts.title, opts.text, opts.url].filter(Boolean).join('\n'));
    return false;
  } catch {
    return false;
  }
}

/** Save or share a text file (Export .md). */
export async function shareFile(filename: string, content: string, mime = 'text/markdown'): Promise<void> {
  if (isNative()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const res = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title: filename, files: [res.uri], dialogTitle: 'Save or share file' });
    return;
  }
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener');
}

/** Open a download (APK) in the system browser so Android's installer takes over. */
export async function openInSystemBrowser(url: string): Promise<void> {
  // Chrome Custom Tabs hand APK downloads to the system download manager.
  return openExternal(url);
}

export async function setStatusBar(theme: 'light' | 'dark' | 'sepia', bg: string): Promise<void> {
  if (!isNative()) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    return;
  }
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: bg });
  } catch {
    /* not fatal */
  }
}

/** Apply Android's system font size to the WebView, so the app respects accessibility settings. */
export async function applySystemTextZoom(): Promise<void> {
  if (!isNative()) return;
  try {
    const { TextZoom } = await import('@capacitor/text-zoom');
    const { value } = await TextZoom.getPreferred();
    if (value && Math.abs(value - 1) > 0.01) await TextZoom.set({ value });
  } catch {
    /* keep the default size */
  }
}

export async function hideSplash(): Promise<void> {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    /* ignore */
  }
}

export async function appVersion(): Promise<string> {
  const built = import.meta.env.VITE_APP_VERSION as string | undefined;
  if (isNative()) {
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      return info.version || built || '1.0.0';
    } catch {
      /* fall through */
    }
  }
  return built || '1.0.0-dev';
}

export async function exitApp(): Promise<void> {
  if (!isNative()) return;
  const { App } = await import('@capacitor/app');
  await App.exitApp();
}
