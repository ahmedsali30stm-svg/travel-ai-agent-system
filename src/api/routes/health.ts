import { Router, Request, Response } from 'express';
import { config } from '../../config/index.js';

export const healthRoutes = Router();

healthRoutes.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: config.app.version,
      environment: config.app.env,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});

healthRoutes.get('/ready', (req: Request, res: Response) => {
  // Check database, redis, etc.
  const checks = {
    database: true, // Check actual DB connection
    redis: true,    // Check actual Redis connection
    providers: true, // Check provider API health
  };

  const isReady = Object.values(checks).every(Boolean);

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    data: {
      status: isReady ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    },
  });
});

healthRoutes.get('/live', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
    },
  });
});
