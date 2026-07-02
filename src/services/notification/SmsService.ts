import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'SmsService' });

interface SmsOptions {
  to: string;
  message: string;
  sender?: string;
}

interface SmsTemplate {
  name: string;
  message: string;
}

export class SmsService {
  private templates = new Map<string, SmsTemplate>();

  constructor() {
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    this.templates.set('verification', {
      name: 'verification',
      message: 'Your verification code is: {{code}}',
    });

    this.templates.set('booking-confirmation', {
      name: 'booking-confirmation',
      message: 'Your booking {{bookingRef}} is confirmed. Check your email for details.',
    });

    this.templates.set('price-alert', {
      name: 'price-alert',
      message: 'Price drop alert for {{destination}}! New price: {{newPrice}}',
    });
  }

  async send(options: SmsOptions): Promise<boolean> {
    try {
      logger.info({
        to: options.to,
        messageLength: options.message.length,
      }, 'Sending SMS');

      // In production, use Twilio, AWS SNS, or similar
      // This is a simplified implementation
      
      logger.info('SMS sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return false;
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    data: Record<string, any>
  ): Promise<boolean> {
    const template = this.templates.get(templateName);
    
    if (!template) {
      logger.error({ templateName }, 'Template not found');
      return false;
    }

    let message = template.message;

    // Replace placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return this.send({
      to,
      message,
    });
  }

  addTemplate(template: SmsTemplate): void {
    this.templates.set(template.name, template);
    logger.info({ templateName: template.name }, 'Template added');
  }

  getTemplate(name: string): SmsTemplate | undefined {
    return this.templates.get(name);
  }

  listTemplates(): SmsTemplate[] {
    return Array.from(this.templates.values());
  }

  async verify(): Promise<boolean> {
    try {
      // In production, verify SMS provider connection
      return true;
    } catch (error) {
      logger.error('SMS service verification failed:', error);
      return false;
    }
  }
}

export const smsService = new SmsService();
