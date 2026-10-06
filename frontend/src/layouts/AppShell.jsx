import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import AppHeader from '../components/app/AppHeader';
import AppSidebar from '../components/app/AppSidebar';
import RightDashboardPanel from '../components/app/RightDashboardPanel';
import TaskDetailModal from '../components/app/TaskDetailModal';
import QuickAddModal from '../components/app/QuickAddModal';
import NotificationCenter from '../components/app/NotificationCenter';
import InviteModal from '../components/app/InviteModal';
import ReportsModal from '../components/app/ReportsModal';

export default function AppShell() {
  const { isSidebarOpen, setIsQuickAddOpen } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  // Global Keyboard shortcuts: Q for quick add, / for search, Esc to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;

      if (isInput) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if (e.key === '/') {
        e.preventDefault();
        navigate('/app/search');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, setIsQuickAddOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cream font-sans text-neutral-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Sidebar Navigation */}
      <AppSidebar />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Unified Top Header Bar */}
        <AppHeader />

        {/* Dynamic Outlet Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Persistent Right Activity & Calendar Panel */}
      <RightDashboardPanel />

      {/* Global Modals & Drawers */}
      <TaskDetailModal />
      <QuickAddModal />
      <NotificationCenter />
      <InviteModal />
      <ReportsModal />
    </div>
  );
}
