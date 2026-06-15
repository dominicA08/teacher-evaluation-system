import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import LogoHeader from '../../components/LogoHeader';
import {
  UploadCloud, X, CheckCircle2, Clock, AlertCircle, Loader2, ImageIcon,
} from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export default function StudentVerifyID() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [errorMsg, setErrorMsg]     = useState(null);
  const fileInputRef = useRef(null);

  // ── File selection & validation ──────────────────────────────────────────
  const handleFile = useCallback((selected) => {
    setErrorMsg(null);
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setErrorMsg('Only JPG and PNG images are accepted.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setErrorMsg('File is too large. Maximum allowed size is 5MB.');
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreview(url);
  }, []);

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Drag-and-drop handlers ───────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = ()  => setIsDragging(false);
  const onDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  // ── Upload to Supabase Storage + update profile ─────────────────────────
  const handleSubmit = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/student_id.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('student-ids')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Update profile with the raw upload path instead of a public URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          id_image_url:        path,
          verification_status: 'pending',
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Submitted / waiting state ────────────────────────────────────────────
  // Show waiting screen only if:
  //   1. The student just submitted in this session (optimistic update), OR
  //   2. The profile has an uploaded image AND the status is pending/approved
  //      (covers hard refresh — never drop back to upload form after a real submission)
  // NOTE: A new account has status='pending' by default with NO image — that should NOT
  //       trigger the pending screen. We require id_image_url to be set.
  const alreadySubmitted =
    submitted ||
    (profile?.id_image_url &&
      (profile?.verification_status === 'pending' ||
        profile?.verification_status === 'approved'));

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen circuit-bg flex flex-col justify-center py-12 px-4 relative">
        <div className="w-full max-w-md mx-auto">
          <LogoHeader />

          <div className="relative animate-fade-in-up">
            {/* Gold accent bar */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-gold-primary to-transparent rounded-t-2xl z-10" />

            <div className="bg-[#111E35]/75 backdrop-blur-md border border-[#1E3056] rounded-2xl p-8 md:p-10 shadow-2xl text-center space-y-6">
              {/* Animated hourglass icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-warning animate-pulse" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">ID Submitted!</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Your AISAT Student ID has been submitted for review. An administrator will verify
                  your account shortly. You will be automatically redirected once approved.
                </p>
              </div>

              {/* Pulsing status badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 text-warning text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                Verification Pending
              </div>

              <p className="text-xs text-text-disabled">
                You can safely close this tab. You'll be notified when your verification is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload form state ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen circuit-bg flex flex-col justify-center py-12 px-4 relative">
      <div className="w-full max-w-md mx-auto">
        <LogoHeader />

        <div className="relative animate-fade-in-up">
          {/* Gold accent bar */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-gold-primary to-transparent rounded-t-2xl z-10" />

          <div className="bg-[#111E35]/75 backdrop-blur-md border border-[#1E3056] rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Soft glow inside card */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gold-primary/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Header */}
              <div className="text-center">
                {/* Pending badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-medium mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                  Verification Required
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-1">Verify Your Account</h2>
                <p className="text-sm text-text-secondary">
                  Upload your physical AISAT Student ID card to confirm your enrollment.
                </p>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-xs rounded-lg animate-fade-in-up flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Upload zone */}
              {!preview ? (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload student ID card"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group
                    ${isDragging
                      ? 'border-gold-primary bg-gold-primary/5 scale-[1.01]'
                      : 'border-border-steel hover:border-gold-primary/50 hover:bg-gold-primary/5'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200 ${isDragging ? 'bg-gold-primary/20' : 'bg-[#1E3056] group-hover:bg-gold-primary/10'}`}>
                      <UploadCloud className={`w-7 h-7 transition-colors duration-200 ${isDragging ? 'text-gold-primary' : 'text-text-disabled group-hover:text-gold-primary'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-0.5">
                        {isDragging ? 'Drop your ID here' : 'Upload your Student ID Card'}
                      </p>
                      <p className="text-xs text-text-muted">
                        Drag & drop or <span className="text-gold-primary font-medium">browse</span>
                      </p>
                    </div>
                    <p className="text-[10px] text-text-disabled">
                      JPG, PNG — max 5MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                // Preview state
                <div className="relative rounded-xl overflow-hidden border border-border-steel group">
                  <img
                    src={preview}
                    alt="Student ID preview"
                    className="w-full h-48 object-cover"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-primary/80 via-transparent to-transparent" />
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={clearFile}
                    aria-label="Remove selected image"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-error/80 hover:bg-error flex items-center justify-center transition-colors duration-200"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {/* File name badge */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-navy-primary/80 backdrop-blur-sm">
                    <ImageIcon className="w-3 h-3 text-gold-primary" />
                    <span className="text-[10px] text-text-secondary truncate max-w-[180px]">{file.name}</span>
                  </div>
                  {/* Valid indicator */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/20 border border-success/30">
                    <CheckCircle2 className="w-3 h-3 text-success" />
                    <span className="text-[10px] text-success font-medium">Ready to submit</span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-3 bg-seal-blue/10 border border-seal-blue/20 rounded-lg">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <span className="text-info font-semibold">Instructions: </span>
                  Make sure your ID card is clearly visible, all four corners are in the frame,
                  and your name and ID number are legible. Blurry or cropped images will be rejected.
                </p>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!file || isUploading}
                className="gold-btn w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Submit for Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
