import { z } from 'zod';
import { query } from '../../db/connection.js';
import axios from 'axios';
import { logger } from '../../utils/logger.js';

export interface ToolExecutionContext {
  workspaceId: string;
  workflowRunId: string;
  stepId: string;
  userId?: string;
}

export interface ToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApprovalByDefault: boolean;
  schema: z.ZodType<TParams>;
  execute: (params: TParams, context: ToolExecutionContext) => Promise<TResult>;
}

// 1. Task Creation Tool
const taskCreateSchema = z.object({
  title: z.string().min(3).max(200),
  details: z.string().optional(),
  assigned_to: z.string().optional().default('unassigned'),
});

// 2. Task Update Tool
const taskUpdateSchema = z.object({
  task_id: z.string().min(1),
  status: z.enum(['todo', 'in_progress', 'completed', 'blocked']),
  details: z.string().optional(),
});

// 3. Checklist Management Tool
const checklistManageSchema = z.object({
  title: z.string().default('Workflow Execution Checklist'),
  items: z.array(z.string().min(1)).min(1).max(20),
});

// 4. Artifact Save Tool
const artifactSaveSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.enum(['document', 'json', 'checklist', 'summary', 'code']),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional().default({}),
});

// 5. Notification Tool
const notificationDispatchSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(1),
  type: z.enum(['info', 'warning', 'alert']).default('info'),
});

// 6. Policy & Compliance Risk Check Tool
const policyCheckSchema = z.object({
  action_type: z.string().min(2),
  target_resource: z.string().min(2),
  risk_score: z.number().min(0).max(100),
  explanation: z.string().min(5),
  requires_human_signoff: z.boolean().default(false),
});

// 7. Safe Sandboxed HTTP Inspector (Public APIs Only, SSRF Protected)
const httpFetchSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET']).default('GET'),
});

