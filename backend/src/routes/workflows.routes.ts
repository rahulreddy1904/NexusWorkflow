import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { query } from '../db/connection.js';
import {
  createAndPlanWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  cancelWorkflow,
  retryFailedStep,
} from '../services/engine/workflow.engine.js';

const router = Router();

const createWorkflowSchema = z.object({
  title: z.string().min(3).max(200),
  goal: z.string().min(5),
  context: z.string().optional(),
  constraints: z.array(z.string()).optional().default([]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  templateId: z.string().optional(),
});

const listWorkflowsSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  priority: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sort: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Create and trigger planning
router.post('/', authenticate, validateBody(createWorkflowSchema), async (req: Request, res: Response) => {
  try {
    const result = await createAndPlanWorkflow({
      workspaceId: req.user!.workspaceId,
      userId: req.user!.userId,
      title: req.body.title,
      goal: req.body.goal,
      context: req.body.context,
      constraints: req.body.constraints,
      priority: req.body.priority,
      templateId: req.body.templateId,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'PLANNING_FAILED', message: err.message },
    });
  }
});

// List workflows
router.get('/', authenticate, validateQuery(listWorkflowsSchema), async (req: Request, res: Response) => {
  const { status, search, priority, page, limit, sort, order } = req.query as any;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM workflow_runs WHERE workspace_id = $1';
  const params: any[] = [req.user!.workspaceId];
  let paramIdx = 2;

  if (status && status !== 'all') {
    sql += ` AND status = $${paramIdx++}`;
    params.push(status);
  }

  if (priority && priority !== 'all') {
    sql += ` AND priority = $${paramIdx++}`;
    params.push(priority);
  }

  if (search) {
    sql += ` AND (title ILIKE $${paramIdx} OR goal ILIKE $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }

  // Count total
  const countSql = `SELECT COUNT(*) as total FROM (${sql}) as filtered`;
  const countRes = await query(countSql, params);
  const total = parseInt(countRes.rows[0]?.total || '0', 10);

  // Sorting and pagination
  sql += ` ORDER BY ${sort} ${order.toUpperCase()} LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const runsRes = await query(sql, params);

  res.json({
    success: true,
    data: {
      items: runsRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// Get workflow detail
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const runRes = await query(
    'SELECT * FROM workflow_runs WHERE id = $1 AND workspace_id = $2',
    [req.params.id, req.user!.workspaceId]
  );

  if (runRes.rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workflow run not found' } });
    return;
  }

  const run = runRes.rows[0];

  // Fetch steps
  const stepsRes = await query(
    'SELECT * FROM workflow_steps WHERE workflow_run_id = $1 ORDER BY step_index ASC',
    [run.id]
  );

  // Fetch approvals
  const approvalsRes = await query(
    'SELECT * FROM workflow_approvals WHERE workflow_run_id = $1 ORDER BY created_at DESC',
    [run.id]
  );

  // Fetch artifacts
  const artifactsRes = await query(
    'SELECT * FROM workflow_artifacts WHERE workflow_run_id = $1 ORDER BY created_at ASC',
    [run.id]
  );

  // Fetch tasks
  const tasksRes = await query(
    'SELECT * FROM workflow_tasks WHERE workflow_run_id = $1 ORDER BY created_at ASC',
    [run.id]
  );

  res.json({
    success: true,
    data: {
      ...run,
      steps: stepsRes.rows,
      approvals: approvalsRes.rows,
      artifacts: artifactsRes.rows,
      tasks: tasksRes.rows,
    },
  });
});

// Pause
router.post('/:id/pause', authenticate, async (req: Request, res: Response) => {
  await pauseWorkflow(req.params.id);
  res.json({ success: true, message: 'Workflow paused successfully.' });
});

// Resume
router.post('/:id/resume', authenticate, async (req: Request, res: Response) => {
  await resumeWorkflow(req.params.id);
  res.json({ success: true, message: 'Workflow resumed successfully.' });
});

// Cancel
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  await cancelWorkflow(req.params.id);
  res.json({ success: true, message: 'Workflow cancelled.' });
});

// Retry step
router.post('/:id/retry/:stepId', authenticate, async (req: Request, res: Response) => {
  await retryFailedStep(req.params.id, req.params.stepId);
  res.json({ success: true, message: 'Step retry initiated.' });
});

// Run audit events
router.get('/:id/events', authenticate, async (req: Request, res: Response) => {
  const eventsRes = await query(
    'SELECT * FROM audit_events WHERE workflow_run_id = $1 ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json({ success: true, data: eventsRes.rows });
});

export default router;
