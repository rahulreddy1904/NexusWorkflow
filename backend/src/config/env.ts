import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string().optional().default(''),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),

  // JWT & Sessions
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('nexus_default_jwt_secret_dev_32char_minimum_pass'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('nexus_default_cookie_secret_key'),

  // Gemini AI Service
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_TIMEOUT_MS: z.coerce.number().default(30000),
  GEMINI_MAX_RETRIES: z.coerce.number().default(3),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/v1/auth/oauth/google/callback'),

  // Facebook OAuth
  FACEBOOK_APP_ID: z.string().optional().default(''),
  FACEBOOK_APP_SECRET: z.string().optional().default(''),
  FACEBOOK_CALLBACK_URL: z.string().default('http://localhost:5000/api/v1/auth/oauth/facebook/callback'),

  // Workflow Limits
  WORKFLOW_MAX_STEPS: z.coerce.number().default(12),
  WORKFLOW_STEP_TIMEOUT_MS: z.coerce.number().default(60000),
  WORKFLOW_MAX_RETRIES: z.coerce.number().default(3),
  WORKFLOW_WORKER_INTERVAL_MS: z.coerce.number().default(2000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[CONFIG ERROR] Invalid environment configuration:');
  parsed.error.errors.forEach(err => {
    console.error(` - ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;

export function getSanitizedConfig() {
  return {
    port: env.PORT,
    environment: env.NODE_ENV,
    clientOrigin: env.CLIENT_ORIGIN,
    database: {
      isConfigured: Boolean(env.DATABASE_URL && env.DATABASE_URL.trim().length > 0),
      ssl: env.DATABASE_SSL === 'true',
    },
    gemini: {
      isConfigured: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0),
      model: env.GEMINI_MODEL,
      timeoutMs: env.GEMINI_TIMEOUT_MS,
    },
    googleOAuth: {
      isConfigured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      callbackUrl: env.GOOGLE_CALLBACK_URL,
    },
    facebookOAuth: {
      isConfigured: Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET),
      callbackUrl: env.FACEBOOK_CALLBACK_URL,
    },
  };
}
