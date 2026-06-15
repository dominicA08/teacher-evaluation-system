import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';
import {
  GraduationCap, Plus, Pencil, Trash2, Loader2, X,
  BookOpen, Search, RefreshCw, CheckCircle2, AlertTriangle,
  ChevronRight, Mail,
} from 'lucide-react';

// ── Secondary anon client for auth creation (doesn't touch admin session) ─
const supabaseAlt = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ── Teacher email validator ───────────────────────────────────────────────
// Pattern: aisat.[surname].teacher[1-2digits].[8digits]@gmail.com
const TEACHER_EMAIL_REGEX = /^aisat\.([a-zA-Z.-]+)\.teacher(\d{1,2})\.(\d{8})@gmail\.com$/i;

function validateTeacherEmail(email) {
  if (!email) return { isValid: false, error: 'Email is required.' };
  const match = email.toLowerCase().trim().match(TEACHER_EMAIL_REGEX);
  if (!match) {
    return {
      isValid: false,
      error: 'Email must follow: aisat.[surname].teacher[1-2 digits].[8 digits]@gmail.com',
    };
  }
  return { isValid: true, error: null };
}

// ── Status toast ─────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`mb-6 flex items-center gap-3 p-4 rounded-xl border animate-fade-in-up
      ${toast.type === 'success'
        ? 'bg-success/10 border-success/30 text-success'
        : 'bg-error/10 border-error/30 text-error'
      }`}
    >
      {toast.type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertTriangle className="w-4 h-4 shrink-0" />
      }
      <p className="text-sm font-medium">{toast.text}</p>
    </div>
  );
}

// ── Subject row input inside modal ────────────────────────────────────────
function SubjectRow({ subject, index, onChange, onRemove }) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        placeholder="Code (e.g. CS101)"
        value={subject.subject_code}
        onChange={(e) => onChange(index, 'subject_code', e.target.value)}
        className="glass-input flex-none w-28 py-2 px-3 rounded-lg text-xs"
      />
      <input
        type="text"
        placeholder="Subject Title"
        value={subject.subject_title}
        onChange={(e) => onChange(index, 'subject_title', e.target.value)}
        className="glass-input flex-1 py-2 px-3 rounded-lg text-xs"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-lg text-text-disabled hover:text-error hover:bg-error/10 transition-colors shrink-0"
        aria-label="Remove subject"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Teacher modal (add / edit) ────────────────────────────────────────────
function TeacherModal({ mode, teacher, onClose, onSaved, setToast }) {
  const isEdit = mode === 'edit';

  const [fullName, setFullName]   = useState(isEdit ? teacher.full_name : '');
  const [email, setEmail]         = useState(isEdit ? (teacher.email || '') : '');
  const [password, setPassword]   = useState('');
  const [subjects, setSubjects]   = useState(
    isEdit ? (teacher.subjects ?? []) : [{ subject_code: '', subject_title: '' }]
  );
  const [isSaving, setIsSaving]   = useState(false);
  const [formError, setFormError] = useState(null);

  const emailValidation = validateTeacherEmail(email);

  const addSubjectRow = () =>
    setSubjects((prev) => [...prev, { subject_code: '', subject_title: '' }]);

  const removeSubjectRow = (idx) =>
    setSubjects((prev) => prev.filter((_, i) => i !== idx));

  const handleSubjectChange = (idx, field, value) =>
    setSubjects((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) { setFormError('Full name is required.'); return; }
    if (!emailValidation.isValid) { setFormError(emailValidation.error); return; }
    if (!isEdit && password.length < 8) { setFormError('Password must be at least 8 characters.'); return; }

    const validSubjects = subjects.filter(
      (s) => s.subject_code.trim() && s.subject_title.trim()
    );
    if (validSubjects.length === 0) {
      setFormError('Add at least one subject with a code and title.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEdit) {
        // ── EDIT MODE ──
        // 1. Update teacher record
        const { error: updateErr } = await supabase
          .from('teachers')
          .update({ full_name: fullName.trim(), email: email.trim() })
          .eq('id', teacher.id);

        if (updateErr) throw new Error(updateErr.message);

        // 2. Delete old subjects, re-insert new ones
        await supabase.from('subjects').delete().eq('teacher_id', teacher.id);
        const subjectRows = validSubjects.map((s) => ({
          subject_code:  s.subject_code.trim().toUpperCase(),
          subject_title: s.subject_title.trim(),
          teacher_id:    teacher.id,
        }));
        const { error: subjErr } = await supabase.from('subjects').insert(subjectRows);
        if (subjErr) throw new Error(subjErr.message);

        setToast({ type: 'success', text: `${fullName} updated successfully.` });
        onSaved();
      } else {
        // ── ADD MODE ──
        // 1. Create auth user via secondary client
        const { data: authData, error: authErr } = await supabaseAlt.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { role: 'teacher' } },
        });

        if (authErr) throw new Error(authErr.message);
        const teacherId = authData.user?.id;
        if (!teacherId) throw new Error('Auth user creation did not return a user ID.');

        // 2. Insert into teachers table
        const { error: teacherErr } = await supabase
          .from('teachers')
          .insert({ id: teacherId, full_name: fullName.trim(), email: email.trim() });

        if (teacherErr) throw new Error(teacherErr.message);

        // 3. Insert subjects
        const subjectRows = validSubjects.map((s) => ({
          subject_code:  s.subject_code.trim().toUpperCase(),
          subject_title: s.subject_title.trim(),
          teacher_id:    teacherId,
        }));
        const { error: subjErr } = await supabase.from('subjects').insert(subjectRows);
        if (subjErr) throw new Error(subjErr.message);

        setToast({ type: 'success', text: `${fullName} added successfully.` });
        onSaved();
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-primary/80 backdrop-blur-sm p-4">
      <div className="bg-[#111E35] border border-border-steel rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-steel">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-gold-primary" />
            </div>
            <h2 className="text-base font-bold text-text-primary">
              {isEdit ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-disabled hover:text-text-primary hover:bg-white/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {formError && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              className="glass-input block w-full py-2.5 px-3 rounded-lg text-sm"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              AISAT Teacher Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aisat.surname.teacher1.20241012@gmail.com"
                className="glass-input block w-full pl-9 pr-3 py-2.5 rounded-lg text-sm"
              />
            </div>
            {email && (
              <p className={`text-[11px] flex items-center gap-1.5 ${emailValidation.isValid ? 'text-success' : 'text-error'}`}>
                {emailValidation.isValid
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Valid teacher email format</>
                  : <><AlertTriangle className="w-3.5 h-3.5" /> {emailValidation.error}</>
                }
              </p>
            )}
            <p className="text-[10px] text-text-disabled leading-relaxed">
              Format: <span className="font-mono text-text-muted">aisat.[surname].teacher[1-2 digits].[8 digits]@gmail.com</span>
            </p>
          </div>

          {/* Password (add only) */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Initial Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="glass-input block w-full py-2.5 px-3 rounded-lg text-sm"
              />
            </div>
          )}

          {/* Subjects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                CS Subjects Handled
              </label>
              <button
                type="button"
                onClick={addSubjectRow}
                className="flex items-center gap-1.5 text-xs text-gold-primary hover:underline font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Subject
              </button>
            </div>
            <div className="space-y-2">
              {subjects.map((subj, i) => (
                <SubjectRow
                  key={i}
                  subject={subj}
                  index={i}
                  onChange={handleSubjectChange}
                  onRemove={removeSubjectRow}
                />
              ))}
            </div>
            {subjects.length === 0 && (
              <p className="text-xs text-text-disabled text-center py-3 border border-dashed border-border-steel rounded-lg">
                No subjects added yet.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-steel">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-border-steel text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="gold-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
            >
              {isSaving
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : isEdit ? 'Update Teacher' : 'Add Teacher'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────
function DeleteModal({ teacher, onClose, onDeleted, setToast }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete subjects first (FK constraint)
      await supabase.from('subjects').delete().eq('teacher_id', teacher.id);
      const { error } = await supabase.from('teachers').delete().eq('id', teacher.id);
      if (error) throw new Error(error.message);
      setToast({ type: 'success', text: `${teacher.full_name} removed.` });
      onDeleted();
    } catch (err) {
      setToast({ type: 'error', text: err.message });
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-primary/80 backdrop-blur-sm p-4">
      <div className="bg-[#111E35] border border-border-steel rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-error" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Remove Teacher?</h3>
            <p className="text-sm text-text-secondary mt-1">
              This will permanently delete <span className="text-text-primary font-semibold">{teacher.full_name}</span> and
              all of their assigned subjects. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-border-steel text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-error/10 border border-error/40 text-error text-xs font-semibold hover:bg-error/20 transition-all cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
          >
            {isDeleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Removing…</> : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function FacultyManagement() {
  const [teachers, setTeachers]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null); // null | { mode: 'add' } | { mode: 'edit', teacher } | { mode: 'delete', teacher }
  const [toast, setToast]           = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Fetch teachers + subjects ─────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('teachers')
      .select('id, full_name, email, subjects(id, subject_code, subject_title)')
      .order('full_name', { ascending: true });

    if (!error) setTeachers(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // ── Search filter ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setFiltered(teachers); return; }
    const q = search.toLowerCase();
    setFiltered(
      teachers.filter((t) =>
        t.full_name?.toLowerCase().includes(q)
      )
    );
  }, [teachers, search]);

  const handleSaved = () => { setModal(null); fetchTeachers(); };
  const handleDeleted = () => { setModal(null); fetchTeachers(); };

  return (
    <div className="min-h-screen circuit-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">

        {/* ── Page header ──────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">Admin</p>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Faculty Management</h1>
            <p className="text-sm text-text-muted mt-1">
              Add, edit, or remove Computer Science instructors and their assigned subjects.
            </p>
          </div>
          <button
            id="add-teacher-btn"
            onClick={() => setModal({ mode: 'add' })}
            className="gold-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>

        <Toast toast={toast} />

        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-9 pr-3 py-2.5 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={fetchTeachers}
            aria-label="Refresh list"
            className="p-2.5 rounded-lg border border-border-steel text-text-secondary hover:text-gold-primary hover:border-gold-primary/40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ── Content ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border-steel rounded-xl">
            <GraduationCap className="w-12 h-12 text-text-disabled mx-auto mb-3" />
            <p className="text-text-secondary font-semibold">
              {search ? 'No teachers match your search.' : 'No teachers added yet.'}
            </p>
            <p className="text-xs text-text-disabled mt-1">
              {!search && 'Click "Add Teacher" to provision the first faculty account.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-[#111E35]/70 border border-border-steel rounded-xl p-5 hover:border-gold-primary/20 transition-all duration-200 animate-fade-in-up"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left — teacher info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-primary/20 to-gold-primary/5 border border-gold-primary/20 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5 text-gold-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary">{teacher.full_name}</p>
                      {/* Email hidden from student views — only visible here in admin */}
                      <p className="text-[11px] text-text-disabled mt-0.5 font-mono truncate">
                        {teacher.email}
                      </p>

                      {/* Subjects */}
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {teacher.subjects.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold-primary bg-gold-primary/10 border border-gold-primary/15 px-2 py-0.5 rounded"
                            >
                              <BookOpen className="w-2.5 h-2.5" />
                              {s.subject_code} · {s.subject_title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-text-disabled mt-1 italic">No subjects assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setModal({ mode: 'edit', teacher: { ...teacher, subjects: teacher.subjects ?? [] } })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-steel text-xs font-semibold text-text-secondary hover:text-gold-primary hover:border-gold-primary/30 transition-all cursor-pointer"
                      aria-label={`Edit ${teacher.full_name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => setModal({ mode: 'delete', teacher })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-steel text-xs font-semibold text-text-secondary hover:text-error hover:border-error/30 hover:bg-error/5 transition-all cursor-pointer"
                      aria-label={`Remove ${teacher.full_name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <TeacherModal
          mode={modal.mode}
          teacher={modal.teacher}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          setToast={setToast}
        />
      )}
      {modal?.mode === 'delete' && (
        <DeleteModal
          teacher={modal.teacher}
          onClose={() => setModal(null)}
          onDeleted={handleDeleted}
          setToast={setToast}
        />
      )}
    </div>
  );
}
