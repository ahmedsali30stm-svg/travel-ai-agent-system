import { Router, Request, Response } from 'express';
import { config } from '../../config/index.js';
import { database } from '../../memory/Database.js';
import { redis } from '../../memory/RedisCache.js';
import { healthChecker } from '../../utils/healthCheck.js';

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

healthRoutes.get('/ready', async (req: Request, res: Response) => {
  const dbHealthy = await database.healthCheck();
  const redisHealthy = await redis.ping();

  const checks = {
    database: dbHealthy,
    redis: redisHealthy,
    providers: true,
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

healthRoutes.get('/detailed', async (req: Request, res: Response) => {
  const results = await healthChecker.checkAll();
  const allHealthy = results.every(r => r.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      checks: results,
      timestamp: new Date().toISOString(),
    },
  });
});
