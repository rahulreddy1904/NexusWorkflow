import axios from 'axios';
import { env } from '../../config/env.js';
import { query } from '../../db/connection.js';
import { signJwt } from '../../utils/security.js';
import { logger } from '../../utils/logger.js';

export interface OAuthProviderStatus {
  provider: 'google' | 'facebook';
  configured: boolean;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  callbackUrl: string;
  missingEnv: string[];
  setupGuideUrl: string;
}

export function getOAuthStatus(): { google: OAuthProviderStatus; facebook: OAuthProviderStatus } {
  const googleMissing: string[] = [];
  if (!env.GOOGLE_CLIENT_ID) googleMissing.push('GOOGLE_CLIENT_ID');
  if (!env.GOOGLE_CLIENT_SECRET) googleMissing.push('GOOGLE_CLIENT_SECRET');

  const fbMissing: string[] = [];
  if (!env.FACEBOOK_APP_ID) fbMissing.push('FACEBOOK_APP_ID');
  if (!env.FACEBOOK_APP_SECRET) fbMissing.push('FACEBOOK_APP_SECRET');

  return {
    google: {
      provider: 'google',
      configured: googleMissing.length === 0,
      clientIdConfigured: Boolean(env.GOOGLE_CLIENT_ID),
      clientSecretConfigured: Boolean(env.GOOGLE_CLIENT_SECRET),
      callbackUrl: env.GOOGLE_CALLBACK_URL,
      missingEnv: googleMissing,
      setupGuideUrl: 'https://console.cloud.google.com/apis/credentials',
    },
    facebook: {
      provider: 'facebook',
      configured: fbMissing.length === 0,
      clientIdConfigured: Boolean(env.FACEBOOK_APP_ID),
      clientSecretConfigured: Boolean(env.FACEBOOK_APP_SECRET),
      callbackUrl: env.FACEBOOK_CALLBACK_URL,
      missingEnv: fbMissing,
      setupGuideUrl: 'https://developers.facebook.com/apps/',
    },
  };
}

export function getGoogleAuthUrl(state: string): { url?: string; configured: boolean; details?: OAuthProviderStatus } {
  const status = getOAuthStatus().google;
  if (!status.configured) {
    return { configured: false, details: status };
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  return {
    configured: true,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  };
}

export async function exchangeGoogleCode(code: string): Promise<string> {
  const status = getOAuthStatus().google;
  if (!status.configured) {
    throw new Error('Google OAuth is not configured in backend environment.');
  }

  // 1. Exchange code for tokens
  const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    grant_type: 'authorization_code',
  });

  const { access_token } = tokenRes.data;

  // 2. Fetch verified user profile
  const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = userRes.data;
  if (!profile.email) {
    throw new Error('Google OAuth response did not contain a verified email address.');
  }

  return await findOrCreateOAuthUser({
    provider: 'google',
    providerUserId: profile.sub,
    email: profile.email,
    name: profile.name || profile.email.split('@')[0],
    avatarUrl: profile.picture,
  });
}

export function getFacebookAuthUrl(state: string): { url?: string; configured: boolean; details?: OAuthProviderStatus } {
  const status = getOAuthStatus().facebook;
  if (!status.configured) {
    return { configured: false, details: status };
  }

  const params = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID,
    redirect_uri: env.FACEBOOK_CALLBACK_URL,
    state,
    scope: 'email,public_profile',
    response_type: 'code',
  });

  return {
    configured: true,
    url: `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`,
  };
}

export async function exchangeFacebookCode(code: string): Promise<string> {
  const status = getOAuthStatus().facebook;
  if (!status.configured) {
    throw new Error('Facebook OAuth is not configured in backend environment.');
  }

  // 1. Exchange code for access token
  const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
    params: {
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      redirect_uri: env.FACEBOOK_CALLBACK_URL,
      code,
    },
  });

  const { access_token } = tokenRes.data;

  // 2. Fetch user profile
  const userRes = await axios.get('https://graph.facebook.com/me', {
    params: {
      fields: 'id,name,email,picture',
      access_token,
    },
  });

  const profile = userRes.data;
  const email = profile.email || `${profile.id}@facebook.oauth.user`;

  return await findOrCreateOAuthUser({
    provider: 'facebook',
    providerUserId: profile.id,
    email,
    name: profile.name || 'Facebook User',
    avatarUrl: profile.picture?.data?.url,
  });
}

async function findOrCreateOAuthUser(data: {
  provider: 'google' | 'facebook';
  providerUserId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<string> {
  // Check if identity exists
  const identityRes = await query(
    'SELECT * FROM auth_identities WHERE provider = $1 AND provider_user_id = $2',
    [data.provider, data.providerUserId]
  );

  let userId: string;

  if (identityRes.rows.length > 0) {
    userId = identityRes.rows[0].user_id;
    // Update user info
    await query(
      'UPDATE users SET name = COALESCE($1, name), avatar_url = COALESCE($2, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [data.name, data.avatarUrl, userId]
    );
  } else {
    // Check if user exists by email
    const userRes = await query('SELECT * FROM users WHERE email = $1', [data.email]);

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
    } else {
      userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await query(
        'INSERT INTO users (id, email, name, avatar_url) VALUES ($1, $2, $3, $4)',
        [userId, data.email, data.name, data.avatarUrl || null]
      );

      // Create workspace for user
      const wsId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 5)}`;
      await query(
        'INSERT INTO workspaces (id, name, slug, owner_id) VALUES ($1, $2, $3, $4)',
        [wsId, `${data.name}'s Workspace`, slug, userId]
      );
      await query(
        'INSERT INTO workspace_members (id, workspace_id, user_id, role) VALUES ($1, $2, $3, $4)',
        [`wsm_${Date.now()}`, wsId, userId, 'owner']
      );
    }

    // Link identity
    const identityId = `ident_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await query(
      'INSERT INTO auth_identities (id, user_id, provider, provider_user_id, provider_email) VALUES ($1, $2, $3, $4, $5)',
      [identityId, userId, data.provider, data.providerUserId, data.email]
    );
  }

  // Get workspace membership
  const memberRes = await query(
    'SELECT workspace_id, role FROM workspace_members WHERE user_id = $1 LIMIT 1',
    [userId]
  );

  const workspaceId = memberRes.rows[0]?.workspace_id || 'ws_acme_ops_01';
  const role = memberRes.rows[0]?.role || 'operator';

  return signJwt({
    userId,
    email: data.email,
    workspaceId,
    role,
  });
}
