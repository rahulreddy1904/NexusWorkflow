import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { query } from '../db/connection.js';
import { signJwt } from '../utils/security.js';
import { recordAuditEvent } from '../services/engine/workflow.engine.js';
import { env } from '../config/env.js';

const router = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
});

const joinWorkspaceSchema = z.object({
  joinCode: z.string().min(3, 'Join code is required'),
});

const switchWorkspaceSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

function generateUniqueJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NX-${random}`;
}

// 1. Get current active workspace details, members, and stats
router.get('/current', authenticate, async (req: Request, res: Response) => {
  const currentWsId = req.user!.workspaceId;
  if (!currentWsId) {
    res.status(404).json({
      success: false,
      error: { code: 'NO_ACTIVE_WORKSPACE', message: 'You have not joined or created a workspace yet.' }
    });
    return;
  }

  const wsRes = await query('SELECT * FROM workspaces WHERE id = $1', [currentWsId]);
  if (wsRes.rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Workspace not found' } });
    return;
  }

  const ws = wsRes.rows[0];

  // If join_code is missing for whatever reason, generate and persist one
  if (!ws.join_code) {
    const newCode = generateUniqueJoinCode();
    await query('UPDATE workspaces SET join_code = $1 WHERE id = $2', [newCode, ws.id]);
    ws.join_code = newCode;
  }

  // Members
  const membersRes = await query(`
    SELECT wm.id, wm.role, wm.created_at, u.name, u.email, u.avatar_url
    FROM workspace_members wm
    JOIN users u ON u.id = wm.user_id
    WHERE wm.workspace_id = $1
    ORDER BY wm.created_at ASC
  `, [currentWsId]);

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
  `, [currentWsId]);

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
      workspace: ws,
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

// 2. List all workspaces the authenticated user belongs to
router.get('/my-workspaces', authenticate, async (req: Request, res: Response) => {
  const result = await query(`
    SELECT w.id, w.name, w.slug, w.join_code, w.owner_id, wm.role, wm.created_at as joined_at,
           (w.id = $2) as is_active
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.user_id = $1
    ORDER BY wm.created_at ASC
  `, [req.user!.userId, req.user!.workspaceId || '']);

  res.json({
    success: true,
    data: result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      joinCode: row.join_code,
      role: row.role,
      isOwner: row.role === 'owner',
      isActive: Boolean(row.is_active),
      joinedAt: row.joined_at,
    })),
  });
});

// 3. Create a brand-new workspace (User becomes Owner with new Join Code)
router.post('/create', authenticate, validateBody(createWorkspaceSchema), async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = req.user!.userId;
  const userEmail = req.user!.email;

  const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 5)}`;
  const joinCode = generateUniqueJoinCode();

  await query(`
    INSERT INTO workspaces (id, name, slug, join_code, owner_id)
    VALUES ($1, $2, $3, $4, $5)
  `, [wsId, name.trim(), slug, joinCode, userId]);

  await query(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role)
    VALUES ($1, $2, $3, 'owner')
  `, [`wsm_${Date.now()}`, wsId, userId]);

  const token = signJwt({
    userId,
    email: userEmail,
    workspaceId: wsId,
    role: 'owner',
  });

  res.cookie('nexus_session', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await recordAuditEvent({
    workspaceId: wsId,
    eventType: 'workspace.created',
    actorType: 'user',
    actorId: userId,
    payload: { name: name.trim(), joinCode },
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      workspace: {
        id: wsId,
        name: name.trim(),
        slug,
        joinCode,
        role: 'owner',
      },
    },
  });
});

// 4. Join an existing workspace via Invite/Join Code (User becomes Operator/Member)
router.post('/join', authenticate, validateBody(joinWorkspaceSchema), async (req: Request, res: Response) => {
  const cleanCode = req.body.joinCode.trim().toUpperCase();
  const userId = req.user!.userId;
  const userEmail = req.user!.email;

  const wsRes = await query('SELECT * FROM workspaces WHERE UPPER(join_code) = $1', [cleanCode]);
  if (wsRes.rows.length === 0) {
    res.status(404).json({
      success: false,
      error: { code: 'INVALID_JOIN_CODE', message: `Workspace join code '${req.body.joinCode}' not found. Please confirm the code with your team owner.` },
    });
    return;
  }

  const targetWs = wsRes.rows[0];

  // Check if user is already a member
  const memberRes = await query(
    'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
    [targetWs.id, userId]
  );

  let role = 'operator';
  if (memberRes.rows.length > 0) {
    role = memberRes.rows[0].role;
  } else {
    // If user is actually the creator, retain owner, else operator
    if (targetWs.owner_id === userId) {
      role = 'owner';
    }
    await query(`
      INSERT INTO workspace_members (id, workspace_id, user_id, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (workspace_id, user_id) DO NOTHING
    `, [`wsm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, targetWs.id, userId, role]);
  }

  const token = signJwt({
    userId,
    email: userEmail,
    workspaceId: targetWs.id,
    role,
  });

  res.cookie('nexus_session', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await recordAuditEvent({
    workspaceId: targetWs.id,
    eventType: 'workspace.joined',
    actorType: 'user',
    actorId: userId,
    payload: { codeUsed: cleanCode, role },
  });

  res.json({
    success: true,
    data: {
      token,
      workspace: {
        id: targetWs.id,
        name: targetWs.name,
        slug: targetWs.slug,
        joinCode: targetWs.join_code,
        role,
      },
    },
  });
});

// 5. Switch active workspace (for users in multiple workspaces)
router.post('/switch', authenticate, validateBody(switchWorkspaceSchema), async (req: Request, res: Response) => {
  const { workspaceId } = req.body;
  const userId = req.user!.userId;
  const userEmail = req.user!.email;

  const memberRes = await query(`
    SELECT wm.role, w.name, w.slug, w.join_code
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.workspace_id = $1 AND wm.user_id = $2
  `, [workspaceId, userId]);

  if (memberRes.rows.length === 0) {
    res.status(403).json({
      success: false,
      error: { code: 'NOT_A_MEMBER', message: 'You are not a member of this workspace.' },
    });
    return;
  }

  const ws = memberRes.rows[0];
  const token = signJwt({
    userId,
    email: userEmail,
    workspaceId,
    role: ws.role,
  });

  res.cookie('nexus_session', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      token,
      workspace: {
        id: workspaceId,
        name: ws.name,
        slug: ws.slug,
        joinCode: ws.join_code,
        role: ws.role,
      },
    },
  });
});

// 6. Regenerate Join Code (Owner only)
router.post('/regenerate-code', authenticate, async (req: Request, res: Response) => {
  const currentWsId = req.user!.workspaceId;
  const role = req.user!.role;

  if (role !== 'owner') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only workspace owners can regenerate the team join code.' },
    });
    return;
  }

  const newCode = generateUniqueJoinCode();
  await query('UPDATE workspaces SET join_code = $1 WHERE id = $2', [newCode, currentWsId]);

  res.json({
    success: true,
    data: {
      joinCode: newCode,
    },
  });
});

export default router;
