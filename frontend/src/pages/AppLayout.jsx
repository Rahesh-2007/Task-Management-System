import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';

export default function AppLayout({ toasts, onRemoveToast, onUndo, theme, onToggleTheme }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Loading TaskFlow Pro...</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Restoring your session</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onCloseMobile={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="app-main">
        {/* Top bar (mobile + theme controls) */}
        <div className="app-topbar">
          <button
            className="btn-icon topbar-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="topbar-right">
            <button className="btn-icon" onClick={onToggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="app-content">
          <Outlet />
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={onRemoveToast} onUndo={onUndo} />
    </div>
  );
}
