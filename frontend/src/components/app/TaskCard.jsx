import React, { useState } from 'react';
import {
  Check,
  Calendar,
  Flag,
  MessageSquare,
  CheckSquare,
  Clock,
  MoreHorizontal,
  Trash2,
  CalendarDays,
  Repeat,
  Tag,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatFriendlyDueDate } from '../../utils/nlpParser';
import { getQuickRescheduleOptions } from '../../utils/rescheduleLogic';

export default function TaskCard({ task, isDragging = false }) {
  const {
    members,
    toggleTaskCompletion,
    setActiveTaskModal,
    handleRescheduleTask,
    deleteTask,
    projects,
  } = useWorkspace();

  const [isRescheduleMenuOpen, setIsRescheduleMenuOpen] = useState(false);

  const safeMembers = members || [];
  const safeProjects = projects || [];
  const assignee = safeMembers.find((m) => m.id === task?.assigneeId);
  const project = safeProjects.find((p) => p.id === task?.projectId);
  const friendlyDate = formatFriendlyDueDate(task?.dueDate, task?.dueTime);

  const priorityStyles = {
    p1: { border: 'border-priority-p1', text: 'text-priority-p1', flag: 'text-priority-p1' },
    p2: { border: 'border-priority-p2', text: 'text-priority-p2', flag: 'text-priority-p2' },
    p3: { border: 'border-priority-p3', text: 'text-priority-p3', flag: 'text-priority-p3' },
    p4: { border: 'border-neutral-300', text: 'text-neutral-500', flag: 'text-neutral-400' },
  };

  const pStyle = priorityStyles[task.priority] || priorityStyles.p4;
  const quickOptions = getQuickRescheduleOptions();

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      onClick={() => setActiveTaskModal(task)}
      className={`group relative bg-white rounded-xl p-3 border border-neutral-200/80 hover:border-neutral-300 shadow-subtle hover:shadow-card transition-all cursor-pointer select-none ${
        task.completed ? 'opacity-60 bg-neutral-50/70' : ''
      } ${isDragging ? 'shadow-2xl ring-2 ring-brand rotate-1' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskCompletion(task.id);
          }}
          className={`mt-0.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            task.completed
              ? 'bg-neutral-400 border-neutral-400 text-white'
              : `${pStyle.border} hover:bg-neutral-100`
          }`}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-xs sm:text-sm text-neutral-900 leading-snug break-words ${
                task.completed ? 'line-through text-neutral-400' : 'font-medium'
              }`}
            >
              {task.title}
            </h4>

            {/* Priority flag */}
            {task.priority !== 'p4' && (
              <Flag className={`w-3.5 h-3.5 flex-shrink-0 ${pStyle.flag}`} />
            )}
          </div>

          {/* Description Preview (if any) */}
          {task.description && (
            <p className="text-[11px] text-neutral-500 line-clamp-1 mt-1">
              {task.description}
            </p>
          )}

          {/* Meta tags and actions bar */}
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-1.5 border-t border-neutral-100 text-[11px] text-neutral-500">
            {/* Due date chip */}
            {friendlyDate && (
              <div
                className="relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsRescheduleMenuOpen(!isRescheduleMenuOpen)}
                  className={`flex items-center gap-1 font-medium px-1.5 py-0.5 rounded hover:bg-neutral-100 transition-colors ${
                    friendlyDate.isOverdue
                      ? 'text-red-600 bg-red-50'
                      : 'text-emerald-700 bg-emerald-50'
                  }`}
                  title="Click to reschedule"
                >
                  <Calendar className="w-3 h-3" />
                  <span>{friendlyDate.label}</span>
                </button>

                {/* Quick Reschedule Popover */}
                {isRescheduleMenuOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-elevated border border-neutral-200 py-1 z-50">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase px-2.5 py-1">
                      Reschedule Task
                    </div>
                    {quickOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          handleRescheduleTask(task.id, opt.date);
                          setIsRescheduleMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 flex items-center justify-between"
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{opt.shortcut}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recurrence rule */}
            {task.recurrence && (
              <span className="flex items-center gap-0.5 text-blue-600 font-medium">
                <Repeat className="w-2.5 h-2.5" />
                <span>{task.recurrenceRule || task.recurrence}</span>
              </span>
            )}

            {/* Subtasks pill */}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-medium">
                <CheckSquare className="w-3 h-3 text-neutral-400" />
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </span>
            )}

            {/* Comments count */}
            {task.comments?.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                <MessageSquare className="w-3 h-3" />
                <span>{task.comments.length}</span>
              </span>
            )}

            {/* Labels */}
            {task.labels?.slice(0, 2).map((label) => (
              <span
                key={label}
                className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-mono"
              >
                @{label}
              </span>
            ))}

            {/* Assignee Avatar (Far Right) */}
            {assignee && (
              <div className="ml-auto flex items-center gap-1" title={`Assigned to ${assignee.name}`}>
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="w-5 h-5 min-w-[20px] max-w-[20px] min-h-[20px] max-h-[20px] rounded-full object-cover border border-white shadow-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
