import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  CheckSquare,
  Calendar,
  CalendarDays,
  Star,
  UserCheck,
  Plus,
  ChevronDown,
  Trash2,
  Check,
  Users,
  Settings,
  Home,
  GraduationCap,
  Briefcase,
  Rocket,
  BookOpen,
  Folder,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { format } from 'date-fns';

export default function AppSidebar() {
  const navigate = useNavigate();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    deleteWorkspace,
    projects,
    tasks,
    activeFilter,
    setActiveFilter,
    activeView,
    setActiveView,
    isSidebarOpen,
    currentUser,
    members,
    addProject,
    setIsInviteModalOpen,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
  } = useWorkspace();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#E11D48');
  const [newProjectLead, setNewProjectLead] = useState(() => currentUser?.id);

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeWorkspaces = workspaces || [];
  const activeWs = safeWorkspaces.find((w) => String(w.id) === String(activeWorkspaceId)) || safeWorkspaces[0] || {
    id: 'ws_personal',
    name: 'My Workspace',
    type: 'personal',
    color: '#E11D48',
  };

  // Dynamic real counts based on actual tasks
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayCount = (tasks || []).filter((t) => !t.completed && t.dueDate === todayStr).length;
  const upcomingCount = (tasks || []).filter((t) => !t.completed && t.dueDate && t.dueDate > todayStr).length;
  const importantCount = (tasks || []).filter((t) => !t.completed && (t.priority === 'p1' || t.priority === 'p2')).length;
  const assignedToMeCount = (tasks || []).filter((t) => !t.completed && (t.assigneeId === currentUser?.id || t.assigneeId === 'user_me')).length;

  const currentWorkspaceProjects = (projects || []).filter(
    (p) => String(p.workspaceId) === String(activeWorkspaceId) || !p.workspaceId
  );

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    addProject(newProjectName.trim(), newProjectColor, 'list', newProjectLead || currentUser?.id, [newProjectLead || currentUser?.id]);
    setNewProjectName('');
    setIsNewProjectModalOpen(false);
  };

  const handleDeleteWs = (e, wsId, wsName) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete workspace "${wsName}"? All its projects and tasks will be removed.`)) {
      deleteWorkspace(wsId);
    }
  };

  const getProjectIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('personal') || lower.includes('home')) return <Home className="w-4 h-4 text-rose-500" />;
    if (lower.includes('college') || lower.includes('study') || lower.includes('school')) return <GraduationCap className="w-4 h-4 text-blue-500" />;
    if (lower.includes('work') || lower.includes('company') || lower.includes('office')) return <Briefcase className="w-4 h-4 text-amber-500" />;
    if (lower.includes('hackathon') || lower.includes('launch')) return <Rocket className="w-4 h-4 text-purple-500" />;
    if (lower.includes('learn') || lower.includes('read') || lower.includes('book')) return <BookOpen className="w-4 h-4 text-emerald-500" />;
    return <Folder className="w-4 h-4 text-neutral-500" />;
  };

  if (!isSidebarOpen) return null;

  return (
    <aside
      className="w-64 bg-white border-r border-neutral-200/80 flex flex-col justify-between select-none z-20 flex-shrink-0 transition-all duration-200"
      aria-label="Application Sidebar"
    >
      <div className="p-3.5 overflow-y-auto space-y-5">
        {/* Workspace Switcher Card */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full px-3 py-2.5 rounded-2xl bg-neutral-50/80 hover:bg-neutral-100/80 border border-neutral-200/80 flex items-center justify-between gap-2 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div
                className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0"
                style={{ backgroundColor: activeWs?.color || '#E11D48' }}
              >
                {activeWs?.name ? activeWs.name.charAt(0).toUpperCase() : 'W'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-bold text-neutral-900 truncate">
                  {activeWs?.name || 'My Workspace'}
                </div>
                <div className="text-[10px] text-neutral-500 font-medium">
                  {activeWs?.type === 'personal' ? 'Personal Plan' : 'Team Workspace'}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-transform flex-shrink-0" />
          </button>

          {/* Workspace Dropdown with Delete & Create */}
          {isWorkspaceMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-neutral-200 p-2 z-40 animate-slide-up">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 py-1 mb-1">
                Your Workspaces
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {workspaces.map((ws) => {
                  const isSelected = String(ws.id) === String(activeWorkspaceId);
                  return (
                    <div
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setIsWorkspaceMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer group ${
                        isSelected ? 'bg-rose-50 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-6 h-6 rounded-md text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                          style={{ backgroundColor: ws.color || '#E11D48' }}
                        >
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{ws.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E11D48] flex-shrink-0" />}
                        {/* Delete Workspace Button */}
                        {workspaces.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteWs(e, ws.id, ws.name)}
                            className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title={`Delete workspace "${ws.name}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    navigate('/create-workspace');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-[#E11D48] hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Core Navigation Views */}
        <nav className="space-y-1" aria-label="Core Views">
          {/* 1. Workspace Overview */}
          <button
            type="button"
            onClick={() => setActiveFilter('workspace')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'workspace' || activeFilter === 'inbox'
                ? 'bg-rose-50 text-[#E11D48] font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#E11D48]" />
              <span>Workspace</span>
            </div>
          </button>

          {/* 2. My Tasks */}
          <button
            type="button"
            onClick={() => setActiveFilter('my_tasks')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'my_tasks'
                ? 'bg-rose-50 text-[#E11D48] font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-neutral-500" />
              <span>My Tasks</span>
            </div>
          </button>

          {/* 3. Today */}
          <button
            type="button"
            onClick={() => setActiveFilter('today')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'today'
                ? 'bg-rose-50 text-[#E11D48] font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>Today</span>
            </div>
            {todayCount > 0 && (
              <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                {todayCount}
              </span>
            )}
          </button>

          {/* 4. Upcoming */}
          <button
            type="button"
            onClick={() => setActiveFilter('upcoming')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'upcoming'
                ? 'bg-rose-50 text-[#E11D48] font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-4 h-4 text-neutral-500" />
              <span>Upcoming</span>
            </div>
            {upcomingCount > 0 && (
              <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                {upcomingCount}
              </span>
            )}
          </button>

          {/* 5. Important */}
          <button
            type="button"
            onClick={() => setActiveFilter('important')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'important'
                ? 'bg-rose-50 text-[#E11D48] font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-neutral-500" />
              <span>Important</span>
            </div>
            {importantCount > 0 && (
              <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                {importantCount}
              </span>
            )}
          </button>

          {/* 6. Assigned to Me */}
          <button
            type="button"
            onClick={() => setActiveFilter('assigned_to_me')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              activeFilter === 'assigned_to_me'
                ? 'bg-rose-50 text-[#E11D48] font-bold'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-neutral-500" />
              <span>Assigned to Me</span>
            </div>
            {assignedToMeCount > 0 && (
              <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">
                {assignedToMeCount}
              </span>
            )}
          </button>
        </nav>

        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-neutral-900">Projects</span>
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              title="Add project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            {currentWorkspaceProjects.map((proj) => {
              const isSelected = activeFilter === proj.id;
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setActiveFilter(proj.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {getProjectIcon(proj.name)}
                  <span className="truncate">{proj.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-neutral-400" />
              <span>Add Project</span>
            </button>
          </div>
        </div>

        {/* Team Section (Only Members, Settings removed) */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-neutral-900">Team</span>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              title="Invite member"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-neutral-500" />
              <span>Members</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-modal border border-neutral-200">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Website Redesign"
                    className="w-full text-xs p-2 rounded-lg border border-neutral-300 focus:border-[#E11D48] outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Assign Project Lead</label>
                  <select
                    value={newProjectLead || currentUser?.id}
                    onChange={(e) => setNewProjectLead(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 outline-none focus:border-[#E11D48] font-medium"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} ({m.role}) {m.id === currentUser?.id ? '— (You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg shadow-sm"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
