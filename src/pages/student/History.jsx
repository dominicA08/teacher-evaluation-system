import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/StudentSidebar';
import {
  CheckCircle2, Clock, Calendar, BookOpen, Loader2, Award
} from 'lucide-react';

export default function StudentHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('evaluation_completion_tracker')
          .select(`
            id, semester, academic_year,
            teachers(id, full_name),
            subjects(id, subject_code, subject_title)
          `)
          .eq('student_id', user.id);

        if (!error) {
          setHistory(data ?? []);
        }
      } catch (err) {
        console.error('Failed to load evaluation history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [user]);

  return (
    <div className="min-h-screen circuit-bg flex">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">
            Student Profile
          </p>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Submission History
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Checklist of all instructors and subjects you have evaluated.
          </p>
        </div>

        {/* ── Loading Spinner ────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
          </div>
        ) : history.length === 0 ? (
          /* ── Empty State ──────────────────────────────────────────────── */
          <div className="bg-[#111E35]/40 border border-dashed border-border-steel rounded-xl p-12 text-center max-w-xl mx-auto mt-12 animate-fade-in-up">
            <Award className="w-12 h-12 text-text-disabled mx-auto mb-3" />
            <p className="text-text-secondary font-semibold text-sm">No submissions found</p>
            <p className="text-xs text-text-disabled mt-1">
              You haven't completed any faculty evaluations for the current active semester yet.
            </p>
          </div>
        ) : (
          /* ── Checklist Cards ──────────────────────────────────────────── */
          <div className="space-y-4 max-w-3xl animate-fade-in-up">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-[#111E35]/70 border border-border-steel/60 hover:border-success/30 rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Completion Check Icon */}
                  <div className="w-9 h-9 rounded-full bg-success/10 border border-success/20 flex items-center justify-center shrink-0 text-success">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    {/* Course Code + Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded tracking-wide">
                        {record.subjects?.subject_code || 'CODE'}
                      </span>
                      <h3 className="text-sm font-bold text-text-primary tracking-tight">
                        {record.subjects?.subject_title || 'Subject Title'}
                      </h3>
                    </div>

                    {/* Instructor details */}
                    <p className="text-xs text-text-secondary mt-1">
                      Instructor evaluated: <span className="text-text-primary font-medium">{record.teachers?.full_name || '—'}</span>
                    </p>
                  </div>
                </div>

                {/* Right badges */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 text-[10px] font-semibold text-text-muted shrink-0">
                  <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    <Calendar className="w-3 h-3 text-text-disabled" />
                    AY {record.academic_year}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3 text-text-disabled" />
                    {record.semester}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
