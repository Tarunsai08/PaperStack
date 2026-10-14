import { AnimatePresence } from 'framer-motion';
import { lazy, Suspense, useEffect, useRef } from 'react';
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Celebration } from './components/Celebration';
import { ListSkeleton } from './components/Skeleton';
import { TabBar } from './components/TabBar';
import { Toaster } from './components/Toaster';
import { UpdatePrompt } from './components/UpdatePrompt';
import { handleOverlayBack } from './lib/backStack';
import { syncContent } from './lib/contentSync';
import { exitApp, isNative } from './lib/native';
import { initNotifications, rescheduleReminder } from './lib/notifications';
import { store, useStore } from './lib/storage';
import { useApplyTheme } from './lib/theme';
import { toast } from './lib/toast';
import { ContentProvider, useContent } from './lib/useContent';
import Home from './pages/Home';

const Learn = lazy(() => import('./pages/Learn'));
const Track = lazy(() => import('./pages/Track'));
const Article = lazy(() => import('./pages/Article'));
const Search = lazy(() => import('./pages/Search'));
const Library = lazy(() => import('./pages/Library'));
const Import = lazy(() => import('./pages/Import'));
const Settings = lazy(() => import('./pages/Settings'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

const TAB_ROOTS = ['/', '/learn', '/search', '/library'];

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const loc = useRef(location);
  loc.current = location;

  useEffect(() => {
    if (!isNative()) return;
    let remove: (() => void) | undefined;
    (async () => {
      const { App } = await import('@capacitor/app');
      const h = await App.addListener('backButton', () => {
        if (handleOverlayBack()) return;
        const path = loc.current.pathname;
        if (path === '/' || path === '/onboarding') {
          exitApp();
        } else if (TAB_ROOTS.includes(path)) {
          navigate('/', { replace: true });
        } else if (window.history.length > 1 && loc.current.key !== 'default') {
          navigate(-1);
        } else {
          navigate('/', { replace: true });
        }
      });
      const s = await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) store.flush();
      });
      remove = () => {
        h.remove();
        s.remove();
      };
    })();
    return () => remove?.();
  }, [navigate]);

  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && store.flush();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);
  return null;
}

function LaunchTasks() {
  const content = useContent();
  const prefs = useStore('prefs');
  const progress = useStore('progress');
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (!content.ready || ran.current) return;
    ran.current = true;
    syncContent({ bundledVersion: content.bundledVersion })
      .then((r) => {
        if (r.added > 0) toast(`${r.added} new article${r.added === 1 ? '' : 's'} arrived`);
      })
      .catch(() => undefined);
    initNotifications((id) => navigate(`/article/${id}`));
  }, [content.ready, content.bundledVersion, navigate]);

  // Keep the daily reminder pointing at the next article on the path.
  useEffect(() => {
    if (!content.ready) return;
    rescheduleReminder(prefs.reminderTime, content.path, progress);
  }, [content.ready, content.path, prefs.reminderTime, progress]);

  return null;
}

function Shell() {
  useApplyTheme();
  const location = useLocation();
  const prefs = useStore('prefs');
  const { error } = useContent();
  const showTabs = TAB_ROOTS.includes(location.pathname);

  if (!prefs.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <BackButtonHandler />
      <LaunchTasks />
      <div className={showTabs ? 'pb-[calc(var(--tabbar-h)+var(--sab)+16px)]' : ''}>
        {error && (
          <div className="mx-4 mt-4 rounded-xl border border-line bg-surface-2 p-4 text-sm pt-safe">
            Content could not be loaded: {error}
          </div>
        )}
        <Suspense
          fallback={
            <div className="mx-auto max-w-[680px] px-4 pt-safe">
              <div className="h-16" />
              <ListSkeleton rows={5} />
            </div>
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/track/:id" element={<Track />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/import" element={<Import />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      {showTabs && <TabBar />}
      <Toaster aboveTabs={showTabs} />
      <UpdatePrompt />
      <Celebration />
    </>
  );
}

export default function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ContentProvider>
        <Shell />
      </ContentProvider>
    </HashRouter>
  );
}
