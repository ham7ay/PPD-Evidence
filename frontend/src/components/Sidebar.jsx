import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Archive, Banknote, FileBarChart2,
  History, Shield, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PPDBadge from './PPDBadge';

const nav = [
  { to: '/',          label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/locker',    label: 'Evidence Locker', icon: Archive },
  { to: '/treasury',  label: 'Treasury',      icon: Banknote },
  { to: '/reports',   label: 'Reports',       icon: FileBarChart2 },
  { to: '/history',   label: 'History',       icon: History },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 border-r border-line bg-navy-950/70 backdrop-blur-md flex flex-col z-10">
      {/* Logo */}
      <div className="p-5 border-b border-line">
        <div className="flex items-center gap-3">
          <PPDBadge size={44} />
          <div>
            <div className="font-display font-bold text-gold-500 text-sm tracking-widest leading-none">
              EVIDENCE
            </div>
            <div className="font-mono text-[10px] text-slate-500 mt-1 tracking-widest">
              SYS // v1.0
            </div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-line">
        <div className="text-[10px] font-mono text-slate-500 tracking-widest mb-1">
          OFFICER
        </div>
        <div className="font-display font-semibold text-slate-100 truncate">
          {user?.name || '—'}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-xs text-slate-400">
            #{user?.batchCode || '----'}
          </span>
          {isAdmin && <span className="badge badge-gold !text-[9px]">ADMIN</span>}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gold-500/10 text-gold-400 border-l-2 border-gold-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/60 border-l-2 border-transparent'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="font-display tracking-wider text-sm">{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 ${
                isActive
                  ? 'bg-gold-500/10 text-gold-400 border-l-2 border-gold-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/60 border-l-2 border-transparent'
              }`
            }
          >
            <Shield size={18} className="shrink-0" />
            <span className="font-display tracking-wider text-sm">Admin Panel</span>
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-line">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          <span className="font-display tracking-wider text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
