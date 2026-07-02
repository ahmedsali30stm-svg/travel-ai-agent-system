import { describe, it, expect, beforeEach } from 'vitest';
import { TripService } from '../../src/services/trip/TripService.js';

describe('TripService', () => {
  let tripService: TripService;
  const userId = 'user_test_123';

  beforeEach(() => {
    tripService = new TripService();
  });

  describe('createTrip', () => {
    it('should create a new trip', async () => {
      const params = {
        userId,
        name: 'Paris Adventure',
        destination: 'Paris, France',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        travelers: 2,
        budget: 3000,
      };

      const trip = await tripService.createTrip(params);

      expect(trip).toBeDefined();
      expect(trip.id).toMatch(/^trip_/);
      expect(trip.name).toBe(params.name);
      expect(trip.destination).toBe(params.destination);
      expect(trip.status).toBe('draft');
      expect(trip.items).toEqual([]);
    });
  });

  describe('getUserTrips', () => {
    it('should return user trips', async () => {
      // Create a trip first
      await tripService.createTrip({
        userId,
        name: 'Test Trip',
        destination: 'Paris',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        travelers: 2,
      });

      const result = await tripService.getUserTrips(userId, {
        page: 1,
        limit: 10,
      });

      expect(result.trips).toBeInstanceOf(Array);
      expect(result.trips.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter trips by status', async () => {
      await tripService.createTrip({
        userId,
        name: 'Draft Trip',
        destination: 'Paris',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        travelers: 2,
      });

      const result = await tripService.getUserTrips(userId, {
        status: 'draft',
        page: 1,
        limit: 10,
      });

      expect(result.trips.every(t => t.status === 'draft')).toBe(true);
    });
  });

  describe('getTripById', () => {
    it('should return trip by id', async () => {
      const trip = await tripService.createTrip({
        userId,
        name: 'Test Trip',
        destination: 'Paris',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        travelers: 2,
      });

      const found = await tripService.getTripById(trip.id, userId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(trip.id);
    });

    it('should return null for non-existent trip', async () => {
      const found = await tripService.getTripById('nonexistent', userId);

      expect(found).toBeNull();
    });
  });

  describe('addItem', () => {
    it('should add item to trip', async () => {
      const trip = await tripService.createTrip({
        userId,
        name: 'Test Trip',
        destination: 'Paris',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        travelers: 2,
      });

      const item = await tripService.addItem(trip.id, userId, {
        type: 'hotel',
        name: 'Grand Hotel',
        details: { stars: 4, address: '123 Main St' },
        cost: 150,
        currency: 'EUR',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        status: 'confirmed',
      });

      expect(item).toBeDefined();
      expect(item.id).toMatch(/^item_/);
      expect(item.type).toBe('hotel');
      expect(item.name).toBe('Grand Hotel');
    });
  });

  describe('generateItinerary', () => {
    it('should generate itinerary', async () => {
      const trip = await tripService.createTrip({
        userId,
        name: 'Test Trip',
        destination: 'Paris',
        startDate: '2024-06-01',
        endDate: '2024-06-07',
        travelers: 2,
      });

      await tripService.addItem(trip.id, userId, {
        type: 'hotel',
        name: 'Grand Hotel',
        details: {},
        cost: 150,
        status: 'confirmed',
        startDate: '2024-06-01',
      });

      const itinerary = await tripService.generateItinerary(trip.id, userId);

      expect(itinerary).toBeDefined();
      expect(itinerary.trip).toBeDefined();
      expect(itinerary.itinerary).toBeDefined();
      expect(itinerary.summary).toBeDefined();
    });
  });
});
