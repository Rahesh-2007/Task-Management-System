import React, { useMemo } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import ListView from '../components/app/ListView';
import { Inbox, Plus } from 'lucide-react';

export default function InboxPage() {
  const { tasks = [], projects = [], setIsQuickAddOpen, setQuickAddInitialParams } = useWorkspace();

  // Use is_inbox flag (Phase 2) if available, otherwise fall back to name matching
  const inboxProject = projects.find((p) => p.is_inbox) ||
    projects.find((p) => p.name?.toLowerCase() === 'inbox') ||
    null;

  const inboxTasks = useMemo(() => {
    if (!inboxProject) {
      // No inbox project — show tasks with no project as a safe fallback
      return tasks.filter((t) => !t.completed && !t.projectId);
    }
    // Correct filter: ONLY tasks belonging to the inbox project
    return tasks.filter((t) => !t.completed && String(t.projectId) === String(inboxProject.id));
  }, [tasks, inboxProject]);


  const handleAddTask = () => {
    if (inboxProject) {
      setQuickAddInitialParams({ projectId: inboxProject.id });
    }
    setIsQuickAddOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#E11D48]" />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Inbox</h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {inboxTasks.length} {inboxTasks.length === 1 ? 'task' : 'tasks'} waiting in your inbox stream
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTask}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E11D48] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#BE123C] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Inbox</span>
        </button>
      </div>

      <ListView tasks={inboxTasks} />
    </div>
  );
}
