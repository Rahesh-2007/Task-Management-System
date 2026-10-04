function getHeaders(userId) {
  const h = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = String(userId);
  return h;
}

export function createProjectApi(userId) {
  const API = '/api/projects';
  const h = () => getHeaders(userId);

  return {
    async getProjects(workspaceId) {
      const res = await fetch(`${API}?workspace_id=${workspaceId}`, { headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async createProject(data) {
      const res = await fetch(API, { method: 'POST', headers: h(), body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async getProject(id) {
      const res = await fetch(`${API}/${id}`, { headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async updateProject(id, data) {
      const res = await fetch(`${API}/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async deleteProject(id) {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
  };
}

export function createLabelApi(userId) {
  const API = '/api/labels';
  const h = () => getHeaders(userId);

  return {
    async getLabels(workspaceId) {
      const res = await fetch(`${API}?workspace_id=${workspaceId}`, { headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async createLabel(data) {
      const res = await fetch(API, { method: 'POST', headers: h(), body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async updateLabel(id, data) {
      const res = await fetch(`${API}/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async deleteLabel(id) {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
  };
}

export function createCommentApi(userId) {
  const API = '/api/comments';
  const h = () => getHeaders(userId);

  return {
    async getComments(taskId) {
      const res = await fetch(`${API}?task_id=${taskId}`, { headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async createComment(taskId, content) {
      const res = await fetch(API, { method: 'POST', headers: h(), body: JSON.stringify({ task_id: taskId, content }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async updateComment(id, content) {
      const res = await fetch(`${API}/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify({ content }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async deleteComment(id) {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: h() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
  };
}
