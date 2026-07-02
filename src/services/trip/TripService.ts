import { logger } from '../../utils/logger.js';

interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: number;
  status: 'draft' | 'planned' | 'booked' | 'completed' | 'cancelled';
  preferences?: Record<string, any>;
  items: TripItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface TripItem {
  id: string;
  tripId: string;
  type: 'hotel' | 'flight' | 'activity' | 'transport' | 'other';
  name: string;
  details: Record<string, any>;
  cost?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'reserved' | 'confirmed' | 'cancelled';
  bookingRef?: string;
  notes?: string;
}

interface CreateTripParams {
  userId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget?: number;
  preferences?: Record<string, any>;
}

export class TripService {
  private trips = new Map<string, Trip>();

  async createTrip(params: CreateTripParams): Promise<Trip> {
    const trip: Trip = {
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      status: 'draft',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.trips.set(trip.id, trip);
    
    logger.info({ tripId: trip.id, userId: params.userId }, 'Trip created');
    
    return trip;
  }

  async getUserTrips(
    userId: string,
    options: { status?: string; page: number; limit: number }
  ): Promise<{ trips: Trip[]; total: number; page: number; limit: number }> {
    const userTrips = Array.from(this.trips.values())
      .filter(t => t.userId === userId);

    let filtered = userTrips;
    if (options.status) {
      filtered = userTrips.filter(t => t.status === options.status);
    }

    const startIndex = (options.page - 1) * options.limit;
    const paginatedTrips = filtered.slice(startIndex, startIndex + options.limit);

    return {
      trips: paginatedTrips,
      total: filtered.length,
      page: options.page,
      limit: options.limit,
    };
  }

  async getTripById(tripId: string, userId: string): Promise<Trip | null> {
    const trip = this.trips.get(tripId);
    
    if (!trip || trip.userId !== userId) {
      return null;
    }
    
    return trip;
  }

  async updateTrip(
    tripId: string,
    userId: string,
    updates: Partial<Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Trip> {
    const trip = this.trips.get(tripId);
    
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found');
    }

    const updatedTrip: Trip = {
      ...trip,
      ...updates,
      updatedAt: new Date(),
    };

    this.trips.set(tripId, updatedTrip);
    
    logger.info({ tripId, updates }, 'Trip updated');
    
    return updatedTrip;
  }

  async deleteTrip(tripId: string, userId: string): Promise<void> {
    const trip = this.trips.get(tripId);
    
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found');
    }

    this.trips.delete(tripId);
    
    logger.info({ tripId }, 'Trip deleted');
  }

  async addItem(
    tripId: string,
    userId: string,
    itemData: Omit<TripItem, 'id' | 'tripId'>
  ): Promise<TripItem> {
    const trip = this.trips.get(tripId);
    
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found');
    }

    const item: TripItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      ...itemData,
    };

    trip.items.push(item);
    trip.updatedAt = new Date();
    
    logger.info({ tripId, itemId: item.id, type: item.type }, 'Item added to trip');
    
    return item;
  }

  async generateItinerary(tripId: string, userId: string): Promise<any> {
    const trip = this.trips.get(tripId);
    
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found');
    }

    // Sort items by start date
    const sortedItems = [...trip.items].sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    // Group by date
    const itinerary: Record<string, TripItem[]> = {};
    
    for (const item of sortedItems) {
      const date = item.startDate || 'unscheduled';
      if (!itinerary[date]) {
        itinerary[date] = [];
      }
      itinerary[date].push(item);
    }

    return {
      trip,
      itinerary,
      summary: {
        totalItems: trip.items.length,
        confirmedItems: trip.items.filter(i => i.status === 'confirmed').length,
        totalCost: trip.items.reduce((sum, i) => sum + (i.cost || 0), 0),
        currency: trip.items[0]?.currency || 'USD',
      },
    };
  }

  async getBudgetSummary(tripId: string, userId: string): Promise<any> {
    const trip = this.trips.get(tripId);
    
    if (!trip || trip.userId !== userId) {
      throw new Error('Trip not found');
    }

    const itemsByType: Record<string, { count: number; total: number }> = {};
    
    for (const item of trip.items) {
      if (!itemsByType[item.type]) {
        itemsByType[item.type] = { count: 0, total: 0 };
      }
      itemsByType[item.type].count++;
      itemsByType[item.type].total += item.cost || 0;
    }

    const totalSpent = trip.items.reduce((sum, i) => sum + (i.cost || 0), 0);
    const remaining = trip.budget ? trip.budget - totalSpent : undefined;

    return {
      tripId,
      budget: trip.budget,
      totalSpent,
      remaining,
      byType: itemsByType,
      currency: trip.items[0]?.currency || 'USD',
    };
  }
}
