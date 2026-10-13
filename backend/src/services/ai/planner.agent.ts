import { z } from 'zod';
import { geminiService } from './gemini.service.js';
import { toolRegistry } from '../tools/registry.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export const planStepSchema = z.object({
  step_index: z.number().int().positive(),
  title: z.string().min(3).max(200),
  description: z.string().min(5),
  assigned_agent: z.enum(['triage_specialist', 'researcher', 'executor', 'reviewer']),
  tool_name: z.string(),
  tool_arguments: z.record(z.any()),
  requires_approval: z.boolean().default(false),
  approval_reason: z.string().optional(),
});

export const workflowPlanSchema = z.object({
  plan_summary: z.string().min(10),
  risk_assessment: z.object({
    risk_level: z.enum(['low', 'medium', 'high', 'critical']),
    impact_score: z.number().min(0).max(100),
    human_review_required: z.boolean(),
    risk_factors: z.array(z.string()).default([]),
  }),
  steps: z.array(planStepSchema).min(2).max(env.WORKFLOW_MAX_STEPS),
});

export type WorkflowPlan = z.infer<typeof workflowPlanSchema>;

export interface PlanRequest {
  title: string;
  goal: string;
  context?: string;
  constraints?: string[];
  priority?: string;
  approvalPolicies?: Record<string, any>;
}

export async function generateWorkflowPlan(req: PlanRequest): Promise<{ plan: WorkflowPlan; mode: 'gemini' | 'rule_based' }> {
  const toolDescriptions = Object.values(toolRegistry).map(t => ({
    name: t.name,
    description: t.description,
    risk: t.riskLevel,
  }));

  if (geminiService.isConfigured()) {
    try {
      const systemInstruction = `You are NEXUS Orchestrator, an enterprise multi-agent workflow planner.
Your job is to decompose an operational request into a sequential, bounded execution plan.
Specialist Agents available:
- triage_specialist: Analyzes incoming parameters, classifies severity, flags missing context.
- researcher: Gathers background information, compares policies, checks external metrics.
- executor: Performs database mutations, task creation, checklist generation, notifications.
- reviewer: Validates goal completion, verifies constraints, compiles final artifacts.

Available Tools:
${JSON.stringify(toolDescriptions, null, 2)}

Strict Policy:
- Output valid JSON only adhering strictly to the schema.
- Maximum step limit: ${env.WORKFLOW_MAX_STEPS}.
- If any action touches financial thresholds, production service changes, or high-risk compliance, set requires_approval=true.`;

      const prompt = `Formulate an agentic workflow plan for the following request:
Title: ${req.title}
Goal: ${req.goal}
Context: ${req.context || 'None provided'}
Constraints: ${JSON.stringify(req.constraints || [])}
Priority: ${req.priority || 'normal'}
Configured Approval Policies: ${JSON.stringify(req.approvalPolicies || {})}

Return a JSON object with:
- plan_summary: string
- risk_assessment: { risk_level: "low"|"medium"|"high"|"critical", impact_score: number(0-100), human_review_required: boolean, risk_factors: string[] }
- steps: array of steps, each with step_index, title, description, assigned_agent, tool_name, tool_arguments, requires_approval, approval_reason.`;

      const rawPlan = await geminiService.generateStructured<any>(prompt, systemInstruction);
      const validated = workflowPlanSchema.parse(rawPlan);

      // Validate that tool names actually exist in the registry
      for (const step of validated.steps) {
        if (!toolRegistry[step.tool_name]) {
          logger.warn(`AI suggested unknown tool '${step.tool_name}', remapping to 'db_task_create'`);
          step.tool_name = 'db_task_create';
          step.tool_arguments = { title: step.title, details: step.description };
        }
      }

      return { plan: validated, mode: 'gemini' };
    } catch (err: any) {
      logger.warn(`Gemini planning encountered an error, falling back to deterministic planner: ${err.message}`);
    }
  }

  // Deterministic Rule-Based Planner (Used when GEMINI_API_KEY is not configured or offline)
  const isHighRisk = (req.constraints || []).some(c =>
    /sign-off|approval|legal|ciso|financial|refund|auth|secret|permission/i.test(c)
  ) || /dispute|refund|security|access|delete|terminate/i.test(req.goal);

  const steps: z.infer<typeof planStepSchema>[] = [
    {
      step_index: 1,
      title: `Intake & Triage: ${req.title.substring(0, 40)}`,
      description: `Analyze parameters, classify operational priority (${req.priority || 'normal'}), and initialize tracking tasks.`,
      assigned_agent: 'triage_specialist',
      tool_name: 'db_task_create',
      tool_arguments: {
        title: `Triage: ${req.title}`,
        details: req.goal,
        assigned_to: 'triage-lead',
      },
      requires_approval: false,
    },
    {
      step_index: 2,
      title: 'Procedural Compliance & Checklist Generation',
      description: 'Formulate operational checklist items to satisfy organizational constraints and policies.',
      assigned_agent: 'executor',
      tool_name: 'db_checklist_manage',
      tool_arguments: {
        title: `${req.title} Verification Steps`,
        items: [
          'Verify intake constraints against SLA policy',
          'Execute core operational mutations',
          'Record audit telemetry in workspace ledger',
        ],
      },
      requires_approval: false,
    },
    {
      step_index: 3,
      title: isHighRisk ? 'Policy Compliance Risk Evaluation & Sign-off' : 'Policy Compliance Verification',
      description: isHighRisk
        ? 'High-impact policy evaluation triggered: requires explicit human operator sign-off before proceeding.'
        : 'Automated compliance rule check against active workspace policies.',
      assigned_agent: 'executor',
      tool_name: 'policy_compliance_check',
      tool_arguments: {
        action_type: 'operational_execution_gate',
        target_resource: req.title,
        risk_score: isHighRisk ? 80 : 35,
        explanation: isHighRisk
          ? 'Action impacts regulated financial or security boundaries requiring human confirmation.'
          : 'Standard operational action within automated risk tolerances.',
        requires_human_signoff: isHighRisk,
      },
      requires_approval: isHighRisk,
      approval_reason: isHighRisk ? 'Mandatory human approval gate for consequential operational action.' : undefined,
    },
    {
      step_index: 4,
      title: 'Executive Summary & Artifact Compilation',
      description: 'Synthesize operational results into a formal persisted markdown artifact.',
      assigned_agent: 'reviewer',
      tool_name: 'db_artifact_save',
      tool_arguments: {
        title: `Summary Report: ${req.title}`,
        type: 'document',
        content: `# Executive Summary: ${req.title}\n\n**Goal**: ${req.goal}\n\n**Status**: Completed via NEXUS Multi-Agent Execution Engine.\n\n### Operational Audit\n- Constraints observed: ${req.constraints?.join(', ') || 'Standard'}\n- All checklist items recorded in database.`,
        metadata: { engine: 'NEXUS Agentic Orchestrator v1.0', priority: req.priority || 'normal' },
      },
      requires_approval: false,
    },
  ];

  const plan: WorkflowPlan = {
    plan_summary: `Structured 4-step execution strategy: Intake Triage → Checklist Formulation → Policy & Compliance Check → Executive Artifact Compilation.`,
    risk_assessment: {
      risk_level: isHighRisk ? 'high' : 'low',
      impact_score: isHighRisk ? 80 : 30,
      human_review_required: isHighRisk,
      risk_factors: isHighRisk ? ['Policy constraints mandate human confirmation', 'Sensitive operational boundary'] : ['Standard automated operations'],
    },
    steps,
  };

  return { plan, mode: 'rule_based' };
}
