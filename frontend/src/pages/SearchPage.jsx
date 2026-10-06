import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import ListView from '../components/app/ListView';
import { Search, X } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { tasks = [] } = useWorkspace();

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    } else {
      setSearchParams({});
    }
  };

  const filteredTasks = useMemo(() => {
    if (!query.trim()) return tasks;
    const q = query.toLowerCase();
    return tasks.filter((t) => {
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchLabels = Array.isArray(t.labels) && t.labels.some((l) => (typeof l === 'object' ? l.name : l).toLowerCase().includes(q));
      return matchTitle || matchDesc || matchLabels;
    });
  }, [tasks, query]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Search Workspace</h1>
        <p className="mt-1 text-xs text-neutral-500">Find any task, description, or tag across your workspace</p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) setSearchParams({});
            else setSearchParams({ q: e.target.value });
          }}
          placeholder="Type to search tasks..."
          className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl bg-white border border-neutral-200 shadow-sm outline-none focus:border-[#E11D48] text-neutral-900 placeholder:text-neutral-400"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSearchParams({});
            }}
            className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Results */}
      <div>
        <div className="text-xs font-semibold text-neutral-500 mb-3">
          {query.trim()
            ? `Found ${filteredTasks.length} ${filteredTasks.length === 1 ? 'result' : 'results'} for "${query}"`
            : 'All workspace tasks'}
        </div>
        <ListView tasks={filteredTasks} />
      </div>
    </div>
  );
}
