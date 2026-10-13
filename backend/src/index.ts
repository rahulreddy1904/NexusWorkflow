import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { runMigrations } from './db/migrator.js';
import { seedDevelopmentData } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import workflowRoutes from './routes/workflows.routes.js';
import approvalRoutes from './routes/approvals.routes.js';
import templateRoutes from './routes/templates.routes.js';
import auditRoutes from './routes/audit.routes.js';
import configRoutes from './routes/config.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import healthRoutes from './routes/health.routes.js';

export const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigins = [
  ...env.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) return callback(null, true);
    if (
      allowedOrigins.includes(requestOrigin) ||
      allowedOrigins.includes('*') ||
      /^http:\/\/localhost:\d+$/.test(requestOrigin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(requestOrigin)
    ) {
      return callback(null, true);
    }
    if (env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body Parsers & Cookies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication requests, please try again later.' } },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded, please slow down.' } },
});

// Mount Routes
app.use('/health', healthRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/workflows', apiLimiter, workflowRoutes);
app.use('/api/v1/approvals', apiLimiter, approvalRoutes);
app.use('/api/v1/templates', apiLimiter, templateRoutes);
app.use('/api/v1/audit', apiLimiter, auditRoutes);
app.use('/api/v1/config', apiLimiter, configRoutes);
app.use('/api/v1/workspaces', apiLimiter, workspaceRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server & Initialize Database
export async function startServer() {
  try {
    logger.info('Initializing NEXUS Workflow database...');
    await runMigrations();
    await seedDevelopmentData();

    const server = app.listen(env.PORT, () => {
      logger.info(`========================================================`);
      logger.info(`  NEXUS Workflow Engine running on http://localhost:${env.PORT}`);
      logger.info(`  Environment: ${env.NODE_ENV}`);
      logger.info(`  Client Origin: ${env.CLIENT_ORIGIN}`);
      logger.info(`  Gemini AI Key: ${env.GEMINI_API_KEY ? 'CONFIGURED (' + env.GEMINI_MODEL + ')' : 'NOT CONFIGURED (Using Rule-based Fallback)'}`);
      logger.info(`========================================================`);
    });

    const shutdown = () => {
      logger.info('Gracefully shutting down NEXUS Workflow backend...');
      server.close(() => {
        logger.info('Closed out remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err: any) {
    logger.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

// Start if executed directly
if (process.argv[1] && process.argv[1].endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  startServer();
}
