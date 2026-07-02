import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService } from '../../src/services/search/SearchService.js';
import type { HotelResult, HotelSearchProvider, SearchParams } from '../../src/services/search/types.js';

class MockBookingProvider implements HotelSearchProvider {
  readonly name = 'booking';

  async search(params: SearchParams): Promise<HotelResult[]> {
    return [
      {
        id: 'booking_mock_1',
        name: 'Hotel Le Paris',
        type: 'hotel',
        pricePerNight: 150,
        totalPrice: 900,
        currency: 'EUR',
        rating: 4.5,
        reviewCount: 1234,
        images: [{ url: 'https://example.com/paris.jpg', alt: 'Hotel Le Paris' }],
        provider: 'booking',
        bookingUrl: 'https://booking.com/hotel/paris',
        starRating: 4,
        roomTypes: [
          {
            name: 'Deluxe Room',
            pricePerNight: 150,
            currency: 'EUR',
            maxGuests: 2,
            isRefundable: true,
            breakfastIncluded: true,
          },
        ],
        breakfastAvailable: true,
        cancellationPolicy: { type: 'free', description: 'Free cancellation' },
        amenities: ['WiFi', 'Pool', 'Gym'],
        availability: true,
      },
      {
        id: 'booking_mock_2',
        name: 'Budget Inn Paris',
        type: 'hotel',
        pricePerNight: 80,
        totalPrice: 480,
        currency: 'EUR',
        rating: 3.2,
        reviewCount: 567,
        images: [{ url: 'https://example.com/budget.jpg', alt: 'Budget Inn Paris' }],
        provider: 'booking',
        bookingUrl: 'https://booking.com/hotel/budget',
        starRating: 2,
        roomTypes: [
          {
            name: 'Standard Room',
            pricePerNight: 80,
            currency: 'EUR',
            maxGuests: 2,
            isRefundable: false,
            breakfastIncluded: false,
          },
        ],
        breakfastAvailable: false,
        cancellationPolicy: { type: 'non_refundable', description: 'Non-refundable' },
        amenities: ['WiFi'],
        availability: true,
      },
      {
        id: 'booking_mock_3',
        name: 'Luxury Palace Paris',
        type: 'hotel',
        pricePerNight: 450,
        totalPrice: 2700,
        currency: 'EUR',
        rating: 4.9,
        reviewCount: 890,
        images: [{ url: 'https://example.com/luxury.jpg', alt: 'Luxury Palace Paris' }],
        provider: 'booking',
        bookingUrl: 'https://booking.com/hotel/luxury',
        starRating: 5,
        roomTypes: [
          {
            name: 'Presidential Suite',
            pricePerNight: 450,
            currency: 'EUR',
            maxGuests: 3,
            isRefundable: true,
            breakfastIncluded: true,
          },
        ],
        breakfastAvailable: true,
        cancellationPolicy: { type: 'free', description: 'Free cancellation until 48h before' },
        amenities: ['WiFi', 'Pool', 'Spa', 'Concierge'],
        availability: true,
      },
    ];
  }

  async cleanup(): Promise<void> {}
}

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService([new MockBookingProvider()]);
  });

  describe('searchHotels', () => {
    it('should search hotels with valid parameters', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2026-12-01',
        checkOut: '2026-12-07',
        guests: 2,
        rooms: 1,
      };

      const result = await searchService.searchHotels(params);

      expect(result).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.metadata.searchTime).toBeGreaterThanOrEqual(0);
      expect(result.results[0].id).toBeDefined();
      expect(result.results[0].name).toBeDefined();
      expect(result.results[0].pricePerNight).toBeGreaterThan(0);
    });

    it('should only search requested providers', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2026-12-01',
        checkOut: '2026-12-07',
        guests: 2,
        providers: ['booking'],
      };

      const result = await searchService.searchHotels(params);

      expect(result.providers).toEqual(['booking']);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter results by budget', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2026-12-01',
        checkOut: '2026-12-07',
        guests: 2,
        budget: 100,
      };

      const result = await searchService.searchHotels(params);

      expect(result.results.every(r => r.pricePerNight <= 100)).toBe(true);
    });

    it('should sort results by price ascending', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2026-12-01',
        checkOut: '2026-12-07',
        guests: 2,
        sortBy: 'price',
      };

      const result = await searchService.searchHotels(params);

      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i].pricePerNight).toBeGreaterThanOrEqual(
          result.results[i - 1].pricePerNight
        );
      }
    });

    it('should sort results by rating descending', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2026-12-01',
        checkOut: '2026-12-07',
        guests: 2,
        sortBy: 'rating',
      };

      const result = await searchService.searchHotels(params);

      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i].rating).toBeLessThanOrEqual(
          result.results[i - 1].rating
        );
      }
    });

    it('should paginate results', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2026-12-01',
        checkOut: '2026-12-07',
        guests: 2,
        page: 1,
        limit: 2,
      };

      const result = await searchService.searchHotels(params);

      expect(result.results.length).toBeLessThanOrEqual(2);
      expect(result.limit).toBe(2);
    });

    it('should return full HotelResult structure', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2026-12-01',
        checkOut: '2026-12-07',
        guests: 2,
      };

      const result = await searchService.searchHotels(params);
      const hotel = result.results[0];

      expect(hotel).toHaveProperty('id');
      expect(hotel).toHaveProperty('name');
      expect(hotel).toHaveProperty('type', 'hotel');
      expect(hotel).toHaveProperty('pricePerNight');
      expect(hotel).toHaveProperty('totalPrice');
      expect(hotel).toHaveProperty('currency');
      expect(hotel).toHaveProperty('rating');
      expect(hotel).toHaveProperty('reviewCount');
      expect(hotel).toHaveProperty('images');
      expect(Array.isArray(hotel.images)).toBe(true);
      expect(hotel.images[0]).toHaveProperty('url');
      expect(hotel).toHaveProperty('provider', 'booking');
      expect(hotel).toHaveProperty('bookingUrl');
      expect(hotel).toHaveProperty('roomTypes');
      expect(Array.isArray(hotel.roomTypes)).toBe(true);
      expect(hotel).toHaveProperty('breakfastAvailable');
      expect(hotel).toHaveProperty('availability', true);
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions for valid query', async () => {
      const suggestions = await searchService.getSuggestions('par');

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array for short query', async () => {
      const suggestions = await searchService.getSuggestions('p');

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBe(0);
    });
  });
});
