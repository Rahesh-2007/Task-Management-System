const API_BASE = '/api/tasks';

function getHeaders(userId) {
  const h = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = String(userId);
  return h;
}

// Get userId from localStorage (set by auth system)
function getCurrentUserId() {
  try {
    const stored = localStorage.getItem('taskflow_user');
    if (stored) return JSON.parse(stored)?.id || null;
  } catch (_) {}
  return null;
}

export const taskApi = {
  async getAllTasks(params = {}) {
    try {
      const userId = getCurrentUserId();
      const queryParams = new URLSearchParams();
      if (params.workspace_id) queryParams.set('workspace_id', params.workspace_id);
      if (params.project_id) queryParams.set('project_id', params.project_id);
      if (params.is_inbox) queryParams.set('is_inbox', 'true');
      if (params.label_id) queryParams.set('label_id', params.label_id);
      if (params.search) queryParams.set('search', params.search);
      if (params.due_filter) queryParams.set('due_filter', params.due_filter);

      const url = `${API_BASE}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url, { headers: getHeaders(userId) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('API Error (getAllTasks):', error);
      throw error;
    }
  },

  async createTask(taskData) {
    try {
      const userId = getCurrentUserId();
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(taskData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create task');
      return data.data;
    } catch (error) {
      console.error('API Error (createTask):', error);
      throw error;
    }
  },

  async updateTask(id, updates) {
    try {
      const userId = getCurrentUserId();
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: getHeaders(userId),
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update task');
      return data.data;
    } catch (error) {
      console.error('API Error (updateTask):', error);
      throw error;
    }
  },

  async toggleComplete(id) {
    try {
      const userId = getCurrentUserId();
      const response = await fetch(`${API_BASE}/${id}/toggle`, {
        method: 'PATCH',
        headers: getHeaders(userId),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to toggle task');
      return data.data;
    } catch (error) {
      console.error('API Error (toggleComplete):', error);
      throw error;
    }
  },

  async reorderTasks(tasksPayload) {
    try {
      const userId = getCurrentUserId();
      const response = await fetch(`${API_BASE}/reorder`, {
        method: 'PATCH',
        headers: getHeaders(userId),
        body: JSON.stringify({ tasks: tasksPayload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reorder tasks');
      return data.data;
    } catch (error) {
      console.error('API Error (reorderTasks):', error);
      throw error;
    }
  },

  async deleteTask(id) {
    try {
      const userId = getCurrentUserId();
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: getHeaders(userId),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete task');
      return data.data;
    } catch (error) {
      console.error('API Error (deleteTask):', error);
      throw error;
    }
  },

  async resetTasks() {
    try {
      const userId = getCurrentUserId();
      const response = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: getHeaders(userId),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset tasks');
      return data.data;
    } catch (error) {
      console.error('API Error (resetTasks):', error);
      throw error;
    }
  }
};
