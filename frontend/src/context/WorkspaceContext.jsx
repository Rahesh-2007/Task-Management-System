import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  workspaceApi,
  projectApi,
  sectionApi,
  labelApi,
  taskApi,
  notificationApi,
} from '../api/apiClient';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user, isAuthenticated, login, register, logout } = useAuth();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem('taskflow_active_ws_id') || null;
  });

  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [labels, setLabels] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // UI modal states
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialParams, setQuickAddInitialParams] = useState(null);
  const [activeTaskModal, setActiveTaskModal] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);

  // Load Workspaces when authenticated
  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      return;
    }
    try {
      setIsLoadingWorkspaces(true);
      const res = await workspaceApi.getMyWorkspaces();
      if (res.success && Array.isArray(res.data)) {
        setWorkspaces(res.data);
        if (res.data.length > 0) {
          const currentValid = res.data.find((w) => String(w.id) === String(activeWorkspaceId));
          if (!currentValid) {
            const defaultWsId = res.data[0].id;
            setActiveWorkspaceId(defaultWsId);
            localStorage.setItem('taskflow_active_ws_id', String(defaultWsId));
          }
        }
      }
    } catch (err) {
      console.error('[WorkspaceContext] Failed to load workspaces:', err.message);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, [isAuthenticated, activeWorkspaceId]);

  useEffect(() => {
    loadWorkspaces();
  }, [isAuthenticated]);

  // Load all workspace resources when activeWorkspaceId changes
  const loadWorkspaceResources = useCallback(async () => {
    if (!isAuthenticated || !activeWorkspaceId) return;

    try {
      setIsLoadingData(true);
      const [membersRes, projectsRes, sectionsRes, labelsRes, tasksRes, notifsRes] = await Promise.allSettled([
        workspaceApi.getMembers(activeWorkspaceId),
        projectApi.getProjects(activeWorkspaceId),
        sectionApi.getSections(activeWorkspaceId),
        labelApi.getLabels(activeWorkspaceId),
        taskApi.getTasks(activeWorkspaceId),
        notificationApi.getNotifications(),
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value?.data) {
        setMembers(membersRes.value.data);
      }
      if (projectsRes.status === 'fulfilled' && projectsRes.value?.data) {
        setProjects(projectsRes.value.data);
      }
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.data) {
        setSections(sectionsRes.value.data);
      }
      if (labelsRes.status === 'fulfilled' && labelsRes.value?.data) {
        setLabels(labelsRes.value.data);
      }
      if (tasksRes.status === 'fulfilled' && tasksRes.value?.data) {
        setTasks(tasksRes.value.data);
      }
      if (notifsRes.status === 'fulfilled' && notifsRes.value?.data) {
        setNotifications(notifsRes.value.data);
      }
    } catch (err) {
      console.error('[WorkspaceContext] Error loading resources:', err.message);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, activeWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('taskflow_active_ws_id', String(activeWorkspaceId));
      loadWorkspaceResources();
    }
  }, [activeWorkspaceId, loadWorkspaceResources]);

  // Active workspace object
  const activeWorkspace = useMemo(() => {
    return (
      workspaces.find((w) => String(w.id) === String(activeWorkspaceId)) ||
      workspaces[0] || {
        id: activeWorkspaceId || 1,
        name: 'My Workspace',
        type: 'personal',
      }
    );
  }, [workspaces, activeWorkspaceId]);

  // Change active workspace
  const switchWorkspace = (wsId) => {
    setActiveWorkspaceId(wsId);
    localStorage.setItem('taskflow_active_ws_id', String(wsId));
  };

  // Workspace CRUD
  const createWorkspace = async (name, type = 'personal') => {
    const res = await workspaceApi.createWorkspace(name, type);
    if (res.success && res.data) {
      setWorkspaces((prev) => [...prev, res.data]);
      switchWorkspace(res.data.id);
      return res.data;
    }
  };

  const deleteWorkspace = async (wsId) => {
    await workspaceApi.deleteWorkspace(wsId);
    await loadWorkspaces();
  };

  const deleteWorkspaces = async (wsIds = []) => {
    if (!Array.isArray(wsIds) || wsIds.length === 0) return;
    await workspaceApi.bulkDeleteWorkspaces(wsIds);
    await loadWorkspaces();
  };

  // Task Actions (with optimistic updates)
  const addTask = async (title, details = {}) => {
    if (!title || !title.trim() || !activeWorkspaceId) return null;

    const tempId = `temp_${Date.now()}`;
    const targetProjectId = details.projectId ? parseInt(details.projectId, 10) : null;
    const targetAssigneeId = details.assigneeId ? parseInt(details.assigneeId, 10) : user?.id || null;

    const optimisticTask = {
      id: tempId,
      workspaceId: parseInt(activeWorkspaceId, 10),
      title: title.trim(),
      description: details.description || '',
      status: details.status || 'todo',
      completed: details.status === 'done',
      priority: details.priority || 'p4',
      dueDate: details.dueDate || null,
      startTime: details.startTime || null,
      dueTime: details.dueTime || null,
      deadline: details.deadline || null,
      projectId: targetProjectId,
      sectionId: details.sectionId ? parseInt(details.sectionId, 10) : null,
      assigneeId: targetAssigneeId,
      subtasks: details.subtasks || [],
      labels: details.labels || [],
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const res = await taskApi.createTask({
        workspaceId: parseInt(activeWorkspaceId, 10),
        title: title.trim(),
        description: details.description || '',
        status: details.status || 'todo',
        priority: details.priority || 'p4',
        dueDate: details.dueDate || null,
        startTime: details.startTime || null,
        dueTime: details.dueTime || null,
        deadline: details.deadline || null,
        projectId: targetProjectId,
        sectionId: details.sectionId ? parseInt(details.sectionId, 10) : null,
        assigneeId: targetAssigneeId,
        recurrenceRule: details.recurrenceRule || null,
        estimateMinutes: details.estimateMinutes ? parseInt(details.estimateMinutes, 10) : null,
        labelIds: details.labelIds || [],
        subtasks: details.subtasks || [],
      });

      if (res.success && res.data) {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? res.data : t)));
        return res.data;
      }
    } catch (err) {
      console.error('[WorkspaceContext] addTask failed:', err.message);
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    let originalTask;
    setTasks((prev) => {
      const found = prev.find((t) => String(t.id) === String(taskId));
      if (found) originalTask = { ...found };
      return prev.map((t) => (String(t.id) === String(taskId) ? { ...t, ...updates } : t));
    });

    try {
      const res = await taskApi.updateTask(taskId, updates);
      if (res.success && res.data) {
        setTasks((prev) => {
          let updated = prev.map((t) => (String(t.id) === String(taskId) ? res.data : t));
          if (res.nextRecurringTask) {
            // Check if next recurring task already in state
            const exists = updated.some((t) => t.id === res.nextRecurringTask.id);
            if (!exists) {
              loadWorkspaceResources();
            }
          }
          return updated;
        });
        return res.data;
      }
    } catch (err) {
      console.error('[WorkspaceContext] updateTask failed:', err.message);
      if (originalTask) {
        setTasks((prev) => prev.map((t) => (String(t.id) === String(taskId) ? originalTask : t)));
      }
      throw err;
    }
  };

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find((t) => String(t.id) === String(taskId));
    if (!task) return;
    const newCompleted = !task.completed;
    const newStatus = newCompleted ? 'done' : 'todo';
    return updateTask(taskId, { completed: newCompleted, status: newStatus });
  };

  const deleteTask = async (taskId) => {
    const backupTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => String(t.id) !== String(taskId)));
    try {
      await taskApi.deleteTask(taskId);
    } catch (err) {
      console.error('[WorkspaceContext] deleteTask failed:', err.message);
      setTasks(backupTasks);
      throw err;
    }
  };

  // Project CRUD
  const addProject = async (name, color = '#E11D48', defaultView = 'list', leadId = null) => {
    if (!name.trim() || !activeWorkspaceId) return;
    const res = await projectApi.createProject(activeWorkspaceId, {
      name: name.trim(),
      color,
      default_view: defaultView,
      lead_id: leadId ? parseInt(leadId, 10) : null,
    });
    if (res.success && res.data) {
      setProjects((prev) => [...prev, res.data]);
      return res.data;
    }
  };

  const deleteProject = async (projectId) => {
    await projectApi.deleteProject(projectId);
    setProjects((prev) => prev.filter((p) => String(p.id) !== String(projectId)));
    setTasks((prev) => prev.filter((t) => String(t.projectId) !== String(projectId)));
  };

  // Label CRUD
  const addLabel = async (name, color = '#6366f1') => {
    if (!name.trim() || !activeWorkspaceId) return;
    const res = await labelApi.createLabel(activeWorkspaceId, name.trim(), color);
    if (res.success && res.data) {
      setLabels((prev) => [...prev, res.data]);
      return res.data;
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        // Auth passthrough for backwards compatibility
        user,
        currentUser: user,
        authUser: user,
        login,
        signup: (data) => register(data?.name || data, data?.email, data?.password),
        logout,

        // Workspace state
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        setActiveWorkspaceId: switchWorkspace,
        switchWorkspace,
        createWorkspace,
        deleteWorkspace,
        deleteWorkspaces,
        loadWorkspaces,

        // Data collections
        members,
        projects,
        sections,
        labels,
        tasks,
        notifications,
        isLoadingData,
        refreshWorkspaceData: loadWorkspaceResources,

        // Task operations
        addTask,
        updateTask,
        toggleTaskCompletion,
        deleteTask,

        // Project & Label operations
        addProject,
        deleteProject,
        addLabel,

        // UI Modal & Navigation state
        isQuickAddOpen,
        setIsQuickAddOpen,
        quickAddInitialParams,
        setQuickAddInitialParams,
        activeTaskModal,
        setActiveTaskModal,
        isInviteModalOpen,
        setIsInviteModalOpen,
        isNewProjectModalOpen,
        setIsNewProjectModalOpen,
        isReportsModalOpen,
        setIsReportsModalOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        searchQuery,
        setSearchQuery,
        selectedCalendarDate,
        setSelectedCalendarDate,
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
