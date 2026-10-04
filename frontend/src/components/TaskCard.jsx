import React, { useState } from 'react';
import {
  GripVertical,
  Check,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  User,
  Clock
} from 'lucide-react';

export default function TaskCard({
  task,
  index,
  onToggleComplete,
  onEdit,
  onDelete,
  onPostpone,
  onSubtaskToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isKanban = false
}) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPostponeMenu, setShowPostponeMenu] = useState(false);

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const hasSubtasks = subtasks.length > 0;
  const subtaskProgress = hasSubtasks
    ? Math.round((completedSubtasks / subtasks.length) * 100)
    : 0;

  // Due date status
  let dateStatusClass = '';
  let formattedDate = task.dueDate;
  if (task.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    if (!task.completed) {
      if (task.dueDate < today) {
        dateStatusClass = 'overdue';
      } else if (task.dueDate === today) {
        dateStatusClass = 'due-today';
      }
    }
  }

  const handleDragOverLocal = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver?.(e, task, index);
  };

  const handleDragLeaveLocal = (e) => {
    setIsDragOver(false);
    onDragLeave?.(e, task, index);
  };

  const handleDropLocal = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop?.(e, task, index);
  };

  return (
    <div
      className={`task-card ${isDragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={(e) => onDragStart?.(e, task, index)}
      onDragEnd={(e) => {
        setIsDragOver(false);
        onDragEnd?.(e, task, index);
      }}
      onDragOver={handleDragOverLocal}
      onDragLeave={handleDragLeaveLocal}
      onDrop={handleDropLocal}
      style={{
        cursor: 'grab',
        opacity: task.isBeingDragged ? 0.35 : 1
      }}
      role="listitem"
    >
      {/* Drag Grip Handle */}
      <div
        className="drag-handle"
        title="Click and drag to reorder task"
      >
        <GripVertical size={16} />
      </div>

      {/* Complete Checkbox */}
      <div
        className={`custom-checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggleComplete(task.id)}
        role="checkbox"
        aria-checked={task.completed}
        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Check size={14} strokeWidth={3} />}
      </div>

      {/* Main Content Area */}
      <div className="task-body">
        <div className="task-title-row">
          <span className={`task-title ${task.completed ? 'completed' : ''}`}>
            {task.title}
          </span>

          <div className="task-actions" style={{ display: 'flex', gap: '4px', position: 'relative' }}>
            <button
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => setShowPostponeMenu(!showPostponeMenu)}
              title="Postpone task"
              aria-label="Postpone task"
            >
              <Clock size={13} />
            </button>
            {showPostponeMenu && (
              <div className="postpone-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 20,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-md)',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minWidth: '130px'
              }}>
                <button className="postpone-opt" style={{ border: 'none', background: 'none', textAlign: 'left', padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }} onClick={() => { onPostpone?.(task.id, 1); setShowPostponeMenu(false); }}>+1 Day (Tomorrow)</button>
                <button className="postpone-opt" style={{ border: 'none', background: 'none', textAlign: 'left', padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }} onClick={() => { onPostpone?.(task.id, 3); setShowPostponeMenu(false); }}>+3 Days</button>
                <button className="postpone-opt" style={{ border: 'none', background: 'none', textAlign: 'left', padding: '6px 10px', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }} onClick={() => { onPostpone?.(task.id, 7); setShowPostponeMenu(false); }}>+1 Week</button>
              </div>
            )}
            <button
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => onEdit(task)}
              title="Edit task"
              aria-label="Edit task"
            >
              <Edit3 size={13} />
            </button>
            <button
              className="btn-icon"
              style={{ width: '28px', height: '28px' }}
              onClick={() => onDelete(task.id)}
              title="Delete task"
              aria-label="Delete task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="task-desc">{task.description}</p>
        )}

        {/* Metadata row: Priority, Assignee, Category, Due Date, Subtasks */}
        <div className="task-meta-row">
          <span className={`pill pill-priority-${task.priority || 'medium'}`}>
            {task.priority || 'medium'}
          </span>

          {task.assignee && (
            <span className="assignee-chip" title={`Assigned to ${task.assignee.name}`}>
              <span className="assignee-avatar">
                {task.assignee.avatar || task.assignee.name?.[0] || 'U'}
              </span>
              <span>{task.assignee.name}</span>
            </span>
          )}

          {task.category && (
            <span className="pill pill-category">
              <Tag size={10} />
              {task.category}
            </span>
          )}

          {task.dueDate && (
            <span className={`pill-date ${dateStatusClass}`}>
              <Calendar size={12} />
              {formattedDate} {dateStatusClass === 'overdue' && '(Overdue)'}
              {dateStatusClass === 'due-today' && '(Due Today)'}
            </span>
          )}

          {hasSubtasks && (
            <button
              type="button"
              onClick={() => setShowSubtasks(!showSubtasks)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <CheckSquare size={12} />
              <span>{completedSubtasks}/{subtasks.length} subtasks</span>
              {showSubtasks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Subtask progress bar & expandable checklist */}
        {hasSubtasks && (
          <div className="subtasks-box">
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>

            {showSubtasks && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                {subtasks.map((st, sIdx) => (
                  <label
                    key={st.id || sIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      color: st.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(st.completed)}
                      onChange={() => onSubtaskToggle(task.id, sIdx)}
                    />
                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>
                      {st.text}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
