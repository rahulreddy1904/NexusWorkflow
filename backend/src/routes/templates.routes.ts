import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../db/connection.js';

const router = Router();

// List templates
router.get('/', authenticate, async (req: Request, res: Response) => {
  const result = await query(`
    SELECT * FROM workflow_templates
    WHERE is_system = true OR workspace_id = $1
    ORDER BY is_system DESC, name ASC
  `, [req.user!.workspaceId]);

  res.json({ success: true, data: result.rows });
});

// Get template by id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await query(`
    SELECT * FROM workflow_templates
    WHERE id = $1 AND (is_system = true OR workspace_id = $2)
  `, [req.params.id, req.user!.workspaceId]);

  if (result.rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Template not found.' } });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
});

export default router;
