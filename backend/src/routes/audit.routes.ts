import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../db/connection.js';

const router = Router();

// List audit events
router.get('/', authenticate, async (req: Request, res: Response) => {
  if (!req.user!.workspaceId) {
    res.json({ success: true, data: [] });
    return;
  }

  const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
  const eventType = req.query.type as string;

  let sql = 'SELECT * FROM audit_events WHERE workspace_id = $1';
  const params: any[] = [req.user!.workspaceId];

  if (eventType && eventType !== 'all') {
    sql += ' AND event_type = $2';
    params.push(eventType);
  }

  sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
  params.push(limit);

  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
});

export default router;
