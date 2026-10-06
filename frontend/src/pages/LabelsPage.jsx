import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import ListView from '../components/app/ListView';
import { Tag, Plus, Trash2, Check, Sparkles } from 'lucide-react';

export default function LabelsPage() {
  const { labelId } = useParams();
  const { labels = [], tasks = [], addLabel } = useWorkspace();

  const [selectedLabelId, setSelectedLabelId] = useState(labelId || null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#E11D48');
  const [showCreate, setShowCreate] = useState(false);

  const PRESET_COLORS = ['#E11D48', '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#64748B'];

  const filteredTasks = useMemo(() => {
    if (!selectedLabelId) return tasks;
    return tasks.filter((t) => {
      if (!Array.isArray(t.labels)) return false;
      return t.labels.some((l) => (typeof l === 'object' ? String(l.id) === String(selectedLabelId) : String(l) === String(selectedLabelId)));
    });
  }, [tasks, selectedLabelId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    await addLabel(newLabelName.trim(), newLabelColor);
    setNewLabelName('');
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#E11D48]" />
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Labels</h1>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Categorize, tag, and filter tasks across projects</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E11D48] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#BE123C] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Label</span>
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-wrap items-center gap-3">
          <input
            type="text"
            required
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Label name..."
            className="flex-1 min-w-[200px] text-xs p-2 rounded-xl border border-neutral-300 outline-none focus:border-[#E11D48]"
            autoFocus
          />

          <div className="flex items-center gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewLabelColor(c)}
                className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                  newLabelColor === c ? 'scale-120 ring-2 ring-neutral-900' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-xl shadow-sm cursor-pointer"
          >
            Create Label
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Label Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedLabelId(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            !selectedLabelId
              ? 'bg-[#E11D48] text-white shadow-xs'
              : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          All Tasks
        </button>

        {labels.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setSelectedLabelId(l.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              selectedLabelId === l.id
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
            <span>{l.name}</span>
          </button>
        ))}
      </div>

      <ListView tasks={filteredTasks} />
    </div>
  );
}
