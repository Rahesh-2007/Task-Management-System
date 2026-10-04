import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { Inbox, Plus } from 'lucide-react';

export default function TaskList({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onPostpone,
  onSubtaskToggle,
  onReorderTasks,
  onOpenCreateModal,
  onPlayDropSound
}) {
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (e, task, index) => {
    setDraggedItem({ task, index });
    e.dataTransfer.effectAllowed = 'move';
    // Transparent or ghost image
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: task.id, index }));
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDropOnTask = (e, targetTask, targetIndex) => {
    e.preventDefault();
    if (!draggedItem) return;
    const sourceIndex = draggedItem.index;
    if (sourceIndex === targetIndex) return;

    // Create a reordered copy of the task array
    const reordered = [...tasks];
    const [movedItem] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Update order indices
    const updatedWithOrder = reordered.map((t, idx) => ({
      ...t,
      order: idx
    }));

    onPlayDropSound?.();
    onReorderTasks(updatedWithOrder);
    setDraggedItem(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon-box">
          <Inbox size={28} />
        </div>
        <div className="empty-title">No tasks found</div>
        <div className="empty-subtitle">
          There are no tasks matching your current filters. Create a new task or adjust your filters.
        </div>
        <button
          className="btn btn-primary"
          onClick={onOpenCreateModal}
          style={{ marginTop: '12px' }}
        >
          <Plus size={16} />
          <span>Create New Task</span>
        </button>
      </div>
    );
  }

  return (
    <div className="task-list-container" role="list">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={{
            ...task,
            isBeingDragged: draggedItem?.task?.id === task.id
          }}
          index={index}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          onPostpone={onPostpone}
          onSubtaskToggle={onSubtaskToggle}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDropOnTask}
        />
      ))}
    </div>
  );
}
