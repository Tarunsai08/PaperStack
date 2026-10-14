/**
 * Daily reading reminder via Capacitor Local Notifications (Android only).
 */
import { isNative } from './native';
import { nextInPath } from './progress';
import type { ProgressEntry } from './storage';
import type { Article } from './types';

const REMINDER_ID = 1001;
let lastSignature = '';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative()) {
    if (typeof Notification === 'undefined') return false;
    return (await Notification.requestPermission()) === 'granted';
  }
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const cur = await LocalNotifications.checkPermissions();
  if (cur.display === 'granted') return true;
  const res = await LocalNotifications.requestPermissions();
  return res.display === 'granted';
}

export function reminderBody(next: Article | undefined): { title: string; body: string } {
  if (!next) return { title: 'Keep your streak going', body: 'Revisit a favourite article or take a quiz again.' };
  return { title: 'Your daily read is ready', body: `Up next: ${next.title} · ${next.read_minutes} min` };
}

export async function rescheduleReminder(
  time: string | null,
  path: Article[],
  progress: Record<string, ProgressEntry>,
): Promise<void> {
  if (!isNative()) return;
  const next = nextInPath(path, progress);
  const sig = `${time}|${next?.id ?? ''}`;
  if (sig === lastSignature) return;
  lastSignature = sig;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    if (!time) return;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    const [hour, minute] = time.split(':').map(Number);
    const { title, body } = reminderBody(next);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title,
          body,
          schedule: { on: { hour, minute }, allowWhileIdle: true },
          extra: { articleId: next?.id ?? null },
          smallIcon: 'ic_stat_paperstack',
          iconColor: '#FF6719',
        },
      ],
    });
  } catch (e) {
    lastSignature = '';
    console.warn('PaperStack: could not schedule reminder', e);
  }
}

let listening = false;

export async function initNotifications(open: (articleId: string) => void): Promise<void> {
  if (!isNative() || listening) return;
  listening = true;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.addListener('localNotificationActionPerformed', (ev) => {
    const id = ev.notification.extra?.articleId as string | undefined;
    if (id) open(id);
  });
}
