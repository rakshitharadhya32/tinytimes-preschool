import { NavLink, Outlet } from 'react-router-dom';
import { Home, Newspaper, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/parent', label: 'Home', icon: Home, end: true },
  { to: '/parent/feed', label: 'Feed', icon: Newspaper },
  { to: '/parent/children', label: 'My Kids', icon: Users },
];

export default function ParentLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col bg-brand-50">
      <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <img src="/logo-wordmark.png" alt="TinyTimes Preschool" className="h-9 w-auto" />
        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md justify-around border-t border-slate-200 bg-white py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-5 py-1.5 text-[11px] font-medium ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
