import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';
import {
  Settings, ToggleLeft, ToggleRight, Save, Loader2,
  Calendar, BookOpen, AlertTriangle, CheckCircle2,
} from 'lucide-react';

// ── Toggle switch component ───────────────────────────────────────────────
function EvalToggle({ isOpen, onToggle, isSaving }) {
  return (
    <button
      id="eval-window-toggle"
      onClick={onToggle}
      disabled={isSaving}
      aria-label={isOpen ? 'Close evaluation window' : 'Open evaluation window'}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-primary/40 disabled:opacity-50
        ${isOpen ? 'bg-success' : 'bg-border-steel'}`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300
          ${isOpen ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  );
}

// ── Section card ─────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-[#111E35]/70 border border-border-steel rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border-steel">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SystemSettings() {
  const [config, setConfig]         = useState(null);
  const [configId, setConfigId]     = useState(null);
  const [evalOpen, setEvalOpen]     = useState(false);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester]     = useState('1st Semester');
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [toast, setToast]           = useState(null); // { type: 'success'|'error', text }

  // ── Load config ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setConfig(data);
        setConfigId(data.id);
        setEvalOpen(data.evaluation_open ?? false);
        setAcademicYear(data.current_academic_year ?? '2025-2026');
        setSemester(data.current_semester ?? '1st Semester');
      }
      setIsLoading(false);
    };
    load();
  }, []);

  // ── Auto-dismiss toast ────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      evaluation_open:       evalOpen,
      current_academic_year: academicYear.trim(),
      current_semester:      semester,
    };

    let error;
    if (configId) {
      ({ error } = await supabase
        .from('system_config')
        .update(payload)
        .eq('id', configId));
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('system_config')
        .insert(payload)
        .select()
        .single();
      error = insertErr;
      if (inserted) setConfigId(inserted.id);
    }

    if (error) {
      setToast({ type: 'error', text: `Save failed: ${error.message}` });
    } else {
      setToast({ type: 'success', text: 'Settings saved successfully.' });
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen circuit-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">System Settings</h1>
          <p className="text-sm text-text-muted mt-1">
            Control the evaluation window and active academic period.
          </p>
        </div>

        {/* ── Toast ────────────────────────────────────────────────────── */}
        {toast && (
          <div className={`mb-6 flex items-center gap-3 p-4 rounded-xl border animate-fade-in-up
            ${toast.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-error/10   border-error/30   text-error'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />
            }
            <p className="text-sm font-medium">{toast.text}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
          </div>
        ) : (
          <div className="max-w-2xl space-y-6 animate-fade-in-up">

            {/* ── Evaluation Window Card ────────────────────────────── */}
            <SectionCard
              title="Evaluation Window"
              subtitle="When open, approved students can submit anonymous evaluations."
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {evalOpen
                    ? <ToggleRight className="w-5 h-5 text-success" />
                    : <ToggleLeft  className="w-5 h-5 text-text-disabled" />
                  }
                  <div>
                    <p className={`text-sm font-bold ${evalOpen ? 'text-success' : 'text-text-secondary'}`}>
                      {evalOpen ? 'OPEN — Submissions Enabled' : 'CLOSED — Submissions Disabled'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {evalOpen
                        ? 'Students can currently evaluate their instructors.'
                        : 'No evaluations can be submitted until the window is opened.'
                      }
                    </p>
                  </div>
                </div>
                <EvalToggle
                  isOpen={evalOpen}
                  onToggle={() => setEvalOpen((v) => !v)}
                  isSaving={isSaving}
                />
              </div>

              {/* Warning banner on toggle */}
              <div className="mt-4 p-3 bg-warning/5 border border-warning/15 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span className="text-warning font-semibold">Note: </span>
                  Changing this setting takes effect immediately for all students in the system.
                </p>
              </div>
            </SectionCard>

            {/* ── Academic Period Card ──────────────────────────────── */}
            <SectionCard
              title="Academic Period"
              subtitle="This determines which semester students are currently evaluating for."
            >
              <div className="space-y-4">
                {/* Academic Year */}
                <div className="space-y-2">
                  <label
                    htmlFor="academic-year"
                    className="block text-xs font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Academic Year
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
                    <input
                      id="academic-year"
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="e.g. 2025-2026"
                      className="glass-input block w-full pl-9 pr-3 py-3 rounded-lg text-sm"
                    />
                  </div>
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <label
                    htmlFor="semester"
                    className="block text-xs font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    Semester
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
                    <select
                      id="semester"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="glass-input block w-full pl-9 pr-3 py-3 rounded-lg text-sm cursor-pointer"
                    >
                      <option value="1st Semester" className="bg-navy-primary text-text-primary">1st Semester</option>
                      <option value="2nd Semester" className="bg-navy-primary text-text-primary">2nd Semester</option>
                      <option value="Summer"       className="bg-navy-primary text-text-primary">Summer</option>
                    </select>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── Save button ───────────────────────────────────────── */}
            <div className="flex justify-end">
              <button
                id="save-settings-btn"
                onClick={handleSave}
                disabled={isSaving}
                className="gold-btn flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
              >
                {isSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save Settings</>
                }
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
