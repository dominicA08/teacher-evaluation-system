import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute
 *
 * Props:
 *   children    — the page component to render when access is granted
 *   role        — required role: 'student' | 'admin' | 'teacher'
 *
 * Redirect logic:
 *   • Loading          → full-screen gold spinner
 *   • No session       → /[role]/login  (or /student/login as default)
 *   • Role mismatch    → /
 *   • Student pending  → /student/verify  (unless already there)
 *   • Student approved & on /student/verify → /student/dashboard
 */
export default function ProtectedRoute({ children, role = 'student' }) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  // ── 1. Loading state ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen circuit-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-gold-primary animate-spin" />
          <p className="text-sm text-text-secondary">Loading your session…</p>
        </div>
      </div>
    );
  }

  // ── 2. Not authenticated ─────────────────────────────────────────────────
  if (!user) {
    const loginPaths = {
      student: '/student/login',
      admin:   '/admin/login',
      teacher: '/teacher/login',
    };
    return <Navigate to={loginPaths[role] ?? '/student/login'} state={{ from: location }} replace />;
  }

  // ── 2b. User is authenticated but profile is still loading (async role lookup) ──
  if (!profile) {
    if (!isLoading) {
      const loginPaths = {
        student: '/student/login',
        admin:   '/admin/login',
        teacher: '/teacher/login',
      };
      return <Navigate to={loginPaths[role] ?? '/student/login'} replace />;
    }

    return (
      <div className="min-h-screen circuit-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-gold-primary animate-spin" />
          <p className="text-sm text-text-secondary">Verifying credentials…</p>
        </div>
      </div>
    );
  }

  // ── 3. Role mismatch ─────────────────────────────────────────────────────
  if (profile && profile.role !== role) {
    return <Navigate to="/" replace />;
  }

  // ── 4. Student-specific verification routing ─────────────────────────────
  if (role === 'student' && profile) {
    const status = profile.verification_status;
    const onVerifyPage = location.pathname === '/student/verify';

    // Pending → must be on /student/verify
    if (status === 'pending' && !onVerifyPage) {
      return <Navigate to="/student/verify" replace />;
    }

    // Approved → should not be on /student/verify
    if (status === 'approved' && onVerifyPage) {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
}
