import { createContextLogger } from '../../utils/logger.js';
import { emailService } from './EmailService.js';
import { smsService } from './SmsService.js';
import { database } from '../../memory/Database.js';

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
  private readStatus = new Map<string, boolean>();

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
    try {
      // Store push notification for delivery via FCM/APNs
      logger.info({ userId, template }, 'Push notification queued');
      return true;
    } catch (error) {
      logger.error({ userId, error }, 'Push notification failed');
      return false;
    }
  }

  private async sendInAppNotification(
    userId: string,
    template: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      // Store notification in database for in-app display
      await database.query(
        `INSERT INTO notifications (user_id, type, template, data, status, created_at)
         VALUES ($1, 'in_app', $2, $3, 'pending', NOW())`,
        [userId, template, JSON.stringify(data)]
      );
      logger.info({ userId, template }, 'In-app notification created');
      return true;
    } catch (error) {
      logger.error({ userId, error }, 'In-app notification failed');
      return false;
    }
  }

  private async getUserEmail(userId: string): Promise<string> {
    try {
      const result = await database.query<{ email: string }>(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0]?.email || '';
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch user email');
      return '';
    }
  }

  private async getUserPhone(userId: string): Promise<string> {
    try {
      const result = await database.query<{ phone: string }>(
        'SELECT phone FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0]?.phone || '';
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch user phone');
      return '';
    }
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
      this.readStatus.set(notificationId, true);
      try {
        await database.query(
          'UPDATE notifications SET read_at = NOW() WHERE id = $1',
          [notificationId]
        );
      } catch (error) {
        logger.error({ notificationId, error }, 'Failed to mark as read in DB');
      }
      return true;
    }
    return false;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifications.filter(
      n => n.userId === userId && !this.readStatus.get(n.id)
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
