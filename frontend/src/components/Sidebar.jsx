import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CalendarDays, Tag, FolderOpen,
  Star, Settings, LogOut, ChevronDown, ChevronRight,
  Plus, Building2, CheckSquare, Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { createWorkspaceApi } from '../api/workspaceApi';

export default function Sidebar({ onCloseMobile }) {
  const { user, workspaces, logout, addWorkspace } = useAuth();
  const { currentWorkspace, projects, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [projectsOpen, setProjectsOpen] = useState(true);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [wsError, setWsError] = useState('');

  const isPersonal = currentWorkspace?.type === 'personal';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNavClick = () => {
    onCloseMobile?.();
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) { setWsError('Name required'); return; }
    try {
      const api = createWorkspaceApi(user.id);
      const ws = await api.createWorkspace(newWsName.trim());
      addWorkspace(ws);
      switchWorkspace(ws);
      setCreatingWorkspace(false);
      setNewWsName('');
      navigate('/members');
    } catch (err) {
      setWsError(err.message);
    }
  };

  const navItem = (to, icon, label, end = false) => (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
      onClick={handleNavClick}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className="sidebar">
      {/* Workspace Switcher */}
      <div className="sidebar-workspace-switcher" onClick={() => setWorkspaceSwitcherOpen(!workspaceSwitcherOpen)}>
        <div className="ws-icon">
          {currentWorkspace?.type === 'company' ? <Building2 size={18} /> : <CheckSquare size={18} />}
        </div>
        <div className="ws-info">
          <div className="ws-name">{currentWorkspace?.name || 'Loading...'}</div>
          <div className="ws-type">{currentWorkspace?.type === 'company' ? 'Company' : 'Personal'}</div>
        </div>
        <ChevronDown size={16} className={`ws-chevron ${workspaceSwitcherOpen ? 'open' : ''}`} />
      </div>

      {workspaceSwitcherOpen && (
        <div className="ws-dropdown">
          {workspaces.map(ws => (
            <button
              key={ws.id}
              className={`ws-option ${currentWorkspace?.id === ws.id ? 'active' : ''}`}
              onClick={() => {
                switchWorkspace(ws);
                setWorkspaceSwitcherOpen(false);
                navigate('/dashboard');
              }}
            >
              <span className="ws-opt-icon">
                {ws.type === 'company' ? <Building2 size={14} /> : <CheckSquare size={14} />}
              </span>
              <span className="ws-opt-name">{ws.name}</span>
              {ws.type === 'personal' && <span className="ws-opt-badge">Personal</span>}
            </button>
          ))}
          <div className="ws-dropdown-divider" />
          {!creatingWorkspace ? (
            <button className="ws-option ws-create-btn" onClick={() => setCreatingWorkspace(true)}>
              <Plus size={14} /> Create Company Workspace
            </button>
          ) : (
            <form onSubmit={handleCreateWorkspace} style={{ padding: '8px' }}>
              <input
                autoFocus
                type="text"
                placeholder="Company name..."
                value={newWsName}
                onChange={e => { setNewWsName(e.target.value); setWsError(''); }}
                className="form-input"
                style={{ fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
              />
              {wsError && <div style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: 4 }}>{wsError}</div>}
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '5px', fontSize: '0.8rem' }}>Create</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '5px', fontSize: '0.8rem' }} onClick={() => setCreatingWorkspace(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Personal Tasks</div>

        {navItem('/dashboard', <LayoutDashboard size={17} />, 'Dashboard')}
        {navItem('/today', <Calendar size={17} />, 'Today')}
        {navItem('/upcoming', <CalendarDays size={17} />, 'Upcoming')}

        <div className="sidebar-section-label" style={{ marginTop: 12 }}>Workspace & Team</div>

        {navItem('/members', <Users size={17} />, isPersonal ? 'Workspace Info' : 'Team & Workers')}
        {navItem('/labels', <Tag size={17} />, 'Labels')}

        {/* Projects Section */}
        <button
          className="sidebar-section-toggle"
          onClick={() => setProjectsOpen(!projectsOpen)}
        >
          <FolderOpen size={17} />
          <span>Projects</span>
          {projectsOpen ? <ChevronDown size={14} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
        </button>

        {projectsOpen && (
          <div className="sidebar-projects">
            {projects.filter(p => !p.is_archived).map(p => (
              <NavLink
                key={p.id}
                to={`/project/${p.id}`}
                className={({ isActive }) => `sidebar-project-item${isActive ? ' active' : ''}`}
                onClick={handleNavClick}
              >
                <span className="project-dot" style={{ background: p.color || '#6366f1' }} />
                <span className="project-name">{p.name}</span>
                {p.taskCount > 0 && <span className="project-count">{p.taskCount}</span>}
                {p.is_favorite && <Star size={10} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => `sidebar-user${isActive ? ' active' : ''}`} onClick={handleNavClick}>
          <div className="sidebar-avatar">{user?.avatar || user?.name?.[0] || '?'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </NavLink>
        <div className="sidebar-footer-actions">
          <NavLink to="/settings" className="sidebar-icon-btn" title="Settings" onClick={handleNavClick}>
            <Settings size={16} />
          </NavLink>
          <button className="sidebar-icon-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
