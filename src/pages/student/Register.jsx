import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { validateAisatEmail } from '../../utils/emailValidator';
import LogoHeader from '../../components/LogoHeader';
import AuthCard from '../../components/AuthCard';
import { Mail, Lock, Eye, EyeOff, Loader2, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentRegister() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [emailValidation, setEmailValidation] = useState({ isValid: false, studentId: null, error: null });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-error' });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Email validation effect
  useEffect(() => {
    if (!email) {
      setEmailValidation({ isValid: false, studentId: null, error: null });
      return;
    }
    const result = validateAisatEmail(email);
    setEmailValidation(result);
  }, [email]);

  // Password strength checker effect
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, label: 'Weak', color: 'bg-error' });
      return;
    }
    
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special chars

    let label = 'Weak';
    let color = 'bg-error';

    if (score >= 3) {
      label = 'Strong';
      color = 'bg-success';
    } else if (score === 2) {
      label = 'Medium';
      color = 'bg-warning';
    }

    setPasswordStrength({ score, label, color });
  }, [password]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Final checks
    if (!emailValidation.isValid) {
      setErrorMsg('Please enter a valid AISAT student email first.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up student
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            role: 'student',
            student_id: emailValidation.studentId,
            student_name: emailValidation.studentName,
            verification_status: 'pending',
          }
        }
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Account created successfully! Redirecting to student portal...');
        setTimeout(() => {
          navigate('/student/login');
        }, 3000);
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen circuit-bg flex flex-col justify-center py-12 px-4 relative">
      <div className="w-full max-w-md mx-auto">
        <LogoHeader />

        <AuthCard title="Create Your Account" subtitle="Register with your official AISAT email">
          <form onSubmit={handleRegister} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg animate-fade-in-up">
                ⚠️ {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="p-3 bg-success/10 border border-success/20 text-success text-xs rounded-lg animate-fade-in-up">
                🎉 {successMsg}
              </div>
            )}

            {/* Email Field with inline validation indicator */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  AISAT Student Email
                </label>
                {email && (
                  <span>
                    {emailValidation.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-success inline" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-error inline" />
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-disabled">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="Enter Student email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input block w-full pl-10 pr-3 py-3 rounded-lg text-sm"
                  autoComplete="email"
                />
              </div>

              {/* Dynamic validation instruction card */}
              {email && (
                <div className="animate-fade-in-up">
                  {emailValidation.isValid ? (
                    <div className="p-2.5 bg-success/10 border border-success/20 text-success text-[11px] rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Valid AISAT email format detected &mdash; <strong>ID: {emailValidation.studentId}</strong></span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-error/10 border border-error/20 text-error text-[11px] rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Email must follow the pattern: aisat.johndoe[6-digit ID]@gmail.com</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Password
              </label>
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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-disabled hover:text-gold-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Indicator Bar */}
              {password && (
                <div className="space-y-1.5 animate-fade-in-up">
                  <div className="flex justify-between items-center text-[10px] text-text-secondary">
                    <span>Password Strength:</span>
                    <span className="font-semibold">{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1A3D8F]/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${passwordStrength.color} transition-all duration-300`} 
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-disabled">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input block w-full pl-10 pr-10 py-3 rounded-lg text-sm"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-disabled hover:text-gold-primary transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Match Validation Message */}
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-error flex items-center gap-1.5 mt-1 animate-fade-in-up">
                  <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !emailValidation.isValid || password.length < 8 || password !== confirmPassword}
              className="gold-btn w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Footer SignIn Link */}
          <div className="mt-8 text-center border-t border-border-steel pt-6">
            <p className="text-sm text-text-muted">
              Already registered?{' '}
              <Link 
                to="/student/login" 
                className="text-gold-primary hover:underline hover:text-gold-dark transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
