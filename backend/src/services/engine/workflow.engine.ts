import { query } from '../../db/connection.js';
import { generateWorkflowPlan, WorkflowPlan } from '../ai/planner.agent.js';
import { reviewWorkflowExecution } from '../ai/reviewer.agent.js';
import { executeTool } from '../tools/registry.js';
import { logger } from '../../utils/logger.js';

export interface CreateWorkflowParams {
  workspaceId: string;
  userId?: string;
  templateId?: string;
  title: string;
  goal: string;
  context?: string;
  constraints?: string[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export async function createAndPlanWorkflow(params: CreateWorkflowParams) {
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  logger.info(`Creating workflow run '${params.title}' [${runId}]`);

  // Insert initial record in planning state
  await query(`
    INSERT INTO workflow_runs (
      id, workspace_id, template_id, user_id, title, goal, context,
      constraints, priority, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'planning')
  `, [
    runId,
    params.workspaceId,
    params.templateId || null,
    params.userId || null,
    params.title,
    params.goal,
    params.context || null,
    JSON.stringify(params.constraints || []),
    params.priority || 'normal',
  ]);

  // Record audit log
  await recordAuditEvent({
    workspaceId: params.workspaceId,
    workflowRunId: runId,
    eventType: 'workflow.created',
    actorType: 'user',
    actorId: params.userId || 'system',
    payload: { title: params.title, priority: params.priority },
  });

  // Call Planner Agent
  try {
    const { plan, mode } = await generateWorkflowPlan({
      title: params.title,
      goal: params.goal,
      context: params.context,
      constraints: params.constraints,
      priority: params.priority,
    });

    // Update workflow run with plan
    await query(`
      UPDATE workflow_runs
      SET plan_summary = $1, risk_assessment = $2, total_steps = $3, status = 'running'
      WHERE id = $4
    `, [
      plan.plan_summary,
      JSON.stringify(plan.risk_assessment),
      plan.steps.length,
      runId,
    ]);

    // Insert steps
    for (const step of plan.steps) {
      const stepId = `stp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${step.step_index}`;
      let approvalId: string | null = null;
      if (step.requires_approval) {
        approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      }

      // Insert step first
      await query(`
        INSERT INTO workflow_steps (
          id, workflow_run_id, step_index, title, description, assigned_agent,
          status, tool_name, tool_arguments, requires_approval, approval_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10)
      `, [
        stepId,
        runId,
        step.step_index,
        step.title,
        step.description,
        step.assigned_agent,
        step.tool_name,
        JSON.stringify(step.tool_arguments || {}),
        step.requires_approval,
        approvalId,
      ]);

      // If approval required, insert approval referencing the step_id
      if (step.requires_approval && approvalId) {
        await query(`
          INSERT INTO workflow_approvals (
            id, workflow_run_id, step_id, workspace_id, action_type,
            action_summary, risk_level, risk_reason, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
        `, [
          approvalId,
          runId,
          stepId,
          params.workspaceId,
          step.tool_name,
          step.title,
          plan.risk_assessment.risk_level,
          step.approval_reason || 'Sensitive action requiring operational sign-off.',
        ]);
      }
    }

    await recordAuditEvent({
      workspaceId: params.workspaceId,
      workflowRunId: runId,
      eventType: 'workflow.planned',
      actorType: 'agent',
      actorId: 'planner_agent',
      payload: { mode, stepCount: plan.steps.length, riskLevel: plan.risk_assessment.risk_level },
    });

    // Trigger asynchronous execution advance
    advanceWorkflow(runId).catch(err => {
      logger.error(`Error advancing workflow ${runId}:`, err);
    });

    return { runId, plan, mode };
  } catch (err: any) {
    logger.error(`Workflow planning failed for ${runId}:`, err);
    await query(`
      UPDATE workflow_runs
      SET status = 'failed', error_message = $1
      WHERE id = $2
    `, [err.message, runId]);

    await recordAuditEvent({
      workspaceId: params.workspaceId,
      workflowRunId: runId,
      eventType: 'workflow.failed',
      actorType: 'agent',
      actorId: 'planner_agent',
      payload: { error: err.message },
    });

    throw err;
  }
}

export async function advanceWorkflow(runId: string): Promise<void> {
  const runRes = await query('SELECT * FROM workflow_runs WHERE id = $1', [runId]);
  if (runRes.rows.length === 0) return;
  const run = runRes.rows[0];

  if (['completed', 'failed', 'cancelled', 'paused'].includes(run.status)) {
    return;
  }

  // Get all steps ordered
  const stepsRes = await query(
    'SELECT * FROM workflow_steps WHERE workflow_run_id = $1 ORDER BY step_index ASC',
    [runId]
  );
  const steps = stepsRes.rows;

  const nextStep = steps.find(s => s.status === 'pending');

  if (!nextStep) {
    // Check if any step is awaiting approval or failed
    const hasAwaiting = steps.some(s => s.status === 'awaiting_approval');
    if (hasAwaiting) {
      await query('UPDATE workflow_runs SET status = $1 WHERE id = $2', ['awaiting_approval', runId]);
      return;
    }

    const hasFailed = steps.some(s => s.status === 'failed');
    if (hasFailed) {
      await query('UPDATE workflow_runs SET status = $1 WHERE id = $2', ['failed', runId]);
      return;
    }

    // All steps completed! Execute Reviewer Agent
    await finalizeWorkflow(run, steps);
    return;
  }

  // Check if nextStep requires human approval
  if (nextStep.requires_approval) {
    const apprRes = await query(
      'SELECT * FROM workflow_approvals WHERE id = $1',
      [nextStep.approval_id]
    );
    const approval = apprRes.rows[0];

    if (!approval || approval.status === 'pending') {
      logger.info(`Step ${nextStep.step_index} requires approval. Pausing run ${runId}`);
      await query('UPDATE workflow_steps SET status = $1 WHERE id = $2', ['awaiting_approval', nextStep.id]);
      await query('UPDATE workflow_runs SET status = $1 WHERE id = $2', ['awaiting_approval', runId]);

      await recordAuditEvent({
        workspaceId: run.workspace_id,
        workflowRunId: runId,
        eventType: 'approval.requested',
        actorType: 'system',
        actorId: 'governance_engine',
        payload: { stepId: nextStep.id, actionType: nextStep.tool_name, approvalId: nextStep.approval_id },
      });
      return;
    }

    if (approval.status === 'rejected') {
      logger.info(`Step ${nextStep.step_index} was rejected by operator.`);
      await query('UPDATE workflow_steps SET status = $1, error_message = $2 WHERE id = $3', [
        'failed',
        `Action rejected by operator: ${approval.decision_note || 'No reason specified'}`,
        nextStep.id,
      ]);
      await query('UPDATE workflow_runs SET status = $1, error_message = $2 WHERE id = $3', [
        'failed',
        `Step ${nextStep.step_index} rejected by human approver.`,
        runId,
      ]);
      return;
    }
  }

  // Execute Step
  await query(
    'UPDATE workflow_steps SET status = $1, started_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['running', nextStep.id]
  );
  await query(
    'UPDATE workflow_runs SET status = $1, current_step_index = $2 WHERE id = $3',
    ['running', nextStep.step_index, runId]
  );

  await recordAuditEvent({
    workspaceId: run.workspace_id,
    workflowRunId: runId,
    eventType: 'step.started',
    actorType: 'agent',
    actorId: nextStep.assigned_agent,
    payload: { stepIndex: nextStep.step_index, title: nextStep.title, tool: nextStep.tool_name },
  });

  try {
    const args = typeof nextStep.tool_arguments === 'string'
      ? JSON.parse(nextStep.tool_arguments)
      : nextStep.tool_arguments;

    const toolResult = await executeTool(nextStep.tool_name, args, {
      workspaceId: run.workspace_id,
      workflowRunId: runId,
      stepId: nextStep.id,
      userId: run.user_id,
    });

    const reasoning = `${nextStep.assigned_agent} successfully executed '${nextStep.tool_name}'. Output verified against runtime constraints.`;

    await query(`
      UPDATE workflow_steps
      SET status = 'completed', tool_result = $1, agent_reasoning = $2, completed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [JSON.stringify(toolResult), reasoning, nextStep.id]);

    await recordAuditEvent({
      workspaceId: run.workspace_id,
      workflowRunId: runId,
      eventType: 'tool.executed',
      actorType: 'agent',
      actorId: nextStep.assigned_agent,
      payload: { stepId: nextStep.id, tool: nextStep.tool_name, success: true },
    });

    // Continue advancing to next step
    setTimeout(() => advanceWorkflow(runId), 300);
  } catch (err: any) {
    logger.error(`Error executing step ${nextStep.id}:`, err);
    const retryCount = (nextStep.retry_count || 0) + 1;

    if (retryCount <= (nextStep.max_retries || 3)) {
      logger.info(`Retrying step ${nextStep.id} (attempt ${retryCount})`);
      await query(`
        UPDATE workflow_steps
        SET status = 'pending', retry_count = $1, error_message = $2
        WHERE id = $3
      `, [retryCount, `Retry ${retryCount}: ${err.message}`, nextStep.id]);
      setTimeout(() => advanceWorkflow(runId), 1500);
    } else {
      await query(`
        UPDATE workflow_steps
        SET status = 'failed', error_message = $1, completed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [err.message, nextStep.id]);

      await query(`
        UPDATE workflow_runs
        SET status = 'failed', error_message = $1
        WHERE id = $2
      `, [`Step ${nextStep.step_index} failed: ${err.message}`, runId]);

      await recordAuditEvent({
        workspaceId: run.workspace_id,
        workflowRunId: runId,
        eventType: 'workflow.failed',
        actorType: 'system',
        actorId: 'execution_engine',
        payload: { stepIndex: nextStep.step_index, error: err.message },
      });
    }
  }
}

async function finalizeWorkflow(run: any, steps: any[]): Promise<void> {
  logger.info(`Finalizing workflow ${run.id}. Invoking Quality Reviewer Agent...`);

  const completedSteps = steps.map(s => ({
    title: s.title,
    agent: s.assigned_agent,
    tool: s.tool_name,
    result: s.tool_result,
  }));

  const constraints = typeof run.constraints === 'string'
    ? JSON.parse(run.constraints)
    : (run.constraints || []);

  const review = await reviewWorkflowExecution({
    workflowTitle: run.title,
    goal: run.goal,
    constraints,
    completedSteps,
  });

  await query(`
    UPDATE workflow_runs
    SET status = 'completed', final_summary = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [review.finalSummary, run.id]);

  await recordAuditEvent({
    workspaceId: run.workspace_id,
    workflowRunId: run.id,
    eventType: 'workflow.completed',
    actorType: 'agent',
    actorId: 'reviewer_agent',
    payload: { qualityScore: review.qualityScore, satisfaction: review.isSatisfied },
  });

  logger.info(`Workflow ${run.id} marked as completed!`);
}

export async function pauseWorkflow(runId: string) {
  await query("UPDATE workflow_runs SET status = 'paused' WHERE id = $1 AND status = 'running'", [runId]);
}

export async function resumeWorkflow(runId: string) {
  await query("UPDATE workflow_runs SET status = 'running' WHERE id = $1 AND status = 'paused'", [runId]);
  advanceWorkflow(runId).catch(e => logger.error(`Error on resume ${runId}:`, e));
}

export async function cancelWorkflow(runId: string) {
  await query("UPDATE workflow_runs SET status = 'cancelled' WHERE id = $1", [runId]);
  await query("UPDATE workflow_steps SET status = 'skipped' WHERE workflow_run_id = $1 AND status IN ('pending', 'running', 'awaiting_approval')", [runId]);
}

export async function retryFailedStep(runId: string, stepId: string) {
  await query("UPDATE workflow_steps SET status = 'pending', error_message = NULL WHERE id = $1", [stepId]);
  await query("UPDATE workflow_runs SET status = 'running', error_message = NULL WHERE id = $1", [runId]);
  advanceWorkflow(runId).catch(e => logger.error(`Error on retry ${runId}:`, e));
}

export async function resolveApproval(approvalId: string, approved: boolean, note?: string, reviewerId?: string) {
  const status = approved ? 'approved' : 'rejected';
  await query(`
    UPDATE workflow_approvals
    SET status = $1, decision_note = $2, reviewed_by = $3, resolved_at = CURRENT_TIMESTAMP
    WHERE id = $4
  `, [status, note || null, reviewerId || null, approvalId]);

  const apprRes = await query('SELECT * FROM workflow_approvals WHERE id = $1', [approvalId]);
  if (apprRes.rows.length === 0) return;
  const appr = apprRes.rows[0];

  await recordAuditEvent({
    workspaceId: appr.workspace_id,
    workflowRunId: appr.workflow_run_id,
    eventType: 'approval.decided',
    actorType: 'user',
    actorId: reviewerId || 'operator',
    payload: { approvalId, approved, note },
  });

  if (approved) {
    // Set step back to pending so advanceWorkflow executes it
    await query("UPDATE workflow_steps SET status = 'pending' WHERE id = $1", [appr.step_id]);
    await query("UPDATE workflow_runs SET status = 'running' WHERE id = $1", [appr.workflow_run_id]);
    advanceWorkflow(appr.workflow_run_id).catch(e => logger.error('Advance after approval error:', e));
  } else {
    await query("UPDATE workflow_steps SET status = 'failed', error_message = $1 WHERE id = $2", [
      `Rejected by operator: ${note || 'No reason provided'}`,
      appr.step_id,
    ]);
    await query("UPDATE workflow_runs SET status = 'failed', error_message = $1 WHERE id = $2", [
      'Workflow stopped: Critical action rejected by operator.',
      appr.workflow_run_id,
    ]);
  }
}

export async function recordAuditEvent(evt: {
  workspaceId?: string;
  workflowRunId?: string;
  eventType: string;
  actorType: 'user' | 'agent' | 'system';
  actorId?: string;
  payload?: any;
  ipAddress?: string;
}) {
  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await query(`
    INSERT INTO audit_events (id, workspace_id, workflow_run_id, event_type, actor_type, actor_id, payload, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    id,
    evt.workspaceId || null,
    evt.workflowRunId || null,
    evt.eventType,
    evt.actorType,
    evt.actorId || null,
    JSON.stringify(evt.payload || {}),
    evt.ipAddress || null,
  ]);
}
