import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_MEMBERS,
  INITIAL_WORKSPACES,
  INITIAL_PROJECTS,
  INITIAL_SECTIONS,
  INITIAL_TASKS,
  INITIAL_ACTIVITIES,
} from '../data/seedData';
import { parseTaskInput, computeNextRecurrenceDate } from '../utils/nlpParser';
import { bulkRescheduleOverdue, rescheduleTask } from '../utils/rescheduleLogic';
import { format } from 'date-fns';
import { authApi } from '../api/authApi';
import { createWorkspaceApi } from '../api/workspaceApi';

const WorkspaceContext = createContext(null);

const STORAGE_KEYS = {
  AUTH_USER: 'taskflow_auth_user',
  REGISTERED_USERS: 'taskflow_registered_users',
  WORKSPACES: 'todoist_clone_workspaces',
  CURRENT_WORKSPACE: 'todoist_clone_active_ws',
  PROJECTS: 'todoist_clone_projects',
  SECTIONS: 'todoist_clone_sections',
  TASKS: 'todoist_clone_tasks',
  ACTIVITIES: 'todoist_clone_activities',
  MEMBERS: 'todoist_clone_members',
  INVITATIONS: 'taskflow_workspace_invitations',
};

// Seed default accounts
const DEFAULT_REGISTERED_USERS = [
  {
    id: 'user_rakesh',
    name: 'Rakesh',
    email: 'rakesh27870@gmail.com',
    username: 'rakesh27870',
    password: '123456',
    avatar: 'https://ui-avatars.com/api/?name=Rakesh&background=E11D48&color=fff',
    role: 'owner',
    title: 'Workspace Owner',
    color: '#E11D48',
  },
  {
    id: 'user_staff123',
    name: 'Staff Member',
    email: 'staff123@taskflow.io',
    username: 'staff123',
    password: 'password123',
    avatar: 'https://ui-avatars.com/api/?name=Staff&background=E11D48&color=fff',
    role: 'member',
    title: 'Operations Member',
    color: '#E11D48',
  },
];

