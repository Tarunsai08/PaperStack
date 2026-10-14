import { Bell, ChevronRight, CloudDownload, Download, FilePlus2, Github, RefreshCw, RotateCcw, Smartphone, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BackHeader } from '../components/Headers';
import { Page } from '../components/Page';
import { ReaderSettings } from '../components/ReaderSettings';
import { REMOTE_BASE, syncContent } from '../lib/contentSync';
import { appVersion, haptic, isNative, openExternal, shareFile } from '../lib/native';
import { requestNotificationPermission } from '../lib/notifications';
import { exportData, importData, setPrefs, store, useStore } from '../lib/storage';
import { toast } from '../lib/toast';
import { checkForUpdate, GITHUB_REPO } from '../lib/updateCheck';
import { useContent } from '../lib/useContent';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="chrome mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</h2>
      <div className="overflow-hidden rounded-card border border-line bg-surface">{children}</div>
    </section>
  );
}

function Row({
  icon,
  label,
  detail,
  onClick,
  right,
}: {
  icon: ReactNode;
  label: string;
  detail?: ReactNode;
  onClick?: () => void;
  right?: ReactNode;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink/80">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {detail && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{detail}</span>}
      </span>
      {right ?? (onClick ? <ChevronRight size={18} className="shrink-0 text-muted" /> : null)}
    </>
  );
  const cls = 'chrome flex min-h-[60px] w-full items-center gap-3.5 border-b border-line px-4 py-2.5 text-left last:border-b-0';
  return onClick ? (
    <button onClick={onClick} className={`press ${cls}`}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        haptic('selection');
        onChange(!on);
      }}
      className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors ${on ? 'bg-[#10AC84]' : 'bg-line'}`}
    >
      <span className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[23px]' : 'left-[3px]'}`} />
    </button>
  );
}

function ago(iso: string | null): string {
  if (!iso) return 'never';
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

export default function Settings() {
  const prefs = useStore('prefs');
  const remote = useStore('remote');
  const content = useContent();
  const navigate = useNavigate();
  const [version, setVersion] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    appVersion().then(setVersion);
  }, []);

  const setReminder = async (on: boolean) => {
    if (!on) {
      setPrefs({ reminderTime: null });
      return;
    }
    const ok = await requestNotificationPermission();
    if (!ok && isNative()) {
      toast('Allow notifications for PaperStack in Android settings');
      return;
    }
    setPrefs({ reminderTime: prefs.reminderTime ?? '19:30' });
    if (!isNative()) toast('Reminders work in the Android app');
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const r = await syncContent({ force: true });
      if (r.skipped === 'no-remote') toast('This build has no content server configured');
      else if (r.skipped === 'offline') toast("You're offline");
      else toast(r.added || r.updated ? `${r.added} new, ${r.updated} updated` : "You're up to date");
    } catch {
      toast("Couldn't reach the content server");
    } finally {
      setSyncing(false);
    }
  };

  const checkUpdate = async () => {
    if (!isNative()) {
      toast('The web version updates itself automatically');
      return;
    }
    setChecking(true);
    const r = await checkForUpdate({ force: true });
    setChecking(false);
    if (r.status === 'current') toast("You're on the latest version");
    else if (r.status === 'error') toast(`Couldn't check: ${r.message ?? 'network error'}`);
    else if (r.status === 'skipped' && r.message) toast(r.message);
  };

  const onImportFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      importData(await f.text());
      toast('Your data was restored');
    } catch (e) {
      toast((e as Error).message || 'That file could not be read');
    }
  };

  return (
    <Page>
      <BackHeader title="Settings" />
      <div className="mx-auto max-w-read space-y-8 px-4 pb-16 pt-6">
        <Group title="Reading">
          <div className="p-4">
            <ReaderSettings />
          </div>
        </Group>

        <Group title="Daily reminder">
          <Row
            icon={<Bell size={18} />}
            label="Remind me to read"
            detail={prefs.reminderTime ? 'A gentle nudge with your next article' : 'Off'}
            right={<Toggle on={!!prefs.reminderTime} onChange={setReminder} label="Daily reminder" />}
          />
          {prefs.reminderTime && (
            <Row
              icon={<span className="text-[13px] font-bold">⏰</span>}
              label="Time"
              right={
                <input
                  type="time"
                  value={prefs.reminderTime}
                  onChange={(e) => e.target.value && setPrefs({ reminderTime: e.target.value })}
                  className="h-10 rounded-lg border border-line bg-bg px-2 text-[15px]"
                  aria-label="Reminder time"
                />
              }
            />
          )}
        </Group>

        <Group title="Content">
          <Row
            icon={<CloudDownload size={18} />}
            label="Download new articles"
            detail={REMOTE_BASE ? `Checks for new articles every few hours. Last check ${ago(remote.lastSyncAt)}.` : 'Not configured in this build'}
            right={<Toggle on={prefs.syncEnabled} onChange={(v) => setPrefs({ syncEnabled: v })} label="Content sync" />}
          />
          <Row
            icon={<RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />}
            label="Check now"
            detail={`${content.path.length} articles · content ${(remote.contentVersion ?? content.bundledVersion ?? '').slice(0, 8)}`}
            onClick={syncNow}
          />
          <Row icon={<FilePlus2 size={18} />} label="Import an article" detail="Bring in a paper written by any chatbot" onClick={() => navigate('/import')} />
        </Group>

        <Group title="App">
          <Row
            icon={<Smartphone size={18} />}
            label="Check for app update"
            detail={`Version ${version}${isNative() ? '' : ' (web)'}`}
            onClick={checkUpdate}
            right={checking ? <RefreshCw size={18} className="animate-spin text-muted" /> : undefined}
          />
          {GITHUB_REPO && (
            <Row icon={<Github size={18} />} label="Project on GitHub" detail={GITHUB_REPO} onClick={() => openExternal(`https://github.com/${GITHUB_REPO}`)} />
          )}
        </Group>

        <Group title="Your data">
          <Row
            icon={<Download size={18} />}
            label="Export my data"
            detail="Progress, highlights, notes, imports as JSON"
            onClick={() => shareFile(`paperstack-backup-${new Date().toISOString().slice(0, 10)}.json`, exportData(), 'application/json')}
          />
          <Row icon={<Upload size={18} />} label="Restore from a backup" detail="Replaces the data on this device" onClick={() => fileRef.current?.click()} />
          <Row
            icon={<RotateCcw size={18} />}
            label="Show the welcome screens again"
            onClick={() => {
              setPrefs({ onboarded: false });
              navigate('/onboarding', { replace: true });
            }}
          />
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0])} />
        </Group>

        <Group title="Danger zone">
          <Row
            icon={<RotateCcw size={18} className="text-[#E5484D]" />}
            label="Reset reading progress"
            detail="Keeps highlights, saved articles and imports"
            onClick={() => {
              if (!confirm('Reset all reading progress, quiz scores and your streak?')) return;
              store.update('progress', () => ({}));
              store.update('quiz', () => ({}));
              store.update('streak', () => ({ current: 0, best: 0, lastActiveDate: null, day: null, daySeconds: 0 }));
              store.update('meta', (m) => ({ ...m, completedTracks: [] }));
              toast('Progress reset');
            }}
          />
        </Group>

        <div className="chrome pt-2 text-center text-[13px] leading-relaxed text-muted">
          <p className="font-semibold text-ink">PaperStack {version}</p>
          <p>Learn AI from the papers that built it.</p>
          <p className="mt-2">
            <Link to="/learn" className="text-brand-ink underline underline-offset-2">
              Go to your learning path
            </Link>
          </p>
        </div>
      </div>
    </Page>
  );
}
