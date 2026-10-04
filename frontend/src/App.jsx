import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import AuthPage from './pages/AuthPage';
import AppPage from './pages/AppPage';
import CreateWorkspacePage from './pages/CreateWorkspacePage';
import JoinWorkspacePage from './pages/JoinWorkspacePage';

function ProtectedRoute({ children }) {
  const { authUser } = useWorkspace();
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RootRoute() {
  const { authUser } = useWorkspace();
  if (!authUser) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/app" replace />;
}

export default function App() {
  return (
    <WorkspaceProvider>
      <Router>
        <Routes>
          {/* Default entry point: direct to login */}
          <Route path="/" element={<RootRoute />} />

          {/* Login & Sign Up Page */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />

          {/* Protected Workspace Application */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppPage />
              </ProtectedRoute>
            }
          />

          {/* Create Workspace Page */}
          <Route
            path="/create-workspace"
            element={
              <ProtectedRoute>
                <CreateWorkspacePage />
              </ProtectedRoute>
            }
          />

          {/* Join / Accept Workspace Invitation */}
          <Route
            path="/join-workspace"
            element={
              <ProtectedRoute>
                <JoinWorkspacePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accept-invite"
            element={
              <ProtectedRoute>
                <JoinWorkspacePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </WorkspaceProvider>
  );
}
