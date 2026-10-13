import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  workspace: Workspace | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, workspaceName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const storedToken = localStorage.getItem('nexus_token');
      if (!storedToken) {
        setUser(null);
        setWorkspace(null);
        setIsLoading(false);
        return;
      }
      const data = await apiClient.getCurrentSession();
      setUser(data.user);
      setWorkspace(data.workspace);
    } catch (err) {
      setUser(null);
      setWorkspace(null);
      localStorage.removeItem('nexus_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.login(email, password);
    const { token: newToken, user: newUser, workspace: newWs } = res.data;
    localStorage.setItem('nexus_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setWorkspace(newWs);
  };

  const register = async (email: string, password: string, name: string, workspaceName?: string) => {
    const res = await apiClient.register(email, password, name, workspaceName);
    const { token: newToken, user: newUser, workspace: newWs } = res.data;
    localStorage.setItem('nexus_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setWorkspace(newWs);
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
    setWorkspace(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
