import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';
import {
  BookOpen, Plus, Pencil, Trash2, Loader2, X,
  Search, RefreshCw, CheckCircle2, AlertTriangle,
  GraduationCap,
} from 'lucide-react';

// ── Toast notification ────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`mb-6 flex items-center gap-3 p-4 rounded-xl border animate-fade-in-up
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

// ── Subject Add / Edit Modal ──────────────────────────────────────────────
function SubjectModal({ mode, subject, teachers, onClose, onSaved, setToast }) {
  const isEdit = mode === 'edit';

  const [subjectCode, setSubjectCode]   = useState(isEdit ? subject.subject_code : '');
  const [subjectTitle, setSubjectTitle] = useState(isEdit ? subject.subject_title : '');
  const [teacherId, setTeacherId]       = useState(isEdit ? subject.teacher_id : '');
  const [isSaving, setIsSaving]         = useState(false);
  const [formError, setFormError]       = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!subjectCode.trim())  { setFormError('Subject code is required.'); return; }
    if (!subjectTitle.trim()) { setFormError('Subject title is required.'); return; }
    if (!teacherId)           { setFormError('Please assign a teacher.'); return; }

    setIsSaving(true);
    try {
      const payload = {
        subject_code:  subjectCode.trim().toUpperCase(),
        subject_title: subjectTitle.trim(),
        teacher_id:    teacherId,
      };

      if (isEdit) {
        const { error } = await supabase.from('subjects').update(payload).eq('id', subject.id);
        if (error) throw new Error(error.message);
        setToast({ type: 'success', text: `"${payload.subject_code}" updated successfully.` });
      } else {
        const { error } = await supabase.from('subjects').insert(payload);
        if (error) throw new Error(error.message);
        setToast({ type: 'success', text: `"${payload.subject_code}" added successfully.` });
      }
      onSaved();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-primary/80 backdrop-blur-sm p-4">
      <div className="bg-[#111E35] border border-border-steel rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border-steel">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gold-primary" />
            </div>
            <h2 className="text-base font-bold text-text-primary">
              {isEdit ? 'Edit Subject' : 'Add New Subject'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {formError && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {formError}
            </div>
          )}

          {/* Subject Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Subject Code
            </label>
            <input
              type="text"
              required
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. CS101"
              className="glass-input block w-full py-2.5 px-3 rounded-lg text-sm font-mono uppercase"
            />
          </div>

          {/* Subject Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Subject Title
            </label>
            <input
              type="text"
              required
              value={subjectTitle}
              onChange={(e) => setSubjectTitle(e.target.value)}
              placeholder="e.g. Introduction to Programming"
              className="glass-input block w-full py-2.5 px-3 rounded-lg text-sm"
            />
          </div>

          {/* Assign Teacher */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Assigned Teacher
            </label>
            <select
              required
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="glass-input block w-full py-2.5 px-3 rounded-lg text-sm"
            >
              <option value="">— Select a teacher —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
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
                : isEdit ? 'Update Subject' : 'Add Subject'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────
function DeleteModal({ subject, onClose, onDeleted, setToast }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
      if (error) throw new Error(error.message);
      setToast({ type: 'success', text: `"${subject.subject_code}" removed.` });
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
            <h3 className="text-lg font-bold text-text-primary">Remove Subject?</h3>
            <p className="text-sm text-text-secondary mt-1">
              This will permanently delete{' '}
              <span className="text-text-primary font-semibold">
                {subject.subject_code} – {subject.subject_title}
              </span>
              . Any linked evaluations will no longer reference this subject. This action cannot be undone.
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
export default function SubjectManagement() {
  const [subjects,  setSubjects]  = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null); // null | { mode: 'add' } | { mode: 'edit', subject } | { mode: 'delete', subject }
  const [toast,     setToast]     = useState(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Fetch subjects + teachers ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const [subjRes, teachRes] = await Promise.all([
      supabase
        .from('subjects')
        .select('id, subject_code, subject_title, teacher_id, teachers(full_name)')
        .order('subject_code', { ascending: true }),
      supabase
        .from('teachers')
        .select('id, full_name')
        .order('full_name', { ascending: true }),
    ]);

    if (!subjRes.error)  setSubjects(subjRes.data ?? []);
    if (!teachRes.error) setTeachers(teachRes.data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Search filter ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setFiltered(subjects); return; }
    const q = search.toLowerCase();
    setFiltered(
      subjects.filter((s) =>
        s.subject_code?.toLowerCase().includes(q) ||
        s.subject_title?.toLowerCase().includes(q) ||
        s.teachers?.full_name?.toLowerCase().includes(q)
      )
    );
  }, [subjects, search]);

  const handleSaved   = () => { setModal(null); fetchData(); };
  const handleDeleted = () => { setModal(null); fetchData(); };

  return (
    <div className="min-h-screen circuit-bg flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">Admin</p>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Subject Management</h1>
            <p className="text-sm text-text-muted mt-1">
              Register, edit, or remove course subjects and their faculty assignments.
            </p>
          </div>
          <button
            id="add-subject-btn"
            onClick={() => setModal({ mode: 'add' })}
            className="gold-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>

        <Toast toast={toast} />

        {/* ── Summary Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md">
          <div className="bg-[#111E35]/70 border border-border-steel rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-gold-primary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Total Subjects</p>
              <p className="text-xl font-bold text-text-primary">{subjects.length}</p>
            </div>
          </div>
          <div className="bg-[#111E35]/70 border border-border-steel rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-border-steel/40 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Faculty Count</p>
              <p className="text-xl font-bold text-text-primary">{teachers.length}</p>
            </div>
          </div>
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
            <input
              type="text"
              placeholder="Search by code, title or teacher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-9 pr-3 py-2.5 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={fetchData}
            aria-label="Refresh list"
            className="p-2.5 rounded-lg border border-border-steel text-text-secondary hover:text-gold-primary hover:border-gold-primary/40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* ── Table / Cards ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border-steel rounded-xl">
            <BookOpen className="w-12 h-12 text-text-disabled mx-auto mb-3" />
            <p className="text-text-secondary font-semibold">
              {search ? 'No subjects match your search.' : 'No subjects registered yet.'}
            </p>
            <p className="text-xs text-text-disabled mt-1">
              {!search && 'Click "Add Subject" to register the first course.'}
            </p>
          </div>
        ) : (
          /* ── Desktop Table ── */
          <div className="overflow-x-auto rounded-xl border border-border-steel">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border-steel bg-[#0E172B]/80">
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-32">
                    Code
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Subject Title
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-steel/50">
                {filtered.map((subj) => (
                  <tr
                    key={subj.id}
                    className="bg-[#111E35]/70 hover:bg-[#111E35]/90 transition-colors duration-150 animate-fade-in-up"
                  >
                    {/* Code */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] font-bold text-gold-primary bg-gold-primary/10 border border-gold-primary/15 px-2.5 py-1 rounded tracking-wide">
                        {subj.subject_code}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-text-primary">{subj.subject_title}</p>
                    </td>

                    {/* Instructor */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-primary/20 to-gold-primary/5 border border-gold-primary/20 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-3 h-3 text-gold-primary" />
                        </div>
                        <span className="text-sm text-text-secondary">
                          {subj.teachers?.full_name ?? '—'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal({ mode: 'edit', subject: subj })}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-steel text-xs font-semibold text-text-secondary hover:text-gold-primary hover:border-gold-primary/30 transition-all cursor-pointer"
                          aria-label={`Edit ${subj.subject_code}`}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setModal({ mode: 'delete', subject: subj })}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-steel text-xs font-semibold text-text-secondary hover:text-error hover:border-error/30 hover:bg-error/5 transition-all cursor-pointer"
                          aria-label={`Remove ${subj.subject_code}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {(modal?.mode === 'add' || modal?.mode === 'edit') && (
        <SubjectModal
          mode={modal.mode}
          subject={modal.subject}
          teachers={teachers}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          setToast={setToast}
        />
      )}
      {modal?.mode === 'delete' && (
        <DeleteModal
          subject={modal.subject}
          onClose={() => setModal(null)}
          onDeleted={handleDeleted}
          setToast={setToast}
        />
      )}
    </div>
  );
}
