import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { createLabelApi } from '../api/resourceApis';
import TasksView from '../components/TasksView';
import { Tag, Plus, Trash2, Edit3, X, Check } from 'lucide-react';

export default function LabelsPage() {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [labels, setLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366F1');
  const [showCreate, setShowCreate] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);

  const labelApi = createLabelApi(user?.id);

  const fetchLabels = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await labelApi.getLabels(currentWorkspace.id);
      if (res.success) {
        setLabels(res.data);
      }
    } catch (err) {
      console.error('Error fetching labels:', err);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, [currentWorkspace]);

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim() || !currentWorkspace) return;

    try {
      const res = await labelApi.createLabel({
        workspace_id: currentWorkspace.id,
        name: newLabelName.trim(),
        color: newLabelColor,
      });

      if (res.success) {
        setNewLabelName('');
        setShowCreate(false);
        fetchLabels();
      }
    } catch (err) {
      console.error('Error creating label:', err);
    }
  };

  const handleDeleteLabel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this label?')) return;
    try {
      await labelApi.deleteLabel(id);
      if (selectedLabel?.id === id) setSelectedLabel(null);
      fetchLabels();
    } catch (err) {
      console.error('Error deleting label:', err);
    }
  };

  const PRESET_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#64748B'];

  return (
    <div className="labels-page-container">
      <div className="labels-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Tag size={24} style={{ color: 'var(--primary-color)' }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Labels</h1>
        </div>
        <button 
          className="primary-btn" 
          onClick={() => setShowCreate(!showCreate)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Add Label
        </button>
      </div>

      {showCreate && (
        <form className="label-form-card" onSubmit={handleCreateLabel} style={{
          background: 'var(--card-bg, #ffffff)',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Label name..."
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            style={{
              flex: 1,
              minWidth: '180px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--input-bg)'
            }}
            required
          />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {PRESET_COLORS.map(color => (
              <div
                key={color}
                onClick={() => setNewLabelColor(color)}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: newLabelColor === color ? '2px solid var(--text-color)' : '2px solid transparent',
                  transform: newLabelColor === color ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
          <button type="submit" className="primary-btn">Save</button>
          <button type="button" className="secondary-btn" onClick={() => setShowCreate(false)}>Cancel</button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          onClick={() => setSelectedLabel(null)}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: !selectedLabel ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
            background: !selectedLabel ? 'var(--primary-light, rgba(99,102,241,0.1))' : 'var(--card-bg)',
            color: !selectedLabel ? 'var(--primary-color)' : 'var(--text-color)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          All Tasks
        </button>

        {labels.map(l => (
          <div
            key={l.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: selectedLabel?.id === l.id ? `2px solid ${l.color}` : '1px solid var(--border-color)',
              background: selectedLabel?.id === l.id ? `${l.color}22` : 'var(--card-bg)',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedLabel(l)}
          >
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: l.color
            }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{l.name}</span>
            {l.task_count > 0 && (
              <span style={{ fontSize: '0.75rem', opacity: 0.6, background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '10px' }}>
                {l.task_count}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLabel(l.id);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: '2px', display: 'flex' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <TasksView
        title={selectedLabel ? `Label: ${selectedLabel.name}` : 'All Labeled Tasks'}
        filterType={selectedLabel ? 'label' : 'all'}
        filterId={selectedLabel?.id}
      />
    </div>
  );
}
