import React from 'react';
import TasksView from '../components/TasksView';

export default function TodayPage() {
  return (
    <TasksView 
      pageTitle="Today" 
      taskParams={{ due_filter: 'today' }} 
      emptyMessage="No tasks scheduled for today"
      emptySubMessage="You're all caught up for today! Add a new task or enjoy your free time."
    />
  );
}
