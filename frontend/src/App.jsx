import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';

// Layouts
import AppShell from './layouts/AppShell';

// Public & Auth Pages
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import NotFoundPage from './pages/NotFoundPage';

// Protected App Pages
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import InboxPage from './pages/InboxPage';
import CalendarPage from './pages/CalendarPage';
import BoardPage from './pages/BoardPage';
import WorkloadPage from './pages/WorkloadPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import LabelsPage from './pages/LabelsPage';
import MembersPage from './pages/MembersPage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';
import MeetingsPage from './pages/MeetingsPage';
import TeamChatPage from './pages/TeamChatPage';
import VacationsPage from './pages/VacationsPage';
import NotificationsPage from './pages/NotificationsPage';
import CreateWorkspacePage from './pages/CreateWorkspacePage';
import JoinWorkspacePage from './pages/JoinWorkspacePage';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center font-medium text-xs text-neutral-500">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-xl bg-[#E11D48] text-white flex items-center justify-center font-black mx-auto animate-pulse">
            T
          </div>
          <p>Restoring TaskFlow session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
}

// GuestRoute must be rendered inside <Router> (it is — used inside <Routes>)
function GuestRoute({ children }) {
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  if (isLoading) return null;
  if (user) {
    // Honor ?redirect= param so invite links work even for already-logged-in users
    const redirect = searchParams.get('redirect');
    if (redirect && redirect.startsWith('/')) {
      return <Navigate to={redirect} replace />;
    }
    return <Navigate to="/app/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <Router>
          <Routes>
            {/* 1. Authentication (Guest Only) - Root is AuthPage */}
            <Route
              path="/"
              element={
                <GuestRoute>
                  <AuthPage />
                </GuestRoute>
              }
            />

            {/* 2. Authentication (Guest Only) */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <AuthPage />
                </GuestRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <AuthPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <AuthPage />
                </GuestRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* 3. Invitation link */}
            <Route path="/invite/:token" element={<AcceptInvitePage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* 4. Protected Workspace Application Shell */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<TodayPage />} />
              <Route path="inbox" element={<InboxPage />} />
              <Route path="today" element={<TodayPage />} />
              <Route path="upcoming" element={<UpcomingPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="board" element={<BoardPage />} />
              <Route path="workload" element={<WorkloadPage />} />
              <Route path="my-tasks" element={<TodayPage filter="my_tasks" />} />
              <Route path="important" element={<TodayPage filter="important" />} />
              <Route path="completed" element={<TodayPage filter="completed" />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="labels" element={<LabelsPage />} />
              <Route path="labels/:labelId" element={<LabelsPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="meetings" element={<MeetingsPage />} />
              <Route path="chat" element={<TeamChatPage />} />
              <Route path="vacations" element={<VacationsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>

            {/* 5. Workspace creation & join (Protected) */}
            <Route
              path="/workspaces/new"
              element={
                <ProtectedRoute>
                  <CreateWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-workspace"
              element={
                <ProtectedRoute>
                  <CreateWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces/join"
              element={
                <ProtectedRoute>
                  <JoinWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/join-workspace"
              element={
                <ProtectedRoute>
                  <JoinWorkspacePage />
                </ProtectedRoute>
              }
            />

            {/* 6. 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
