import { BookMarked, Compass, Home, Search } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { haptic } from '../lib/native';

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/learn', label: 'Learn', icon: Compass, end: false },
  { to: '/search', label: 'Search', icon: Search, end: false },
  { to: '/library', label: 'Library', icon: BookMarked, end: false },
];

export function TabBar() {
  return (
    <nav
      className="chrome fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/[0.97] backdrop-blur-xl"
      style={{ paddingBottom: 'var(--sab)' }}
      aria-label="Main"
    >
      <div className="mx-auto flex h-[var(--tabbar-h)] max-w-[560px] items-stretch justify-around px-2">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            replace
            onClick={() => haptic('selection')}
            className={({ isActive }) =>
              `press flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-ink' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={23} strokeWidth={isActive ? 2.3 : 1.8} aria-hidden />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
