import { Router, Request, Response } from 'express';
import { checkDbHealth } from '../db/connection.js';
import { geminiService } from '../services/ai/gemini.service.js';
import { getOAuthStatus } from '../services/oauth/oauth.service.js';
import { env, getSanitizedConfig } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Full integrations and system status
router.get('/status', authenticate, async (req: Request, res: Response) => {
  const dbHealth = await checkDbHealth();
  const oauth = getOAuthStatus();
  const isGeminiConfigured = geminiService.isConfigured();

  res.json({
    success: true,
    data: {
      system: {
        environment: env.NODE_ENV,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
      database: {
        mode: dbHealth.mode,
        connected: dbHealth.connected,
        type: dbHealth.type,
        host: dbHealth.host,
        latencyMs: dbHealth.latencyMs,
        isSupabase: dbHealth.mode === 'supabase_postgres',
        instructions: dbHealth.mode === 'local_postgres_emulator'
          ? 'To connect Supabase PostgreSQL, add DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres in backend/.env'
          : 'Connected to live Supabase PostgreSQL.',
      },
      geminiAi: {
        configured: isGeminiConfigured,
        model: env.GEMINI_MODEL,
        timeoutMs: env.GEMINI_TIMEOUT_MS,
        maxRetries: env.GEMINI_MAX_RETRIES,
        status: isGeminiConfigured ? 'READY' : 'CONFIGURATION_REQUIRED',
        instructions: isGeminiConfigured
          ? 'Gemini API is active. Real multi-agent planning and reasoning is enabled.'
          : 'Add GEMINI_API_KEY in backend/.env to enable live Google Gemini multi-agent reasoning. Free API key available at https://aistudio.google.com/app/apikey',
      },
      oauth: {
        google: oauth.google,
        facebook: oauth.facebook,
      },
      limits: {
        maxStepsPerWorkflow: env.WORKFLOW_MAX_STEPS,
        stepTimeoutMs: env.WORKFLOW_STEP_TIMEOUT_MS,
        maxRetries: env.WORKFLOW_MAX_RETRIES,
      },
    },
  });
});

export default router;
