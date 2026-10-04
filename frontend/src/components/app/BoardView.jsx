import React, { useState } from 'react';
import { Plus, MoreHorizontal, Check, Clock } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import TaskCard from './TaskCard';

export default function BoardView({ tasks, project }) {
  const {
    sections,
    updateTask,
    addTask,
    addSection,
  } = useWorkspace();

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [activeColumnAdd, setActiveColumnAdd] = useState(null);
  const [columnTaskInput, setColumnTaskInput] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  const projectSections = project
    ? sections.filter((s) => s.projectId === project.id)
    : [
        { id: 'sec_todo', name: 'To Do', order: 0 },
        { id: 'sec_progress', name: 'In Progress', order: 1 },
        { id: 'sec_done', name: 'Done', order: 2 },
      ];

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      updateTask(taskId, {
        sectionId: targetSectionId,
        completed: targetSectionId?.includes('done') || false,
      });
    }
    setDraggedTaskId(null);
  };

  const handleAddColumnTask = (sectionId) => {
    if (!columnTaskInput.trim()) return;
    addTask(columnTaskInput.trim(), {
      projectId: project ? project.id : 'proj_inbox',
      sectionId,
    });
    setColumnTaskInput('');
    setActiveColumnAdd(null);
  };

  const handleCreateSection = (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !project) return;
    addSection(project.id, newSectionTitle.trim());
    setNewSectionTitle('');
    setIsAddingSection(false);
  };

  return (
    <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 select-none items-start min-h-[500px]">
      {projectSections.map((sec) => {
        const columnTasks = tasks.filter((t) => t.sectionId === sec.id);

        return (
          <div
            key={sec.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, sec.id)}
            className="w-72 sm:w-80 bg-cream-50/80 rounded-2xl p-3 sm:p-4 border border-neutral-200/80 flex flex-col max-h-[calc(100vh-210px)] flex-shrink-0"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  {sec.name}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-neutral-200 text-neutral-600">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Cards List with Drag & Drop */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[100px]">
              {columnTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TaskCard task={t} isDragging={draggedTaskId === t.id} />
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-neutral-200 rounded-xl flex items-center justify-center text-neutral-400 text-xs">
                  Drop tasks here
                </div>
              )}
            </div>

            {/* Add Task to Column */}
            <div className="pt-3 mt-2 border-t border-neutral-200/60">
              {activeColumnAdd === sec.id ? (
                <div className="bg-white rounded-xl p-2.5 border border-brand/50 shadow-xs space-y-2">
                  <input
                    type="text"
                    value={columnTaskInput}
                    onChange={(e) => setColumnTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumnTask(sec.id);
                    }}
                    placeholder="Task name..."
                    className="w-full text-xs font-medium outline-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveColumnAdd(null)}
                      className="px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddColumnTask(sec.id)}
                      className="px-3 py-1 bg-brand text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveColumnAdd(sec.id)}
                  className="w-full flex items-center gap-1.5 p-1.5 rounded-lg text-neutral-500 hover:text-brand hover:bg-neutral-200/50 text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-brand stroke-[2.5]" />
                  <span>Add task</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add New Section Column */}
      {project && (
        <div className="w-72 bg-neutral-100/60 hover:bg-neutral-100 rounded-2xl p-4 border border-dashed border-neutral-300 flex-shrink-0 transition-colors">
          {isAddingSection ? (
            <form onSubmit={handleCreateSection} className="space-y-2">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Column name e.g. In Review"
                className="w-full text-xs p-2 rounded-lg bg-white border border-neutral-300 focus:border-brand outline-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSection(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingSection(true)}
              className="w-full flex items-center justify-center gap-2 py-4 text-xs font-semibold text-neutral-600 hover:text-brand"
            >
              <Plus className="w-4 h-4" />
              <span>Add Column</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
