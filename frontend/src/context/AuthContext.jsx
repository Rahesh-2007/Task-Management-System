import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getToken, setToken, clearToken } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount via /api/auth/me
  const restoreSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        clearToken();
        setUser(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Session restore failed:', err.message);
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password, remember = true) => {
    setError(null);
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        setToken(res.data.token, remember);
        setUser(res.data.user);
        return { success: true, user: res.data.user, workspaces: res.data.workspaces };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await authApi.register({ name, email, password });
      if (res.success && res.data) {
        setToken(res.data.token, true);
        setUser(res.data.user);
        return { success: true, user: res.data.user, workspaces: res.data.workspaces };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
    window.location.href = '/login';
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.success && res.data) {
      setUser(res.data);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser: user,
        currentUser: user,
        isAuthenticated: Boolean(user),
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        refreshSession: restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
