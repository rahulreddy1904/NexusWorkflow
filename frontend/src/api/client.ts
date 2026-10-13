import axios from 'axios';
import {
  WorkflowRun,
  WorkflowTemplate,
  WorkflowApproval,
  SystemStatusData,
  AuditEvent,
  User,
  Workspace,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      localStorage.removeItem('nexus_workspace');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth
  login: async (
    email: string,
    password: string,
    opts?: {
      name?: string;
      workspaceAction?: 'signin' | 'create' | 'join';
      workspaceName?: string;
      joinCode?: string;
    }
  ) => {
    const res = await api.post('/auth/login', { email, password, ...opts });
    return res.data;
  },
  register: async (email: string, password: string, name: string, opts?: { workspaceAction?: 'create' | 'join' | 'none'; workspaceName?: string; joinCode?: string }) => {
    const res = await api.post('/auth/register', { email, password, name, ...opts });
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_workspace');
    return res.data;
  },
  getCurrentSession: async (): Promise<{ user: User; workspace: Workspace | null }> => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
  getOAuthStatus: async () => {
    const res = await api.get('/auth/oauth/status');
    return res.data.data;
  },
  initiateGoogleOAuth: async () => {
    const res = await api.get('/auth/oauth/google');
    return res.data;
  },
  initiateFacebookOAuth: async () => {
    const res = await api.get('/auth/oauth/facebook');
    return res.data;
  },

  // Workflows
  createWorkflow: async (payload: {
    title: string;
    goal: string;
    context?: string;
    constraints?: string[];
    priority?: string;
    templateId?: string;
  }): Promise<{ runId: string; plan: any; mode: string }> => {
    const res = await api.post('/workflows', payload);
    return res.data.data;
  },
  listWorkflows: async (params?: {
    status?: string;
    search?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: WorkflowRun[]; pagination: any }> => {
    const res = await api.get('/workflows', { params });
    return res.data.data;
  },
  getWorkflowDetail: async (id: string): Promise<WorkflowRun> => {
    const res = await api.get(`/workflows/${id}`);
    return res.data.data;
  },
  pauseWorkflow: async (id: string) => {
    const res = await api.post(`/workflows/${id}/pause`);
    return res.data;
  },
  resumeWorkflow: async (id: string) => {
    const res = await api.post(`/workflows/${id}/resume`);
    return res.data;
  },
  cancelWorkflow: async (id: string) => {
    const res = await api.post(`/workflows/${id}/cancel`);
    return res.data;
  },
  retryStep: async (runId: string, stepId: string) => {
    const res = await api.post(`/workflows/${runId}/retry/${stepId}`);
    return res.data;
  },
  getWorkflowEvents: async (runId: string): Promise<AuditEvent[]> => {
    const res = await api.get(`/workflows/${runId}/events`);
    return res.data.data;
  },

  // Approvals
  listApprovals: async (status: string = 'pending'): Promise<WorkflowApproval[]> => {
    const res = await api.get('/approvals', { params: { status } });
    return res.data.data;
  },
  decideApproval: async (id: string, approved: boolean, note?: string) => {
    const res = await api.post(`/approvals/${id}/decide`, { approved, note });
    return res.data;
  },

  // Templates
  listTemplates: async (): Promise<WorkflowTemplate[]> => {
    const res = await api.get('/templates');
    return res.data.data;
  },
  getTemplate: async (id: string): Promise<WorkflowTemplate> => {
    const res = await api.get(`/templates/${id}`);
    return res.data.data;
  },

  // Audit Logs
  listAuditLogs: async (params?: { limit?: number; type?: string }): Promise<AuditEvent[]> => {
    const res = await api.get('/audit', { params });
    return res.data.data;
  },

  // System & Config Status
  getConfigStatus: async (): Promise<SystemStatusData> => {
    const res = await api.get('/config/status');
    return res.data.data;
  },

  // Workspace Management & Sharing
  getWorkspaceSummary: async () => {
    const res = await api.get('/workspaces/current');
    return res.data.data;
  },
  createWorkspace: async (name: string) => {
    const res = await api.post('/workspaces/create', { name });
    return res.data;
  },
  joinWorkspace: async (joinCode: string) => {
    const res = await api.post('/workspaces/join', { joinCode });
    return res.data;
  },
  listMyWorkspaces: async () => {
    const res = await api.get('/workspaces/my-workspaces');
    return res.data.data;
  },
  switchWorkspace: async (workspaceId: string) => {
    const res = await api.post('/workspaces/switch', { workspaceId });
    return res.data;
  },
  regenerateWorkspaceCode: async () => {
    const res = await api.post('/workspaces/regenerate-code');
    return res.data.data;
  },
};

export default api;
