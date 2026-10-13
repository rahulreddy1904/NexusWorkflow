export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  created_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'operator' | 'viewer';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  default_goal: string;
  default_context?: string;
  default_constraints: string[];
  suggested_tools: string[];
  approval_policies: Record<string, any>;
  is_system: boolean;
}

export interface WorkflowStep {
  id: string;
  workflow_run_id: string;
  step_index: number;
  title: string;
  description: string;
  assigned_agent: 'planner' | 'triage_specialist' | 'researcher' | 'executor' | 'reviewer';
  status: 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'skipped';
  tool_name: string;
  tool_arguments: any;
  tool_result?: any;
  agent_reasoning?: string;
  requires_approval: boolean;
  approval_id?: string;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface WorkflowApproval {
  id: string;
  workflow_run_id: string;
  step_id: string;
  workspace_id: string;
  action_type: string;
  action_summary: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  decision_note?: string;
  created_at: string;
  resolved_at?: string;
  workflow_title?: string;
  step_title?: string;
  assigned_agent?: string;
}

export interface WorkflowArtifact {
  id: string;
  workflow_run_id: string;
  step_id?: string;
  title: string;
  type: 'document' | 'json' | 'checklist' | 'summary' | 'code';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WorkflowTask {
  id: string;
  workflow_run_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  assigned_to?: string;
  details?: string;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workspace_id: string;
  template_id?: string;
  user_id?: string;
  title: string;
  goal: string;
  context?: string;
  constraints: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'planning' | 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'paused' | 'cancelled';
  current_step_index: number;
  total_steps: number;
  plan_summary?: string;
  risk_assessment?: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    impact_score: number;
    human_review_required: boolean;
    risk_factors: string[];
  };
  final_summary?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  steps?: WorkflowStep[];
  approvals?: WorkflowApproval[];
  artifacts?: WorkflowArtifact[];
  tasks?: WorkflowTask[];
}

export interface AuditEvent {
  id: string;
  workspace_id: string;
  workflow_run_id?: string;
  event_type: string;
  actor_type: 'user' | 'agent' | 'system';
  actor_id?: string;
  payload: any;
  created_at: string;
}

export interface SystemStatusData {
  system: {
    environment: string;
    version: string;
    timestamp: string;
  };
  database: {
    mode: 'supabase_postgres' | 'local_postgres_emulator';
    connected: boolean;
    type: string;
    host?: string;
    latencyMs?: number;
    isSupabase: boolean;
    instructions: string;
  };
  geminiAi: {
    configured: boolean;
    model: string;
    timeoutMs: number;
    maxRetries: number;
    status: 'READY' | 'CONFIGURATION_REQUIRED';
    instructions: string;
  };
  oauth: {
    google: {
      provider: 'google';
      configured: boolean;
      clientIdConfigured: boolean;
      clientSecretConfigured: boolean;
      callbackUrl: string;
      missingEnv: string[];
      setupGuideUrl: string;
    };
    facebook: {
      provider: 'facebook';
      configured: boolean;
      clientIdConfigured: boolean;
      clientSecretConfigured: boolean;
      callbackUrl: string;
      missingEnv: string[];
      setupGuideUrl: string;
    };
  };
  limits: {
    maxStepsPerWorkflow: number;
    stepTimeoutMs: number;
    maxRetries: number;
  };
}
