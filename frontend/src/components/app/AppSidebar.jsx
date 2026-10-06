import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  CalendarDays,
  Plus,
  Users,
  Home,
  GraduationCap,
  Briefcase,
  Rocket,
  BookOpen,
  Folder,
  LayoutGrid,
  BarChart2,
  Tag,
  Inbox,
  Video,
  MessageSquare,
  Palmtree,
  ChevronDown,
  ChevronRight,
  Menu,
  Check,
  Settings,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function AppSidebar() {
  const navigate = useNavigate();
  const {
    workspaces = [],
    activeWorkspace,
    activeWorkspaceId,
    switchWorkspace,
    projects = [],
    tasks = [],
    isSidebarOpen,
    setIsSidebarOpen,
    members = [],
    addProject,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
  } = useWorkspace();

  const { user } = useAuth();

  // Workspaces can be closed by default or expanded on user action
  const [expandedWsIds, setExpandedWsIds] = useState([]);

  const toggleWorkspaceExpand = (wsId, e) => {
    e?.stopPropagation();
    const idStr = String(wsId);
    setExpandedWsIds((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const handleWorkspaceClick = (wsId) => {
    const idStr = String(wsId);
    if (idStr !== String(activeWorkspaceId)) {
      switchWorkspace(wsId);
      // Open newly selected workspace
      setExpandedWsIds((prev) => (prev.includes(idStr) ? prev : [...prev, idStr]));
    } else {
      // Toggle collapse/expand when clicking active workspace header
      toggleWorkspaceExpand(wsId);
    }
  };

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#E11D48');
  const [newProjectLead, setNewProjectLead] = useState(() => user?.id);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayCount = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= todayStr).length;
  const upcomingCount = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate > todayStr).length;
  const inboxCount = tasks.filter((t) => !t.completed && (!t.dueDate || !t.projectId)).length;

  const currentWorkspaceProjects = projects.filter(
    (p) => String(p.workspaceId) === String(activeWorkspaceId) || String(p.workspace_id) === String(activeWorkspaceId) || !p.workspaceId
  );

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const created = await addProject(newProjectName.trim(), newProjectColor, 'list', newProjectLead || user?.id);
    setNewProjectName('');
    setIsNewProjectModalOpen(false);
    if (created?.id) {
      navigate(`/app/projects/${created.id}`);
    }
  };

  const getProjectIcon = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('personal') || lower.includes('home')) return <Home className="w-3.5 h-3.5 text-rose-500" />;
    if (lower.includes('college') || lower.includes('study') || lower.includes('school')) return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />;
    if (lower.includes('work') || lower.includes('company') || lower.includes('office')) return <Briefcase className="w-3.5 h-3.5 text-amber-500" />;
    if (lower.includes('launch') || lower.includes('sprint')) return <Rocket className="w-3.5 h-3.5 text-purple-500" />;
    if (lower.includes('learn') || lower.includes('book')) return <BookOpen className="w-3.5 h-3.5 text-emerald-500" />;
    return <Folder className="w-3.5 h-3.5 text-neutral-400" />;
  };

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-white border-r border-neutral-200/80 flex flex-col justify-between select-none z-20 flex-shrink-0 h-screen">
      {/* Top Sidebar Header with Menu toggle & TaskFlow logo */}
      <div className="h-16 border-b border-neutral-200/80 px-4 flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/app/today" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#E11D48] text-white flex items-center justify-center shadow-xs">
            <Check className="w-5 h-5 stroke-[3.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-neutral-900">
            Task<span className="text-[#E11D48]">Flow</span>
          </span>
        </Link>
      </div>

      <div className="p-3.5 overflow-y-auto space-y-4 flex-1">
        {/* Workspaces Group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Workspaces
            </span>
            <Link
              to="/workspaces/new"
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              title="Create Workspace"
            >
              <Plus className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            {workspaces.map((ws) => {
              const isActive = String(ws.id) === String(activeWorkspaceId);
              const isCompany = ws.type === 'company';
              const isExpanded = expandedWsIds.includes(String(ws.id));

              return (
                <div key={ws.id} className="space-y-1">
                  {/* Workspace Tab Button (Collapsible & Expandable) */}
                  <button
                    type="button"
                    onClick={() => handleWorkspaceClick(ws.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-rose-50 text-[#E11D48] font-bold border border-rose-200/80 shadow-2xs'
                        : 'text-neutral-700 hover:bg-neutral-100 border border-transparent font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        onClick={(e) => toggleWorkspaceExpand(ws.id, e)}
                        className="p-0.5 rounded hover:bg-black/5 text-neutral-400"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                          isActive ? 'bg-[#E11D48] text-white shadow-2xs' : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {(ws.name || 'W')[0].toUpperCase()}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    <span
                      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-semibold ${
                        isActive ? 'bg-rose-100/90 text-[#E11D48]' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {isCompany ? 'Company' : 'Personal'}
                    </span>
                  </button>

                  {/* Active Workspace Nested Content (Collapsible) */}
                  {isActive && isExpanded && (
                    <div className="pl-3.5 ml-2.5 border-l-2 border-rose-200/80 space-y-0.5 pt-1 pb-1 animate-slide-up">
                      {/* Core 5 Views (Inbox, Today, Upcoming, Calendar, Board View) */}
                      <NavLink
                        to="/app/inbox"
                        className={({ isActive: navActive }) =>
                          `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Inbox className="w-3.5 h-3.5 text-[#E11D48]" />
                          <span>Inbox</span>
                        </div>
                        {inboxCount > 0 && (
                          <span className="text-[10px] text-rose-600 bg-white px-1.5 py-0.2 rounded-full font-bold shadow-2xs">
                            {inboxCount}
                          </span>
                        )}
                      </NavLink>

                      <NavLink
                        to="/app/today"
                        className={({ isActive: navActive }) =>
                          `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Today</span>
                        </div>
                        {todayCount > 0 && (
                          <span className="text-[10px] text-rose-600 bg-white px-1.5 py-0.2 rounded-full font-bold shadow-2xs">
                            {todayCount}
                          </span>
                        )}
                      </NavLink>

                      <NavLink
                        to="/app/upcoming"
                        className={({ isActive: navActive }) =>
                          `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Upcoming</span>
                        </div>
                        {upcomingCount > 0 && (
                          <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded-full font-bold">
                            {upcomingCount}
                          </span>
                        )}
                      </NavLink>

                      <NavLink
                        to="/app/calendar"
                        className={({ isActive: navActive }) =>
                          `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Calendar</span>
                        </div>
                      </NavLink>

                      <NavLink
                        to="/app/board"
                        className={({ isActive: navActive }) =>
                          `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Board View</span>
                        </div>
                      </NavLink>

                      {/* Extended Features ONLY for Company / Team Workspaces */}
                      {isCompany && (
                        <>
                          {/* Team Section (Workload, Meetings, Team Chat, Vacations) */}
                          <div className="pt-2">
                            <div className="flex items-center justify-between px-1 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              <span>Team</span>
                              <Link
                                to="/app/meetings"
                                className="p-0.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                                title="Schedule Meeting"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Link>
                            </div>

                            <div className="space-y-0.5">
                              <NavLink
                                to="/app/workload"
                                className={({ isActive: navActive }) =>
                                  `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                                  }`
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <BarChart2 className="w-3.5 h-3.5 text-neutral-500" />
                                  <span>Team Workload</span>
                                </div>
                              </NavLink>

                              <NavLink
                                to="/app/meetings"
                                className={({ isActive: navActive }) =>
                                  `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                                  }`
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <Video className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Meetings</span>
                                </div>
                                <span className="text-[9px] font-bold uppercase text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  GMeet
                                </span>
                              </NavLink>

                              <NavLink
                                to="/app/chat"
                                className={({ isActive: navActive }) =>
                                  `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                                  }`
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Team chat</span>
                                </div>
                              </NavLink>

                              <NavLink
                                to="/app/vacations"
                                className={({ isActive: navActive }) =>
                                  `w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                                  }`
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <Palmtree className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Vacations Calendar</span>
                                </div>
                              </NavLink>

                              <Link
                                to="/app/meetings"
                                className="w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-neutral-400" />
                                <span>New</span>
                              </Link>
                            </div>
                          </div>

                          {/* Projects Section */}
                          <div className="pt-2">
                            <div className="flex items-center justify-between px-1 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              <span>Projects</span>
                              <button
                                type="button"
                                onClick={() => setIsNewProjectModalOpen(true)}
                                className="p-0.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 cursor-pointer"
                                title="Add project"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="space-y-0.5">
                              {currentWorkspaceProjects.map((proj) => (
                                <NavLink
                                  key={proj.id}
                                  to={`/app/projects/${proj.id}`}
                                  className={({ isActive: navActive }) =>
                                    `w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                      navActive ? 'bg-neutral-100 text-neutral-900 font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                                    }`
                                  }
                                >
                                  {getProjectIcon(proj.name)}
                                  <span className="truncate">{proj.name}</span>
                                </NavLink>
                              ))}

                              <button
                                type="button"
                                onClick={() => setIsNewProjectModalOpen(true)}
                                className="w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Add Project</span>
                              </button>
                            </div>
                          </div>

                          {/* Workspace Controls (Labels, Members) */}
                          <div className="pt-2 space-y-0.5">
                            <NavLink
                              to="/app/labels"
                              className={({ isActive: navActive }) =>
                                `w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                                }`
                              }
                            >
                              <Tag className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Labels</span>
                            </NavLink>

                            <NavLink
                              to="/app/members"
                              className={({ isActive: navActive }) =>
                                `w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  navActive ? 'bg-rose-100/70 text-[#E11D48] font-bold' : 'text-neutral-700 hover:bg-neutral-50'
                                }`
                              }
                            >
                              <Users className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Members</span>
                            </NavLink>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              to="/workspaces/new"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 border border-dashed border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-neutral-400" />
              <span>Add Workspace</span>
            </Link>

            {/* Settings at the very bottom after all workspaces */}
            <div className="pt-2 border-t border-neutral-100">
              <NavLink
                to="/app/settings"
                className={({ isActive: navActive }) =>
                  `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    navActive
                      ? 'bg-rose-50 text-[#E11D48] border border-rose-200/80 shadow-2xs font-bold'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent'
                  }`
                }
              >
                <Settings className="w-4 h-4 text-neutral-500" />
                <span>Settings</span>
              </NavLink>
            </div>
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
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Assign Lead</label>
                  <select
                    value={newProjectLead || user?.id}
                    onChange={(e) => setNewProjectLead(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-300 bg-white text-neutral-800 outline-none focus:border-[#E11D48] font-medium"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} ({m.role}) {m.id === user?.id ? '— (You)' : ''}
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
