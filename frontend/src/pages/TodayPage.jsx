import React, { useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import ListView from '../components/app/ListView';
import { Calendar, Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function TodayPage({ filter = 'today' }) {
  const { tasks = [], setIsQuickAddOpen, setQuickAddInitialParams } = useWorkspace();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const filteredTasks = useMemo(() => {
    if (filter === 'my_tasks') {
      return tasks.filter((t) => !t.completed);
    }
    if (filter === 'important') {
      return tasks.filter((t) => !t.completed && (t.priority === 'p1' || t.priority === 'p2'));
    }
    if (filter === 'completed') {
      return tasks.filter((t) => t.completed);
    }
    // Default: Today (Due today or overdue)
    return tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= todayStr);
  }, [tasks, filter, todayStr]);

  const pageTitle =
    filter === 'my_tasks'
      ? 'My Tasks'
      : filter === 'important'
      ? 'Important Tasks'
      : filter === 'completed'
      ? 'Completed Tasks'
      : 'Today';

  const handleAddTask = () => {
    setQuickAddInitialParams({ dueDate: todayStr });
    setIsQuickAddOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{pageTitle}</h1>
            {filter === 'today' && (
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-[#E11D48]">
                {format(new Date(), 'EEE, MMM d')}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} scheduled
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTask}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E11D48] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#BE123C] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task List View */}
      <ListView tasks={filteredTasks} />
    </div>
  );
}
