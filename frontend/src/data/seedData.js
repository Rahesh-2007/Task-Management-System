export const INITIAL_MEMBERS = [
  {
    id: 'user_abbinav',
    name: 'Abbinav',
    email: 'abbinav@taskflow.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'owner',
    title: 'Workspace Owner',
  },
  {
    id: 'user_ravi',
    name: 'Ravi',
    email: 'ravi@taskflow.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    title: 'Developer',
  },
  {
    id: 'user_divya',
    name: 'Divya',
    email: 'divya@taskflow.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    title: 'Designer',
  },
];

export const INITIAL_WORKSPACES = [
  {
    id: 'ws_personal',
    name: 'My Workspace',
    type: 'personal',
    icon: 'user',
    color: '#E11D48',
    members: [],
  },
];

export const INITIAL_PROJECTS = [
  { id: 'proj_personal', workspaceId: 'ws_personal', name: 'Personal', color: '#EC4899', isShared: false, icon: 'home' },
  { id: 'proj_college', workspaceId: 'ws_personal', name: 'College', color: '#3B82F6', isShared: false, icon: 'college' },
  { id: 'proj_work', workspaceId: 'ws_personal', name: 'Work', color: '#F59E0B', isShared: false, icon: 'work' },
  { id: 'proj_hackathon', workspaceId: 'ws_personal', name: 'Hackathon', color: '#8B5CF6', isShared: false, icon: 'hackathon' },
  { id: 'proj_learning', workspaceId: 'ws_personal', name: 'Learning', color: '#10B981', isShared: false, icon: 'learning' },
];

export const INITIAL_SECTIONS = [];

export const INITIAL_TASKS = [
  // Overdue Tasks
  {
    id: 'task_1',
    projectId: 'proj_work',
    workspaceId: 'ws_personal',
    title: 'Complete DB schema for Task Manager',
    dueDate: '2026-09-28',
    priority: 'p1', // High
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['Work'],
  },
  {
    id: 'task_2',
    projectId: 'proj_college',
    workspaceId: 'ws_personal',
    title: 'Prepare presentation slides',
    dueDate: '2026-09-30',
    priority: 'p1', // High
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['College'],
  },
  // Due Today Tasks
  {
    id: 'task_3',
    projectId: 'proj_work',
    workspaceId: 'ws_personal',
    title: 'Fix login authentication bug',
    dueDate: '2026-10-04',
    priority: 'p2', // Medium
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['Work'],
  },
  {
    id: 'task_4',
    projectId: 'proj_personal',
    workspaceId: 'ws_personal',
    title: 'Design workspace UI',
    dueDate: '2026-10-04',
    priority: 'p1', // High
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['Personal'],
  },
  {
    id: 'task_5',
    projectId: 'proj_college',
    workspaceId: 'ws_personal',
    title: 'Write project report',
    dueDate: '2026-10-04',
    priority: 'p2', // Medium
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['College'],
  },
  {
    id: 'task_6',
    projectId: 'proj_learning',
    workspaceId: 'ws_personal',
    title: 'Practice DSA problems',
    dueDate: '2026-10-04',
    priority: 'p3', // Low
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['Learning'],
  },
  // Upcoming Tasks
  {
    id: 'task_7',
    projectId: 'proj_work',
    workspaceId: 'ws_personal',
    title: 'Deploy application to server',
    dueDate: '2026-10-06',
    priority: 'p2', // Medium
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['Work'],
  },
  {
    id: 'task_8',
    projectId: 'proj_college',
    workspaceId: 'ws_personal',
    title: 'Attend team meeting',
    dueDate: '2026-10-07',
    priority: 'p3', // Low
    completed: false,
    assigneeId: 'user_abbinav',
    labels: ['College'],
  },
  {
    id: 'task_9',
    projectId: 'proj_personal',
    workspaceId: 'ws_personal',
    title: 'Weekly grocery shopping',
    dueDate: '2026-10-08',
    priority: 'p3',
    completed: true,
    assigneeId: 'user_abbinav',
    labels: ['Personal'],
  },
  {
    id: 'task_10',
    projectId: 'proj_hackathon',
    workspaceId: 'ws_personal',
    title: 'Set up Vite React Tailwind template',
    dueDate: '2026-10-09',
    priority: 'p2',
    completed: true,
    assigneeId: 'user_abbinav',
    labels: ['Hackathon'],
  },
  {
    id: 'task_11',
    projectId: 'proj_learning',
    workspaceId: 'ws_personal',
    title: 'Review System Design microservices notes',
    dueDate: '2026-10-10',
    priority: 'p3',
    completed: true,
    assigneeId: 'user_abbinav',
    labels: ['Learning'],
  },
  {
    id: 'task_12',
    projectId: 'proj_work',
    workspaceId: 'ws_personal',
    title: 'Update project README documentation',
    dueDate: '2026-10-04',
    priority: 'p3',
    completed: true,
    assigneeId: 'user_abbinav',
    labels: ['Work'],
  },
];

export const INITIAL_ACTIVITIES = [
  {
    id: 'act_1',
    type: 'complete',
    userName: 'You',
    taskTitle: 'Update README file',
    timestamp: '2h ago',
  },
  {
    id: 'act_2',
    type: 'assigned',
    userName: 'Ravi',
    taskTitle: 'Prepare presentation slides',
    timestamp: '4h ago',
  },
  {
    id: 'act_3',
    type: 'project',
    userName: 'You',
    taskTitle: 'Hackathon',
    timestamp: '1d ago',
  },
  {
    id: 'act_4',
    type: 'comment',
    userName: 'Divya',
    taskTitle: 'Looks good! 👍',
    timestamp: '1d ago',
  },
];

