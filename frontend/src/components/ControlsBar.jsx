import React from 'react';
import { Search, Plus, List, LayoutGrid, X } from 'lucide-react';

export default function ControlsBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  viewMode,
  onViewModeChange,
  onOpenCreateModal
}) {
  return (
    <div className="controls-bar">
      <div className="controls-left">
        {/* Search input */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Tasks</option>
          <option value="active">Active Only</option>
          <option value="completed">Completed Only</option>
          <option value="overdue">Overdue Tasks</option>
        </select>

        {/* Priority Filter */}
        <select
          className="filter-select"
          value={priorityFilter}
          onChange={(e) => onPriorityFilterChange(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟠 High</option>
          <option value="medium">🔵 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        {/* Category Filter */}
        <select
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* View Switcher: List vs Kanban */}
        <div className="view-switcher" role="tablist">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            role="tab"
            aria-selected={viewMode === 'list'}
          >
            <List size={16} />
            <span>List</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => onViewModeChange('kanban')}
            role="tab"
            aria-selected={viewMode === 'kanban'}
          >
            <LayoutGrid size={16} />
            <span>Kanban</span>
          </button>
        </div>

        {/* Add Task Button */}
        <button
          className="btn btn-primary"
          onClick={onOpenCreateModal}
          title="Create task (Shortcut: Ctrl+N)"
        >
          <Plus size={16} />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
}
