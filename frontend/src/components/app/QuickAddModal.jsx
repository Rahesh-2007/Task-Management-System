import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Calendar,
  Flag,
  Hash,
  User,
  Sparkles,
  Repeat,
  Tag,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { parseTaskInput, formatFriendlyDueDate } from '../../utils/nlpParser';
import { format } from 'date-fns';

export default function QuickAddModal() {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    addTask,
    projects,
    members,
    activeFilter,
    currentUser,
    selectedCalendarDate,
    setSelectedCalendarDate,
  } = useWorkspace();

  const [inputTitle, setInputTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState(() =>
    activeFilter?.startsWith('proj_') ? activeFilter : (projects[0]?.id || 'proj_inbox')
  );
  const [selectedAssignee, setSelectedAssignee] = useState(() => currentUser?.id);
  const [selectedPriority, setSelectedPriority] = useState('p4');
  const [selectedDueDate, setSelectedDueDate] = useState(() => selectedCalendarDate || format(new Date(), 'yyyy-MM-dd'));

  React.useEffect(() => {
    if (selectedCalendarDate) {
      setSelectedDueDate(selectedCalendarDate);
    }
  }, [selectedCalendarDate, isQuickAddOpen]);

  const parsedPreview = useMemo(() => {
    if (!inputTitle.trim()) return null;
    return parseTaskInput(inputTitle);
  }, [inputTitle]);

  if (!isQuickAddOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;

    addTask(inputTitle, {
      description,
      projectId: selectedProject || projects[0]?.id || 'proj_inbox',
      assigneeId: selectedAssignee || currentUser?.id,
      dueDate: parsedPreview?.dueDate || selectedDueDate || format(new Date(), 'yyyy-MM-dd'),
      priority: parsedPreview?.priority && parsedPreview.priority !== 'p4' ? parsedPreview.priority : selectedPriority,
    });

    setInputTitle('');
    setDescription('');
    if (setSelectedCalendarDate) setSelectedCalendarDate(null);
    setIsQuickAddOpen(false);
  };

  const priorityColors = {
    p1: 'text-priority-p1',
    p2: 'text-priority-p2',
    p3: 'text-priority-p3',
    p4: 'text-neutral-400',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={() => setIsQuickAddOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-cream-50">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Quick Add Task</span>
          </div>
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(false)}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <input
            type="text"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            placeholder="e.g. Schedule design critique tomorrow 3pm p1 #Launch +Sarah"
            className="w-full text-sm font-semibold text-neutral-900 border-none outline-none placeholder:text-neutral-400 placeholder:font-normal"
            autoFocus
          />

          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full text-xs text-neutral-700 border-none outline-none resize-none placeholder:text-neutral-400"
          />

          {/* Live NLP Chip Previews */}
          {parsedPreview && (parsedPreview.dueDate || parsedPreview.priority !== 'p4' || parsedPreview.recurrence || parsedPreview.assigneeName) && (
            <div className="flex flex-wrap items-center gap-1.5 py-2 border-t border-neutral-100 text-[11px]">
              <span className="text-neutral-400 text-[10px] font-bold uppercase">Detected:</span>
              {parsedPreview.dueDate && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1 border border-emerald-200">
                  <Calendar className="w-3 h-3" />
                  {formatFriendlyDueDate(parsedPreview.dueDate, parsedPreview.dueTime)?.label || parsedPreview.dueDate}
                </span>
              )}
              {parsedPreview.priority && parsedPreview.priority !== 'p4' && (
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-brand font-medium flex items-center gap-1 border border-red-200">
                  <Flag className="w-3 h-3" />
                  {parsedPreview.priority.toUpperCase()}
                </span>
              )}
              {parsedPreview.recurrence && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium flex items-center gap-1 border border-blue-200">
                  <Repeat className="w-3 h-3" />
                  {parsedPreview.recurrenceRule || parsedPreview.recurrence}
                </span>
              )}
              {parsedPreview.assigneeName && (
                <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium flex items-center gap-1 border border-purple-200">
                  <User className="w-3 h-3" />
                  {parsedPreview.assigneeName}
                </span>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              {/* Project Select */}
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="text-xs p-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium outline-none max-w-[130px] truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Assignee Select */}
              <select
                value={selectedAssignee || ''}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="text-xs p-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 font-medium outline-none max-w-[130px] truncate"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    👤 {m.name} {m.id === currentUser?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>

              {/* Due Date Picker */}
              <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 rounded-lg px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="text-xs bg-transparent text-neutral-700 font-medium outline-none cursor-pointer"
                  title="Due Date"
                />
              </div>

              {/* Priority Select */}
              <div className="flex items-center gap-0.5">
                {['p1', 'p2', 'p3', 'p4'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPriority(p)}
                    className={`p-1 rounded ${
                      selectedPriority === p ? 'bg-neutral-200 ring-1 ring-neutral-400' : 'hover:bg-neutral-100'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${priorityColors[p]}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inputTitle.trim()}
                className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-40"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
