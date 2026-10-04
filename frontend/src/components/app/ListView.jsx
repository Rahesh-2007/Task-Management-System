import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import TaskCard from './TaskCard';
import { format, parseISO, isPast, isToday, isFuture } from 'date-fns';

export default function ListView({ tasks = [], project }) {
  const {
    sections = [],
    addTask,
    toggleTaskCompletion,
    setActiveTaskModal,
    projects = [],
    members = [],
    setIsQuickAddOpen,
  } = useWorkspace();

  const [collapsedGroups, setCollapsedGroups] = useState({
    overdue: false,
    today: false,
    upcoming: false,
  });

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Categorize tasks into Overdue, Due Today, Upcoming, and Completed
  const overdueTasks = [];
  const dueTodayTasks = [];
  const upcomingTasks = [];
  const completedTasks = [];
  const otherTasks = [];

  const safeTasks = tasks || [];
  const safeProjects = projects || [];
  const safeMembers = members || [];

  safeTasks.forEach((task) => {
    if (!task) return;
    if (task.completed) {
      completedTasks.push(task);
      return;
    }

    if (!task.dueDate) {
      dueTodayTasks.push(task);
      return;
    }

    if (task.dueDate < todayStr) {
      overdueTasks.push(task);
    } else if (task.dueDate === todayStr) {
      dueTodayTasks.push(task);
    } else if (task.dueDate > todayStr) {
      upcomingTasks.push(task);
    } else {
      otherTasks.push(task);
    }
  });

  const getProjectBadge = (projId, labels = []) => {
    const proj = safeProjects.find((p) => p && p.id === projId);
    const name = proj ? proj.name : (Array.isArray(labels) && labels[0] ? labels[0] : 'Work');
    const lower = (name || '').toLowerCase();

    if (lower.includes('work')) {
      return { name: 'Work', bg: 'bg-rose-50 text-rose-600 border border-rose-100' };
    }
    if (lower.includes('college')) {
      return { name: 'College', bg: 'bg-blue-50 text-blue-600 border border-blue-100' };
    }
    if (lower.includes('personal')) {
      return { name: 'Personal', bg: 'bg-pink-50 text-pink-600 border border-pink-100' };
    }
    if (lower.includes('learning')) {
      return { name: 'Learning', bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };
    }
    if (lower.includes('hackathon')) {
      return { name: 'Hackathon', bg: 'bg-purple-50 text-purple-600 border border-purple-100' };
    }
    return { name: name || 'General', bg: 'bg-neutral-100 text-neutral-600 border border-neutral-200' };
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'p1':
        return { label: 'High', bg: 'bg-rose-100/70 text-rose-700' };
      case 'p2':
        return { label: 'Medium', bg: 'bg-amber-100/80 text-amber-700' };
      case 'p3':
      default:
        return { label: 'Low', bg: 'bg-sky-100/70 text-sky-700' };
    }
  };

  const formatTaskDate = (dueDateStr) => {
    if (!dueDateStr) return 'Today';
    try {
      const parsed = parseISO(dueDateStr);
      return format(parsed, 'MMM d, yyyy');
    } catch {
      return dueDateStr;
    }
  };

  const renderTaskRow = (task, isOverdue = false) => {
    if (!task) return null;
    const projBadge = getProjectBadge(task.projectId, task.labels);
    const prioBadge = getPriorityBadge(task.priority);
    const assignee = safeMembers.find((m) => m && m.id === task.assigneeId) || safeMembers[0];
    const avatarUrl = assignee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    return (
      <div
        key={task.id}
        onClick={() => setActiveTaskModal(task)}
        className="group flex items-center justify-between px-4 py-3 bg-white hover:bg-neutral-50/80 transition-colors border-b border-neutral-100/80 last:border-b-0 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Rounded Square Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskCompletion(task.id);
            }}
            className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
              task.completed
                ? 'bg-[#E11D48] border-[#E11D48] text-white'
                : 'border-neutral-300 hover:border-neutral-400 bg-white'
            }`}
          >
            {task.completed && (
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Task Title */}
          <span
            className={`text-xs sm:text-sm font-semibold text-neutral-900 truncate ${
              task.completed ? 'line-through text-neutral-400' : ''
            }`}
          >
            {task.title}
          </span>

          {/* Project Tag Badge */}
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${projBadge.bg} flex-shrink-0`}>
            {projBadge.name}
          </span>

          {/* Priority Tag Badge */}
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${prioBadge.bg} flex-shrink-0`}>
            {prioBadge.label}
          </span>
        </div>

        {/* Right side: Date and Assignee Avatar */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-3">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${isOverdue ? 'text-[#E11D48]' : 'text-neutral-500'}`}>
            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-[#E11D48]' : 'text-neutral-400'}`} />
            <span>{formatTaskDate(task.dueDate)}</span>
          </div>

          <img
            src={avatarUrl}
            alt={assignee?.name || 'Assignee'}
            className="w-6 h-6 rounded-full object-cover border border-neutral-200 shadow-2xs"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Overdue Accordion Group */}
      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-rose-100 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleGroup('overdue')}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-rose-50/90 text-[#E11D48] text-xs font-bold transition-colors cursor-pointer text-left"
          >
            {collapsedGroups.overdue ? (
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Overdue ({overdueTasks.length})</span>
          </button>

          {!collapsedGroups.overdue && (
            <div className="bg-white">
              {overdueTasks.map((task) => renderTaskRow(task, true))}
            </div>
          )}
        </div>
      )}

      {/* 2. Due Today Accordion Group */}
      {dueTodayTasks.length > 0 && (
        <div className="rounded-2xl border border-amber-100 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleGroup('today')}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-amber-50/80 text-amber-800 text-xs font-bold transition-colors cursor-pointer text-left"
          >
            {collapsedGroups.today ? (
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Due Today ({dueTodayTasks.length})</span>
          </button>

          {!collapsedGroups.today && (
            <div className="bg-white">
              {dueTodayTasks.map((task) => renderTaskRow(task, false))}
            </div>
          )}
        </div>
      )}

      {/* 3. Upcoming Accordion Group */}
      {upcomingTasks.length > 0 && (
        <div className="rounded-2xl border border-blue-100 overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => toggleGroup('upcoming')}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-50/80 text-blue-700 text-xs font-bold transition-colors cursor-pointer text-left"
          >
            {collapsedGroups.upcoming ? (
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Upcoming ({upcomingTasks.length})</span>
          </button>

          {!collapsedGroups.upcoming && (
            <div className="bg-white">
              {upcomingTasks.map((task) => renderTaskRow(task, false))}
            </div>
          )}
        </div>
      )}

      {/* 4. Other / Date Tasks Group */}
      {otherTasks.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="bg-white">
            {otherTasks.map((task) => renderTaskRow(task, false))}
          </div>
        </div>
      )}

      {/* 5. Completed Accordion Group */}
      {completedTasks.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 overflow-hidden shadow-2xs opacity-80">
          <button
            type="button"
            onClick={() => toggleGroup('completed')}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-emerald-50/80 text-emerald-800 text-xs font-bold transition-colors cursor-pointer text-left"
          >
            {collapsedGroups.completed ? (
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Completed ({completedTasks.length})</span>
          </button>

          {!collapsedGroups.completed && (
            <div className="bg-white">
              {completedTasks.map((task) => renderTaskRow(task, false))}
            </div>
          )}
        </div>
      )}

      {/* Add Task footer row when tasks exist */}
      {tasks.length > 0 && (
        <button
          type="button"
          onClick={() => setIsQuickAddOpen(true)}
          className="w-full flex items-center gap-2 p-3 rounded-2xl border border-dashed border-neutral-300 hover:border-[#E11D48] text-neutral-500 hover:text-[#E11D48] bg-white/70 hover:bg-rose-50/50 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#E11D48] stroke-[2.5]" />
          <span>+ Add Task</span>
        </button>
      )}

      {/* Empty State with prominent Add Task button */}
      {tasks.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-neutral-200">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold text-neutral-800">All clear! No tasks</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Your workspace is clean. Click below to add a new task.
          </p>
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Add Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
