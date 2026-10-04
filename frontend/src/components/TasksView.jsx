import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { taskApi } from '../api/taskApi';
import { sounds } from './AudioEffects';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import TaskList from './TaskList';
import KanbanBoard from './KanbanBoard';
import ControlsBar from './ControlsBar';
import TaskFormModal from './TaskFormModal';
import AnalyticsCard from './AnalyticsCard';

/**
 * Reusable task view component embedded in pages (Inbox, Today, Upcoming, Project, etc.).
 */
export default function TasksView({
  taskParams = {},
  showAnalytics = false,
  showControls = true,
  showViewSwitcher = true,
  pageTitle,
  emptyMessage = 'No tasks found.',
  emptySubMessage = '',
  onTasksLoaded,
  addToast,
}) {
  const { user } = useAuth();
  const { currentWorkspace, loadProjects } = useWorkspace();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('taskflow_view') || 'list');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mergedParams = { ...taskParams };
      if (currentWorkspace?.id && !mergedParams.workspace_id) {
        mergedParams.workspace_id = currentWorkspace.id;
      }
      const data = await taskApi.getAllTasks(mergedParams);
      setTasks(data);
      onTasksLoaded?.(data);
    } catch (err) {
      setError('Failed to load tasks. Is the backend running?');
      addToast?.('Error fetching tasks from database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(taskParams), currentWorkspace?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Keyboard shortcut (Ctrl+N or Cmd+N)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setEditingTask(null);
        setIsModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('taskflow_view', viewMode);
  }, [viewMode]);

  const categories = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => { if (t.category) set.add(t.category); });
    return Array.from(set);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(task => {
      if (query) {
        const m = task.title?.toLowerCase().includes(query) ||
                  task.description?.toLowerCase().includes(query) ||
                  task.category?.toLowerCase().includes(query);
        if (!m) return false;
      }
      if (statusFilter === 'active' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'overdue') {
        if (task.completed || !task.dueDate || task.dueDate >= todayStr) return false;
      }
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const handleToggleComplete = async (taskId) => {
    const previousTasks = [...tasks];
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const isNowCompleted = !target.completed;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: isNowCompleted, status: isNowCompleted ? 'completed' : 'todo' } : t));
    if (isNowCompleted) { sounds.playCheck(); }
    try {
      await taskApi.toggleComplete(taskId);
    } catch (err) {
      setTasks(previousTasks);
      addToast?.('Failed to update task', 'error');
    }
  };

  const handleSubtaskToggle = async (taskId, subtaskIndex) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target?.subtasks) return;
    const updated = [...target.subtasks];
    updated[subtaskIndex] = { ...updated[subtaskIndex], completed: !updated[subtaskIndex].completed };
    setTasks(tasks.map(t => t.id === taskId ? { ...t, subtasks: updated } : t));
    await taskApi.updateTask(taskId, { subtasks: updated });
  };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (currentWorkspace) payload.workspaceId = currentWorkspace.id;
      if (taskParams.is_inbox) payload.isInbox = true;
      if (taskParams.project_id) payload.projectId = taskParams.project_id;

      if (editingTask) {
        delete payload.repeatDays;
        const updated = await taskApi.updateTask(editingTask.id, payload);
        setTasks(tasks.map(t => t.id === editingTask.id ? updated : t));
        addToast?.(`Task "${updated.title}" updated`, 'success');
      } else {
        const repeatCount = payload.repeatDays || 1;
        delete payload.repeatDays;

        if (repeatCount > 1) {
          const createdList = [];
          const startDate = payload.dueDate ? new Date(payload.dueDate) : new Date();
          for (let i = 0; i < repeatCount; i++) {
            const currentD = new Date(startDate);
            currentD.setDate(currentD.getDate() + i);
            const singlePayload = { ...payload, dueDate: currentD.toISOString().split('T')[0] };
            const created = await taskApi.createTask(singlePayload);
            createdList.push(created);
          }
          setTasks([...tasks, ...createdList]);
          addToast?.(`Created ${createdList.length} consecutive daily tasks`, 'success');
        } else {
          const created = await taskApi.createTask(payload);
          setTasks([...tasks, created]);
          addToast?.(`Task "${created.title}" created`, 'success');
        }
        if (taskParams.project_id) loadProjects();
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      addToast?.(err.message || 'Failed to save task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostponeTask = async (taskId, days) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const baseDate = target.dueDate ? new Date(target.dueDate) : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    const newDueDate = baseDate.toISOString().split('T')[0];

    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, dueDate: newDueDate } : t));
    try {
      await taskApi.updateTask(taskId, { dueDate: newDueDate });
      addToast?.(`Postponed task by ${days} day(s)`, 'info');
    } catch (err) {
      setTasks(previousTasks);
      addToast?.('Failed to postpone task', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== taskId));
    sounds.playTrash();

    try {
      await taskApi.deleteTask(taskId);
      addToast?.(`Deleted "${taskToDelete?.title || 'task'}"`, 'info');
    } catch (err) {
      setTasks(previousTasks);
      addToast?.('Failed to delete task', 'error');
    }
  };

  const handleReorderTasks = async (newOrderedTasks) => {
    setTasks(newOrderedTasks);
    const payload = newOrderedTasks.map((t, idx) => ({ id: t.id, order: idx }));
    try {
      await taskApi.reorderTasks(payload);
    } catch (_) {}
  };

  const handleResetTasks = async () => {
    setIsResetting(true);
    try {
      const res = await taskApi.resetTasks();
      setTasks(res);
      addToast?.('Sample tasks reloaded', 'success');
    } catch (_) {
      addToast?.('Failed to reset tasks', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="empty-state" style={{ padding: '60px 20px' }}>
        <div className="empty-title">Loading your tasks...</div>
        <div className="empty-subtitle">Retrieving data from workspace</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ borderColor: 'var(--accent-rose)' }}>
        <div className="empty-title" style={{ color: 'var(--accent-rose)' }}>Error Loading Tasks</div>
        <div className="empty-subtitle">{error}</div>
        <button className="btn btn-secondary" onClick={loadTasks} style={{ marginTop: 12 }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="tasks-view">
      {showAnalytics && <AnalyticsCard tasks={tasks} />}

      {showControls && (
        <ControlsBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          viewMode={viewMode}
          onViewModeChange={showViewSwitcher ? setViewMode : undefined}
          onOpenCreateModal={() => { setEditingTask(null); setIsModalOpen(true); }}
          onResetTasks={handleResetTasks}
          isResetting={isResetting}
        />
      )}

      {viewMode === 'list' ? (
        <TaskList
          tasks={filteredTasks}
          onToggleComplete={handleToggleComplete}
          onEdit={t => { setEditingTask(t); setIsModalOpen(true); }}
          onDelete={handleDeleteTask}
          onPostpone={handlePostponeTask}
          onSubtaskToggle={handleSubtaskToggle}
          onReorderTasks={handleReorderTasks}
          onOpenCreateModal={() => { setEditingTask(null); setIsModalOpen(true); }}
          onPlayDropSound={() => sounds.playDrop()}
          emptyMessage={emptyMessage}
          emptySubMessage={emptySubMessage}
        />
      ) : (
        <KanbanBoard
          tasks={filteredTasks}
          onToggleComplete={handleToggleComplete}
          onEdit={t => { setEditingTask(t); setIsModalOpen(true); }}
          onDelete={handleDeleteTask}
          onSubtaskToggle={handleSubtaskToggle}
          onReorderTasks={handleReorderTasks}
          onOpenCreateModal={() => { setEditingTask(null); setIsModalOpen(true); }}
          onPlayDropSound={() => sounds.playDrop()}
        />
      )}

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
