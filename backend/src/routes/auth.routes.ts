import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { query } from '../db/connection.js';
import { hashPassword, verifyPassword, signJwt } from '../utils/security.js';
import { getOAuthStatus, getGoogleAuthUrl, exchangeGoogleCode, getFacebookAuthUrl, exchangeFacebookCode } from '../services/oauth/oauth.service.js';
import { recordAuditEvent } from '../services/engine/workflow.engine.js';
import { env } from '../config/env.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(2).max(100),
  workspaceName: z.string().min(2).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password, name, workspaceName } = req.body;

  // Check existing user
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'An account with this email address already exists.' },
    });
    return;
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const passwordHash = await hashPassword(password);

  await query(`
    INSERT INTO users (id, email, password_hash, name)
    VALUES ($1, $2, $3, $4)
  `, [userId, email, passwordHash, name]);

  // Create primary workspace
  const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const wsTitle = workspaceName || `${name.split(' ')[0]}'s Workspace`;
  const slug = `${wsTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 5)}`;

  await query(`
    INSERT INTO workspaces (id, name, slug, owner_id)
    VALUES ($1, $2, $3, $4)
  `, [wsId, wsTitle, slug, userId]);

  await query(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role)
    VALUES ($1, $2, $3, 'owner')
  `, [`wsm_${Date.now()}`, wsId, userId]);

  const token = signJwt({
    userId,
    email,
    workspaceId: wsId,
    role: 'owner',
  });

  // Set HTTP-only cookie
  res.cookie('nexus_session', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await recordAuditEvent({
    workspaceId: wsId,
    eventType: 'auth.register',
    actorType: 'user',
    actorId: userId,
    payload: { email },
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: { id: userId, email, name, avatarUrl: null },
      workspace: { id: wsId, name: wsTitle, slug, role: 'owner' },
    },
  });
});

// Login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
    return;
  }

  const user = userRes.rows[0];
  if (!user.password_hash) {
    res.status(400).json({
      success: false,
      error: { code: 'OAUTH_ONLY_ACCOUNT', message: 'This account uses single sign-on. Please sign in with Google or Facebook.' },
    });
    return;
  }

  const matches = await verifyPassword(password, user.password_hash);
  if (!matches) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
    return;
  }

  // Get workspace membership
  const memberRes = await query(`
    SELECT wm.workspace_id, wm.role, w.name as workspace_name, w.slug
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.user_id = $1
    LIMIT 1
  `, [user.id]);

  const ws = memberRes.rows[0] || {
    workspace_id: 'ws_acme_ops_01',
    role: 'operator',
    workspace_name: 'Default Workspace',
    slug: 'default',
  };

  const token = signJwt({
    userId: user.id,
    email: user.email,
    workspaceId: ws.workspace_id,
    role: ws.role,
  });

  res.cookie('nexus_session', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await recordAuditEvent({
    workspaceId: ws.workspace_id,
    eventType: 'auth.login',
    actorType: 'user',
    actorId: user.id,
    payload: { email },
  });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url },
      workspace: { id: ws.workspace_id, name: ws.workspace_name, slug: ws.slug, role: ws.role },
    },
  });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('nexus_session');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Current User Session
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const userRes = await query('SELECT id, email, name, avatar_url, created_at FROM users WHERE id = $1', [req.user!.userId]);
  if (userRes.rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return;
  }

  const memberRes = await query(`
    SELECT wm.workspace_id, wm.role, w.name as workspace_name, w.slug
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.user_id = $1
    LIMIT 1
  `, [req.user!.userId]);

  const ws = memberRes.rows[0];

  res.json({
    success: true,
    data: {
      user: userRes.rows[0],
      workspace: ws ? { id: ws.workspace_id, name: ws.workspace_name, slug: ws.slug, role: ws.role } : null,
    },
  });
});

// OAuth Provider Status
router.get('/oauth/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: getOAuthStatus(),
  });
});

// Google OAuth Initiation
router.get('/oauth/google', (req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(2, 15);
  const result = getGoogleAuthUrl(state);

  if (!result.configured) {
    res.status(503).json({
      success: false,
      configured: false,
      error: {
        code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
        message: 'Google OAuth Client ID & Secret have not been configured in backend environment.',
      },
      details: result.details,
    });
    return;
  }

  res.json({
    success: true,
    configured: true,
    redirectUrl: result.url,
  });
});

// Google OAuth Callback
router.get('/oauth/google/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    res.redirect(`${env.CLIENT_ORIGIN}/login?oauth_error=${encodeURIComponent(String(error))}`);
    return;
  }

  if (!code) {
    res.redirect(`${env.CLIENT_ORIGIN}/login?oauth_error=Missing+authorization+code`);
    return;
  }

  try {
    const token = await exchangeGoogleCode(String(code));
    res.cookie('nexus_session', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${env.CLIENT_ORIGIN}/auth/callback?token=${token}`);
  } catch (err: any) {
    res.redirect(`${env.CLIENT_ORIGIN}/login?oauth_error=${encodeURIComponent(err.message)}`);
  }
});

// Facebook OAuth Initiation
router.get('/oauth/facebook', (req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(2, 15);
  const result = getFacebookAuthUrl(state);

  if (!result.configured) {
    res.status(503).json({
      success: false,
      configured: false,
      error: {
        code: 'FACEBOOK_OAUTH_NOT_CONFIGURED',
        message: 'Facebook App ID & Secret have not been configured in backend environment.',
      },
      details: result.details,
    });
    return;
  }

  res.json({
    success: true,
    configured: true,
    redirectUrl: result.url,
  });
});

// Facebook OAuth Callback
router.get('/oauth/facebook/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    res.redirect(`${env.CLIENT_ORIGIN}/login?oauth_error=${encodeURIComponent(String(error))}`);
    return;
  }

  if (!code) {
    res.redirect(`${env.CLIENT_ORIGIN}/login?oauth_error=Missing+authorization+code`);
    return;
  }

  try {
    const token = await exchangeFacebookCode(String(code));
    res.cookie('nexus_session', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${env.CLIENT_ORIGIN}/auth/callback?token=${token}`);
  } catch (err: any) {
    res.redirect(`${env.CLIENT_ORIGIN}/login?oauth_error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
