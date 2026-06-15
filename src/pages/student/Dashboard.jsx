import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/StudentSidebar';
import {
  Users, CheckCircle2, AlertCircle, Play, Loader2, BookOpen, Clock, Calendar, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [evalWindow, setEvalWindow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Parse student name from email ─────────────────────────────────────────
  const parseName = (email) => {
    const match = email?.match(/^aisat\.([a-zA-Z.]+)\d{6}@gmail\.com$/i);
    return match ? match[1].replace(/\./g, ' ') : 'Student';
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Fetch evaluation window status and active semester/year
        const { data: configData } = await supabase
          .from('system_config')
          .select('*')
          .limit(1)
          .maybeSingle();

        setEvalWindow(configData ?? { evaluation_open: false, current_academic_year: '—', current_semester: '—' });

        // 2. Fetch all subjects joined with teacher details
        const { data: subjectsData, error: subjectsErr } = await supabase
          .from('subjects')
          .select('id, subject_code, subject_title, teacher_id, teachers(id, full_name)');
        
        if (!subjectsErr) {
          setSubjects(subjectsData ?? []);
        }

        // 3. Fetch student's completed evaluations for this academic year & semester
        const semesterFilter = configData?.current_semester || '1st Semester';
        const yearFilter = configData?.current_academic_year || '—';

        const { data: trackerData } = await supabase
          .from('evaluation_completion_tracker')
          .select('subject_id')
          .eq('student_id', user.id)
          .eq('semester', semesterFilter)
          .eq('academic_year', yearFilter);

        if (trackerData) {
          setCompletedList(trackerData.map((t) => t.subject_id));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const totalSubjects = subjects.length;
  const completedCount = subjects.filter((s) => completedList.includes(s.id)).length;
  const remainingCount = totalSubjects - completedCount;

  return (
    <div className="min-h-screen circuit-bg flex">
      <StudentSidebar />

      {/* Main workspace */}
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        
        {/* ── Welcome Header ─────────────────────────────────────────────── */}
        <div className="mb-6 animate-fade-in-up">
          <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">
            Student Dashboard
          </p>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight capitalize">
            Welcome, {profile ? parseName(profile.email) : 'Student'}!
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Department of Computer Science · AISAT College
          </p>
        </div>

        {/* ── Loading Spinner ────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Active Status Banner ─────────────────────────────────────── */}
            <div className={`mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border animate-fade-in-up
              ${evalWindow?.evaluation_open
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-error/10 border-error/30 text-error'
              }`}
            >
              <div className="flex items-center gap-3">
                {evalWindow?.evaluation_open ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    Evaluation Window is {evalWindow?.evaluation_open ? 'OPEN' : 'CLOSED'}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {evalWindow?.evaluation_open
                      ? 'Submit your anonymous evaluations for your instructors below.'
                      : 'Submissions are currently closed. You can view faculty but cannot evaluate them.'
                    }
                  </p>
                </div>
              </div>

              {/* Semester info tags */}
              <div className="flex gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-text-primary">
                  <Calendar className="w-3.5 h-3.5" />
                  AY {evalWindow?.current_academic_year || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-text-primary">
                  <Clock className="w-3.5 h-3.5" />
                  {evalWindow?.current_semester || '—'}
                </span>
              </div>
            </div>

            {/* ── Stats Row ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Total Courses */}
              <div className="bg-[#111E35]/70 border border-border-steel rounded-xl p-5 hover:scale-[1.01] transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Total Subjects</p>
                    <p className="text-3xl font-bold text-text-primary">{totalSubjects}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-border-steel/40 flex items-center justify-center text-text-secondary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Completed */}
              <div className="bg-[#111E35]/70 border border-border-steel rounded-xl p-5 hover:scale-[1.01] transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Evaluations Submitted</p>
                    <p className="text-3xl font-bold text-success">{completedCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center text-success">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Remaining */}
              <div className="bg-[#111E35]/70 border border-border-steel rounded-xl p-5 hover:scale-[1.01] transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">Pending Evaluations</p>
                    <p className="text-3xl font-bold text-gold-primary">{remainingCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gold-primary/15 flex items-center justify-center text-gold-primary">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Teacher List Grid ────────────────────────────────────────── */}
            <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
              My Assigned Faculty & Subjects
            </h2>

            {subjects.length === 0 ? (
              <div className="bg-[#111E35]/40 border border-dashed border-border-steel rounded-xl p-12 text-center">
                <Users className="w-12 h-12 text-text-disabled mx-auto mb-3" />
                <p className="text-text-secondary font-semibold">No assigned subjects found</p>
                <p className="text-xs text-text-disabled mt-1">Please contact the Computer Science department administrator.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {subjects.map((subj) => {
                  const completed = completedList.includes(subj.id);
                  const canEvaluate = evalWindow?.evaluation_open && !completed;

                  return (
                    <div 
                      key={subj.id}
                      className={`relative bg-[#111E35]/70 border rounded-xl overflow-hidden p-5 transition-all duration-200 flex flex-col justify-between min-h-[160px]
                        ${completed 
                          ? 'border-success/20 opacity-80' 
                          : canEvaluate 
                            ? 'border-border-steel hover:border-gold-primary/30 hover:scale-[1.01]' 
                            : 'border-border-steel opacity-75'}`}
                    >
                      {/* Left-accent border stripe */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1
                        ${completed 
                          ? 'bg-success' 
                          : canEvaluate 
                            ? 'bg-gold-primary' 
                            : 'bg-text-disabled'}`} 
                      />

                      <div>
                        {/* Course code & badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-gold-primary tracking-wide bg-gold-primary/10 px-2 py-0.5 rounded">
                            {subj.subject_code}
                          </span>
                          
                          {completed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded border border-success/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded border border-gold-primary/20">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Title & Teacher */}
                        <h3 className="text-sm font-bold text-text-primary tracking-tight line-clamp-1">
                          {subj.subject_title}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Instructor: <span className="text-text-primary font-medium">{subj.teachers?.full_name || '—'}</span>
                        </p>
                      </div>

                      {/* CTA Button */}
                      <div className="mt-4 pt-3 border-t border-border-steel/50 flex justify-end">
                        <button
                          disabled={!canEvaluate}
                          onClick={() => navigate(`/student/evaluate/${subj.teacher_id}/${subj.id}`)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200
                            ${completed
                              ? 'bg-success/5 border border-success/20 text-success cursor-default'
                              : canEvaluate
                                ? 'gold-btn cursor-pointer'
                                : 'bg-border-steel/40 border border-border-steel text-text-disabled cursor-not-allowed'}`}
                        >
                          {completed ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Evaluation Submitted
                            </>
                          ) : !evalWindow?.evaluation_open ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              Evaluation Window Closed
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-navy-primary" />
                              Start Evaluation
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
