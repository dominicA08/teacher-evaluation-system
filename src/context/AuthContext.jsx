import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Pattern: aisat.[surname].teacher[1-2digits].[8digits]@gmail.com
const TEACHER_EMAIL_REGEX = /^aisat\.([a-zA-Z.-]+)\.teacher(\d{1,2})\.(\d{8})@gmail\.com$/i;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ── Fetch profile and determine role dynamically ──────────────────────────
  const fetchProfile = useCallback(async (userObj) => {
    if (!userObj) return null;

    try {
      // 1. Admin check
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (userObj.email && adminEmail && userObj.email.toLowerCase() === adminEmail.toLowerCase()) {
        return { role: 'admin', email: userObj.email };
      }

      // 2. Teacher check
      // Try matching by ID first
      let { data: teacherData, error: teacherErr } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', userObj.id)
        .maybeSingle();

      if (teacherErr) {
        console.warn('Teacher lookup by ID failed:', teacherErr.message);
      }

      // Try matching by email if ID lookup returned empty
      if (!teacherData && userObj.email) {
        const { data: teacherByEmail, error: teacherEmailErr } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', userObj.email.toLowerCase().trim())
          .maybeSingle();

        if (teacherEmailErr) {
          console.warn('Teacher lookup by email failed:', teacherEmailErr.message);
        } else if (teacherByEmail) {
          teacherData = teacherByEmail;
        }
      }

      if (teacherData) {
        return { ...teacherData, role: 'teacher', email: userObj.email };
      }

      // Dynamic Email Deduction Fallback for Teachers
      const isTeacherEmail = userObj.email && TEACHER_EMAIL_REGEX.test(userObj.email);
      if (isTeacherEmail) {
        const match = userObj.email.match(TEACHER_EMAIL_REGEX);
        let displayName = 'Faculty Member';
        if (match && match[1]) {
          const surname = match[1];
          displayName = 'Professor ' + surname.charAt(0).toUpperCase() + surname.slice(1);
        }
        return {
          id: userObj.id,
          full_name: userObj.user_metadata?.full_name || displayName,
          email: userObj.email,
          role: 'teacher'
        };
      }

      // 3. Student check
      let { data: studentData, error: studentErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userObj.id)
        .maybeSingle();

      if (studentErr) {
        console.warn('Student lookup by ID failed:', studentErr.message);
      }

      if (studentData) {
        return { ...studentData, role: 'student', email: userObj.email };
      }

      // If student is registered but doesn't have a profiles row yet, insert it automatically
      const roleMeta = userObj.user_metadata?.role;
      if (roleMeta === 'student') {
        const { data: newProfile, error: newProfileErr } = await supabase
          .from('profiles')
          .insert({
            id: userObj.id,
            email: userObj.email,
            verification_status: 'pending',
          })
          .select()
          .single();

        if (newProfileErr) {
          console.warn('Auto-insertion of student profile failed:', newProfileErr.message);
        } else if (newProfile) {
          return { ...newProfile, role: 'student' };
        }
      }

      // Fallback for Students
      if (roleMeta === 'student' || (userObj.email && userObj.email.toLowerCase().includes('student'))) {
        return {
          id: userObj.id,
          email: userObj.email,
          role: 'student',
          verification_status: 'pending'
        };
      }
    } catch (err) {
      console.error('Unexpected error in fetchProfile:', err);
    }

    return null;
  }, []);

  // ── Sign-out helper exposed to consumers ──────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  // ── Bootstrap: read the existing session on first load ───────────────────
  useEffect(() => {
    let realtimeChannel = null;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        const p = await fetchProfile(session.user);
        setProfile(p);
      }
      setIsLoading(false);
    };

    init();

    // ── Listen to Supabase auth events (login / logout / token refresh) ────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user);
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
          // Clean up realtime channel when user logs out
          if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel);
            realtimeChannel = null;
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [fetchProfile]);

  // ── Realtime: watch `profiles` row for rejection after profile is loaded ─
  useEffect(() => {
    if (!user || !profile) return;
    // Only subscribe for students — admins/teachers don't get force-logged out
    if (profile.role !== 'student') return;

    const channel = supabase
      .channel(`profile-watch-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          const updated = payload.new;
          // Sync latest profile state into context with student role preserved
          setProfile({ ...updated, role: 'student' });

          if (updated.verification_status === 'rejected') {
            // Force logout + redirect
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            navigate('/student/login', {
              state: { message: 'Your ID verification was rejected. Please re-register or contact admin.' },
            });
          }

          if (updated.verification_status === 'approved') {
            navigate('/student/dashboard');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, navigate]);

  const value = {
    user,
    profile,
    isLoading,
    signOut,
    /** Manually refresh the profile row (e.g., after uploading ID) */
    refreshProfile: async () => {
      if (!user) return;
      const p = await fetchProfile(user);
      setProfile(p);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook for consuming auth context in any component */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
