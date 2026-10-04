import React from 'react';
import { useParams } from 'react-router-dom';
import TasksView from '../components/TasksView';
import { useWorkspace } from '../context/WorkspaceContext';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { projects } = useWorkspace();

  const currentProject = projects.find(p => String(p.id) === String(projectId));
  const title = currentProject ? currentProject.name : 'Project Tasks';

  return (
    <TasksView 
      title={title} 
      filterType="project"
      filterId={projectId}
      projectColor={currentProject?.color}
    />
  );
}
