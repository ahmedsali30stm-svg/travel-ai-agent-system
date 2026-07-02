import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { requestLogger } from './api/middleware/requestLogger.js';
import { healthRoutes } from './api/routes/health.js';
import { searchRoutes } from './api/routes/search.js';
import { agentRoutes } from './api/routes/agents.js';
import { tripRoutes } from './api/routes/trips.js';
import { authRoutes } from './api/routes/auth.js';
import { database } from './memory/Database.js';
import { redis } from './memory/RedisCache.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.app.env === 'production'
    ? (process.env.CORS_ORIGINS || '').split(',').filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.window,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check (no auth required)
app.use('/health', healthRoutes);

// API routes
app.use(`/api/${config.app.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.app.apiVersion}/search`, searchRoutes);
app.use(`/api/${config.app.apiVersion}/agents`, agentRoutes);
app.use(`/api/${config.app.apiVersion}/trips`, tripRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
app.use(errorHandler);

// Start server
async function bootstrap() {
  try {
    // Initialize database connection
    await database.connect();
    logger.info('Database connected');

    // Initialize Redis
    await redis.connect();
    logger.info('Redis connected');

    app.listen(config.app.port, () => {
      logger.info(`🚀 Server running on port ${config.app.port}`);
      logger.info(`📊 Environment: ${config.app.env}`);
      logger.info(`🔗 API: http://localhost:${config.app.port}/api/${config.app.apiVersion}`);
      logger.info(`❤️  Health: http://localhost:${config.app.port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await database.disconnect();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await database.disconnect();
  await redis.disconnect();
  process.exit(0);
});

bootstrap();

export default app;
