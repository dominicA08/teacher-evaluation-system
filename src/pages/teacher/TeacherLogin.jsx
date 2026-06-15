import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import LogoHeader from '../../components/LogoHeader';
import AuthCard from '../../components/AuthCard';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

const TEACHER_EMAIL_REGEX = /^aisat\.([a-zA-Z.-]+)\.teacher(\d{1,2})\.(\d{8})@gmail\.com$/i;

function validateTeacherEmail(email) {
  if (!email) return { isValid: false, error: 'Email is required.' };
  const match = email.toLowerCase().trim().match(TEACHER_EMAIL_REGEX);
  if (!match) {
    return {
      isValid: false,
      error: 'Invalid format. Use: aisat.[surname].teacher[1-2 digits].[8 digits]@gmail.com',
    };
  }
  return { isValid: true, error: null };
}

export default function TeacherLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailValidation = validateTeacherEmail(email);
    if (!emailValidation.isValid) {
      setErrorMsg(emailValidation.error);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // Redirect teacher to dashboard
        navigate('/teacher/dashboard');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen circuit-bg flex flex-col justify-center py-12 px-4 relative">
      <div className="w-full max-w-md mx-auto">
        <LogoHeader />
        
        <AuthCard title="Teacher Portal" subtitle="Sign in to view your course evaluations">
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg animate-fade-in-up">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                AISAT Teacher Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-disabled">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="aisat.[surname].teacher1.[8 digits]@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input block w-full pl-10 pr-3 py-3 rounded-lg text-sm font-mono"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-disabled">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
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
              disabled={isLoading}
              className="gold-btn w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
