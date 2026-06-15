import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebar from '../../components/TeacherSidebar';
import {
  GraduationCap, BookOpen, CheckCircle2, Lock, Loader2, Star,
  TrendingUp, BarChart3, RefreshCw, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';

const CRITERIA = [
  { key: 'avg_rating_1', label: 'Subject Knowledge', desc: 'Demonstrates deep mastery and understanding of the subject matter.' },
  { key: 'avg_rating_2', label: 'Teaching Effectiveness', desc: 'Delivers lessons clearly, uses appropriate methods, and facilitates learning.' },
  { key: 'avg_rating_3', label: 'Communication Skills', desc: 'Expresses concepts clearly, listens attentively, and encourages dialogue.' },
  { key: 'avg_rating_4', label: 'Classroom Engagement', desc: 'Maintains student attention, interest, and encourages active participation.' },
  { key: 'avg_rating_5', label: 'Fairness and Professionalism', desc: 'Treats students with respect, grading is transparent and unbiased.' },
  { key: 'avg_rating_6', label: 'Responsiveness to Student Concerns', desc: 'Accessible outside class hours, addresses queries and feedback constructively.' },
];

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSubjectId, setExpandedSubjectId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dynamic debug state to surface mapping errors visually onto the dashboard screen
  const [debugLog, setDebugLog] = useState({
    authUserId: null,
    profileId: null,
    resolvedTeacherId: null,
    isIdMismatch: false
  });

  const fetchData = useCallback(async () => {
    if (!user || !profile) return;
    try {
      let activeTeacherId = profile.id;
      let fallbackDetected = false;

      // CROSS-CHECK: If profile.id doesn't match a teacher record, find the true teacher row via email lookup
      const { data: teacherRecord, error: teacherLookupErr } = await supabase
        .from('teachers')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (!teacherLookupErr && teacherRecord) {
        activeTeacherId = teacherRecord.id;
        // Check if AuthContext returned the baseline Auth UUID instead of the designated table ID
        if (profile.id !== teacherRecord.id) {
          fallbackDetected = true;
        }
      }

      // Update the debug state logs for browser diagnostic monitoring
      setDebugLog({
        authUserId: user.id,
        profileId: profile.id,
        resolvedTeacherId: activeTeacherId,
        isIdMismatch: fallbackDetected
      });

      console.dir({
        "[DEBUG] Auth User UUID:": user.id,
        "[DEBUG] AuthContext Profile ID:": profile.id,
        "[DEBUG] Verified Teachers Table ID:": activeTeacherId,
        "[DEBUG] Resolved via Email Fallback Match:": fallbackDetected
      });

      // 1. Fetch subjects assigned to this teacher using the verified ID mapping
      const { data: subjectsData, error: subjectsErr } = await supabase
        .from('subjects')
        .select('*')
        .eq('teacher_id', activeTeacherId);

      if (subjectsErr) throw subjectsErr;
      setSubjects(subjectsData ?? []);

      // 2. Fetch all evaluation analytics for this teacher via the teacher_analytics view/table
      const { data: analyticsData, error } = await supabase
        .from('teacher_analytics')
        .select('*')
        .eq('teacher_id', activeTeacherId);

      if (error) throw error;
      setEvaluations(analyticsData ?? []);
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    }
  }, [user, profile]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    init();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const getSubjectAnalytics = (subjectId) => {
    if (!Array.isArray(evaluations)) return null;
    return evaluations.find((e) => e.subject_id === subjectId) || null;
  };

  const getRatingValue = (analytics, criteriaKey) => {
    if (!analytics) return null;
    const val = analytics[criteriaKey];
    if (val !== null && val !== undefined) {
      return parseFloat(val);
    }
    return null;
  };

  const totalAssignedCourses = subjects.length;
  const totalEvaluationsCount = Array.isArray(evaluations)
    ? evaluations.reduce((sum, curr) => sum + (parseInt(curr?.response_count, 10) || 0), 0)
    : 0;

  return (
    <div className="min-h-screen circuit-bg flex">
      <TeacherSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">
              Teacher Portal
            </p>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              Welcome, {profile?.full_name || 'Faculty Member'}!
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Access your aggregated student evaluation scores and analytics.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gold-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* ── Visual ID Mismatch Debug Alert ────────────────────────────── */}
        {debugLog.isIdMismatch && (
          <div className="mb-6 max-w-4xl p-4 bg-error/10 border border-error/30 rounded-xl flex items-start gap-3 text-error text-xs animate-fade-in-up">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider mb-1 text-[11px]">System Mapping Warning Detected</p>
              <p className="leading-relaxed text-text-secondary">
                Your account fell through the standard auth context path. The dashboard intercepted this structural mismatch and auto-aligned the queries using an email resolution mechanism.
              </p>
              <div className="mt-2 font-mono bg-black/30 p-2 rounded border border-white/5 space-y-1 text-text-muted">
                <div>• Auth User UUID: <span className="text-text-primary">{debugLog.authUserId}</span></div>
                <div>• Profile ID Context: <span className="text-text-primary">{debugLog.profileId}</span></div>
                <div>• Verified Database Teacher ID: <span className="text-gold-primary font-bold">{debugLog.resolvedTeacherId}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading Spinner ────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            {/* ── Stats Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
              <div className="bg-[#111E35]/70 border border-border-steel rounded-xl p-5 hover:scale-[1.01] transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Assigned Subjects
                    </p>
                    <p className="text-3xl font-bold text-text-primary">{totalAssignedCourses}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="bg-[#111E35]/70 border border-border-steel rounded-xl p-5 hover:scale-[1.01] transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Total Evaluations Received
                    </p>
                    <p className="text-3xl font-bold text-success">{totalEvaluationsCount}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center text-success">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Course List & Performance Grid ───────────────────────────── */}
            <div>
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
                Assigned Subject Analytics
              </h2>

              {subjects.length === 0 ? (
                <div className="bg-[#111E35]/40 border border-dashed border-border-steel rounded-xl p-12 text-center max-w-xl">
                  <GraduationCap className="w-12 h-12 text-text-disabled mx-auto mb-3" />
                  <p className="text-text-secondary font-semibold text-sm">No assigned courses found</p>
                  <p className="text-xs text-text-disabled mt-1">
                    If this is an error, please contact the administrator to assign subjects to your account.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl">
                  {subjects.map((subj) => {
                    const analytics = getSubjectAnalytics(subj.id);
                    const count = analytics ? parseInt(analytics.response_count, 10) : 0;
                    const isLocked = count < 3;

                    const overallAverage = analytics && analytics.overall_average !== null && !isNaN(analytics.overall_average)
                      ? parseFloat(analytics.overall_average)
                      : 0;

                    const isExpanded = expandedSubjectId === subj.id;

                    return (
                      <div
                        key={subj.id}
                        className={`bg-[#111E35]/70 border border-border-steel rounded-xl overflow-hidden transition-all duration-300
                          ${isExpanded ? 'ring-1 ring-gold-primary/30 shadow-lg' : 'hover:border-border-steel/80'}`}
                      >
                        {/* Summary Header */}
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-primary/20 to-gold-primary/5 border border-gold-primary/20 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 text-gold-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] font-bold text-gold-primary bg-gold-primary/10 px-2 py-0.5 rounded tracking-wide">
                                  {subj.subject_code}
                                </span>
                                <span className="text-xs text-text-muted">
                                  {count} {count === 1 ? 'evaluation' : 'evaluations'} received
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-text-primary tracking-tight mt-1">
                                {subj.subject_title}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 justify-between md:justify-end">
                            {!isLocked ? (
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                                    Overall Score
                                  </p>
                                  <p className="text-lg font-extrabold text-gold-primary">
                                    {overallAverage.toFixed(2)}
                                    <span className="text-xs text-text-muted font-normal"> / 5.00</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-0.5 text-gold-primary bg-gold-primary/10 border border-gold-primary/15 rounded-lg p-2 shrink-0">
                                  <Star className="w-4 h-4 fill-current" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-text-muted bg-white/5 border border-border-steel/50 rounded-xl px-3 py-2">
                                <Lock className="w-4 h-4" />
                                <span className="text-xs font-semibold">Locked</span>
                              </div>
                            )}

                            <button
                              onClick={() => setExpandedSubjectId(isExpanded ? null : subj.id)}
                              className="p-2 rounded-lg border border-border-steel text-text-secondary hover:text-gold-primary hover:border-gold-primary/30 transition-all cursor-pointer"
                              aria-label={isExpanded ? 'Collapse analysis' : 'Expand analysis'}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="border-t border-border-steel/50 bg-[#0E172B]/60 p-5 animate-fade-in-up">
                            {isLocked ? (
                              <div className="relative min-h-[350px] flex items-center justify-center border border-dashed border-border-steel/60 rounded-xl p-6 overflow-hidden my-4">
                                <div className="absolute inset-0 filter blur-md opacity-20 select-none pointer-events-none p-5 space-y-6 flex flex-col justify-between">
                                  <div className="flex items-center gap-2 border-b border-border-steel/50 pb-3">
                                    <BarChart3 className="w-4 h-4 text-gold-primary" />
                                    <div className="h-4 w-40 bg-text-muted/20 rounded"></div>
                                  </div>
                                  <div className="w-full flex justify-center">
                                    <div className="w-40 h-40 rounded-full border-4 border-dashed border-border-steel"></div>
                                  </div>
                                </div>

                                <div className="relative z-10 bg-[#0E172B]/85 backdrop-blur-md border border-gold-primary/20 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center flex flex-col items-center animate-fade-in-up">
                                  <div className="w-12 h-12 rounded-full bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center text-gold-primary mb-4 shadow-inner">
                                    <Lock className="w-5 h-5" />
                                  </div>
                                  <h4 className="text-base font-bold text-text-primary tracking-tight">
                                    Analytics Locked
                                  </h4>
                                  <p className="text-xs text-text-muted mt-2 leading-relaxed max-w-sm">
                                    Analytics for this subject remain locked until at least 3 evaluations have been submitted.
                                  </p>
                                  <div className="mt-5 px-4.5 py-1.5 bg-gold-primary/10 border border-gold-primary/20 rounded-full inline-flex items-center gap-2 text-xs font-semibold text-gold-primary">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    Progress: {count} / 3 submissions
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="flex items-center gap-2 border-b border-border-steel/50 pb-3 mb-2">
                                  <BarChart3 className="w-4 h-4 text-gold-primary" />
                                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Criterion Breakdown Scores
                                  </h4>
                                </div>

                                <div className="w-full h-72 mt-2">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart
                                      data={CRITERIA.map((crit, idx) => {
                                        const numValue = getRatingValue(analytics, crit.key) ?? 0;
                                        return {
                                          subject: `Criteria ${idx + 1}`,
                                          fullLabel: crit.label,
                                          score: isNaN(numValue) ? 0 : parseFloat(numValue.toFixed(2)),
                                          fullMark: 5,
                                        };
                                      })}
                                      margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
                                    >
                                      <PolarGrid stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                                      <PolarAngleAxis
                                        dataKey="subject"
                                        tick={({ x, y, payload }) => (
                                          <text
                                            x={x}
                                            y={y}
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fill="#94A3B8"
                                            fontSize={10}
                                            fontWeight={600}
                                          >
                                            {payload?.value}
                                          </text>
                                        )}
                                      />
                                      <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 5]}
                                        tickCount={6}
                                        tick={{ fill: '#64748B', fontSize: 9 }}
                                        axisLine={false}
                                      />
                                      <Radar
                                        name="Score"
                                        dataKey="score"
                                        stroke="#C9973E"
                                        fill="#C9973E"
                                        fillOpacity={0.25}
                                        strokeWidth={2}
                                        dot={{ r: 4, fill: '#C9973E', strokeWidth: 0 }}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          background: '#111E35',
                                          border: '1px solid rgba(201,151,62,0.3)',
                                          borderRadius: '8px',
                                          fontSize: '11px',
                                          color: '#E2E8F0',
                                        }}
                                        formatter={(value, name, props) => [`${value} / 5.00`, props?.payload?.fullLabel || name]}
                                      />
                                    </RadarChart>
                                  </ResponsiveContainer>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                  {CRITERIA.map((crit) => {
                                    const safeAvg = getRatingValue(analytics, crit.key) ?? 0;
                                    const percent = (safeAvg / 5) * 100;

                                    return (
                                      <div key={crit.key} className="space-y-1.5">
                                        <div className="flex justify-between items-start gap-4">
                                          <div>
                                            <p className="text-xs font-bold text-text-primary">
                                              {crit.label}
                                            </p>
                                            <p className="text-[10px] text-text-muted leading-normal mt-0.5 max-w-xs">
                                              {crit.desc}
                                            </p>
                                          </div>
                                          <span className="text-xs font-extrabold text-gold-primary font-mono shrink-0">
                                            {safeAvg.toFixed(2)} / 5.00
                                          </span>
                                        </div>

                                        <div className="h-2 w-full bg-[#111E35] rounded-full overflow-hidden border border-border-steel/60">
                                          <div
                                            className="h-full bg-gradient-to-r from-gold-dark to-gold-primary rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}