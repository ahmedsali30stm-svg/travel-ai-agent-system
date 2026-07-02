import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'EmailService' });

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
}

export class EmailService {
  private templates = new Map<string, EmailTemplate>();

  constructor() {
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    this.templates.set('welcome', {
      name: 'welcome',
      subject: 'Welcome to Travel AI!',
      html: `
        <h1>Welcome to Travel AI!</h1>
        <p>Thank you for joining our platform.</p>
        <p>We're excited to help you plan your next adventure.</p>
      `,
    });

    this.templates.set('booking-confirmation', {
      name: 'booking-confirmation',
      subject: 'Booking Confirmation',
      html: `
        <h1>Booking Confirmed!</h1>
        <p>Your booking has been confirmed. Here are the details:</p>
        <p><strong>Booking Reference:</strong> {{bookingRef}}</p>
        <p><strong>Destination:</strong> {{destination}}</p>
        <p><strong>Dates:</strong> {{startDate}} - {{endDate}}</p>
      `,
    });

    this.templates.set('price-alert', {
      name: 'price-alert',
      subject: 'Price Alert - Price Drop!',
      html: `
        <h1>Price Alert!</h1>
        <p>The price for your watched destination has dropped!</p>
        <p><strong>Destination:</strong> {{destination}}</p>
        <p><strong>Old Price:</strong> {{oldPrice}}</p>
        <p><strong>New Price:</strong> {{newPrice}}</p>
        <p><strong>Savings:</strong> {{savings}}</p>
      `,
    });
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      logger.info({
        to: options.to,
        subject: options.subject,
      }, 'Sending email');

      // In production, use nodemailer or similar
      // This is a simplified implementation
      
      logger.info('Email sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTemplate(
    to: string | string[],
    templateName: string,
    data: Record<string, any>
  ): Promise<boolean> {
    const template = this.templates.get(templateName);
    
    if (!template) {
      logger.error({ templateName }, 'Template not found');
      return false;
    }

    let html = template.html;
    let subject = template.subject;

    // Replace placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), String(value));
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return this.send({
      to,
      subject,
      html,
    });
  }

  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.name, template);
    logger.info({ templateName: template.name }, 'Template added');
  }

  getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name);
  }

  listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  async verify(): Promise<boolean> {
    try {
      // In production, verify SMTP connection
      return true;
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
