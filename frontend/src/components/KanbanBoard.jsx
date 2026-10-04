import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To Do', dotClass: 'dot-todo' },
  { id: 'in_progress', title: 'In Progress', dotClass: 'dot-in-progress' },
  { id: 'completed', title: 'Completed', dotClass: 'dot-completed' }
];

export default function KanbanBoard({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onSubtaskToggle,
  onReorderTasks,
  onOpenCreateModal,
  onPlayDropSound
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedItem(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleColumnDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleColumnDragLeave = (e, colId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverColumn === colId) {
      setDragOverColumn(null);
    }
  };

  const handleDropOnColumn = (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedItem) return;

    const sourceTaskId = draggedItem.id;
    const isCompleted = targetStatus === 'completed';

    // Find the moved task and compute updated list
    const updatedTasks = tasks.map((t) => {
      if (t.id === sourceTaskId) {
        return {
          ...t,
          status: targetStatus,
          completed: isCompleted
        };
      }
      return t;
    });

    onPlayDropSound?.();
    onReorderTasks(updatedTasks);
    setDraggedItem(null);
  };

  const handleDropOnCardInColumn = (e, targetTask, targetIndex, columnTasks) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    if (!draggedItem) return;

    const sourceTaskId = draggedItem.id;
    const targetStatus = targetTask.status;
    const isCompleted = targetStatus === 'completed';

    // Reorder within tasks array
    let updatedTasks = tasks.map((t) => {
      if (t.id === sourceTaskId) {
        return { ...t, status: targetStatus, completed: isCompleted };
      }
      return t;
    });

    // Re-index orders based on new column positions
    const movingTask = updatedTasks.find((t) => t.id === sourceTaskId);
    const otherTasks = updatedTasks.filter((t) => t.id !== sourceTaskId);

    // Find target index in global array
    const targetGlobalIndex = otherTasks.findIndex((t) => t.id === targetTask.id);
    if (targetGlobalIndex !== -1) {
      otherTasks.splice(targetGlobalIndex, 0, movingTask);
    } else {
      otherTasks.push(movingTask);
    }

    const reorderedFinal = otherTasks.map((t, idx) => ({
      ...t,
      order: idx
    }));

    onPlayDropSound?.();
    onReorderTasks(reorderedFinal);
    setDraggedItem(null);
  };

  return (
    <div className="kanban-grid">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => {
          if (col.id === 'completed') return t.completed || t.status === 'completed';
          if (col.id === 'in_progress') return !t.completed && t.status === 'in_progress';
          return !t.completed && (t.status === 'todo' || !t.status);
        });

        const isOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            className={`kanban-column ${isOver ? 'column-drag-over' : ''}`}
            onDragOver={(e) => handleColumnDragOver(e, col.id)}
            onDragLeave={(e) => handleColumnDragLeave(e, col.id)}
            onDrop={(e) => handleDropOnColumn(e, col.id)}
          >
            {/* Column Header */}
            <div className="kanban-column-header">
              <div className="column-title-group">
                <span className={`column-dot ${col.dotClass}`} />
                <span className="column-title">{col.title}</span>
              </div>
              <span className="column-count">{columnTasks.length}</span>
            </div>

            {/* Column Cards */}
            <div className="kanban-cards-wrapper">
              {columnTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={{
                    ...task,
                    isBeingDragged: draggedItem?.id === task.id
                  }}
                  index={index}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSubtaskToggle={onSubtaskToggle}
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDropOnCardInColumn(e, task, index, columnTasks)}
                  isKanban={true}
                />
              ))}

              {columnTasks.length === 0 && (
                <div
                  style={{
                    padding: '30px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>Drag tasks here</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
