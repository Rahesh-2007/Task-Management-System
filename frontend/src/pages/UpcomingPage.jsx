import React from 'react';
import TasksView from '../components/TasksView';

export default function UpcomingPage() {
  return (
    <TasksView 
      pageTitle="Upcoming" 
      taskParams={{ due_filter: 'upcoming' }} 
      emptyMessage="No upcoming tasks scheduled"
      emptySubMessage="Plan ahead by setting due dates on your tasks."
    />
  );
}
