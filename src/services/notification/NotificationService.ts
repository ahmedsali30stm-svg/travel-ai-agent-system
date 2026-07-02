import { createContextLogger } from '../utils/logger.js';
import { emailService } from './EmailService.js';
import { smsService } from './SmsService.js';

const logger = createContextLogger({ component: 'NotificationService' });

interface NotificationOptions {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  template: string;
  data: Record<string, any>;
  channels?: ('email' | 'sms' | 'push' | 'in_app')[];
}

interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  template: string;
  data: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  error?: string;
}

export class NotificationService {
  private notifications: NotificationRecord[] = [];

  async send(options: NotificationOptions): Promise<boolean> {
    const channels = options.channels || [options.type];
    const results: boolean[] = [];

    for (const channel of channels) {
      try {
        let success = false;

        switch (channel) {
          case 'email':
            success = await emailService.sendTemplate(
              await this.getUserEmail(options.userId),
              options.template,
              options.data
            );
            break;

          case 'sms':
            success = await smsService.sendTemplate(
              await this.getUserPhone(options.userId),
              options.template,
              options.data
            );
            break;

          case 'push':
            success = await this.sendPushNotification(
              options.userId,
              options.template,
              options.data
            );
            break;

          case 'in_app':
            success = await this.sendInAppNotification(
              options.userId,
              options.template,
              options.data
            );
            break;
        }

        results.push(success);

        // Record notification
        this.recordNotification({
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: options.userId,
          type: channel,
          template: options.template,
          data: options.data,
          status: success ? 'sent' : 'failed',
          createdAt: new Date(),
          sentAt: success ? new Date() : undefined,
        });

      } catch (error) {
        results.push(false);
        logger.error({
          userId: options.userId,
          channel,
          template: options.template,
          error,
        }, 'Failed to send notification');
      }
    }

    return results.some(r => r);
  }

  private async sendPushNotification(
    userId: string,
    template: string,
    data: Record<string, any>
  ): Promise<boolean> {
    // In production, use Firebase Cloud Messaging or similar
    logger.info({ userId, template }, 'Push notification sent');
    return true;
  }

  private async sendInAppNotification(
    userId: string,
    template: string,
    data: Record<string, any>
  ): Promise<boolean> {
    // Store notification in database for in-app display
    logger.info({ userId, template }, 'In-app notification created');
    return true;
  }

  private async getUserEmail(userId: string): Promise<string> {
    // In production, fetch from database
    return 'user@example.com';
  }

  private async getUserPhone(userId: string): Promise<string> {
    // In production, fetch from database
    return '+1234567890';
  }

  private recordNotification(record: NotificationRecord): void {
    this.notifications.push(record);
    
    // Keep only last 1000 notifications in memory
    if (this.notifications.length > 1000) {
      this.notifications = this.notifications.slice(-1000);
    }
  }

  async getUserNotifications(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<NotificationRecord[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      // In production, update database
      return true;
    }
    return false;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifications.filter(
      n => n.userId === userId && n.status === 'sent'
    ).length;
  }

  async verify(): Promise<boolean> {
    try {
      const [emailOk, smsOk] = await Promise.all([
        emailService.verify(),
        smsService.verify(),
      ]);
      return emailOk && smsOk;
    } catch (error) {
      logger.error('Notification service verification failed:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
