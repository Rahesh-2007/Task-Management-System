const API_BASE = '/api/auth';

// Helper to build headers with user id
function getHeaders(userId) {
  const h = { 'Content-Type': 'application/json' };
  if (userId) h['x-user-id'] = String(userId);
  return h;
}

export const authApi = {
  async register(data) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json.data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    return json.data;
  },

  async getMe(userId) {
    const res = await fetch(`${API_BASE}/me`, { headers: getHeaders(userId) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to get user info');
    return json.data;
  },

  async updateProfile(userId, data) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update profile');
    return json.data;
  },

  async changePassword(userId, currentPassword, newPassword) {
    const res = await fetch(`${API_BASE}/password`, {
      method: 'PUT',
      headers: getHeaders(userId),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to change password');
    return json;
  },
};
