const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Token helpers
export const TOKEN_KEY = 'taskflow_auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

export function setToken(token, remember = true) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// Universal fetch wrapper
export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, clear token and notify session expired
    if (res.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${redirect}`;
      }
    }

    const data = await res.json().catch(() => ({ success: false, message: 'Invalid server response' }));

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// 1. Auth API
export const authApi = {
  async register(data) {
    return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },
  async login(email, password) {
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async getMe() {
    return apiRequest('/auth/me');
  },
  async updateProfile(data) {
    return apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });
  },
  async changePassword(currentPassword, newPassword) {
    return apiRequest('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  },
  async forgotPassword(email) {
    return apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
};

// 2. Workspace API
export const workspaceApi = {
  async getMyWorkspaces() {
    return apiRequest('/workspaces');
  },
  async createWorkspace(name, type = 'personal') {
    return apiRequest('/workspaces', { method: 'POST', body: JSON.stringify({ name, type }) });
  },
  async getWorkspace(id) {
    return apiRequest(`/workspaces/${id}`);
  },
  async deleteWorkspace(id) {
    return apiRequest(`/workspaces/${id}`, { method: 'DELETE' });
  },
  async bulkDeleteWorkspaces(workspaceIds) {
    return apiRequest('/workspaces/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ workspaceIds }),
    });
  },
  async getMembers(workspaceId) {
    return apiRequest(`/workspaces/${workspaceId}/members`);
  },
  async removeMember(workspaceId, userId) {
    return apiRequest(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' });
  },
  async inviteMember(workspaceId, email, role = 'member') {
    return apiRequest(`/workspaces/${workspaceId}/invite`, { method: 'POST', body: JSON.stringify({ email, role }) });
  },
  async getInvitations(workspaceId) {
    return apiRequest(`/workspaces/${workspaceId}/invitations`);
  },
  async getMyPendingInvitations() {
    return apiRequest('/workspaces/my-invitations');
  },
  async getInviteByToken(token) {
    return apiRequest(`/workspaces/invitations/${token}`);
  },
  async acceptInvite(token) {
    return apiRequest(`/workspaces/invitations/${token}/accept`, { method: 'POST', body: JSON.stringify({ token }) });
  },
  async declineInvite(token) {
    return apiRequest(`/workspaces/invitations/${token}/decline`, { method: 'POST', body: JSON.stringify({ token }) });
  },
  async getActivity(workspaceId) {
    return apiRequest(`/workspaces/${workspaceId}/activity`);
  },
};

// 3. Project API
export const projectApi = {
  async getProjects(workspaceId) {
    return apiRequest(`/projects?workspace_id=${workspaceId}`);
  },
  async createProject(workspaceId, data) {
    return apiRequest('/projects', { method: 'POST', body: JSON.stringify({ workspace_id: workspaceId, ...data }) });
  },
  async getProject(id) {
    return apiRequest(`/projects/${id}`);
  },
  async updateProject(id, data) {
    return apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteProject(id) {
    return apiRequest(`/projects/${id}`, { method: 'DELETE' });
  },
};

// 4. Section API
export const sectionApi = {
  async getSections(workspaceId, projectId) {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    if (projectId) params.append('project_id', projectId);
    return apiRequest(`/sections?${params.toString()}`);
  },
  async createSection(workspaceId, name, projectId = null) {
    return apiRequest('/sections', { method: 'POST', body: JSON.stringify({ workspaceId, name, projectId }) });
  },
  async updateSection(id, data) {
    return apiRequest(`/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteSection(id) {
    return apiRequest(`/sections/${id}`, { method: 'DELETE' });
  },
};

// 5. Task API
export const taskApi = {
  async getTasks(workspaceId, filters = {}) {
    const params = new URLSearchParams({ workspace_id: workspaceId });
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
    return apiRequest(`/tasks?${params.toString()}`);
  },
  async getTask(id) {
    return apiRequest(`/tasks/${id}`);
  },
  async createTask(data) {
    return apiRequest('/tasks', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateTask(id, data) {
    return apiRequest(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteTask(id) {
    return apiRequest(`/tasks/${id}`, { method: 'DELETE' });
  },
  async reorderTasks(workspaceId, taskOrders) {
    return apiRequest('/tasks/reorder', { method: 'POST', body: JSON.stringify({ workspaceId, taskOrders }) });
  },
};

// 6. Label API
export const labelApi = {
  async getLabels(workspaceId) {
    return apiRequest(`/labels?workspace_id=${workspaceId}`);
  },
  async createLabel(workspaceId, name, color = '#6366f1') {
    return apiRequest('/labels', { method: 'POST', body: JSON.stringify({ workspace_id: workspaceId, name, color }) });
  },
  async updateLabel(id, data) {
    return apiRequest(`/labels/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteLabel(id) {
    return apiRequest(`/labels/${id}`, { method: 'DELETE' });
  },
};

// 7. Notification API
export const notificationApi = {
  async getNotifications() {
    return apiRequest('/notifications');
  },
  async markAsRead(id) {
    return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
  },
  async markAllAsRead() {
    return apiRequest('/notifications/read-all', { method: 'PATCH' });
  },
};

// 8. Team API (Meetings with Google Meet, Chat, Vacations, Activity Stream)
export const teamApi = {
  // Meetings (Google Meet)
  async getMeetings(workspaceId) {
    return apiRequest(`/team/workspaces/${workspaceId}/meetings`);
  },
  async createMeeting(workspaceId, data) {
    return apiRequest(`/team/workspaces/${workspaceId}/meetings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async deleteMeeting(workspaceId, meetingId) {
    return apiRequest(`/team/workspaces/${workspaceId}/meetings/${meetingId}`, {
      method: 'DELETE',
    });
  },

  // Team Chat
  async getChatMessages(workspaceId) {
    return apiRequest(`/team/workspaces/${workspaceId}/chat`);
  },
  async sendChatMessage(workspaceId, content) {
    return apiRequest(`/team/workspaces/${workspaceId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Vacations & Time-off
  async getVacations(workspaceId) {
    return apiRequest(`/team/workspaces/${workspaceId}/vacations`);
  },
  async createVacation(workspaceId, data) {
    return apiRequest(`/team/workspaces/${workspaceId}/vacations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateVacationStatus(workspaceId, vacationId, status) {
    return apiRequest(`/team/workspaces/${workspaceId}/vacations/${vacationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
  async deleteVacation(workspaceId, vacationId) {
    return apiRequest(`/team/workspaces/${workspaceId}/vacations/${vacationId}`, {
      method: 'DELETE',
    });
  },

  // Activity Stream
  async getActivityStream(workspaceId) {
    return apiRequest(`/team/workspaces/${workspaceId}/activities`);
  },
};

