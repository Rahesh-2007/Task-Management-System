function getHeaders(userId) {
  const h = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = String(userId);
  return h;
}

export function createWorkspaceApi(userId) {
  const API = '/api/workspaces';
  const headers = () => getHeaders(userId);

  return {
    async getMyWorkspaces() {
      const res = await fetch(API, { headers: headers() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async createWorkspace(name) {
      const res = await fetch(API, {
        method: 'POST', headers: headers(), body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async getWorkspace(id) {
      const res = await fetch(`${API}/${id}`, { headers: headers() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async getMembers(workspaceId) {
      const res = await fetch(`${API}/${workspaceId}/members`, { headers: headers() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async removeMember(workspaceId, memberId) {
      const res = await fetch(`${API}/${workspaceId}/members/${memberId}`, {
        method: 'DELETE', headers: headers(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json;
    },
    async inviteMember(workspaceId, email) {
      const res = await fetch(`${API}/${workspaceId}/invite`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async getInvitations(workspaceId) {
      const res = await fetch(`${API}/${workspaceId}/invitations`, { headers: headers() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async acceptInvite(token) {
      const res = await fetch(`${API}/accept-invite`, {
        method: 'POST', headers: headers(), body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async getInviteInfo(token) {
      const res = await fetch(`${API}/invite-info?token=${token}`, { headers: headers() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
    async getActivity(workspaceId) {
      const res = await fetch(`${API}/${workspaceId}/activity`, { headers: headers() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      return json.data;
    },
  };
}
