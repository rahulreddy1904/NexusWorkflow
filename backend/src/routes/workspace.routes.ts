import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../db/connection.js';

const router = Router();

// Get workspace details and summary stats
router.get('/current', authenticate, async (req: Request, res: Response) => {
  const wsRes = await query('SELECT * FROM workspaces WHERE id = $1', [req.user!.workspaceId]);
  if (wsRes.rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    return;
  }

  // Members
  const membersRes = await query(`
    SELECT wm.id, wm.role, wm.created_at, u.name, u.email, u.avatar_url
    FROM workspace_members wm
    JOIN users u ON u.id = wm.user_id
    WHERE wm.workspace_id = $1
    ORDER BY wm.created_at ASC
  `, [req.user!.workspaceId]);

  // Aggregate stats
  const statsRes = await query(`
    SELECT
      COUNT(*) as total_runs,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_runs,
      COUNT(CASE WHEN status = 'running' THEN 1 END) as running_runs,
      COUNT(CASE WHEN status = 'awaiting_approval' THEN 1 END) as pending_approvals,
      COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs
    FROM workflow_runs
    WHERE workspace_id = $1
  `, [req.user!.workspaceId]);

  const stats = statsRes.rows[0] || {
    total_runs: '0',
    completed_runs: '0',
    running_runs: '0',
    pending_approvals: '0',
    failed_runs: '0',
  };

  res.json({
    success: true,
    data: {
      workspace: wsRes.rows[0],
      members: membersRes.rows,
      stats: {
        totalRuns: parseInt(stats.total_runs, 10),
        completedRuns: parseInt(stats.completed_runs, 10),
        runningRuns: parseInt(stats.running_runs, 10),
        pendingApprovals: parseInt(stats.pending_approvals, 10),
        failedRuns: parseInt(stats.failed_runs, 10),
      },
    },
  });
});

export default router;
