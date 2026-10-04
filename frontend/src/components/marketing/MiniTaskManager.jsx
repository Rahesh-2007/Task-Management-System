import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Plus,
  Calendar,
  Flag,
  Inbox,
  CalendarDays,
  Hash,
  Sparkles,
  ChevronRight,
  Clock,
  Repeat,
  Tag,
  Circle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseTaskInput, formatFriendlyDueDate } from '../../utils/nlpParser';
import { format, addDays } from 'date-fns';

const DEMO_STORAGE_KEY = 'todoist_hero_demo_tasks';

const INITIAL_DEMO_TASKS = [
  {
    id: 'demo_1',
    title: 'Review product launch checklist',
    priority: 'p1',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    dueTime: '11:00',
    category: 'today',
    completed: false,
    project: 'Work',
  },
  {
    id: 'demo_2',
    title: 'Send updated wireframes to engineering team',
    priority: 'p2',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    dueTime: '15:30',
    category: 'today',
    completed: false,
    project: 'Work',
  },
  {
    id: 'demo_3',
    title: 'Gym workout & 5km run',
    priority: 'p3',
    dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    dueTime: '07:30',
    category: 'upcoming',
    completed: false,
    project: 'Personal',
  },
  {
    id: 'demo_4',
    title: 'Water the plants & buy almond milk',
    priority: 'p4',
    dueDate: null,
    dueTime: null,
    category: 'inbox',
    completed: true,
    project: 'Personal',
  },
];

