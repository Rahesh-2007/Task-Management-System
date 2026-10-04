import React from 'react';
import TasksView from '../components/TasksView';

export default function InboxPage() {
  return (
    <TasksView 
      pageTitle="Inbox" 
      taskParams={{ is_inbox: true }} 
      emptyMessage="Your inbox is clear!"
      emptySubMessage="Tasks created here are added to your active workspace. Click + Add Task or press Ctrl+N to add one."
    />
  );
}
