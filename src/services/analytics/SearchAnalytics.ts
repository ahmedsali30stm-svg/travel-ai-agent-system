import { createContextLogger } from '../../utils/logger.js';

const logger = createContextLogger({ component: 'SearchAnalytics' });

interface SearchEvent {
  id: string;
  userId?: string;
  query: string;
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  resultsCount: number;
  clickedResultId?: string;
  bookedResultId?: string;
  timestamp: Date;
  duration: number;
  providers: string[];
  filters?: Record<string, any>;
}

interface SearchStats {
  totalSearches: number;
  uniqueUsers: number;
  averageResults: number;
  averageDuration: number;
  topDestinations: { destination: string; count: number }[];
  conversionRate: number;
  providerPerformance: Record<string, { searches: number; clicks: number; bookings: number }>;
}

export class SearchAnalytics {
  private events: SearchEvent[] = [];
  private maxEvents = 100000;

  async trackSearch(event: Omit<SearchEvent, 'id' | 'timestamp'>): Promise<void> {
    const searchEvent: SearchEvent = {
      ...event,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.events.push(searchEvent);

    // Trim events if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    logger.debug({
      searchId: searchEvent.id,
      destination: searchEvent.destination,
      resultsCount: searchEvent.resultsCount,
    }, 'Search tracked');
  }

  async trackClick(searchId: string, resultId: string): Promise<void> {
    const event = this.events.find(e => e.id === searchId);
    if (event) {
      event.clickedResultId = resultId;
      logger.debug({ searchId, resultId }, 'Click tracked');
    }
  }

  async trackBooking(searchId: string, resultId: string): Promise<void> {
    const event = this.events.find(e => e.id === searchId);
    if (event) {
      event.bookedResultId = resultId;
      logger.debug({ searchId, resultId }, 'Booking tracked');
    }
  }

  async getStats(options?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
  }): Promise<SearchStats> {
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

    const totalSearches = filteredEvents.length;
    const uniqueUsers = new Set(
      filteredEvents.filter(e => e.userId).map(e => e.userId)
    ).size;

    const averageResults = totalSearches > 0
      ? filteredEvents.reduce((sum, e) => sum + e.resultsCount, 0) / totalSearches
      : 0;

    const averageDuration = totalSearches > 0
      ? filteredEvents.reduce((sum, e) => sum + e.duration, 0) / totalSearches
      : 0;

    // Top destinations
    const destinationCounts = new Map<string, number>();
    for (const event of filteredEvents) {
      if (event.destination) {
        const count = destinationCounts.get(event.destination) || 0;
        destinationCounts.set(event.destination, count + 1);
      }
    }
    const topDestinations = Array.from(destinationCounts.entries())
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Conversion rate
    const searchesWithClicks = filteredEvents.filter(e => e.clickedResultId).length;
    const searchesWithBookings = filteredEvents.filter(e => e.bookedResultId).length;
    const conversionRate = totalSearches > 0
      ? (searchesWithBookings / totalSearches) * 100
      : 0;

    // Provider performance
    const providerPerformance: Record<string, { searches: number; clicks: number; bookings: number }> = {};
    for (const event of filteredEvents) {
      for (const provider of event.providers) {
        if (!providerPerformance[provider]) {
          providerPerformance[provider] = { searches: 0, clicks: 0, bookings: 0 };
        }
        providerPerformance[provider].searches++;
        if (event.clickedResultId) {
          providerPerformance[provider].clicks++;
        }
        if (event.bookedResultId) {
          providerPerformance[provider].bookings++;
        }
      }
    }

    return {
      totalSearches,
      uniqueUsers,
      averageResults,
      averageDuration,
      topDestinations,
      conversionRate,
      providerPerformance,
    };
  }

  async getTrendingDestinations(limit = 10): Promise<{ destination: string; trend: number }[]> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeekEvents = this.events.filter(e => e.timestamp >= lastWeek);
    const lastWeekEvents = this.events.filter(
      e => e.timestamp >= lastMonth && e.timestamp < lastWeek
    );

    const thisWeekCounts = new Map<string, number>();
    const lastWeekCounts = new Map<string, number>();

    for (const event of thisWeekEvents) {
      if (event.destination) {
        const count = thisWeekCounts.get(event.destination) || 0;
        thisWeekCounts.set(event.destination, count + 1);
      }
    }

    for (const event of lastWeekEvents) {
      if (event.destination) {
        const count = lastWeekCounts.get(event.destination) || 0;
        lastWeekCounts.set(event.destination, count + 1);
      }
    }

    const trends: { destination: string; trend: number }[] = [];

    for (const [destination, thisWeekCount] of thisWeekCounts.entries()) {
      const lastWeekCount = lastWeekCounts.get(destination) || 0;
      const trend = lastWeekCount > 0
        ? ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
        : 100;
      trends.push({ destination, trend });
    }

    return trends
      .sort((a, b) => b.trend - a.trend)
      .slice(0, limit);
  }

  async getUserSearchHistory(
    userId: string,
    limit = 50
  ): Promise<SearchEvent[]> {
    return this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
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

export const searchAnalytics = new SearchAnalytics();
