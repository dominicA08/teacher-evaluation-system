import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Settings, LogOut,
  ClipboardList, ChevronRight, ShieldCheck, Menu, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',          icon: LayoutDashboard, to: '/admin/dashboard'    },
  { label: 'Verification Queue', icon: ClipboardList,   to: '/admin/verification', hasBadge: true },
  { label: 'Teachers',           icon: Users,           to: '/admin/teachers'     },
  { label: 'Subjects',           icon: BookOpen,        to: '/admin/subjects'     },
  { label: 'Settings',           icon: Settings,        to: '/admin/settings'     },
];

export default function AdminSidebar({ pendingCount = 0 }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Admin identity badge ─────────────────────────────────────── */}
      <div className="p-5 border-b border-border-steel">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-primary to-gold-dark flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-5 h-5 text-navy-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider">Administrator</p>
            <p className="text-[11px] text-text-muted truncate">{profile?.email ?? 'admin@aisat.edu'}</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 px-3 space-y-1" aria-label="Admin navigation">
        {NAV_ITEMS.map(({ label, icon: Icon, to, hasBadge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
              ${isActive
                ? 'text-gold-primary bg-gold-primary/10 border-l-2 border-gold-primary pl-[10px]'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-l-2 border-transparent pl-[10px]'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {hasBadge && pendingCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gold-primary text-navy-primary text-[10px] font-bold flex items-center justify-center">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Sign out ─────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-border-steel">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error/5 transition-all duration-200 group border-l-2 border-transparent pl-[10px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-[#111E35]/90 backdrop-blur-md border-r border-border-steel min-h-screen sticky top-0">
        {/* Top gold accent bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-gold-primary to-transparent shrink-0" />
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar + drawer ────────────────────────────────────── */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#111E35]/90 border-b border-border-steel sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold-primary" />
            <span className="text-sm font-semibold text-text-primary">Admin Panel</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-navy-primary/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-64 bg-[#111E35] border-r border-border-steel h-full overflow-y-auto z-10">
              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-gold-primary to-transparent" />
              <SidebarContent />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
