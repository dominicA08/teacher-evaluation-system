import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LogoHeader from '../../components/LogoHeader';
import AuthCard from '../../components/AuthCard';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [errorMsg, setErrorMsg]         = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

    if (!adminEmail || email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
      setErrorMsg('Access denied. This portal is restricted to administrators.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      navigate('/admin/dashboard');
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen circuit-bg flex flex-col justify-center py-12 px-4 relative">
      <div className="w-full max-w-md mx-auto">
        <LogoHeader />

        <AuthCard
          title="Administrator Portal"
          subtitle="Restricted access — authorized personnel only"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg animate-fade-in-up">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Admin restricted notice */}
            <div className="flex items-start gap-2.5 p-3 bg-seal-blue/10 border border-seal-blue/20 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <p className="text-[11px] text-text-secondary leading-relaxed">
                This login is for the <span className="text-text-primary font-semibold">system administrator</span> only.
                Students and teachers should use their respective portals.
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="admin-email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-disabled">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  placeholder="Enter Admin email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input block w-full pl-10 pr-3 py-3 rounded-lg text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-disabled">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input block w-full pl-10 pr-10 py-3 rounded-lg text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-disabled hover:text-gold-primary transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="admin-login-btn"
              disabled={isLoading}
              className="gold-btn w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Sign In as Admin
                </>
              )}
            </button>
          </form>

          {/* Back link — no registration link per spec */}
          <div className="mt-8 text-center border-t border-border-steel pt-6">
            <Link to="/" className="text-sm text-text-muted hover:text-gold-primary transition-colors">
              ← Back to portal selection
            </Link>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
