import React, { useState } from 'react';
import {
  format,
  addDays,
  isToday,
  isTomorrow,
} from 'date-fns';
import { Plus, Calendar, Clock, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import TaskCard from './TaskCard';

export default function UpcomingView({ tasks: propTasks, project }) {
  const {
    tasks: wsTasks = [],
    updateTask,
    addTask,
  } = useWorkspace();

  const tasks = propTasks || wsTasks || [];

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [inlineDayAdd, setInlineDayAdd] = useState(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // Next 7 days
  const today = new Date();
  const upcomingDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      updateTask(taskId, {
        dueDate: dateStr,
      });
    }
    setDraggedTaskId(null);
  };

  const handleInlineSubmit = (dateStr) => {
    if (!inlineTitle.trim()) return;
    addTask(inlineTitle.trim(), {
      dueDate: dateStr,
      projectId: project ? project.id : 'proj_inbox',
    });
    setInlineTitle('');
    setInlineDayAdd(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-6">
        {upcomingDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasks.filter((t) => t.dueDate === dateStr);

          let dayTitle = format(day, 'EEEE, MMM d');
          if (isToday(day)) dayTitle = `Today • ${format(day, 'MMM d')}`;
          else if (isTomorrow(day)) dayTitle = `Tomorrow • ${format(day, 'MMM d')}`;

          return (
            <div
              key={dateStr}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, dateStr)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-subtle space-y-3"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                    {dayTitle}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-600">
                    {dayTasks.filter((t) => !t.completed).length} tasks
                  </span>
                </div>
              </div>

              {/* Day Tasks with Drag & Drop */}
              <div className="space-y-2">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard task={t} isDragging={draggedTaskId === t.id} />
                  </div>
                ))}

                {dayTasks.length === 0 && (
                  <div className="py-4 text-center border border-dashed border-neutral-200 rounded-xl text-neutral-400 text-xs">
                    Drag tasks here to reschedule to {format(day, 'EEE, MMM d')}
                  </div>
                )}
              </div>

              {/* Inline Add Task for this specific day */}
              {inlineDayAdd === dateStr ? (
                <div className="bg-neutral-50 rounded-xl p-2.5 border border-brand/50 space-y-2">
                  <input
                    type="text"
                    value={inlineTitle}
                    onChange={(e) => setInlineTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleInlineSubmit(dateStr);
                    }}
                    placeholder={`Add task for ${dayTitle}...`}
                    className="w-full text-xs outline-none bg-transparent"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInlineDayAdd(null)}
                      className="px-2 py-1 text-xs text-neutral-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInlineSubmit(dateStr)}
                      className="px-3 py-1 bg-brand text-white rounded text-xs font-semibold shadow-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setInlineDayAdd(dateStr)}
                  className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-brand font-medium pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add task</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Completed Tasks Section at the bottom */}
        {tasks.filter((t) => t.completed).length > 0 && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center justify-between p-4 bg-emerald-50/90 hover:bg-emerald-100/70 text-emerald-800 text-xs font-bold transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                {showCompleted ? (
                  <ChevronDown className="w-4 h-4 stroke-[2.5] text-emerald-700" />
                ) : (
                  <ChevronRight className="w-4 h-4 stroke-[2.5] text-emerald-700" />
                )}
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Completed Tasks</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                {tasks.filter((t) => t.completed).length}
              </span>
            </button>

            {showCompleted && (
              <div className="p-4 space-y-2 bg-neutral-50/40">
                {tasks
                  .filter((t) => t.completed)
                  .map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
