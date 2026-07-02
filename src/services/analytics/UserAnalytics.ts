import { createContextLogger } from '../../utils/logger.js';

const logger = createContextLogger({ component: 'UserAnalytics' });

interface UserEvent {
  id: string;
  userId: string;
  action: string;
  category: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
}

interface UserStats {
  totalEvents: number;
  uniqueActions: number;
  averageSessionDuration: number;
  topActions: { action: string; count: number }[];
  activeUsers: number;
  retentionRate: number;
}

export class UserAnalytics {
  private events: UserEvent[] = [];
  private maxEvents = 100000;

  async trackEvent(event: Omit<UserEvent, 'id' | 'timestamp'>): Promise<void> {
    const userEvent: UserEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.events.push(userEvent);

    // Trim events if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    logger.debug({
      eventId: userEvent.id,
      userId: userEvent.userId,
      action: userEvent.action,
    }, 'User event tracked');
  }

  async trackPageView(
    userId: string,
    page: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'page_view',
      category: 'navigation',
      label: page,
      metadata,
    });
  }

  async trackSearch(
    userId: string,
    query: string,
    resultsCount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'search',
      category: 'search',
      label: query,
      value: resultsCount,
      metadata,
    });
  }

  async trackBooking(
    userId: string,
    bookingId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'booking',
      category: 'commerce',
      label: bookingId,
      value: amount,
      metadata: {
        ...metadata,
        currency,
      },
    });
  }

  async trackConversion(
    userId: string,
    type: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      userId,
      action: 'conversion',
      category: 'goal',
      label: type,
      value,
      metadata,
    });
  }

  async getStats(options?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    sessionId?: string;
  }): Promise<UserStats> {
    let filteredEvents = this.events;

    if (options?.startDate) {
      filteredEvents = filteredEvents.filter(
        e => e.timestamp >= options.startDate!
      );
    }

    if (options?.endDate) {
      filteredEvents = filteredEvents.filter(
        e => e.timestamp <= options.endDate!
      );
    }

    if (options?.userId) {
      filteredEvents = filteredEvents.filter(
        e => e.userId === options.userId
      );
    }

    if (options?.sessionId) {
      filteredEvents = filteredEvents.filter(
        e => e.sessionId === options.sessionId
      );
    }

    const totalEvents = filteredEvents.length;
    const uniqueActions = new Set(filteredEvents.map(e => e.action)).size;

    // Average session duration - calculate from first to last event per session
    const sessionEvents = new Map<string, Date[]>();
    for (const event of filteredEvents) {
      if (event.sessionId) {
        const events = sessionEvents.get(event.sessionId) || [];
        events.push(event.timestamp);
        sessionEvents.set(event.sessionId, events);
      }
    }
    const sessionDurations = new Map<string, number>();
    for (const [sessionId, events] of sessionEvents) {
      if (events.length >= 2) {
        const sorted = events.sort((a, b) => a.getTime() - b.getTime());
        const duration = sorted[sorted.length - 1].getTime() - sorted[0].getTime();
        sessionDurations.set(sessionId, duration / 1000); // in seconds
      }
    }
    const averageSessionDuration = sessionDurations.size > 0
      ? Array.from(sessionDurations.values()).reduce((a, b) => a + b, 0) / sessionDurations.size
      : 0;

    // Top actions
    const actionCounts = new Map<string, number>();
    for (const event of filteredEvents) {
      const count = actionCounts.get(event.action) || 0;
      actionCounts.set(event.action, count + 1);
    }
    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Active users
    const activeUsers = new Set(filteredEvents.map(e => e.userId)).size;

    // Retention rate - users who returned within 7 days
    const userFirstSeen = new Map<string, Date>();
    const userLastSeen = new Map<string, Date>();
    for (const event of filteredEvents) {
      const first = userFirstSeen.get(event.userId);
      const last = userLastSeen.get(event.userId);
      if (!first || event.timestamp < first) userFirstSeen.set(event.userId, event.timestamp);
      if (!last || event.timestamp > last) userLastSeen.set(event.userId, event.timestamp);
    }
    let retainedUsers = 0;
    for (const [userId, firstDate] of userFirstSeen) {
      const lastDate = userLastSeen.get(userId);
      if (lastDate) {
        const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff >= 7) retainedUsers++;
      }
    }
    const retentionRate = activeUsers > 0 ? retainedUsers / activeUsers : 0;

    return {
      totalEvents,
      uniqueActions,
      averageSessionDuration,
      topActions,
      activeUsers,
      retentionRate,
    };
  }

  async getUserActivity(
    userId: string,
    limit = 50
  ): Promise<UserEvent[]> {
    return this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getSessions(userId: string): Promise<string[]> {
    const sessions = new Set<string>();
    for (const event of this.events) {
      if (event.userId === userId && event.sessionId) {
        sessions.add(event.sessionId);
      }
    }
    return Array.from(sessions);
  }

  async clearOldEvents(daysToKeep = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const initialCount = this.events.length;
    this.events = this.events.filter(e => e.timestamp >= cutoff);
    const removedCount = initialCount - this.events.length;

    if (removedCount > 0) {
      logger.info({ removedCount, daysToKeep }, 'Old events cleared');
    }

    return removedCount;
  }
}

export const userAnalytics = new UserAnalytics();
