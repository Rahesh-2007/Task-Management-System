import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Users,
  Filter,
  ArrowUpDown,
  Building2,
  Check,
  ChevronDown,
  Plus,
  LayoutGrid,
  Calendar as CalendarIcon,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import AppHeader from '../components/app/AppHeader';
import AppSidebar from '../components/app/AppSidebar';
import RightDashboardPanel from '../components/app/RightDashboardPanel';
import ListView from '../components/app/ListView';
import BoardView from '../components/app/BoardView';
import CalendarView from '../components/app/CalendarView';
import UpcomingView from '../components/app/UpcomingView';
import WorkloadView from '../components/app/WorkloadView';
import TaskDetailModal from '../components/app/TaskDetailModal';
import QuickAddModal from '../components/app/QuickAddModal';
import NotificationCenter from '../components/app/NotificationCenter';
import InviteModal from '../components/app/InviteModal';
import ReportsModal from '../components/app/ReportsModal';
import { format } from 'date-fns';

export default function AppPage() {
  const {
    projects = [],
    tasks = [],
    activeFilter = 'today',
    setActiveFilter,
    activeView = 'list',
    setActiveView,
    searchQuery = '',
    selectedPriorityFilter = 'all',
    setSelectedPriorityFilter,
    members = [],
    currentUser,
    invitations = [],
    acceptWorkspaceInvitation,
    declineWorkspaceInvitation,
    workspaces = [],
    activeWorkspaceId,
    isInviteModalOpen,
    setIsInviteModalOpen,
    setIsQuickAddOpen,
    isReportsModalOpen,
    setIsReportsModalOpen,
    selectedCalendarDate,
    setSelectedCalendarDate,
  } = useWorkspace();

  const [activeTabFilter, setActiveTabFilter] = useState('all'); // 'all', 'my_tasks', 'assigned', 'overdue', 'completed'
  const [sortBy, setSortBy] = useState('dueDate');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const safeWorkspaces = workspaces || [];
  const safeProjects = projects || [];
  const safeTasks = tasks || [];
  const safeMembers = members || [];
  const safeInvitations = invitations || [];

  const activeWs = safeWorkspaces.find((w) => String(w.id) === String(activeWorkspaceId)) || safeWorkspaces[0] || {
    id: 'ws_personal',
    name: 'My Workspace',
  };

  const userEmail = currentUser?.email ? currentUser.email.toLowerCase() : '';

  // Check if current user has any pending direct workspace invitations to accept
  const pendingDirectInvites = safeInvitations.filter(
    (inv) =>
      inv.type === 'direct_invite' &&
      inv.status === 'pending_member' &&
      inv.email &&
      userEmail &&
      inv.email.toLowerCase() === userEmail
  );

  // Find current project if activeFilter is a project ID
  const currentProject = safeProjects.find((p) => p.id === activeFilter);

  // Statistics calculation for the 4 summary cards (Real dynamic counts)
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const totalTasksCount = safeTasks.length;
  const dueTodayCount = safeTasks.filter((t) => !t.completed && t.dueDate === todayDateStr).length;
  const completedTasksCount = safeTasks.filter((t) => t.completed).length;
  const teamMembersCount = safeMembers.length;

  // Filter tasks based on search, activeFilter, tab filters, and sort
  const filteredTasks = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const safeCurrentUserId = currentUser?.id || 'user_me';

    const result = safeTasks.filter((task) => {
      // 1. Search Query
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (task.title || '').toLowerCase().includes(query);
        const matchDesc = (task.description || '').toLowerCase().includes(query);
        const matchLabels = Array.isArray(task.labels) && task.labels.some((l) => (l || '').toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchLabels) return false;
      }

      // 2. Priority Filter
      if (selectedPriorityFilter && selectedPriorityFilter !== 'all' && task.priority !== selectedPriorityFilter) {
        return false;
      }

      // 3. Tab Filter (mockup tabs: All Tasks, My Tasks, Assigned, Overdue, Completed)
      if (activeTabFilter === 'my_tasks') {
        if (task.assigneeId && task.assigneeId !== safeCurrentUserId && task.assigneeId !== 'user_abbinav') return false;
      } else if (activeTabFilter === 'assigned') {
        if (!task.assigneeId) return false;
      } else if (activeTabFilter === 'overdue') {
        if (!task.dueDate || task.dueDate >= todayStr || task.completed) return false;
      } else if (activeTabFilter === 'completed') {
        if (!task.completed) return false;
      }

      // 4. Sidebar Project or Filter Selection
      if (currentProject) {
        return task.projectId === currentProject.id;
      }

      if (activeFilter === 'today') {
        return task.dueDate === todayStr || (!task.dueDate && !task.completed);
      }

      if (activeFilter === 'upcoming') {
        return task.dueDate && task.dueDate > todayStr;
      }

      if (activeFilter === 'calendar') {
        return true;
      }

      if (activeFilter && activeFilter.startsWith('date:')) {
        const targetDate = activeFilter.replace('date:', '');
        return task.dueDate === targetDate;
      }

      if (activeFilter === 'important') {
        return task.priority === 'p1' || task.priority === 'p2';
      }

      if (activeFilter === 'assigned_to_me') {
        return task.assigneeId === safeCurrentUserId || task.assigneeId === 'user_abbinav';
      }

      return true;
    });

    // Sort result
    return result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'priority') {
        const pOrder = { p1: 1, p2: 2, p3: 3, p4: 4 };
        return (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5);
      }
      // default: sortBy === 'dueDate'
      const dateA = a.dueDate || '9999-12-31';
      const dateB = b.dueDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  }, [safeTasks, activeFilter, currentProject, searchQuery, selectedPriorityFilter, activeTabFilter, sortBy, currentUser]);

  const getHeaderInfo = () => {
    if (currentProject) {
      return {
        title: currentProject.name,
        subtitle: 'Project tasks and scheduled timeline.',
      };
    }
    if (activeFilter === 'today') {
      return {
        title: 'Today',
        subtitle: 'Focus on what needs to be done today.',
      };
    }
    if (activeFilter === 'upcoming') {
      return {
        title: 'Upcoming',
        subtitle: 'Tasks scheduled for the upcoming days.',
      };
    }
    if (activeFilter === 'calendar' || activeView === 'calendar') {
      return {
        title: 'Calendar Schedule',
        subtitle: 'Interactive calendar overview and task management.',
      };
    }
    if (activeFilter && activeFilter.startsWith('date:')) {
      const targetDate = activeFilter.replace('date:', '');
      return {
        title: `Tasks for ${targetDate}`,
        subtitle: `Showing all tasks scheduled for ${targetDate}.`,
      };
    }
    if (activeFilter === 'my_tasks') {
      return {
        title: 'My Tasks',
        subtitle: 'Tasks assigned to you or created by you.',
      };
    }
    if (activeFilter === 'important') {
      return {
        title: 'Important Tasks',
        subtitle: 'High priority tasks (P1 & P2).',
      };
    }
    if (activeFilter === 'assigned_to_me') {
      return {
        title: 'Assigned to Me',
        subtitle: 'Tasks delegated specifically to your account.',
      };
    }
    return {
      title: activeWs?.name || 'My Workspace',
      subtitle: 'Organize your tasks, stay focused and get things done.',
    };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-neutral-900 overflow-hidden font-sans">
      {/* 1. Top White Header */}
      <AppHeader />

      {/* 2. Workspace Body (Left Sidebar + Center View + Right Panel) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <AppSidebar />

        {/* Center Main Dashboard Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] overflow-y-auto">
          {/* Pending Invitations Banner */}
          {pendingDirectInvites.length > 0 && (
            <div className="bg-rose-50 border-b border-rose-200 px-6 sm:px-8 py-3 flex items-center justify-between gap-4 animate-fade-in flex-shrink-0">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-7 h-7 rounded-lg bg-[#E11D48] text-white flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="text-xs text-neutral-800 truncate">
                  You have been invited to join <strong className="text-neutral-900">{pendingDirectInvites[0].workspaceName}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => declineWorkspaceInvitation && declineWorkspaceInvitation(pendingDirectInvites[0].id)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => acceptWorkspaceInvitation && acceptWorkspaceInvitation(pendingDirectInvites[0].id)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept & Join</span>
                </button>
              </div>
            </div>
          )}

          {/* Workspace Title & Greeting */}
          <div className="px-6 sm:px-8 pt-7 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                <span>{headerInfo.title}</span>
                {activeFilter && activeFilter.startsWith('date:') && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('today')}
                    className="text-xs font-bold text-[#E11D48] bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Date Filter ✕
                  </button>
                )}
              </h1>
              <p className="text-xs text-neutral-500 font-medium mt-1">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          {/* 4 Stat Metric Cards (Clickable & Dynamic) */}
          <div className="px-6 sm:px-8 pb-6 grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Card 1: Total Tasks */}
            <div
              onClick={() => {
                setActiveFilter && setActiveFilter('workspace');
                setActiveTabFilter('all');
              }}
              className="bg-white hover:bg-rose-50/40 cursor-pointer transition-all rounded-2xl p-4 border border-neutral-200/80 shadow-2xs flex items-center gap-3.5 select-none group"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100/60 text-[#E11D48] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-lg font-black text-neutral-900 leading-none mb-1">
                  {totalTasksCount}
                </div>
                <div className="text-xs font-semibold text-neutral-500">
                  Total Tasks
                </div>
              </div>
            </div>

            {/* Card 2: Due Today */}
            <div
              onClick={() => {
                setActiveFilter && setActiveFilter('today');
                setActiveTabFilter('all');
              }}
              className="bg-white hover:bg-blue-50/40 cursor-pointer transition-all rounded-2xl p-4 border border-neutral-200/80 shadow-2xs flex items-center gap-3.5 select-none group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100/60 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-lg font-black text-neutral-900 leading-none mb-1">
                  {dueTodayCount}
                </div>
                <div className="text-xs font-semibold text-neutral-500">
                  Due Today
                </div>
              </div>
            </div>

            {/* Card 3: Completed */}
            <div
              onClick={() => setActiveTabFilter('completed')}
              className="bg-white hover:bg-emerald-50/40 cursor-pointer transition-all rounded-2xl p-4 border border-neutral-200/80 shadow-2xs flex items-center gap-3.5 select-none group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/60 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-lg font-black text-neutral-900 leading-none mb-1">
                  {completedTasksCount}
                </div>
                <div className="text-xs font-semibold text-neutral-500">
                  Completed
                </div>
              </div>
            </div>

            {/* Card 4: Team Members */}
            <div
              onClick={() => setIsInviteModalOpen && setIsInviteModalOpen(true)}
              className="bg-white hover:bg-purple-50/40 cursor-pointer transition-all rounded-2xl p-4 border border-neutral-200/80 shadow-2xs flex items-center gap-3.5 select-none group"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100/60 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="text-lg font-black text-neutral-900 leading-none mb-1">
                  {teamMembersCount}
                </div>
                <div className="text-xs font-semibold text-neutral-500">
                  Team Members
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs & Sort Controls */}
          <div className="px-6 sm:px-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Tasks' },
                { id: 'my_tasks', label: 'My Tasks' },
                { id: 'assigned', label: 'Assigned' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'completed', label: 'Completed' },
              ].map((tab) => {
                const isActive = activeTabFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTabFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-rose-50 text-[#E11D48] border border-rose-200/60 shadow-2xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Right side Controls: Add Task, Filter, Sort */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                id="app-main-add-task"
                type="button"
                onClick={() => setIsQuickAddOpen && setIsQuickAddOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Task</span>
              </button>

              {/* Filter Popover Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                    selectedPriorityFilter !== 'all' ? 'border-[#E11D48] text-[#E11D48]' : ''
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Filter {selectedPriorityFilter !== 'all' ? `(${selectedPriorityFilter.toUpperCase()})` : ''}</span>
                </button>

                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-neutral-200 py-1.5 z-30">
                    <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase">Priority Filter</div>
                    {[
                      { id: 'all', label: 'All Priorities' },
                      { id: 'p1', label: '🔴 High Priority (P1)' },
                      { id: 'p2', label: '🟠 Medium Priority (P2)' },
                      { id: 'p3', label: '🔵 Low Priority (P3)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedPriorityFilter && setSelectedPriorityFilter(opt.id);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 flex items-center justify-between ${
                          selectedPriorityFilter === opt.id ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-neutral-700'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedPriorityFilter === opt.id && <Check className="w-3 h-3 text-[#E11D48]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Due Date Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                  <span>
                    {sortBy === 'dueDate' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : 'Name'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-30">
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('dueDate');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 font-medium ${
                        sortBy === 'dueDate' ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-neutral-700'
                      }`}
                    >
                      Due Date
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('priority');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 font-medium ${
                        sortBy === 'priority' ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-neutral-700'
                      }`}
                    >
                      Priority
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSortBy('name');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-50 font-medium ${
                        sortBy === 'name' ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-neutral-700'
                      }`}
                    >
                      Task Name
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Task View Body */}
          <div className="px-6 sm:px-8 pb-10">
            <ListView tasks={filteredTasks} project={currentProject} />
          </div>
        </main>

        {/* Right Dashboard Panel (Calendar, Progress, Actions, Activity) */}
        <RightDashboardPanel />
      </div>

      {/* Global Modals */}
      <TaskDetailModal />
      <QuickAddModal />
      <NotificationCenter />
      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen && setIsInviteModalOpen(false)} />
      <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen && setIsReportsModalOpen(false)} />
    </div>
  );
}
