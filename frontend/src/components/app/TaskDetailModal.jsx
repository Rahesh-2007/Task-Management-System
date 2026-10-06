import React, { useState } from 'react';
import {
  X,
  Check,
  Calendar,
  Clock,
  Flag,
  User,
  Hash,
  MessageSquare,
  Plus,
  Trash2,
  Send,
  History,
  Repeat,
  Tag,
  AlignLeft,
  CheckSquare,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { parseTaskInput, formatFriendlyDueDate } from '../../utils/nlpParser';
import { getQuickRescheduleOptions } from '../../utils/rescheduleLogic';
import Avatar from './Avatar';

export default function TaskDetailModal() {
  const {
    activeTaskModal,
    setActiveTaskModal,
    updateTask,
    deleteTask,
    members,
    currentUser,
    projects,
    sections,
    addComment,
    activities,
    activeWorkspace,
  } = useWorkspace();

  const isPersonal = activeWorkspace?.type === 'personal';

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'comments' | 'activity'
  const [commentInput, setCommentInput] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [isNlpDateInputOpen, setIsNlpDateInputOpen] = useState(false);
  const [nlpDateText, setNlpDateText] = useState('');

  if (!activeTaskModal) return null;

  const task = activeTaskModal;
  const safeProjects = projects || [];
  const safeMembers = members || [];
  const safeSections = sections || [];
  const safeActivities = activities || [];

  const project = safeProjects.find((p) => p.id === task.projectId);
  const currentAssignee = safeMembers.find((m) => m.id === task.assigneeId);
  const projectSections = safeSections.filter((s) => s.projectId === task.projectId);
  const taskActivities = safeActivities.filter((a) => a.taskTitle === task.title || a.projectId === task.projectId);

  const priorityColors = {
    p1: { name: 'Priority 1 (Urgent)', color: 'text-priority-p1', bg: 'bg-red-50' },
    p2: { name: 'Priority 2 (High)', color: 'text-priority-p2', bg: 'bg-amber-50' },
    p3: { name: 'Priority 3 (Medium)', color: 'text-priority-p3', bg: 'bg-blue-50' },
    p4: { name: 'Priority 4 (Low)', color: 'text-neutral-500', bg: 'bg-neutral-50' },
  };

  const handleTitleChange = (e) => {
    updateTask(task.id, { title: e.target.value });
  };

  const handleDescriptionChange = (e) => {
    updateTask(task.id, { description: e.target.value });
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSub = {
      id: `st_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    updateTask(task.id, {
      subtasks: [...(task.subtasks || []), newSub],
    });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subId) => {
    const updated = (task.subtasks || []).map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    updateTask(task.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subId) => {
    const updated = (task.subtasks || []).filter((s) => s.id !== subId);
    updateTask(task.id, { subtasks: updated });
  };

  const handleAddLabel = (e) => {
    e.preventDefault();
    if (!newLabelInput.trim()) return;
    const cleanLabel = newLabelInput.replace(/^@/, '').trim();
    if (!task.labels?.includes(cleanLabel)) {
      updateTask(task.id, {
        labels: [...(task.labels || []), cleanLabel],
      });
    }
    setNewLabelInput('');
  };

  const handleRemoveLabel = (labelToRemove) => {
    updateTask(task.id, {
      labels: (task.labels || []).filter((l) => l !== labelToRemove),
    });
  };

  const handleNlpDateSubmit = (e) => {
    e.preventDefault();
    if (!nlpDateText.trim()) return;
    const parsed = parseTaskInput(nlpDateText);
    if (parsed.dueDate) {
      updateTask(task.id, {
        dueDate: parsed.dueDate,
        dueTime: parsed.dueTime,
        recurrence: parsed.recurrence,
        recurrenceRule: parsed.recurrenceRule,
      });
    }
    setNlpDateText('');
    setIsNlpDateInputOpen(false);
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(task.id, commentInput.trim());
    setCommentInput('');
  };

  const friendlyDueDate = formatFriendlyDueDate(task.dueDate, task.dueTime);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs"
      onClick={() => setActiveTaskModal(null)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200/80 bg-cream-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: project?.color || '#E44332' }}
            />
            <span>{project?.name || 'Inbox'}</span>
            {task.sectionId && (
              <>
                <span className="text-neutral-400">/</span>
                <span className="text-neutral-500">
                  {sections.find((s) => s.id === task.sectionId)?.name}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTaskModal(null)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs Bar */}
        <div className="flex items-center gap-4 px-6 pt-3 border-b border-neutral-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Task Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({task.comments?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Log</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column (Main content): Title, Description, Subtasks */}
              <div className="md:col-span-8 space-y-5">
                {/* Title input */}
                <div>
                  <input
                    type="text"
                    value={task.title}
                    onChange={handleTitleChange}
                    className="w-full text-lg sm:text-xl font-bold text-neutral-900 border-none outline-none focus:ring-1 focus:ring-brand rounded px-1 -ml-1 placeholder:text-neutral-400"
                    placeholder="Task title"
                  />
                </div>

                {/* Description input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Description</span>
                  </label>
                  <textarea
                    rows={3}
                    value={task.description || ''}
                    onChange={handleDescriptionChange}
                    placeholder="Add more details, links, or acceptance criteria..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-neutral-200 focus:border-brand outline-none text-neutral-800 placeholder:text-neutral-400 resize-none"
                  />
                </div>

                {/* Subtasks Checklist */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Subtasks ({task.subtasks?.filter((s) => s.completed).length || 0}/{task.subtasks?.length || 0})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {task.subtasks?.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors group text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleSubtask(sub.id)}
                          className="flex items-center gap-2.5 text-left flex-1"
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              sub.completed ? 'bg-brand border-brand text-white' : 'border-neutral-400'
                            }`}
                          >
                            {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={sub.completed ? 'line-through text-neutral-400' : 'text-neutral-800'}>
                            {sub.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubtask(sub.id)}
                          className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Add subtask input */}
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add subtask..."
                        className="flex-1 text-xs p-2 rounded-lg border border-neutral-200 focus:border-brand outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!newSubtaskTitle.trim()}
                        className="px-3 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Right Column: Metadata Properties (Assignee, Due Date, Priority, Project, Labels) */}
              <div className="md:col-span-4 space-y-4 bg-cream-50/60 p-4 rounded-2xl border border-neutral-200/80">
                {/* Assignee Picker (Company Workspace only) */}
                {!isPersonal && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Assignee
                    </label>
                    <select
                      value={task.assigneeId || ''}
                      onChange={(e) => updateTask(task.id, { assigneeId: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-brand"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.title})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Due Date & Natural Language input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      Due Date & Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsNlpDateInputOpen(!isNlpDateInputOpen)}
                      className="text-[10px] text-brand hover:underline font-semibold"
                    >
                      {isNlpDateInputOpen ? 'Cancel' : '⚡ Natural Language'}
                    </button>
                  </div>

                  {isNlpDateInputOpen ? (
                    <form onSubmit={handleNlpDateSubmit} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={nlpDateText}
                        onChange={(e) => setNlpDateText(e.target.value)}
                        placeholder="e.g. tomorrow 3pm or every Monday"
                        className="flex-1 text-xs p-1.5 rounded-lg border border-brand outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        Set
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={task.dueDate || ''}
                        onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-brand"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">Start Time</label>
                          <input
                            type="time"
                            value={task.startTime || ''}
                            onChange={(e) => updateTask(task.id, { startTime: e.target.value || null })}
                            className="w-full text-xs p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-brand"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">Due Time</label>
                          <input
                            type="time"
                            value={task.dueTime || ''}
                            onChange={(e) => updateTask(task.id, { dueTime: e.target.value || null })}
                            className="w-full text-xs p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-brand"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {friendlyDueDate && (
                    <div className="text-[11px] font-semibold text-emerald-700">
                      Scheduled: {friendlyDueDate.label}
                    </div>
                  )}
                </div>

                {/* Recurrence Rule */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Recurrence
                  </label>
                  <select
                    value={task.recurrence || 'none'}
                    onChange={(e) =>
                      updateTask(task.id, {
                        recurrence: e.target.value === 'none' ? null : e.target.value,
                        recurrenceRule: e.target.value === 'none' ? null : `every ${e.target.value}`,
                      })
                    }
                    className="w-full text-xs p-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-brand"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Every Weekday (Mon-Fri)</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 Weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Priority
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['p1', 'p2', 'p3', 'p4'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateTask(task.id, { priority: p })}
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          task.priority === p
                            ? 'bg-white border-neutral-800 shadow-xs'
                            : 'bg-white/60 border-neutral-200 hover:bg-white'
                        }`}
                      >
                        <Flag className={`w-3.5 h-3.5 ${priorityColors[p].color}`} />
                        <span className="uppercase">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Project & Section Selector (Company Workspace only) */}
                {!isPersonal && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Project & Section
                    </label>
                    <select
                      value={task.projectId || ''}
                      onChange={(e) => updateTask(task.id, { projectId: e.target.value, sectionId: null })}
                      className="w-full text-xs p-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-brand mb-1.5"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    {projectSections.length > 0 && (
                      <select
                        value={task.sectionId || ''}
                        onChange={(e) => updateTask(task.id, { sectionId: e.target.value || null })}
                        className="w-full text-xs p-2 rounded-lg bg-white border border-neutral-200 text-neutral-800 font-medium outline-none focus:border-brand"
                      >
                        <option value="">No Section</option>
                        {projectSections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Labels & Tags */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {task.labels?.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-0.5 rounded bg-neutral-200 text-neutral-800 text-[11px] font-mono flex items-center gap-1"
                      >
                        @{label}
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(label)}
                          className="hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <form onSubmit={handleAddLabel} className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newLabelInput}
                      onChange={(e) => setNewLabelInput(e.target.value)}
                      placeholder="Add @label..."
                      className="flex-1 text-xs p-1.5 rounded-lg bg-white border border-neutral-200 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newLabelInput.trim()}
                      className="px-2.5 py-1.5 bg-neutral-800 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                    >
                      +
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab with @mentions */}
          {activeTab === 'comments' && (
            <div className="space-y-5">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {task.comments?.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 text-xs">
                    No comments yet. Start the conversation with @teammates!
                  </div>
                ) : (
                  task.comments?.map((comment) => {
                    const author = members.find((m) => m.id === comment.authorId) || currentUser;
                    return (
                      <div key={comment.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                        <Avatar
                          user={author}
                          size="sm"
                          className="shadow-2xs"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-900">{author?.name || 'Teammate'}</span>
                            <span className="text-[10px] text-neutral-400">{comment.timestamp}</span>
                          </div>
                          <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleSendComment} className="space-y-2 pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                  <span>Tip: Mention teammates by typing</span>
                  <span className="font-mono text-brand">@sarah</span>
                  <span className="font-mono text-brand">@david</span>
                  <span className="font-mono text-brand">@elena</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment or update..."
                    className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-neutral-200 focus:border-brand outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="p-3 bg-brand hover:bg-brand-hover text-white rounded-xl disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Activity Log Feed */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {taskActivities.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  No activity history logged yet.
                </div>
              ) : (
                taskActivities.map((act) => {
                  const actor = members.find((m) => m.id === act.actorId) || currentUser;
                  return (
                    <div key={act.id} className="flex items-center gap-3 text-xs p-2.5 rounded-lg bg-neutral-50">
                      <Avatar user={actor} size="xs" />
                      <div className="flex-1">
                        <strong className="text-neutral-900">{actor?.name || 'Teammate'}</strong>{' '}
                        <span className="text-neutral-600">{act.action}</span>{' '}
                        <span className="font-semibold text-neutral-800">"{act.taskTitle}"</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">{act.timestamp}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
