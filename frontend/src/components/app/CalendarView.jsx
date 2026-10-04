import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Flag,
  Clock,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function CalendarView({ tasks, project }) {
  const {
    projects,
    updateTask,
    setActiveTaskModal,
    addTask,
    setIsQuickAddOpen,
  } = useWorkspace();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const safeProjects = projects || [];
  const safeTasks = tasks || [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

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

  const handleDayClick = (dateStr) => {
    if (setIsQuickAddOpen) {
      setIsQuickAddOpen(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-subtle p-4 sm:p-6 select-none">
      {/* Calendar Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-t-xl overflow-hidden border border-neutral-200">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="bg-cream-50 py-2 text-center text-xs font-bold text-neutral-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-px bg-neutral-200 border-x border-b border-neutral-200 rounded-b-xl overflow-hidden">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const dayTasks = safeTasks.filter((t) => t.dueDate === dateStr && !t.completed);

          return (
            <div
              key={dateStr}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, dateStr)}
              onClick={() => handleDayClick(dateStr)}
              className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                isCurrentMonth ? 'bg-white hover:bg-neutral-50/70' : 'bg-neutral-50/50 text-neutral-400'
              } ${isTodayDate ? 'ring-2 ring-brand inset-0 z-10' : ''}`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                    isTodayDate ? 'bg-brand text-white' : 'text-neutral-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="space-y-1 my-1 overflow-y-auto max-h-20">
                {dayTasks.map((t) => {
                  const proj = safeProjects.find((p) => p.id === t.projectId);
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTaskModal(t);
                      }}
                      className="p-1 rounded bg-cream border border-neutral-200/90 text-[11px] font-medium text-neutral-800 truncate hover:border-brand flex items-center gap-1 shadow-2xs"
                      style={{ borderLeftWidth: '3px', borderLeftColor: proj?.color || '#E44332' }}
                      title={t.title}
                    >
                      {t.dueTime && (
                        <span className="text-[9px] text-neutral-400">{t.dueTime}</span>
                      )}
                      <span className="truncate">{t.title}</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-neutral-300 opacity-0 hover:opacity-100 text-center">
                + Add task
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
