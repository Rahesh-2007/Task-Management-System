import React from 'react';
import TasksView from '../components/TasksView';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Dashboard Banner */}
      <div 
        className="dashboard-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>👋</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {getTimeGreeting()}, {user?.name || 'User'}!
            </h1>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
            Unified Dashboard for <strong>{currentWorkspace?.name || 'Personal Workspace'}</strong> ({currentWorkspace?.type === 'company' ? 'Company Team' : 'Personal Tasks'})
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '8px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <Layers size={15} style={{ color: 'var(--accent-indigo)' }} />
          <span>Active View: <strong>Common Dashboard</strong></span>
        </div>
      </div>

      {/* Main Tasks List with Analytics & Todoist Drag-Drop/Postpone */}
      <TasksView
        showAnalytics={true}
        showControls={true}
        showViewSwitcher={true}
        pageTitle="Dashboard"
        emptyMessage="No tasks found on your dashboard"
        emptySubMessage="Create your first task or recurring routine task below to get started."
      />
    </div>
  );
}