export const toolRegistry: Record<string, ToolDefinition> = {
  db_task_create: {
    name: 'db_task_create',
    description: 'Create an actionable task item in the application database linked to this workflow.',
    riskLevel: 'low',
    requiresApprovalByDefault: false,
    schema: taskCreateSchema,
    execute: async (params, ctx) => {
      const taskId = `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(`
        INSERT INTO workflow_tasks (id, workflow_run_id, title, details, assigned_to, status)
        VALUES ($1, $2, $3, $4, $5, 'todo')
      `, [taskId, ctx.workflowRunId, params.title, params.details || '', params.assigned_to]);

      return {
        success: true,
        taskId,
        title: params.title,
        status: 'todo',
        assignedTo: params.assigned_to,
      };
    },
  },

  db_task_update: {
    name: 'db_task_update',
    description: 'Update the progress, status, or notes on an existing database task.',
    riskLevel: 'low',
    requiresApprovalByDefault: false,
    schema: taskUpdateSchema,
    execute: async (params, ctx) => {
      await query(`
        UPDATE workflow_tasks
        SET status = $1, details = COALESCE($2, details), updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND workflow_run_id = $4
      `, [params.status, params.details, params.task_id, ctx.workflowRunId]);

      return {
        success: true,
        taskId: params.task_id,
        newStatus: params.status,
      };
    },
  },

  db_checklist_manage: {
    name: 'db_checklist_manage',
    description: 'Populate operational checklist items in the database for tracking procedural compliance.',
    riskLevel: 'low',
    requiresApprovalByDefault: false,
    schema: checklistManageSchema,
    execute: async (params, ctx) => {
      const createdIds: string[] = [];
      for (const item of params.items) {
        const id = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await query(`
          INSERT INTO workflow_tasks (id, workflow_run_id, title, details, status)
          VALUES ($1, $2, $3, $4, 'todo')
        `, [id, ctx.workflowRunId, `[Checklist] ${item}`, `Part of checklist: ${params.title}`]);
        createdIds.push(id);
      }

      return {
        success: true,
        checklistTitle: params.title,
        itemsCreated: createdIds.length,
        taskIds: createdIds,
      };
    },
  },

  db_artifact_save: {
    name: 'db_artifact_save',
    description: 'Save a structured output artifact (markdown document, summary report, analysis matrix, or JSON) into the persistent database.',
    riskLevel: 'low',
    requiresApprovalByDefault: false,
    schema: artifactSaveSchema,
    execute: async (params, ctx) => {
      const artifactId = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(`
        INSERT INTO workflow_artifacts (id, workflow_run_id, step_id, title, type, content, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        artifactId,
        ctx.workflowRunId,
        ctx.stepId,
        params.title,
        params.type,
        params.content,
        JSON.stringify(params.metadata || {}),
      ]);

      return {
        success: true,
        artifactId,
        title: params.title,
        type: params.type,
        sizeBytes: Buffer.byteLength(params.content, 'utf8'),
      };
    },
  },

  system_notification_dispatch: {
    name: 'system_notification_dispatch',
    description: 'Dispatch an in-app system notification to workspace operators.',
    riskLevel: 'low',
    requiresApprovalByDefault: false,
    schema: notificationDispatchSchema,
    execute: async (params, ctx) => {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(`
        INSERT INTO system_notifications (id, workspace_id, user_id, title, message, type, link)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        notifId,
        ctx.workspaceId,
        ctx.userId || 'usr_demo_nexus_01',
        params.title,
        params.message,
        params.type,
        `/workflows/${ctx.workflowRunId}`,
      ]);

      return {
        success: true,
        notificationId: notifId,
        dispatched: true,
      };
    },
  },

  policy_compliance_check: {
    name: 'policy_compliance_check',
    description: 'Evaluate corporate policy, security thresholds, and regulatory constraints. Flags high-risk actions for mandatory Human-in-the-Loop approval.',
    riskLevel: 'medium',
    requiresApprovalByDefault: false,
    schema: policyCheckSchema,
    execute: async (params, ctx) => {
      const requiresApproval = params.requires_human_signoff || params.risk_score >= 70;
      return {
        evaluated: true,
        actionType: params.action_type,
        riskScore: params.risk_score,
        requiresApproval,
        reason: params.explanation,
        governanceDecision: requiresApproval ? 'GATED_BY_HUMAN_APPROVAL' : 'AUTO_PERMITTED',
      };
    },
  },

  http_data_fetch: {
    name: 'http_data_fetch',
    description: 'Fetch external public JSON status or OpenAPI spec from verified domains (SSRF protected; blocks private IPs and loopbacks).',
    riskLevel: 'medium',
    requiresApprovalByDefault: false,
    schema: httpFetchSchema,
    execute: async (params) => {
      const parsedUrl = new URL(params.url);
      const hostname = parsedUrl.hostname.toLowerCase();

      // Enforce strict SSRF protection
      const isBlocked = [
        'localhost', '127.0.0.1', '0.0.0.0', '::1',
        '169.254.169.254', 'metadata.google.internal',
      ].includes(hostname) ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local');

      if (isBlocked) {
        throw new Error(`SSRF Security Violation: Access to internal or loopback address ${hostname} is strictly blocked.`);
      }

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
      }

      const res = await axios.get(params.url, {
        timeout: 8000,
        maxContentLength: 100000, // max 100KB to prevent memory exhaustion
        headers: { 'User-Agent': 'NEXUS-Workflow-Bot/1.0' },
      });

      return {
        status: res.status,
        data: typeof res.data === 'object' ? res.data : String(res.data).substring(0, 500),
      };
    },
  },
};

export async function executeTool(toolName: string, rawArgs: any, context: ToolExecutionContext) {
  const tool = toolRegistry[toolName];
  if (!tool) {
    throw new Error(`Unknown tool: '${toolName}'. Available tools: ${Object.keys(toolRegistry).join(', ')}`);
  }

  // Validate args
  const parsed = tool.schema.safeParse(rawArgs);
  if (!parsed.success) {
    const errorDetails = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Invalid arguments for tool '${toolName}': ${errorDetails}`);
  }

  logger.info(`Executing tool '${toolName}'`, { tool: toolName, runId: context.workflowRunId, stepId: context.stepId });
  const result = await tool.execute(parsed.data, context);
  return result;
}
