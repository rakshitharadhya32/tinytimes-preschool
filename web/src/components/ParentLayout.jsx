import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, Newspaper, Users, Receipt, LogOut, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { pushSupported, getPushStatus, enablePush, disablePush } from '../lib/push';

const navItems = [
  { to: '/parent', label: 'Home', icon: Home, end: true },
  { to: '/parent/feed', label: 'Feed', icon: Newspaper },
  { to: '/parent/children', label: 'My Kids', icon: Users },
  { to: '/parent/billing', label: 'Billing', icon: Receipt },
];

export default function ParentLayout() {
  const { user, logout } = useAuth();
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    if (!pushSupported()) return;
    getPushStatus().then((s) => setPushOn(s.subscribed));
  }, []);

  async function togglePush() {
    setPushBusy(true);
    setPushError('');
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
      } else {
        await enablePush();
        setPushOn(true);
      }
    } catch (err) {
      setPushError(err.message || 'Could not update notification settings');
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="relative mx-auto flex h-screen max-w-md flex-col overflow-hidden bg-gradient-to-b from-brand-50 to-sprout-50">
      <header className="relative z-10 flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <img src="/logo-wordmark.png" alt="TinyTimes Preschool" className="h-9 w-auto" />
        <div className="flex items-center gap-2">
          {pushSupported() && (
            <button
              onClick={togglePush}
              disabled={pushBusy}
              title={pushOn ? 'Notifications on — tap to turn off' : 'Turn on notifications'}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                pushOn ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'
              } disabled:opacity-50`}
            >
              {pushOn ? <Bell size={16} /> : <BellOff size={16} />}
            </button>
          )}
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      {pushError && (
        <p className="relative z-10 bg-red-50 px-4 py-1.5 text-center text-xs text-red-500">{pushError}</p>
      )}

      <main className="relative z-10 flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t border-slate-200 bg-white py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-semibold ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            <Icon size={21} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
