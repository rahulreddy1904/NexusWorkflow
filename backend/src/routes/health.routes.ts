import { Router, Request, Response } from 'express';
import { checkDbHealth } from '../db/connection.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'nexus-workflow-api',
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  const db = await checkDbHealth();
  if (!db.connected) {
    res.status(503).json({
      status: 'unready',
      database: db,
    });
    return;
  }

  res.json({
    status: 'ready',
    database: {
      mode: db.mode,
      connected: db.connected,
      latencyMs: db.latencyMs,
    },
  });
});

export default router;
