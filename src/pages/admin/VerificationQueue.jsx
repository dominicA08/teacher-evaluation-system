import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import AdminSidebar from '../../components/AdminSidebar';
import {
  CheckCircle2, XCircle, Clock, Loader2, ZoomIn, ChevronLeft,
  Search, RefreshCw, User, Hash,
} from 'lucide-react';

// ── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    pending:  { label: 'Pending',  color: 'bg-warning/10 border-warning/20 text-warning' },
    approved: { label: 'Approved', color: 'bg-success/10 border-success/20 text-success' },
    rejected: { label: 'Rejected', color: 'bg-error/10   border-error/20   text-error'   },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${c.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {c.label}
    </span>
  );
}

// ── Zoomable image modal ──────────────────────────────────────────────────
function ImageZoom({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-primary/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <img
        src={src}
        alt="Student ID card enlarged"
        className="max-w-full max-h-full rounded-xl shadow-2xl border border-border-steel object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ── Main Queue Page ───────────────────────────────────────────────────────
export default function VerificationQueue() {
  const [students, setStudents]     = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected]     = useState(null); // selected student for detail panel
  const [isActing, setIsActing]     = useState(false);
  const [actionMsg, setActionMsg]   = useState(null);
  const [zoomSrc, setZoomSrc]       = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);

  // Generate signed URL when selected student changes
  useEffect(() => {
    let active = true;
    const loadSignedUrl = async () => {
      if (!selected?.id_image_url) {
        setPreviewUrl(null);
        return;
      }
      
      // Legacy support: if already a full HTTP URL, use it directly
      if (selected.id_image_url.startsWith('http://') || selected.id_image_url.startsWith('https://')) {
        setPreviewUrl(selected.id_image_url);
        return;
      }

      setIsGeneratingUrl(true);
      try {
        const { data, error } = await supabase.storage
          .from('student-ids')
          .createSignedUrl(selected.id_image_url, 60);

        if (error) throw error;
        if (active && data?.signedUrl) {
          setPreviewUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error generating signed URL:', err);
        if (active) setPreviewUrl(null);
      } finally {
        if (active) setIsGeneratingUrl(false);
      }
    };

    loadSignedUrl();
    return () => {
      active = false;
    };
  }, [selected]);

  // ── Fetch students ────────────────────────────────────────────────────
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, id_image_url, verification_status, created_at')
      .order('created_at', { ascending: false });

    if (!error) {
      setStudents(data ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Client-side filter ────────────────────────────────────────────────
  useEffect(() => {
    let list = students;
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.verification_status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.email?.toLowerCase().includes(q) || parseStudentId(s.email).includes(q)
      );
    }
    setFiltered(list);
  }, [students, statusFilter, search]);

  // ── Approve / Reject actions ──────────────────────────────────────────
  const handleAction = async (studentId, newStatus) => {
    setIsActing(true);
    setActionMsg(null);

    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: newStatus })
      .eq('id', studentId);

    if (error) {
      setActionMsg({ type: 'error', text: error.message });
    } else {
      setActionMsg({
        type: 'success',
        text: newStatus === 'approved' ? '✅ Student approved successfully.' : '❌ Student rejected.',
      });
      // Update local state immediately (Realtime handles the student session)
      setStudents((prev) =>
        prev.map((s) => s.id === studentId ? { ...s, verification_status: newStatus } : s)
      );
      if (selected?.id === studentId) {
        setSelected((prev) => ({ ...prev, verification_status: newStatus }));
      }
    }
    setIsActing(false);
  };

  // ── Format date ───────────────────────────────────────────────────────
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ── Extract student name from email ──────────────────────────────────
  const parseName = (email) => {
    // aisat.johndoe123456@gmail.com → "johndoe"
    const match = email?.match(/^aisat\.([a-zA-Z.]+)\d{6}@gmail\.com$/i);
    return match ? match[1].replace(/\./g, ' ') : '—';
  };

  const pendingCount = students.filter((s) => s.verification_status === 'pending').length;

  return (
    <div className="min-h-screen circuit-bg flex">
      <AdminSidebar pendingCount={pendingCount} />

      {/* Main content area */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left panel: table ──────────────────────────────────────── */}
        <div className={`flex-1 overflow-auto p-6 lg:p-8 ${selected ? 'hidden lg:block' : ''}`}>

          {/* Page header */}
          <div className="mb-6 animate-fade-in-up">
            <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-1">Admin</p>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">Verification Queue</h1>
            <p className="text-sm text-text-muted mt-1">
              Review submitted student ID cards and approve or reject accounts.
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
              <input
                type="text"
                placeholder="Search by email or ID number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input w-full pl-9 pr-3 py-2.5 rounded-lg text-sm"
              />
            </div>

            {/* Status filter pills */}
            <div className="flex gap-2 items-center">
              {['pending', 'approved', 'rejected', 'all'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-150
                    ${statusFilter === s
                      ? 'bg-gold-primary text-navy-primary shadow-md'
                      : 'bg-[#111E35] border border-border-steel text-text-secondary hover:border-gold-primary/40'
                    }`}
                >
                  {s}
                </button>
              ))}
              <button
                onClick={fetchStudents}
                aria-label="Refresh list"
                className="p-2 rounded-lg border border-border-steel text-text-secondary hover:text-gold-primary hover:border-gold-primary/40 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold-primary animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Clock className="w-12 h-12 text-text-disabled mx-auto mb-3" />
              <p className="text-text-secondary text-sm font-medium">No students found</p>
              <p className="text-text-disabled text-xs mt-1">Try a different filter or refresh</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border-steel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-steel bg-[#111E35]/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Student Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden sm:table-cell">Parsed ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Submitted</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, idx) => (
                    <tr
                      key={student.id}
                      onClick={() => setSelected(student)}
                      className={`border-b border-border-steel/50 cursor-pointer transition-colors duration-150
                        ${selected?.id === student.id
                          ? 'bg-gold-primary/5 border-l-2 border-l-gold-primary'
                          : 'hover:bg-white/[0.02]'
                        }
                        ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
                    >
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-text-primary font-medium truncate max-w-[180px]">{student.email}</p>
                          <p className="text-text-disabled text-xs mt-0.5 capitalize">{parseName(student.email)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="font-mono text-gold-primary font-semibold text-xs">
                          {parseStudentId(student.email)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={student.verification_status} />
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-text-muted text-xs">
                        {formatDate(student.created_at)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(student); }}
                          className="text-xs text-gold-primary hover:underline font-medium"
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right panel: detail review ─────────────────────────────── */}
        {selected && (
          <div className="w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-border-steel bg-[#111E35]/60 backdrop-blur-md overflow-auto animate-fade-in-up p-6">
            {/* Back button (mobile) */}
            <button
              onClick={() => { setSelected(null); setActionMsg(null); }}
              className="lg:hidden flex items-center gap-2 text-sm text-text-secondary hover:text-gold-primary mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to list
            </button>

            {/* Gold accent bar at top */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-gold-primary to-transparent rounded-full mb-6" />

            <p className="text-xs font-semibold text-gold-primary uppercase tracking-wider mb-4">ID Verification Review</p>

            {/* Action message */}
            {actionMsg && (
              <div className={`p-3 rounded-lg border text-xs mb-4 animate-fade-in-up
                ${actionMsg.type === 'success'
                  ? 'bg-success/10 border-success/20 text-success'
                  : 'bg-error/10 border-error/20 text-error'
                }`}
              >
                {actionMsg.text}
              </div>
            )}

            {/* ── Side-by-side comparison area ─────────────────────── */}
            <div className="space-y-6">

              {/* Parsed data section */}
              <div className="p-4 rounded-xl bg-[#0D1829]/60 border border-border-steel space-y-3">
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">From Email</p>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-seal-blue/20 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-disabled">Parsed Student ID</p>
                    <p className="text-2xl font-bold font-mono text-gold-primary tracking-wider">
                      {parseStudentId(selected.email)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-seal-blue/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-info" />
                  </div>
                  <div>
                    <p className="text-[10px] text-text-disabled">Parsed Name</p>
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {parseName(selected.email)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-text-disabled mb-0.5">Email</p>
                  <p className="text-xs text-text-secondary break-all">{selected.email}</p>
                </div>
              </div>

              {/* ID Card image */}
              <div>
                <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Submitted ID Card</p>
                {isGeneratingUrl ? (
                  <div className="h-48 rounded-xl border border-border-steel flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gold-primary animate-spin" />
                  </div>
                ) : previewUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border-steel cursor-zoom-in"
                    onClick={() => setZoomSrc(previewUrl)}
                  >
                    <img
                      src={previewUrl}
                      alt="Submitted student ID card"
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-navy-primary/0 group-hover:bg-navy-primary/30 transition-all duration-200 flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
                    </div>
                    <p className="text-[10px] text-text-disabled text-center mt-1">Click to enlarge</p>
                  </div>
                ) : (
                  <div className="h-48 rounded-xl border border-dashed border-border-steel flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-text-disabled text-xs">No ID image submitted yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification instruction */}
              <div className="p-3 bg-info/5 border border-info/15 rounded-lg">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span className="text-info font-semibold">Instruction: </span>
                  Verify that the <strong className="text-text-primary">ID number {parseStudentId(selected.email)}</strong> shown
                  above matches the physical card in the photo. Names should also match.
                </p>
              </div>

              {/* Current status */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">Current status:</p>
                <StatusBadge status={selected.verification_status} />
              </div>

              {/* Action buttons */}
              {selected.verification_status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="reject-student-btn"
                    onClick={() => handleAction(selected.id, 'rejected')}
                    disabled={isActing}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-error/40 bg-error/10 text-error text-sm font-semibold hover:bg-error/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject
                  </button>
                  <button
                    id="approve-student-btn"
                    onClick={() => handleAction(selected.id, 'approved')}
                    disabled={isActing}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-success/10 border border-success/40 text-success text-sm font-semibold hover:bg-success/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                </div>
              )}

              {/* Already actioned */}
              {selected.verification_status !== 'pending' && (
                <p className="text-center text-xs text-text-muted">
                  This account has already been {selected.verification_status}.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Zoom modal */}
      {zoomSrc && <ImageZoom src={zoomSrc} onClose={() => setZoomSrc(null)} />}
    </div>
  );
}

// Hoist parseName outside component for reuse
function parseName(email) {
  const match = email?.match(/^aisat\.([a-zA-Z.]+)\d{6}@gmail\.com$/i);
  return match ? match[1].replace(/\./g, ' ') : '—';
}

const parseStudentId = (email) => {
  if (!email) return 'N/A';
  const match = email.match(/(\d+)(?=@gmail\.com)/i);
  return match ? match[1] : 'N/A';
};
