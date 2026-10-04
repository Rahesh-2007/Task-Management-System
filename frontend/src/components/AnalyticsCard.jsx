import React from 'react';
import { Layers, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AnalyticsCard({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const inProgress = tasks.filter((t) => !t.completed && t.status === 'in_progress').length;
  const todo = tasks.filter((t) => !t.completed && t.status === 'todo').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdue = tasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate < todayStr
  ).length;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // SVG Radial Circle calculations
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="analytics-grid">
      {/* Radial Progress Ring Card */}
      <div className="analytics-card-ring">
        <div className="ring-wrapper">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="transparent"
              stroke="var(--border-subtle)"
              strokeWidth="7"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="transparent"
              stroke="url(#gradient-ring)"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <defs>
              <linearGradient id="gradient-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-blue)" />
                <stop offset="100%" stopColor="var(--accent-emerald)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="ring-text">
            <div className="ring-percentage">{percentage}%</div>
            <div className="ring-label">Done</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Sprint Velocity
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {completed} of {total} tasks achieved
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: percentage === 100 ? 'var(--accent-emerald)' : 'var(--accent-blue)',
              fontWeight: 600,
              marginTop: '6px'
            }}
          >
            {percentage === 100 ? '🎉 All tasks finished!' : `${total - completed} pending action`}
          </div>
        </div>
      </div>

      {/* 4 Metric Boxes */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-header">
            <span>Total Tasks</span>
            <div className="metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-blue)' }}>
              <Layers size={16} />
            </div>
          </div>
          <div className="metric-value">{total}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>In Progress</span>
            <div className="metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="metric-value">{inProgress + todo}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Completed</span>
            <div className="metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="metric-value">{completed}</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span>Overdue</span>
            <div
              className="metric-icon-box"
              style={{
                background: overdue > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                color: overdue > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'
              }}
            >
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: overdue > 0 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {overdue}
          </div>
        </div>
      </div>
    </div>
  );
}
