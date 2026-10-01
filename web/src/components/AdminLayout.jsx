import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Briefcase,
  ClipboardCheck,
  Megaphone,
  School,
  Receipt,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/enrollment', label: 'Enrollment', icon: UserPlus },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/classrooms', label: 'Classrooms', icon: School },
  { to: '/admin/staff', label: 'Staff', icon: Briefcase },
  { to: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/billing', label: 'Billing', icon: Receipt },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-[#fdf9f4]">
      <aside className="hidden w-64 flex-col border-r border-slate-100 bg-white md:flex">
        <div className="px-5 py-5">
          <img src="/logo-wordmark.png" alt="TinyTimes Preschool" className="h-10 w-auto" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-200'
                    : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-heading text-sm font-bold text-brand-700">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{user?.name}</p>
              <p className="truncate text-xs capitalize text-slate-400">{user?.role} &middot; {user?.title || ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar + bottom nav for admin/staff on small screens */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2.5 md:hidden">
          <img src="/logo-wordmark.png" alt="TinyTimes Preschool" className="h-8 w-auto" />
          <button onClick={logout} className="text-sm font-medium text-slate-500">Sign out</button>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 flex gap-1 overflow-x-auto border-t border-slate-100 bg-white px-1 py-2 md:hidden">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 text-[10px] font-semibold ${
                  isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-400'
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