export default function MiniTaskManager() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DEMO_TASKS;
  });

  const [activeTab, setActiveTab] = useState('today'); // 'inbox' | 'today' | 'upcoming' | 'Work' | 'Personal'
  const [inputValue, setInputValue] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('p4');
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Real-time NLP parsed metadata preview
  const parsedPreview = useMemo(() => {
    if (!inputValue.trim()) return null;
    return parseTaskInput(inputValue);
  }, [inputValue]);

  // Handle task completion
  const handleToggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const isDone = !t.completed;
          if (isDone) {
            try {
              confetti({
                particleCount: 35,
                spread: 50,
                origin: { y: 0.7 },
                colors: ['#E44332', '#EB8909', '#246FE0', '#10B981'],
              });
            } catch (e) {
              // ignore
            }
          }
          return { ...t, completed: isDone };
        }
        return t;
      })
    );
  };

  // Add task with NLP parsing
  const handleAddTask = (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const parsed = parseTaskInput(inputValue);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const newTask = {
      id: `task_${Date.now()}`,
      title: parsed.title || inputValue,
      priority: parsed.priority !== 'p4' ? parsed.priority : selectedPriority,
      dueDate: parsed.dueDate || (activeTab === 'today' ? todayStr : null),
      dueTime: parsed.dueTime || null,
      recurrence: parsed.recurrence,
      recurrenceRule: parsed.recurrenceRule,
      category: activeTab === 'Work' || activeTab === 'Personal' ? 'inbox' : activeTab,
      project: parsed.projectName || (activeTab === 'Personal' ? 'Personal' : 'Work'),
      completed: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    setInputValue('');
    setSelectedPriority('p4');
    setIsInputExpanded(false);
  };

  // Filter tasks for current view
  const displayedTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeTab === 'inbox') return true;
      if (activeTab === 'today') {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return task.dueDate === todayStr || (!task.dueDate && !task.completed);
      }
      if (activeTab === 'upcoming') {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return task.dueDate && task.dueDate > todayStr;
      }
      if (activeTab === 'Work' || activeTab === 'Personal') {
        return task.project === activeTab;
      }
      return true;
    });
  }, [tasks, activeTab]);

  const priorityColors = {
    p1: { border: 'border-priority-p1', text: 'text-priority-p1', bg: 'bg-red-50', dot: 'bg-priority-p1' },
    p2: { border: 'border-priority-p2', text: 'text-priority-p2', bg: 'bg-amber-50', dot: 'bg-priority-p2' },
    p3: { border: 'border-priority-p3', text: 'text-priority-p3', bg: 'bg-blue-50', dot: 'bg-priority-p3' },
    p4: { border: 'border-neutral-300', text: 'text-neutral-500', bg: 'bg-neutral-50', dot: 'bg-neutral-400' },
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-elevated border border-neutral-200/80 overflow-hidden flex flex-col md:flex-row text-left transition-all duration-300">
      {/* Left Sidebar */}
      <aside className="w-full md:w-56 bg-cream-50/80 border-b md:border-b-0 md:border-r border-neutral-200/60 p-3 sm:p-4 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Mock Window Controls */}
          <div className="flex items-center gap-1.5 mb-4 px-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="text-[11px] font-medium text-neutral-400 ml-2">Todoist Live Demo</span>
          </div>

          <nav className="space-y-0.5" aria-label="Demo Sidebar">
            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'inbox'
                  ? 'bg-neutral-200/70 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-200/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-500" />
                <span>Inbox</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-normal">
                {tasks.filter((t) => !t.completed).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-neutral-200/70 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-200/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Today</span>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                {tasks.filter((t) => !t.completed && t.dueDate === format(new Date(), 'yyyy-MM-dd')).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-neutral-200/70 text-neutral-900 font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-200/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-purple-500" />
                <span>Upcoming</span>
              </div>
            </button>
          </nav>

          {/* Projects Group */}
          <div className="mt-4 pt-3 border-t border-neutral-200/60">
            <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              <span>My Projects</span>
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('Work')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'Work'
                    ? 'bg-neutral-200/70 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-200/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  <span>Work</span>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {tasks.filter((t) => t.project === 'Work' && !t.completed).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('Personal')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'Personal'
                    ? 'bg-neutral-200/70 text-neutral-900 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-200/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Personal</span>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {tasks.filter((t) => t.project === 'Personal' && !t.completed).length}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:block pt-3 border-t border-neutral-200/60 text-[11px] text-neutral-400 px-1">
          <p className="flex items-center gap-1 font-medium text-neutral-500">
            <Sparkles className="w-3 h-3 text-brand" />
            <span>Try natural language dates</span>
          </p>
        </div>
      </aside>

      {/* Main Task Area */}
      <main className="flex-1 p-4 sm:p-6 bg-white flex flex-col justify-between min-h-[360px]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-neutral-900 capitalize">
                {activeTab === 'today' ? 'Today' : activeTab === 'upcoming' ? 'Upcoming' : activeTab}
              </h3>
              <span className="text-xs text-neutral-400 font-normal">
                {format(new Date(), 'EEE MMM d')}
              </span>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {displayedTasks.filter((t) => !t.completed).length} pending
            </span>
          </div>

          {/* Task Stream */}
          <div className="space-y-1.5 mb-5 max-h-56 overflow-y-auto pr-1">
            <AnimatePresence>
              {displayedTasks.map((task) => {
                const pColor = priorityColors[task.priority] || priorityColors.p4;
                const friendlyDate = formatFriendlyDueDate(task.dueDate, task.dueTime);

                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`group flex items-center justify-between p-2 rounded-xl transition-all ${
                      task.completed ? 'opacity-50 bg-neutral-50/60' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox button */}
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                          task.completed
                            ? 'bg-neutral-400 border-neutral-400 text-white'
                            : `${pColor.border} hover:bg-neutral-100`
                        }`}
                        aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
                      >
                        {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="truncate">
                        <span
                          className={`text-sm text-neutral-800 transition-all ${
                            task.completed ? 'line-through text-neutral-400' : 'font-medium'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Metadata badges */}
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                          {friendlyDate && (
                            <span
                              className={`flex items-center gap-1 ${
                                friendlyDate.isOverdue ? 'text-red-500 font-semibold' : 'text-emerald-700'
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {friendlyDate.label}
                            </span>
                          )}

                          {task.recurrence && (
                            <span className="flex items-center gap-0.5 text-blue-600">
                              <Repeat className="w-2.5 h-2.5" />
                              {task.recurrence}
                            </span>
                          )}

                          {task.project && (
                            <span className="text-neutral-400 flex items-center gap-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                              {task.project}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Priority flag */}
                    {task.priority !== 'p4' && (
                      <Flag className={`w-3.5 h-3.5 flex-shrink-0 ${pColor.text}`} />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {displayedTasks.length === 0 && (
              <div className="text-center py-6 text-neutral-400 text-xs">
                🎉 All tasks completed! Add a new task below.
              </div>
            )}
          </div>
        </div>

        {/* Input Bar with NLP parsing preview */}
        <form onSubmit={handleAddTask} className="pt-2 border-t border-neutral-100">
          <div
            className={`border rounded-xl p-2.5 transition-all ${
              isInputExpanded ? 'border-brand/60 shadow-sm bg-neutral-50/50' : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!isInputExpanded) setIsInputExpanded(true);
              }}
              onFocus={() => setIsInputExpanded(true)}
              placeholder="e.g. Call client tomorrow 4pm p1 #Work (try typing dates!)"
              className="w-full text-xs sm:text-sm bg-transparent border-none outline-none text-neutral-800 placeholder:text-neutral-400"
            />

            {/* Live NLP Chip Previews */}
            {parsedPreview && (parsedPreview.dueDate || parsedPreview.priority !== 'p4' || parsedPreview.recurrence || parsedPreview.projectName) && (
              <motion.div
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-neutral-200/50 text-[11px]"
              >
                <span className="text-neutral-400 flex items-center gap-1 text-[10px] font-semibold uppercase">
                  <Sparkles className="w-3 h-3 text-brand" /> Detected:
                </span>

                {parsedPreview.dueDate && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1 border border-emerald-200/60">
                    <Calendar className="w-3 h-3" />
                    {formatFriendlyDueDate(parsedPreview.dueDate, parsedPreview.dueTime)?.label || parsedPreview.dueDate}
                  </span>
                )}

                {parsedPreview.priority && parsedPreview.priority !== 'p4' && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border ${
                      priorityColors[parsedPreview.priority]?.bg
                    } ${priorityColors[parsedPreview.priority]?.text}`}
                  >
                    <Flag className="w-3 h-3" />
                    {parsedPreview.priority.toUpperCase()}
                  </span>
                )}

                {parsedPreview.recurrence && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium flex items-center gap-1 border border-blue-200/60">
                    <Repeat className="w-3 h-3" />
                    {parsedPreview.recurrenceRule || parsedPreview.recurrence}
                  </span>
                )}

                {parsedPreview.projectName && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium flex items-center gap-1 border border-purple-200/60">
                    <Hash className="w-3 h-3" />
                    {parsedPreview.projectName}
                  </span>
                )}
              </motion.div>
            )}

            {/* Quick Priority & Submit Action Bar */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center gap-1">
                {['p1', 'p2', 'p3', 'p4'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPriority(p)}
                    className={`p-1 rounded hover:bg-neutral-200/50 transition-colors ${
                      selectedPriority === p ? 'ring-1 ring-neutral-400 bg-neutral-200/70' : ''
                    }`}
                    title={`Priority ${p.toUpperCase()}`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${priorityColors[p].text}`} />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputValue('');
                    setIsInputExpanded(false);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-3 py-1 bg-brand hover:bg-brand-hover text-white rounded-lg text-xs font-semibold disabled:opacity-40 shadow-sm transition-all"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
