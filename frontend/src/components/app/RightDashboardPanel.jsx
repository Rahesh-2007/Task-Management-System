import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus,
  FileText,
  CheckCircle2,
  FolderPlus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, getDay, getDate, isToday } from 'date-fns';

export default function RightDashboardPanel() {
  const {
    tasks,
    setIsQuickAddOpen,
    setIsInviteModalOpen,
    setIsNewProjectModalOpen,
    setIsReportsModalOpen,
    activities,
    setActiveFilter,
    activeFilter,
    setActiveView,
    selectedCalendarDate,
    setSelectedCalendarDate,
  } = useWorkspace();

  const [calMonth, setCalMonth] = useState(() => new Date());

  const safeTasks = tasks || [];
  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calendar dates
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthStart = startOfMonth(calMonth);
  const startDayIndex = getDay(monthStart); // 0 (Sun) to 6 (Sat)
  const totalDaysInMonth = getDate(endOfMonth(calMonth));
  const emptyPrefix = Array.from({ length: startDayIndex }, (_, i) => i);
  const daysInMonth = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => setCalMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCalMonth((prev) => addMonths(prev, 1));

  const handleSelectDay = (day) => {
    const targetDate = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    if (setSelectedCalendarDate) {
      setSelectedCalendarDate(dateStr);
    }
    if (setActiveFilter) {
      setActiveFilter(`date:${dateStr}`);
    }
  };

  const handleOpenFullCalendar = () => {
    if (setActiveView) setActiveView('calendar');
    if (setActiveFilter) setActiveFilter('calendar');
  };

  return (
    <aside className="w-80 border-l border-neutral-200/80 bg-white p-5 overflow-y-auto space-y-6 hidden xl:block flex-shrink-0 select-none">
      {/* 1. Monthly Calendar Widget */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-black text-neutral-900">
            {format(calMonth, 'MMMM yyyy')}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekdays.map((day) => (
            <div key={day} className="text-[10px] font-bold text-neutral-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {emptyPrefix.map((idx) => (
            <div key={`empty-${idx}`} className="h-8" />
          ))}
          {daysInMonth.map((day) => {
            const currentDayDate = new Date(calMonth.getFullYear(), calMonth.getMonth(), day);
            const dateStr = format(currentDayDate, 'yyyy-MM-dd');
            const isSelected = selectedCalendarDate === dateStr || (activeFilter === `date:${dateStr}`);
            const isTodayDay = isToday(currentDayDate);
            const dayTasksCount = safeTasks.filter((t) => t.dueDate === dateStr && !t.completed).length;

            return (
              <div
                key={day}
                onClick={() => handleSelectDay(day)}
                className={`h-8 flex flex-col items-center justify-center text-xs font-semibold rounded-xl cursor-pointer transition-all relative ${
                  isSelected
                    ? 'bg-[#E11D48] text-white font-black shadow-xs scale-105'
                    : isTodayDay
                    ? 'bg-rose-50 text-[#E11D48] font-bold ring-1 ring-[#E11D48]/40'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
                title={`${format(currentDayDate, 'MMM d, yyyy')}${dayTasksCount > 0 ? ` (${dayTasksCount} tasks)` : ''}`}
              >
                <span>{day}</span>
                {dayTasksCount > 0 && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? 'bg-white' : 'bg-[#E11D48]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const todayDateStr = format(new Date(), 'yyyy-MM-dd');
              setCalMonth(new Date());
              if (setSelectedCalendarDate) setSelectedCalendarDate(todayDateStr);
              if (setActiveFilter) setActiveFilter('today');
            }}
            className="text-[11px] font-bold text-neutral-600 hover:text-[#E11D48] transition-colors cursor-pointer"
          >
            Today
          </button>
          <span className="text-[10px] text-neutral-400 font-medium">Click day to filter</span>
        </div>
      </div>

      {/* 2. Today's Progress Widget */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-neutral-900">Today's Progress</h3>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-neutral-700">{completedTasks} / {totalTasks} completed</span>
          <span className="font-bold text-neutral-500">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E11D48] to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Quick Actions Widget */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-neutral-900">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100/80 text-[#E11D48] font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Task</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100/80 text-purple-700 font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Project</span>
          </button>

          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Invite Member</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportsModalOpen(true)}
            className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* 4. Recent Activity Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-neutral-900">Recent Activity</h3>
          {(activities || []).length > 0 && (
            <button
              type="button"
              onClick={() => setIsReportsModalOpen(true)}
              className="text-[11px] font-bold text-[#E11D48] hover:underline cursor-pointer"
            >
              View All
            </button>
          )}
        </div>

        <div className="space-y-3">
          {(activities || []).length > 0 ? (
            activities.slice(0, 4).map((act) => (
              <div key={act.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-[#E11D48] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-900 leading-snug">{act.userName || 'Member'} {act.type || 'activity'}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{act.taskTitle || act.message}</div>
                </div>
                <div className="text-[10px] text-neutral-400 flex-shrink-0">{act.timestamp || 'Just now'}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-neutral-400 font-medium">
              No recent activity yet
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
