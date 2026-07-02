import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';
import { emailService } from '../services/notification/EmailService.js';
import { smsService } from '../services/notification/SmsService.js';
import { paymentService } from '../services/payment/PaymentService.js';
import { searchAnalytics } from '../services/analytics/SearchAnalytics.js';
import { userAnalytics } from '../services/analytics/UserAnalytics.js';

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
    
    // Verify service connections
    await Promise.all([
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
