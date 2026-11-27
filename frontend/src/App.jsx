import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import TeamPage from './pages/TeamPage';
import AuditLogsPage from './pages/AuditLogsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        Loading workspace...
      </div>
    );
  }
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
