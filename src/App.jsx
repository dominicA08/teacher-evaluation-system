import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage       from './pages/LandingPage';
import StudentLogin      from './pages/student/Login';
import StudentRegister   from './pages/student/Register';
import AdminLogin        from './pages/admin/AdminLogin';

// Student protected pages
import StudentVerifyID   from './pages/student/VerifyID';
import StudentDashboard  from './pages/student/Dashboard';
import StudentEvaluate   from './pages/student/Evaluate';
import StudentHistory    from './pages/student/History';

// Admin protected pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import VerificationQueue from './pages/admin/VerificationQueue';
import FacultyManagement from './pages/admin/FacultyManagement';
import SystemSettings    from './pages/admin/SystemSettings';
import SubjectManagement from './pages/admin/SubjectManagement';

// Teacher pages
import TeacherLogin      from './pages/teacher/TeacherLogin';
import TeacherDashboard  from './pages/teacher/TeacherDashboard';

import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ── Public Routes ──────────────────────────────────────── */}
          <Route path="/"                  element={<LandingPage />} />
          <Route path="/student/login"     element={<StudentLogin />} />
          <Route path="/student/register"  element={<StudentRegister />} />
          <Route path="/admin/login"       element={<AdminLogin />} />

          {/* ── Student Protected Routes ────────────────────────────── */}
          <Route
            path="/student/verify"
            element={
              <ProtectedRoute role="student">
                <StudentVerifyID />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/evaluate/:teacherId/:subjectId"
            element={
              <ProtectedRoute role="student">
                <StudentEvaluate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/history"
            element={
              <ProtectedRoute role="student">
                <StudentHistory />
              </ProtectedRoute>
            }
          />

          {/* ── Admin Protected Routes ──────────────────────────────── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute role="admin">
                <VerificationQueue />
              </ProtectedRoute>
            }
          />

          {/* ── Admin extended routes ────────────────────────────────── */}
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute role="admin">
                <FacultyManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute role="admin">
                <SubjectManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute role="admin">
                <SystemSettings />
              </ProtectedRoute>
            }
          />

          {/* ── Teacher Routes ───────────────────────────────────────── */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── 404 Fallback ─────────────────────────────────────────── */}
          <Route path="*" element={
            <div className="min-h-screen circuit-bg flex flex-col items-center justify-center p-4">
              <div className="text-center bg-card-surface/60 border border-border-steel p-8 rounded-2xl max-w-sm backdrop-blur-md">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h2>
                <p className="text-sm text-text-secondary mb-6">
                  The page you are looking for does not exist or is under construction.
                </p>
                <a href="/" className="gold-btn inline-block px-5 py-2.5 rounded-lg text-sm">
                  Return to Home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
