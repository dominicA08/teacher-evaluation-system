import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';
import {
  Users, ClipboardList, GraduationCap,
  ToggleRight, ArrowRight, Loader2, BookOpen,
} from 'lucide-react';

// ── Reusable stat card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent = false, isLoading }) {
  return (
    <div className={`relative rounded-xl p-5 border overflow-hidden transition-all duration-200 hover:scale-[1.02]
      ${accent
        ? 'bg-gold-primary/10 border-gold-primary/30'
        : 'bg-[#111E35]/70 border-border-steel'
      }`}
    >
      {/* Subtle inner glow */}
      {accent && <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gold-primary/10 blur-2xl pointer-events-none" />}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{label}</p>
          {isLoading ? (
            <div className="h-8 w-12 bg-border-steel/40 animate-pulse rounded-md" />
          ) : (
            <p className={`text-3xl font-bold ${accent ? 'text-gold-primary' : 'text-text-primary'}`}>
              {value ?? '—'}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
          ${accent ? 'bg-gold-primary/20' : 'bg-border-steel/40'}`}
        >
          <Icon className={`w-5 h-5 ${accent ? 'text-gold-primary' : 'text-text-secondary'}`} />
        </div>
      </div>
    </div>
  );
}

// ── Quick action button ───────────────────────────────────────────────────
function QuickAction({ label, description, to, icon: Icon, accent = false }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-4 p-4 rounded-xl border text-left w-full transition-all duration-200 hover:scale-[1.01] group
        ${accent
          ? 'bg-gold-primary/10 border-gold-primary/30 hover:bg-gold-primary/15'
          : 'bg-[#111E35]/70 border-border-steel hover:border-gold-primary/30'
        }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
        ${accent ? 'bg-gold-primary/20' : 'bg-border-steel/40 group-hover:bg-gold-primary/10'}`}
      >
        <Icon className={`w-5 h-5 ${accent ? 'text-gold-primary' : 'text-text-secondary group-hover:text-gold-primary'} transition-colors`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${accent ? 'text-gold-primary' : 'text-text-primary'}`}>{label}</p>
        <p className="text-xs text-text-muted mt-0.5 truncate">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-text-disabled group-hover:text-gold-primary group-hover:translate-x-1 transition-all duration-200 shrink-0" />
    </button>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evalWindow, setEvalWindow] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch counts in parallel
        const [studentsRes, pendingRes, teachersRes, configRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
          supabase.from('teachers').select('id', { count: 'exact', head: true }),
          supabase.from('system_config').select('evaluation_open').limit(1).maybeSingle(),
        ]);

        setStats({
          totalStudents:  studentsRes.count  ?? 0,
          pendingVerify:  pendingRes.count   ?? 0,
          totalTeachers:  teachersRes.count  ?? 0,
        });
        setEvalWindow(configRes.data?.evaluation_open ?? false);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen circuit-bg flex">
      <AdminSidebar pendingCount={stats?.pendingVerify ?? 0} />

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* ── Page header ────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">Control Panel</p>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-1">
            System overview for the Anonymous Evaluation System
          </p>
        </div>

        {/* ── Evaluation Window Status Banner ─────────────────────────── */}
        {!isLoading && evalWindow !== null && (
          <div className={`mb-6 flex items-center gap-3 p-4 rounded-xl border animate-fade-in-up
            ${evalWindow
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-error/10 border-error/30 text-error'
            }`}
          >
            <ToggleRight className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Evaluation Window: {evalWindow ? 'OPEN' : 'CLOSED'}
              </p>
              <p className="text-xs opacity-80 mt-0.5">
                {evalWindow
                  ? 'Students can currently submit evaluations.'
                  : 'Submissions are disabled. Enable in System Settings.'
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Stats grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Students"
            value={stats?.totalStudents}
            isLoading={isLoading}
          />
          <StatCard
            icon={ClipboardList}
            label="Pending Verifications"
            value={stats?.pendingVerify}
            accent
            isLoading={isLoading}
          />
          <StatCard
            icon={GraduationCap}
            label="Total Teachers"
            value={stats?.totalTeachers}
            isLoading={isLoading}
          />
          <StatCard
            icon={ToggleRight}
            label="Evaluation Window"
            value={isLoading ? null : (evalWindow ? 'Open' : 'Closed')}
            isLoading={isLoading}
          />
        </div>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Quick Actions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction
            label="Review Verification Queue"
            description={`${stats?.pendingVerify ?? '…'} student IDs awaiting review`}
            to="/admin/verification"
            icon={ClipboardList}
            accent
          />
          <QuickAction
            label="Manage Teachers"
            description="Add, edit or remove faculty accounts"
            to="/admin/teachers"
            icon={GraduationCap}
          />
          <QuickAction
            label="Subject Management"
            description="Register, assign or remove course subjects"
            to="/admin/subjects"
            icon={BookOpen}
          />
          <QuickAction
            label="System Settings"
            description="Toggle evaluation window, set semester"
            to="/admin/settings"
            icon={ToggleRight}
          />
        </div>
      </main>
    </div>
  );
}