export function WorkspaceProvider({ children }) {
  // Registered User Accounts DB (persisted in localStorage)
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    return saved ? JSON.parse(saved) : DEFAULT_REGISTERED_USERS;
  });

  // Current Logged-in Auth User
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return saved ? JSON.parse(saved) : null;
  });

  // Workspaces
  const [workspaces, setWorkspaces] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WORKSPACES);
    if (!saved) return INITIAL_WORKSPACES;
    try {
      const parsed = JSON.parse(saved);
      const cleaned = parsed.filter(w => w.id !== 'ws_team');
      return cleaned.length > 0 ? cleaned : INITIAL_WORKSPACES;
    } catch {
      return INITIAL_WORKSPACES;
    }
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE);
    return (saved && saved !== 'ws_team') ? saved : 'ws_personal';
  });

  const activeWs = workspaces.find((w) => String(w.id) === String(activeWorkspaceId)) || workspaces[0];

  const currentUser = authUser || {
    id: 'user_me',
    name: 'My Account',
    email: '',
    role: 'owner',
    title: 'Workspace Owner',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };

  // Workspace Invitations & Join Requests
  const [invitations, setInvitations] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamically resolve members belonging to the active workspace (ONLY OWNER + ACCEPTED MEMBERS)
  const members = React.useMemo(() => {
    const owner = authUser || currentUser;
    const list = [{ ...owner, role: 'owner', isOwner: true, status: 'active' }];

    if (activeWs) {
      // Check invitations for this workspace where status is explicitly 'accepted'
      const wsInvites = (invitations || []).filter(
        (inv) => String(inv.workspaceId) === String(activeWs.id) && inv.status === 'accepted'
      );

      for (const inv of wsInvites) {
        const cleanEmail = String(inv.email).toLowerCase().trim();
        if (!cleanEmail || cleanEmail === owner.email?.toLowerCase().trim()) continue;

        const reg = registeredUsers.find((u) => u.email?.toLowerCase().trim() === cleanEmail);
        const memberData = {
          id: reg ? reg.id : (inv.requesterId || `member_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`),
          name: reg ? reg.name : (inv.requesterName || cleanEmail.split('@')[0]),
          email: cleanEmail,
          role: 'member',
          avatar: reg ? reg.avatar : (inv.requesterAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanEmail.split('@')[0])}&background=E11D48&color=fff`),
          status: 'active',
          type: inv.type,
          invitationId: inv.id,
          isOwner: false,
        };

        if (!list.some((m) => m.email.toLowerCase() === cleanEmail)) {
          list.push(memberData);
        }
      }
    }
    return list;
  }, [activeWs, authUser, currentUser, registeredUsers, invitations]);

  // Projects
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!saved) return INITIAL_PROJECTS;
    try {
      const parsed = JSON.parse(saved);
      const cleaned = parsed.filter(p => !['proj_q4_launch', 'proj_brand_redesign', 'proj_growth'].includes(p.id));
      return cleaned.length > 0 ? cleaned : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  // Sections
  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SECTIONS);
    if (!saved) return INITIAL_SECTIONS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.filter(s => !s.id.startsWith('sec_q4_') && !s.id.startsWith('sec_brand_') && !s.id.startsWith('sec_growth_'));
    } catch {
      return INITIAL_SECTIONS;
    }
  });

  // Tasks
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!saved) return INITIAL_TASKS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.filter(t => !['task_1', 'task_2', 'task_3', 'task_4', 'task_5', 'task_6', 'task_7'].includes(t.id));
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Activities
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    if (!saved) return INITIAL_ACTIVITIES;
    try {
      const parsed = JSON.parse(saved);
      return parsed.filter(a => !['act_1', 'act_2', 'act_3'].includes(a.id));
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  // Navigation & View Filters
  const [activeFilter, setActiveFilter] = useState('today');
  const [activeView, setActiveView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Modals & Drawers
  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    }
  }, [authUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(workspaces));
    localStorage.setItem(STORAGE_KEYS.CURRENT_WORKSPACE, activeWorkspaceId);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
  }, [workspaces, activeWorkspaceId, projects, sections, tasks, activities, members, invitations]);

  // Database-Backed Authentication: Login
  const login = async (emailOrUsername, password) => {
    const query = emailOrUsername.trim();
    
    // 1. Try MySQL backend API first
    try {
      const data = await authApi.login(query, password);
      if (data && data.user) {
        const loggedUser = {
          ...data.user,
          username: data.user.email.split('@')[0],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=E11D48&color=fff`,
          password,
        };
        setAuthUser(loggedUser);
        if (data.workspaces && data.workspaces.length > 0) {
          setWorkspaces(data.workspaces);
          setActiveWorkspaceId(data.workspaces[0].id);
        }
        setRegisteredUsers((prev) => {
          const exists = prev.find((u) => u.email.toLowerCase() === loggedUser.email.toLowerCase());
          return exists
            ? prev.map((u) => (u.email.toLowerCase() === loggedUser.email.toLowerCase() ? { ...u, ...loggedUser } : u))
            : [...prev, loggedUser];
        });
        return { success: true, user: loggedUser };
      }
    } catch (apiErr) {
      console.warn('Backend DB auth error, checking local store:', apiErr.message);
      if (apiErr.message && !apiErr.message.includes('fetch') && !apiErr.message.includes('Failed to fetch')) {
        // If it's a real password/user error from DB, check local fallback first before showing error
      }
    }

    // 2. Fallback to Local DB
    const qLower = query.toLowerCase();
    const foundUser = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === qLower ||
        (u.username && u.username.toLowerCase() === qLower)
    );

    if (!foundUser) {
      return {
        success: false,
        message: 'No account found with this email or username. Please sign up.',
      };
    }

    // Check password
    if (foundUser.password !== password) {
      return {
        success: false,
        message: 'Invalid password. Please check your password and try again.',
      };
    }

    // Success
    setAuthUser(foundUser);
    return { success: true, user: foundUser };
  };

  // Database-Backed Authentication: Sign Up
  const signup = async ({ name, email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 1. Try MySQL backend API first
    try {
      const data = await authApi.register({ name: cleanName, email: cleanEmail, password });
      if (data && data.user) {
        const newUser = {
          ...data.user,
          username: cleanEmail.split('@')[0],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=E11D48&color=fff`,
          password,
          role: 'owner',
          title: 'Workspace Owner',
        };
        setAuthUser(newUser);
        setRegisteredUsers((prev) => [...prev.filter((u) => u.email.toLowerCase() !== cleanEmail), newUser]);
        setMembers([newUser]);
        if (data.workspace) {
          setWorkspaces([data.workspace]);
          setActiveWorkspaceId(data.workspace.id);
        }
        return { success: true, user: newUser };
      }
    } catch (apiErr) {
      console.warn('Backend DB register error, falling back to local database:', apiErr.message);
      if (apiErr.message && (apiErr.message.includes('already exists') || apiErr.message.includes('required'))) {
        return { success: false, message: apiErr.message };
      }
    }

    // 2. Fallback to Local Persistent DB
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'An account with this email already exists. Please log in.',
      };
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: cleanName || 'User',
      email: cleanEmail,
      username: cleanEmail.split('@')[0],
      password: password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=E11D48&color=fff`,
      role: 'owner',
      title: 'Workspace Owner',
      color: '#E11D48',
      createdAt: new Date().toISOString(),
    };

    // Save to registered users
    setRegisteredUsers((prev) => [...prev, newUser]);
    setMembers([newUser]);
    setAuthUser(newUser);

    const personalWs = {
      id: `ws_${Date.now()}`,
      name: `${cleanName}'s Workspace`,
      type: 'personal',
      icon: 'user',
      members: [newUser.id],
    };
    setWorkspaces([personalWs]);
    setActiveWorkspaceId(personalWs.id);

    return { success: true, user: newUser };
  };

  const logout = () => {
    setAuthUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  };

  // Keyboard Shortcuts (Q for quick add, T for today, / for search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setActiveFilter('today');
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('app-global-search');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'Escape') {
        setActiveTaskModal(null);
        setIsQuickAddOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper: Log Activity
  const logActivity = (action, taskTitle, projectId) => {
    const newAct = {
      id: `act_${Date.now()}`,
      actorId: currentUser.id,
      action,
      taskTitle,
      projectId: projectId || 'proj_inbox',
      timestamp: 'Just now',
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Add Task with NLP parsing
  const addTask = (rawTitleOrObj, customOverrides = {}) => {
    let newTaskData = {};

    if (typeof rawTitleOrObj === 'string') {
      const parsed = parseTaskInput(rawTitleOrObj);
      
      let targetProjectId = 'proj_inbox';
      if (parsed.projectName) {
        const found = projects.find((p) => p.name.toLowerCase() === parsed.projectName.toLowerCase());
        if (found) targetProjectId = found.id;
      } else if (activeFilter.startsWith('proj_')) {
        targetProjectId = activeFilter;
      }

      let targetAssignee = currentUser.id;
      if (parsed.assigneeName) {
        const foundUser = members.find((m) => m.name.toLowerCase().includes(parsed.assigneeName.toLowerCase()));
        if (foundUser) targetAssignee = foundUser.id;
      }

      newTaskData = {
        id: `task_${Date.now()}`,
        projectId: targetProjectId,
        sectionId: null,
        parentId: null,
        title: parsed.title,
        description: '',
        assigneeId: targetAssignee,
        dueDate: parsed.dueDate || (activeFilter === 'today' ? format(new Date(), 'yyyy-MM-dd') : null),
        dueTime: parsed.dueTime,
        recurrence: parsed.recurrence,
        recurrenceRule: parsed.recurrenceRule,
        deadline: parsed.dueDate,
        priority: parsed.priority || 'p4',
        labels: parsed.labels || [],
        completed: false,
        subtasks: [],
        comments: [],
        ...customOverrides,
      };
    } else {
      newTaskData = {
        id: `task_${Date.now()}`,
        projectId: activeFilter.startsWith('proj_') ? activeFilter : 'proj_inbox',
        sectionId: null,
        parentId: null,
        title: 'New Task',
        description: '',
        assigneeId: currentUser.id,
        dueDate: activeFilter === 'today' ? format(new Date(), 'yyyy-MM-dd') : null,
        dueTime: null,
        recurrence: null,
        recurrenceRule: null,
        deadline: null,
        priority: 'p4',
        labels: [],
        completed: false,
        subtasks: [],
        comments: [],
        ...rawTitleOrObj,
        ...customOverrides,
      };
    }

    setTasks((prev) => [newTaskData, ...prev]);
    logActivity('created task', newTaskData.title, newTaskData.projectId);
    return newTaskData;
  };

  // Toggle Task Completion
  const toggleTaskCompletion = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isNowCompleted = !t.completed;

          if (isNowCompleted) {
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#E11D48', '#EB8909', '#246FE0', '#10B981'],
              });
            } catch (e) {
              // ignore
            }

            logActivity('completed task', t.title, t.projectId);

            if (t.recurrence && t.dueDate) {
              const nextDate = computeNextRecurrenceDate(t.dueDate, t.recurrenceRule || t.recurrence);
              setTimeout(() => {
                const recurringClone = {
                  ...t,
                  id: `task_${Date.now()}`,
                  completed: false,
                  dueDate: nextDate,
                  deadline: nextDate,
                };
                setTasks((all) => [recurringClone, ...all]);
                logActivity('scheduled next recurring occurrence of', t.title, t.projectId);
              }, 400);
            }
          } else {
            logActivity('uncompleted task', t.title, t.projectId);
          }

          return { ...t, completed: isNowCompleted };
        }
        return t;
      })
    );
  };

  const updateTask = (taskId, updates) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, ...updates };
          if (activeTaskModal?.id === taskId) {
            setActiveTaskModal(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const deleteTask = (taskId) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskModal?.id === taskId) {
      setActiveTaskModal(null);
    }
    if (taskToDelete) {
      logActivity('deleted task', taskToDelete.title, taskToDelete.projectId);
    }
  };

  const handleRescheduleTask = (taskId, newDate, newTime = null) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = rescheduleTask(t, newDate, newTime);
          logActivity(`rescheduled task to ${newDate || 'no date'}`, t.title, t.projectId);
          return updated;
        }
        return t;
      })
    );
  };

  const handleBulkRescheduleOverdue = (targetDate = format(new Date(), 'yyyy-MM-dd')) => {
    setTasks((prev) => {
      const updated = bulkRescheduleOverdue(prev, targetDate);
      logActivity(`bulk rescheduled all overdue tasks to ${targetDate}`, 'Multiple Tasks', 'proj_inbox');
      return updated;
    });
  };

  const addComment = (taskId, content) => {
    const newComment = {
      id: `c_${Date.now()}`,
      authorId: currentUser.id,
      content,
      timestamp: 'Just now',
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, comments: [...(t.comments || []), newComment] };
          if (activeTaskModal?.id === taskId) setActiveTaskModal(updated);
          logActivity('commented on', t.title, t.projectId);
          return updated;
        }
        return t;
      })
    );
  };

  const addSection = (projectId, name) => {
    const newSec = {
      id: `sec_${Date.now()}`,
      projectId,
      name,
      order: sections.filter((s) => s.projectId === projectId).length,
    };
    setSections((prev) => [...prev, newSec]);
  };

  const addProject = (name, color = '#E11D48', view = 'list', leadId = null, assignedMemberIds = []) => {
    const newProj = {
      id: `proj_${Date.now()}`,
      workspaceId: activeWorkspaceId,
      name,
      color,
      view,
      leadId: leadId || currentUser.id,
      assignedMembers: assignedMemberIds.length > 0 ? assignedMemberIds : [leadId || currentUser.id],
      isShared: true,
      icon: 'folder',
    };
    setProjects((prev) => [...prev, newProj]);
    setActiveFilter(newProj.id);
    logActivity('created project', newProj.name, newProj.id);
    return newProj;
  };

  const addMemberToWorkspace = (email, role = 'member') => {
    return sendWorkspaceInvite(activeWorkspaceId, email);
  };

  // 1. Direct email invite (creates invite with 'pending_member' status - member must accept)
  const sendWorkspaceInvite = (workspaceId, email) => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'Invalid email' };
    }

    if (currentUser?.email && currentUser.email.toLowerCase() === cleanEmail) {
      return { success: false, message: 'You cannot invite yourself.' };
    }

    // Check if the user exists in registered accounts!
    const targetUser = registeredUsers.find((u) => u.email?.toLowerCase().trim() === cleanEmail);
    if (!targetUser) {
      return {
        success: false,
        message: `No user found with email "${cleanEmail}". They must create an account first before you can invite them.`,
      };
    }

    const targetWs = workspaces.find((w) => String(w.id) === String(workspaceId || activeWorkspaceId));
    if (!targetWs) return { success: false, message: 'Workspace not found' };

    // Check if already an active member
    if (members.some((m) => m.email?.toLowerCase() === cleanEmail)) {
      return { success: false, message: `${cleanEmail} is already a member of this workspace.` };
    }

    const newInv = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      workspaceId: String(targetWs.id),
      workspaceName: targetWs.name,
      workspaceColor: targetWs.color || '#E11D48',
      inviterId: currentUser.id,
      inviterName: currentUser.name,
      email: cleanEmail,
      type: 'direct_invite',
      status: 'pending_member', // member must accept
      createdAt: new Date().toISOString(),
    };

    setInvitations((prev) => [
      ...prev.filter((i) => !(String(i.workspaceId) === String(targetWs.id) && i.email.toLowerCase() === cleanEmail)),
      newInv,
    ]);

    // Also update workspace invitedEmails
    setWorkspaces((prev) =>
      prev.map((ws) => {
        if (String(ws.id) === String(targetWs.id)) {
          const currentInvites = Array.isArray(ws.invitedEmails) ? ws.invitedEmails : [];
          return currentInvites.some((e) => e.toLowerCase() === cleanEmail)
            ? ws
            : { ...ws, invitedEmails: [...currentInvites, cleanEmail] };
        }
        return ws;
      })
    );

    logActivity('sent workspace invitation to', cleanEmail);
    return { success: true, invitation: newInv };
  };

  const cancelWorkspaceInvitation = (invitationId) => {
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    return { success: true };
  };

  // 2. Link join request (creates request with 'pending_creator_approval' - creator must approve)
  const requestToJoinWorkspace = (workspaceId) => {
    const targetWs = workspaces.find((w) => String(w.id) === String(workspaceId));
    if (!targetWs) return { success: false, message: 'Workspace not found' };

    const userEmail = currentUser.email?.toLowerCase().trim();

    // Check if creator/already member
    if (targetWs.ownerId === currentUser.id || targetWs.members?.includes(currentUser.id)) {
      return { success: true, message: 'You are already a member of this workspace.', status: 'already_member' };
    }

    const newReq = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      workspaceId: String(targetWs.id),
      workspaceName: targetWs.name,
      workspaceColor: targetWs.color || '#E11D48',
      inviterId: targetWs.ownerId || 'owner',
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterAvatar: currentUser.avatar,
      email: userEmail,
      type: 'link_request',
      status: 'pending_creator_approval', // creator must approve
      createdAt: new Date().toISOString(),
    };

    setInvitations((prev) => [
      ...prev.filter((i) => !(String(i.workspaceId) === String(targetWs.id) && i.email.toLowerCase() === userEmail)),
      newReq,
    ]);

    return { success: true, request: newReq };
  };

  // 3. Member accepts direct invitation
  const acceptWorkspaceInvitation = (invitationId) => {
    const inv = invitations.find((i) => i.id === invitationId);
    if (!inv) return { success: false, message: 'Invitation not found' };

    setInvitations((prev) =>
      prev.map((i) => (i.id === invitationId ? { ...i, status: 'accepted' } : i))
    );

    const targetWs = workspaces.find((w) => String(w.id) === String(inv.workspaceId));
    if (targetWs) {
      setActiveWorkspaceId(targetWs.id);
    }
    logActivity('accepted invitation to join', inv.workspaceName);
    return { success: true, workspace: targetWs };
  };

  // 4. Member declines direct invitation
  const declineWorkspaceInvitation = (invitationId) => {
    setInvitations((prev) =>
      prev.map((i) => (i.id === invitationId ? { ...i, status: 'rejected' } : i))
    );
    return { success: true };
  };

  // 5. Creator approves link join request
  const approveJoinRequest = (invitationId) => {
    const inv = invitations.find((i) => i.id === invitationId);
    if (!inv) return { success: false, message: 'Request not found' };

    setInvitations((prev) =>
      prev.map((i) => (i.id === invitationId ? { ...i, status: 'accepted' } : i))
    );

    logActivity('approved join request for', inv.requesterName || inv.email);
    return { success: true };
  };

  // 6. Creator rejects link join request
  const rejectJoinRequest = (invitationId) => {
    setInvitations((prev) =>
      prev.map((i) => (i.id === invitationId ? { ...i, status: 'rejected' } : i))
    );
    return { success: true };
  };

  // Create Workspace
  const createNewWorkspace = async (name, invitedEmails = [], metadata = {}) => {
    const cleanName = name.trim();
    if (!cleanName) return { success: false, message: 'Workspace name is required.' };

    const cleanInvites = Array.isArray(invitedEmails)
      ? invitedEmails.map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      : [];

    // 1. Attempt MySQL backend API
    try {
      if (authUser?.id) {
        const wsApi = createWorkspaceApi(authUser.id);
        const created = await wsApi.createWorkspace(cleanName);

        const inviteResults = [];
        for (const email of cleanInvites) {
          try {
            const inv = await wsApi.inviteMember(created.id, email);
            inviteResults.push(inv);
          } catch (err) {
            console.warn(`Failed backend invite for ${email}:`, err.message);
          }
        }

        const newWs = {
          id: String(created.id),
          name: created.name || cleanName,
          type: created.type || 'company',
          icon: metadata.icon || 'building',
          color: metadata.color || '#E11D48',
          description: metadata.description || '',
          role: 'admin',
          members: [authUser.id],
          invitedEmails: cleanInvites,
        };

        setWorkspaces((prev) => {
          const filtered = prev.filter((w) => String(w.id) !== String(newWs.id));
          return [...filtered, newWs];
        });
        setActiveWorkspaceId(newWs.id);
        logActivity('created workspace', newWs.name);
        return { success: true, workspace: newWs, invites: inviteResults };
      }
    } catch (apiErr) {
      console.warn('Backend DB workspace create error, using local store:', apiErr.message);
    }

    // 2. Local fallback
    const localWs = {
      id: `ws_${Date.now()}`,
      name: cleanName,
      type: 'company',
      icon: metadata.icon || 'building',
      color: metadata.color || '#E11D48',
      description: metadata.description || '',
      role: 'admin',
      members: [currentUser.id],
      invitedEmails: cleanInvites,
    };

    setWorkspaces((prev) => [...prev, localWs]);
    setActiveWorkspaceId(localWs.id);
    logActivity('created workspace', localWs.name);
    return { success: true, workspace: localWs, invites: cleanInvites };
  };

  // Delete Workspace
  const deleteWorkspace = (workspaceId) => {
    if (!workspaceId) return { success: false, message: 'Workspace ID required' };
    const wsToDelete = workspaces.find((w) => String(w.id) === String(workspaceId));
    if (!wsToDelete) return { success: false, message: 'Workspace not found' };

    if (wsToDelete.type === 'personal' && workspaces.length === 1) {
      return { success: false, message: 'Cannot delete your default workspace.' };
    }

    const remaining = workspaces.filter((w) => String(w.id) !== String(workspaceId));
    setWorkspaces(remaining);

    // Cleanup projects and invitations for this workspace
    setProjects((prev) => prev.filter((p) => String(p.workspaceId) !== String(workspaceId)));
    setInvitations((prev) => prev.filter((i) => String(i.workspaceId) !== String(workspaceId)));

    if (String(activeWorkspaceId) === String(workspaceId)) {
      setActiveWorkspaceId(remaining.length > 0 ? remaining[0].id : 'ws_personal');
    }

    logActivity('deleted workspace', wsToDelete.name);
    return { success: true };
  };

  const resetToSeedData = () => {
    setMembers(INITIAL_MEMBERS);
    setRegisteredUsers(DEFAULT_REGISTERED_USERS);
    setWorkspaces(INITIAL_WORKSPACES);
    setProjects(INITIAL_PROJECTS);
    setSections(INITIAL_SECTIONS);
    setTasks(INITIAL_TASKS);
    setActivities(INITIAL_ACTIVITIES);
    localStorage.clear();
  };

  return (
    <WorkspaceContext.Provider
      value={{
        authUser,
        currentUser,
        registeredUsers,
        login,
        signup,
        logout,
        members,
        workspaces,
        activeWorkspaceId,
        setActiveWorkspaceId,
        projects,
        sections,
        tasks,
        activities,
        activeFilter,
        setActiveFilter,
        activeView,
        setActiveView,
        selectedCalendarDate,
        setSelectedCalendarDate,
        searchQuery,
        setSearchQuery,
        selectedPriorityFilter,
        setSelectedPriorityFilter,
        activeTaskModal,
        setActiveTaskModal,
        isQuickAddOpen,
        setIsQuickAddOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        isInviteModalOpen,
        setIsInviteModalOpen,
        isNewProjectModalOpen,
        setIsNewProjectModalOpen,
        isReportsModalOpen,
        setIsReportsModalOpen,
        addTask,
        toggleTaskCompletion,
        updateTask,
        deleteTask,
        handleRescheduleTask,
        handleBulkRescheduleOverdue,
        addComment,
        addSection,
        addProject,
        invitations,
        sendWorkspaceInvite,
        requestToJoinWorkspace,
        acceptWorkspaceInvitation,
        declineWorkspaceInvitation,
        approveJoinRequest,
        rejectJoinRequest,
        cancelWorkspaceInvitation,
        addMemberToWorkspace,
        createNewWorkspace,
        deleteWorkspace,
        activeWs,
        resetToSeedData,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
