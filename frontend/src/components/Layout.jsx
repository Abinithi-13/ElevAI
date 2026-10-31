import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, ClipboardList, Users, Wrench, TrendingUp, BarChart3, Bot, AlertTriangle, LogOut, Menu, X, Bell, ChevronsUpDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import useApi from '../hooks/useApi.js';

const NAV = {
  admin: [
    { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: 'elevators', label: 'Elevators', icon: Building2 },
    { to: 'complaints', label: 'Complaints', icon: ClipboardList },
    { to: 'technicians', label: 'Technicians', icon: Users },
    { to: 'maintenance', label: 'Maintenance', icon: Wrench },
    { to: 'predictive', label: 'Predictive maintenance', icon: TrendingUp },
    { to: 'analytics', label: 'Analytics', icon: BarChart3 },
    { to: 'assistant', label: 'AI assistant', icon: Bot },
  ],
  technician: [
    { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: 'complaints', label: 'My repair jobs', icon: ClipboardList },
    { to: 'maintenance', label: 'Maintenance', icon: Wrench },
    { to: 'predictive', label: 'Predictive insights', icon: TrendingUp },
    { to: 'assistant', label: 'AI assistant', icon: Bot },
  ],
  user: [
    { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: 'report', label: 'Report a fault', icon: AlertTriangle },
    { to: 'complaints', label: 'My complaints', icon: ClipboardList },
    { to: 'assistant', label: 'AI assistant', icon: Bot },
  ],
};

const ROLE_LABEL = { admin: 'Administrator', technician: 'Technician', user: 'Building user' };

function Reminders({ role }) {
  const navigate = useNavigate();
  const { data } = useApi(role === 'user' ? null : '/maintenance/reminders');
  if (role === 'user') return null;
  const count = data?.count || 0;
  return (
    <button onClick={() => navigate(`/${role}/maintenance?tab=reminders`)} className="relative rounded-lg p-2 text-navy-500 hover:bg-navy-50" aria-label={`Maintenance reminders: ${count}`}>
      <Bell size={20} />
      {count > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{count}</span>}
    </button>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = NAV[user.role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen lg:pl-64">
      {open && <div className="fixed inset-0 z-30 bg-navy-900/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-navy-200 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ChevronsUpDown size={20} />
            </div>
            <div className="leading-tight">
              <p className="text-base font-extrabold text-white">ElevAI</p>
              <p className="text-[11px] text-navy-300">Maintenance suite</p>
            </div>
          </div>
          <button className="text-navy-300 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={`/${user.role}/${to}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-600 text-white' : 'text-navy-200 hover:bg-navy-800 hover:text-white'}`}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-navy-800 p-3">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-200 hover:bg-navy-800 hover:text-white">
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-navy-100 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-navy-600 hover:bg-navy-50 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="hidden text-sm text-navy-500 lg:block">
            Welcome back, <span className="font-semibold text-navy-800">{user.name.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Reminders role={user.role} />
            <div className="flex items-center gap-3 border-l border-navy-100 pl-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{user.name.charAt(0)}</div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-navy-900">{user.name}</p>
                <p className="text-xs text-navy-400">{ROLE_LABEL[user.role]}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
