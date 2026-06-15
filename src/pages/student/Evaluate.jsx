import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/StudentSidebar';
import {
  ChevronRight, Star, ShieldAlert, Loader2, Save, BookOpen, User
} from 'lucide-react';

const CRITERIA = [
  { id: 1, label: 'Subject Knowledge', desc: 'Demonstrates deep mastery and understanding of the subject matter.' },
  { id: 2, label: 'Teaching Effectiveness', desc: 'Delivers lessons clearly, uses appropriate methods, and facilitates learning.' },
  { id: 3, label: 'Communication Skills', desc: 'Expresses concepts clearly, listens attentively, and encourages dialogue.' },
  { id: 4, label: 'Classroom Engagement', desc: 'Maintains student attention, interest, and encourages active participation.' },
  { id: 5, label: 'Fairness and Professionalism', desc: 'Treats students with respect, grading is transparent and unbiased.' },
  { id: 6, label: 'Responsiveness to Student Concerns', desc: 'Accessible outside class hours, addresses queries and feedback constructively.' },
];

const RATINGS = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Very Good' },
  { value: 5, label: 'Excellent' },
];

export default function StudentEvaluate() {
  const { teacherId, subjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [subject, setSubject] = useState(null);
  const [evalWindow, setEvalWindow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form States
  const [yearLevel, setYearLevel] = useState('');
  const [semester, setSemester] = useState('');
  const [ratings, setRatings] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadEvaluationData = async () => {
      if (!subjectId) return;
      setIsLoading(true);
      try {
        // 1. Fetch system config for window validation
        const { data: config } = await supabase
          .from('system_config')
          .select('*')
          .limit(1)
          .maybeSingle();

        setEvalWindow(config);
        if (config) {
          setSemester(config.current_semester || '1st Semester');
        }

        // 2. Fetch subject and teacher details
        const { data: subjectData, error: subjectErr } = await supabase
          .from('subjects')
          .select('id, subject_code, subject_title, teacher_id, teachers(id, full_name)')
          .eq('id', subjectId)
          .single();

        if (subjectErr || !subjectData) {
          setErrorMsg('Subject or instructor information could not be retrieved.');
          return;
        }

        setSubject(subjectData);

        // 3. Verify if already evaluated
        if (user && config) {
          const { data: tracker } = await supabase
            .from('evaluation_completion_tracker')
            .select('id')
            .eq('student_id', user.id)
            .eq('subject_id', subjectId)
            .eq('semester', config.current_semester || '1st Semester')
            .eq('academic_year', config.current_academic_year || '')
            .maybeSingle();

          if (tracker) {
            setErrorMsg('You have already submitted an evaluation for this subject and instructor this semester.');
          }
        }
      } catch (err) {
        console.error('Failed to load evaluation details:', err);
        setErrorMsg('An unexpected error occurred while loading this page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvaluationData();
  }, [subjectId, user]);

  const handleRatingChange = (criterionId, val) => {
    setRatings((prev) => ({ ...prev, [criterionId]: val }));
  };

  const isFormValid = () => {
    if (!yearLevel) return false;
    if (!semester) return false;
    return Object.values(ratings).every((r) => r >= 1 && r <= 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setErrorMsg('Please complete all ratings and selection fields before submitting.');
      return;
    }
    setShowConfirm(true);
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setShowConfirm(false);

    try {
      // Execute the decoupled transaction via RPC ensuring correct param naming
      const { error } = await supabase.rpc('submit_evaluation', {
        p_teacher_id: teacherId || subject?.teacher_id,
        p_subject_id: subjectId,
        p_year_level: yearLevel,
        p_semester: semester,
        p_academic_year: evalWindow?.current_academic_year || '—',
        p_rating_1: parseInt(ratings[1]),
        p_rating_2: parseInt(ratings[2]),
        p_rating_3: parseInt(ratings[3]),
        p_rating_4: parseInt(ratings[4]),
        p_rating_5: parseInt(ratings[5]),
        p_rating_6: parseInt(ratings[6])
      });

      if (error) {
        setErrorMsg(error.message || 'Evaluation submission failed.');
        return;
      }

      // Success Redirect
      navigate('/student/dashboard');
    } catch (err) {
      console.error('Submission transaction failed:', err);
      setErrorMsg('An unexpected error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen circuit-bg flex">
      <StudentSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* ── Breadcrumbs ────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider animate-fade-in-up">
          <Link to="/student/dashboard" className="hover:text-gold-primary transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="truncate max-w-[120px] text-text-muted">
            {subject?.teachers?.full_name || 'Instructor'}
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gold-primary truncate max-w-[100px]">
            {subject?.subject_code}
          </span>
        </div>

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            Faculty Evaluation Form
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Complete the Likert-scale metrics below. All inputs are completely anonymous.
          </p>
        </div>

        {/* ── Loading / Error states ────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
          </div>
        ) : errorMsg ? (
          <div className="bg-[#111E35]/60 border border-error/30 rounded-xl p-8 max-w-xl text-center mx-auto animate-fade-in-up">
            <ShieldAlert className="w-12 h-12 text-error mx-auto mb-3" />
            <h2 className="text-lg font-bold text-text-primary mb-2">Evaluation Blocked</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              {errorMsg}
            </p>
            <Link to="/student/dashboard" className="gold-btn px-6 py-2.5 rounded-lg text-sm inline-block">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl animate-fade-in-up">
            {/* ── Course details banner ───────────────────────────────────── */}
            <div className="bg-[#111E35]/80 border border-border-steel rounded-xl p-5 flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold-primary/10 flex items-center justify-center shrink-0 border border-gold-primary/20 text-gold-primary font-mono font-bold text-xs">
                  CS
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">{subject?.subject_title}</h2>
                  <p className="text-xs text-text-secondary font-semibold font-mono mt-0.5 uppercase tracking-wide">
                    {subject?.subject_code} · instructor: {subject?.teachers?.full_name}
                  </p>
                </div>
              </div>

              {/* Window parameters */}
              <div className="flex flex-wrap gap-3 items-center text-xs text-text-muted border-t sm:border-t-0 sm:pt-0 pt-3 border-border-steel/50">
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  <BookOpen className="w-3.5 h-3.5" />
                  AY {evalWindow?.current_academic_year}
                </div>
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  <User className="w-3.5 h-3.5" />
                  {semester}
                </div>
              </div>
            </div>

            {/* ── Demographics select inputs ────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#111E35]/60 border border-border-steel rounded-xl p-5">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Your Year Level
                </label>
                <select
                  required
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="glass-input block w-full py-3 px-4 rounded-lg text-sm cursor-pointer"
                >
                  <option value="" disabled className="bg-navy-primary">Select Year Level</option>
                  <option value="1st Year" className="bg-navy-primary text-text-primary">1st Year</option>
                  <option value="2nd Year" className="bg-navy-primary text-text-primary">2nd Year</option>
                  <option value="3rd Year" className="bg-navy-primary text-text-primary">3rd Year</option>
                  <option value="4th Year" className="bg-navy-primary text-text-primary">4th Year</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Active Semester
                </label>
                <input
                  type="text"
                  disabled
                  value={semester}
                  className="glass-input block w-full py-3 px-4 rounded-lg text-sm bg-navy-primary/40 text-text-disabled cursor-not-allowed border-dashed"
                />
              </div>
            </div>

            {/* ── Likert Matrix ────────────────────────────────────────────── */}
            <div className="bg-[#111E35]/60 border border-border-steel rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border-steel bg-[#111E35]/80">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Evaluation Criteria Matrix
                </p>
              </div>

              <div className="divide-y divide-border-steel/45">
                {CRITERIA.map((crit) => (
                  <div key={crit.id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-white/[0.01] transition-colors duration-150">
                    <div className="flex-1 max-w-lg">
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-gold-primary/10 border border-gold-primary/20 text-[10px] font-bold text-gold-primary flex items-center justify-center shrink-0">
                          {crit.id}
                        </span>
                        {crit.label}
                      </h3>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {crit.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {RATINGS.map((rate) => {
                        const isSelected = ratings[crit.id] === rate.value;
                        return (
                          <button
                            key={rate.value}
                            type="button"
                            onClick={() => handleRatingChange(crit.id, rate.value)}
                            title={`${rate.value} - ${rate.label}`}
                            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 group
                              ${isSelected
                                ? 'bg-gold-primary text-navy-primary border-gold-primary shadow-lg font-bold'
                                : 'bg-navy-primary/60 border-border-steel text-text-secondary hover:border-gold-primary/50'
                              }`}
                          >
                            <Star className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110
                              ${isSelected ? 'fill-navy-primary text-navy-primary' : 'text-text-disabled'}`}
                            />
                            <span>{rate.value}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Submit Area ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-[#111E35]/80 border border-border-steel">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4.5 h-4.5 text-info shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span className="text-text-primary font-semibold">Privacy Protection: </span>
                  Your identity is completely decoupled from your ratings. Once submitted, your scores are permanent and cannot be modified.
                </p>
              </div>

              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200
                  ${isFormValid() && !isSubmitting
                    ? 'gold-btn cursor-pointer'
                    : 'bg-border-steel/40 border border-border-steel text-text-disabled cursor-not-allowed'}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Submit Evaluation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* ── Confirmation Modal ────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-primary/80 backdrop-blur-sm p-4">
          <div className="bg-[#111E35] border border-border-steel rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-6 animate-fade-in-up">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gold-primary/10 border border-gold-primary/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-gold-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Confirm Evaluation</h3>
                <p className="text-sm text-text-secondary mt-1">
                  You are about to submit your anonymous evaluation for this instructor.
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/[0.02] border border-border-steel/40 rounded-lg text-xs text-text-muted leading-relaxed">
              ⚠️ This action is permanent and cannot be undone. To prevent subjective bias, comments are omitted and scores are stored in a decoupled database.
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2.5 rounded-lg border border-border-steel text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                disabled={isSubmitting}
                className="gold-btn px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Confirm Submission"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}