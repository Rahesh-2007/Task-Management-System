import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Calendar,
  Flag,
  User,
  Sparkles,
  Repeat,
  Tag,
  Clock,
  ListOrdered,
  Check,
  ChevronDown,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';
import { parseTaskInput, formatFriendlyDueDate } from '../../utils/nlpParser';
import { format, addDays } from 'date-fns';

export default function QuickAddModal() {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddInitialParams,
    setQuickAddInitialParams,
    addTask,
    projects = [],
    sections = [],
    members = [],
    labels = [],
    activeWorkspace,
  } = useWorkspace();

  const isPersonal = activeWorkspace?.type === 'personal';
  const { user } = useAuth();
  const titleInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('p4');
  const [selectedDueDate, setSelectedDueDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedDueTime, setSelectedDueTime] = useState('');
  const [selectedRecurrence, setSelectedRecurrence] = useState('');
  const [selectedEstimate, setSelectedEstimate] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [createAnother, setCreateAnother] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Re-initialize state every time modal opens
  useEffect(() => {
    if (isQuickAddOpen) {
      const defaultProjId = quickAddInitialParams?.projectId || (isPersonal ? '' : projects[0]?.id || '');
      setTitle(quickAddInitialParams?.title || '');
      setDescription('');
      setSelectedProject(defaultProjId ? String(defaultProjId) : '');
      setSelectedSection(quickAddInitialParams?.sectionId ? String(quickAddInitialParams.sectionId) : '');
      setSelectedAssignee(quickAddInitialParams?.assigneeId ? String(quickAddInitialParams.assigneeId) : (isPersonal ? '' : String(user?.id || '')));
      setSelectedPriority(quickAddInitialParams?.priority || 'p4');
      setSelectedDueDate(quickAddInitialParams?.dueDate || '');
      setSelectedStartTime('');
      setSelectedDueTime('');
      setSelectedRecurrence('');
      setSelectedEstimate('');
      setSelectedLabelIds([]);
      setSubtasks([]);
      setNewSubtaskInput('');
      setErrorMsg('');
      setShowAdvanced(false);

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isQuickAddOpen, quickAddInitialParams, projects, user, isPersonal]);

  // Live NLP parsing
  const parsedPreview = useMemo(() => {
    if (!title.trim()) return null;
    return parseTaskInput(title);
  }, [title]);

  if (!isQuickAddOpen) return null;

  // Project sections
  const projectSections = sections.filter((s) => !s.project_id || String(s.project_id) === String(selectedProject));

  // Quick date presets
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const nextWeekStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const handleAddSubtask = (e) => {
    if (e) e.preventDefault();
    if (!newSubtaskInput.trim()) return;

    // Support multi-line pasting
    const lines = newSubtaskInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const newItems = lines.map((text) => ({
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text,
      completed: false,
    }));

    setSubtasks((prev) => [...prev, ...newItems]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const toggleLabel = (labelId) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Task title is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalDueDate = parsedPreview?.dueDate || selectedDueDate || null;
      const finalDueTime = parsedPreview?.dueTime || selectedDueTime || null;
      const finalPriority =
        parsedPreview?.priority && parsedPreview.priority !== 'p4' ? parsedPreview.priority : selectedPriority;

      const allSubtasks = [...subtasks];
      if (newSubtaskInput.trim()) {
        const lines = newSubtaskInput
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        lines.forEach((text) => allSubtasks.push({ text, completed: false }));
      }

      await addTask(title.trim(), {
        description: description.trim(),
        projectId: selectedProject ? parseInt(selectedProject, 10) : null,
        sectionId: selectedSection ? parseInt(selectedSection, 10) : null,
        assigneeId: selectedAssignee ? parseInt(selectedAssignee, 10) : user?.id || null,
        dueDate: finalDueDate,
        startTime: selectedStartTime || null,
        dueTime: finalDueTime,
        priority: finalPriority,
        recurrenceRule: selectedRecurrence || parsedPreview?.recurrenceRule || null,
        estimateMinutes: selectedEstimate ? parseInt(selectedEstimate, 10) : null,
        labelIds: selectedLabelIds,
        subtasks: allSubtasks.map((st) => ({ text: st.text, completed: false })),
      });

      setIsSubmitting(false);

      if (createAnother) {
        setTitle('');
        setDescription('');
        setSelectedDueDate('');
        setSelectedStartTime('');
        setSelectedDueTime('');
        setSubtasks([]);
        titleInputRef.current?.focus();
      } else {
        setIsQuickAddOpen(false);
        setQuickAddInitialParams(null);
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to create task. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={() => setIsQuickAddOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Form Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#E11D48] text-white shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Create Task</h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                {isPersonal ? 'Personal Workspace Task' : `Workspace: ${activeWorkspace?.name || 'Company'}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQuickAddOpen(false)}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Task Title Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">
              Task Title <span className="text-[#E11D48]">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full text-sm font-semibold text-neutral-900 px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:border-[#E11D48] focus:ring-2 focus:ring-rose-100 outline-none placeholder:text-neutral-400 placeholder:font-normal transition-all"
            />
          </div>

          {/* Live Detected Tokens */}
          {parsedPreview && (parsedPreview.dueDate || (parsedPreview.priority && parsedPreview.priority !== 'p4') || parsedPreview.recurrence) && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-neutral-50 border border-neutral-100 text-[11px]">
              <span className="text-neutral-400 font-bold uppercase text-[9px] tracking-wider mr-1">Detected:</span>
              {parsedPreview.dueDate && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1 border border-emerald-200">
                  <Calendar className="w-3 h-3" />
                  {formatFriendlyDueDate(parsedPreview.dueDate, parsedPreview.dueTime)?.label || parsedPreview.dueDate}
                </span>
              )}
              {parsedPreview.priority && parsedPreview.priority !== 'p4' && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-[#E11D48] font-bold flex items-center gap-1 border border-rose-200">
                  <Flag className="w-3 h-3" />
                  {parsedPreview.priority.toUpperCase()}
                </span>
              )}
              {parsedPreview.recurrence && (
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold flex items-center gap-1 border border-blue-200">
                  <Repeat className="w-3 h-3" />
                  {parsedPreview.recurrence}
                </span>
              )}
            </div>
          )}

          {/* 2. Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 block">
              Description <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description, notes, or links..."
              className="w-full text-xs text-neutral-700 px-3 py-2 rounded-xl border border-neutral-200 focus:border-[#E11D48] focus:ring-2 focus:ring-rose-100 outline-none resize-none placeholder:text-neutral-400 transition-all"
            />
          </div>

          {/* 3. Schedule: Date & Times Grid */}
          <div className="space-y-3 pt-1">
            {/* Due Date Row */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Date</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={selectedDueDate}
                  onChange={(e) => setSelectedDueDate(e.target.value)}
                  className="flex-1 min-w-[140px] text-xs px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-800 font-medium outline-none focus:border-[#E11D48] cursor-pointer"
                />
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedDueDate(todayStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      selectedDueDate === todayStr
                        ? 'bg-[#E11D48] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDueDate(tomorrowStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      selectedDueDate === tomorrowStr
                        ? 'bg-[#E11D48] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDueDate(nextWeekStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      selectedDueDate === nextWeekStr
                        ? 'bg-[#E11D48] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    Next Week
                  </button>
                  {selectedDueDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDueDate('')}
                      className="px-2 py-1 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Time Row: Start Time & Due Time Aligned */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Start Time Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Start Time</span>
                </label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="time"
                      value={selectedStartTime}
                      onChange={(e) => setSelectedStartTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-800 font-medium outline-none focus:border-[#E11D48] cursor-pointer"
                    />
                    {selectedStartTime && (
                      <button
                        type="button"
                        onClick={() => setSelectedStartTime('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-rose-500 font-bold cursor-pointer"
                        title="Clear start time"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {['09:00', '10:00', '14:00', '18:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedStartTime(time)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                          selectedStartTime === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Due / End Time Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Due Time</span>
                </label>
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type="time"
                      value={selectedDueTime}
                      onChange={(e) => setSelectedDueTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-800 font-medium outline-none focus:border-[#E11D48] cursor-pointer"
                    />
                    {selectedDueTime && (
                      <button
                        type="button"
                        onClick={() => setSelectedDueTime('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-rose-500 font-bold cursor-pointer"
                        title="Clear due time"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {['10:00', '12:00', '15:00', '18:00'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedDueTime(time)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                          selectedDueTime === time
                            ? 'bg-[#E11D48] text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Priority & Team Collaboration */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 block">Priority</label>
                <div className="grid grid-cols-4 gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                  {[
                    { id: 'p1', label: 'P1', color: 'text-red-600' },
                    { id: 'p2', label: 'P2', color: 'text-orange-500' },
                    { id: 'p3', label: 'P3', color: 'text-blue-600' },
                    { id: 'p4', label: 'P4', color: 'text-neutral-500' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPriority(p.id)}
                      className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all text-center ${
                        selectedPriority === p.id
                          ? 'bg-white shadow-2xs ' + p.color
                          : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project (Company Workspace only) */}
              {!isPersonal && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-semibold outline-none focus:border-[#E11D48]"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        📁 {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assignee (Company Workspace only) */}
              {!isPersonal && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">Assignee</label>
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-[#E11D48]"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} {m.id === user?.id ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Checklist & Advanced Options Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5 cursor-pointer"
              >
                <span>{showAdvanced ? 'Hide Subtasks & Labels' : '+ Add Subtasks & Labels'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* 5. Advanced Checklist & Labels */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-neutral-100 animate-slide-up">
              {/* Checklist Editor */}
              <div>
                <span className="text-xs font-bold text-neutral-700 block mb-1.5">
                  Subtasks ({subtasks.length})
                </span>

                <div className="space-y-1.5 max-h-32 overflow-y-auto mb-2">
                  {subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
                      <span className="text-neutral-800">{st.text}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(st.id)}
                        className="text-neutral-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Type subtask and press Enter..."
                    className="flex-1 text-xs p-2 rounded-xl border border-neutral-200 outline-none focus:border-[#E11D48]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Labels & Tags */}
              {labels.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-neutral-700 block mb-1.5">Labels</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {labels.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLabel(l.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                          selectedLabelIds.includes(l.id)
                            ? 'bg-neutral-900 text-white border-neutral-900'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5" style={{ backgroundColor: l.color }} />
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <label className="flex items-center gap-2 text-xs text-neutral-600 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="rounded border-neutral-300 text-[#E11D48] focus:ring-[#E11D48] w-3.5 h-3.5"
              />
              <span>Create another</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
