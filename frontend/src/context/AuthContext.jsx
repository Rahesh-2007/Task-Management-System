import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('taskflow_user');
    const storedWs = localStorage.getItem('taskflow_workspaces');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        if (storedWs) setWorkspaces(JSON.parse(storedWs));
      } catch (_) {
        localStorage.removeItem('taskflow_user');
        localStorage.removeItem('taskflow_workspaces');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setWorkspaces(data.workspaces || []);
    localStorage.setItem('taskflow_user', JSON.stringify(data.user));
    localStorage.setItem('taskflow_workspaces', JSON.stringify(data.workspaces || []));
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register({ name, email, password });
    // After register, log in
    return login(email, password);
  };

  const logout = () => {
    setUser(null);
    setWorkspaces([]);
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem('taskflow_workspaces');
    localStorage.removeItem('taskflow_current_workspace');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
  };

  const addWorkspace = (ws) => {
    const updated = [...workspaces, ws];
    setWorkspaces(updated);
    localStorage.setItem('taskflow_workspaces', JSON.stringify(updated));
  };

  const refreshWorkspaces = async () => {
    if (!user) return;
    try {
      const data = await authApi.getMe(user.id);
      setWorkspaces(data.workspaces || []);
      localStorage.setItem('taskflow_workspaces', JSON.stringify(data.workspaces || []));
      return data.workspaces;
    } catch (_) {}
  };

  return (
    <AuthContext.Provider value={{
      user,
      workspaces,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser,
      addWorkspace,
      refreshWorkspaces,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
