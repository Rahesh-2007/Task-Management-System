import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import ListView from '../components/app/ListView';
import BoardView from '../components/app/BoardView';
import CalendarView from '../components/app/CalendarView';
import { Folder, List, LayoutGrid, Calendar as CalendarIcon, Plus, Hash } from 'lucide-react';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects = [], tasks = [], setIsQuickAddOpen, setQuickAddInitialParams } = useWorkspace();

  const currentView = searchParams.get('view') || 'list';

  const project = projects.find((p) => String(p.id) === String(projectId)) || {
    id: projectId,
    name: 'Project',
    color: '#E11D48',
    description: '',
  };

  const projectTasks = useMemo(() => {
    return tasks.filter((t) => String(t.projectId) === String(projectId));
  }, [tasks, projectId]);

  const setView = (view) => {
    setSearchParams({ view });
  };

  const handleAddTask = () => {
    setQuickAddInitialParams({ projectId: project.id });
    setIsQuickAddOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="w-4 h-4 rounded-full inline-block"
              style={{ backgroundColor: project.color || '#E11D48' }}
            />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{project.name}</h1>
          </div>
          {project.description && (
            <p className="mt-1 text-xs text-neutral-500">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                currentView === 'list'
                  ? 'bg-rose-50 text-[#E11D48]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>

            <button
              type="button"
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                currentView === 'board'
                  ? 'bg-rose-50 text-[#E11D48]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>

            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                currentView === 'calendar'
                  ? 'bg-rose-50 text-[#E11D48]'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
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
      </div>

      {/* Render selected view */}
      {currentView === 'board' ? (
        <BoardView tasks={projectTasks} projectId={project.id} />
      ) : currentView === 'calendar' ? (
        <CalendarView tasks={projectTasks} />
      ) : (
        <ListView tasks={projectTasks} />
      )}
    </div>
  );
}
