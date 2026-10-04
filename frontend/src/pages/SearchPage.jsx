import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TasksView from '../components/TasksView';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setActiveQuery(q);
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    setActiveQuery(query);
  };

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--card-bg, #fff)',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          maxWidth: '500px'
        }}>
          <Search size={20} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search tasks by title, description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              background: 'transparent',
              fontSize: '1rem',
              color: 'var(--text-color)'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setActiveQuery(''); setSearchParams({}); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              ×
            </button>
          )}
        </div>
      </form>

      <TasksView
        title={activeQuery ? `Search results for "${activeQuery}"` : 'Search Tasks'}
        filterType="search"
        searchQuery={activeQuery}
      />
    </div>
  );
}
