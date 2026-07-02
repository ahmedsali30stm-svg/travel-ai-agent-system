import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';
import { emailService } from './notification/EmailService.js';
import { smsService } from './notification/SmsService.js';
import { paymentService } from './payment/PaymentService.js';
import { searchAnalytics } from './analytics/SearchAnalytics.js';
import { userAnalytics } from './analytics/UserAnalytics.js';
import { database } from '../memory/Database.js';
import { redis } from '../memory/RedisCache.js';

const logger = createContextLogger({ component: 'ServiceIndex' });

export const services = {
  email: emailService,
  sms: smsService,
  payment: paymentService,
  searchAnalytics: searchAnalytics,
  userAnalytics: userAnalytics,
};

export const initializeServices = async (): Promise<void> => {
  try {
    logger.info('Initializing services...');

    // Verify database connection
    const dbHealthy = await database.healthCheck();
    if (!dbHealthy) {
      logger.warn('Database health check failed - services may be degraded');
    }

    // Verify Redis connection
    const redisHealthy = await redis.ping();
    if (!redisHealthy) {
      logger.warn('Redis health check failed - caching disabled');
    }

    // Verify external service connections
    await Promise.allSettled([
      emailService.verify(),
      smsService.verify(),
      paymentService.verify(),
    ]);

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Service initialization failed:', error);
    throw error;
  }
};

export default services;
