import React from 'react';
import BoardView from '../components/app/BoardView';
import { useWorkspace } from '../context/WorkspaceContext';

export default function BoardPage() {
  const { tasks } = useWorkspace();
  return (
    <div className="space-y-6 animate-fade-in">
      <BoardView tasks={tasks} />
    </div>
  );
}
