import React from 'react';
import { CheckSquare, Volume2, VolumeX, Moon, Sun, RotateCcw, Database } from 'lucide-react';

export default function Header({
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  onResetTasks,
  isResetting
}) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <CheckSquare size={24} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-title">
            TaskFlow Pro
            <span className="badge-tech">React • Node • MySQL</span>
          </div>
          <div className="brand-subtitle">
            Dynamic Task Management & Drag-and-Drop System • {today}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'var(--accent-emerald)',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}
          title="Connected to local MySQL Server 8.0 on port 3306"
        >
          <Database size={13} />
          <span>MySQL Live</span>
        </div>

        <button
          className="btn-icon"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          aria-label="Toggle sound"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onResetTasks}
          disabled={isResetting}
          title="Reset tasks to initial sample dataset in MySQL"
          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
        >
          <RotateCcw size={14} className={isResetting ? 'spin' : ''} />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
}
