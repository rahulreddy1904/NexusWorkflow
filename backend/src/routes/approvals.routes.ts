import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { query } from '../db/connection.js';
import { resolveApproval } from '../services/engine/workflow.engine.js';

const router = Router();

const decisionSchema = z.object({
  approved: z.boolean(),
  note: z.string().optional(),
});

// List approvals
router.get('/', authenticate, async (req: Request, res: Response) => {
  if (!req.user!.workspaceId) {
    res.json({ success: true, data: [] });
    return;
  }

  const status = req.query.status as string || 'pending';

  let sql = `
    SELECT a.*, r.title as workflow_title, s.title as step_title, s.assigned_agent
    FROM workflow_approvals a
    JOIN workflow_runs r ON r.id = a.workflow_run_id
    JOIN workflow_steps s ON s.id = a.step_id
    WHERE a.workspace_id = $1
  `;
  const params: any[] = [req.user!.workspaceId];

  if (status !== 'all') {
    sql += ' AND a.status = $2';
    params.push(status);
  }

  sql += ' ORDER BY a.created_at DESC';

  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
});

// Decide approval
router.post('/:id/decide', authenticate, validateBody(decisionSchema), async (req: Request, res: Response) => {
  const { approved, note } = req.body;

  const apprRes = await query(
    'SELECT * FROM workflow_approvals WHERE id = $1 AND workspace_id = $2',
    [req.params.id, req.user!.workspaceId]
  );

  if (apprRes.rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Approval request not found.' } });
    return;
  }

  const approval = apprRes.rows[0];
  if (approval.status !== 'pending') {
    res.status(400).json({ success: false, error: { code: 'ALREADY_RESOLVED', message: 'This approval has already been resolved.' } });
    return;
  }

  await resolveApproval(req.params.id, approved, note, req.user!.userId);

  res.json({
    success: true,
    message: `Approval has been ${approved ? 'approved' : 'rejected'}. Workflow execution will proceed accordingly.`,
  });
});

export default router;
