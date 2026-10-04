import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Calendar, AlertCircle, User } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export default function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false
}) {
  const { members } = useWorkspace();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [category, setCategory] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [repeatDays, setRepeatDays] = useState(1);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setPriority(initialData.priority || 'medium');
        setStatus(initialData.status || (initialData.completed ? 'completed' : 'todo'));
        setCategory(initialData.category || 'General');
        setDueDate(initialData.dueDate || '');
        setAssigneeId(initialData.assigneeId || initialData.assignee?.id || '');
        setSubtasks(initialData.subtasks ? [...initialData.subtasks] : []);
        setRepeatDays(1);
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setStatus('todo');
        setCategory('General');
        setDueDate('');
        setAssigneeId('');
        setSubtasks([]);
        setRepeatDays(1);
      }
      setNewSubtaskText('');
      setErrors({});

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Task title is required.';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters.';
    } else if (title.trim().length > 120) {
      newErrors.title = 'Title cannot exceed 120 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSubtask = (e) => {
    e?.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newItem = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newSubtaskText.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newItem]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    let finalSubtasks = [...subtasks];
    if (newSubtaskText.trim()) {
      finalSubtasks.push({
        id: `st-${Date.now()}`,
        text: newSubtaskText.trim(),
        completed: false
      });
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      completed: status === 'completed',
      category: category.trim() || 'General',
      dueDate: dueDate || null,
      assigneeId: assigneeId ? parseInt(assigneeId, 10) : null,
      subtasks: finalSubtasks,
      repeatDays: !initialData ? repeatDays : 1
    };

    onSubmit(payload);
  };

  const setQuickDate = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {initialData ? 'Edit Task Details' : 'Create New Task'}
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">
                Task Title <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                id="task-title"
                ref={titleInputRef}
                type="text"
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="e.g. Prepare client proposal"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: null });
                }}
                maxLength={120}
              />
              {errors.title && (
                <div className="form-error-hint">
                  <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {errors.title}
                </div>
              )}
            </div>

            {/* Description Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-description">
                Description (Optional)
              </label>
              <textarea
                id="task-description"
                className="form-textarea"
                rows={3}
                placeholder="Add details, instructions, or notes for your worker..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Priority & Status Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Category & Due Date Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-category">Category / Tag</label>
                <input
                  id="task-category"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Personal, Design, Dev"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-duedate">Due Date</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    id="task-duedate"
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  {dueDate && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => setDueDate('')}
                      title="Clear date"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setQuickDate(0)}>Today</button>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setQuickDate(1)}>Tomorrow</button>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-indigo)', fontSize: '0.75rem', cursor: 'pointer' }} onClick={() => setQuickDate(7)}>In 1 Week</button>
                </div>
              </div>
            </div>

            {/* Repeat for Consecutive Days (Personal / Routine Tasks) */}
            {!initialData && (
              <div className="form-group">
                <label className="form-label" htmlFor="task-repeat-days">
                  Repeat / Upload Task for Required Number of Days
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    id="task-repeat-days"
                    type="number"
                    min="1"
                    max="30"
                    className="form-input"
                    value={repeatDays}
                    onChange={(e) => setRepeatDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    style={{ width: '100px' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {repeatDays === 1 ? 'Single task' : `Creates ${repeatDays} consecutive daily tasks`}
                  </span>
                </div>
              </div>
            )}

            {/* Assignee Field (Worker / Team Member) */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-assignee">Assign to Worker / Team Member</label>
              <select
                id="task-assignee"
                className="form-select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">👤 Unassigned (Personal / Anyone)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    👤 {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Subtasks Section */}
            <div className="subtasks-form-section">
              <label className="form-label">Subtasks Checklist</label>
              {subtasks.map((st, idx) => (
                <div key={st.id || idx} className="subtask-item-input">
                  <span style={{ fontSize: '0.85rem', flex: 1, color: 'var(--text-primary)' }}>{st.text}</span>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ width: 24, height: 24 }}
                    onClick={() => handleRemoveSubtask(idx)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Add a step or subtask..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  style={{ flex: 1, fontSize: '0.85rem', padding: '6px 12px' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddSubtask}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <Plus size={14} /> Add Step
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
