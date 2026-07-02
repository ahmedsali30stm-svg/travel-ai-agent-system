import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService } from '../../src/services/search/SearchService.js';

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService();
  });

  describe('searchHotels', () => {
    it('should search hotels with valid parameters', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2024-06-01',
        checkOut: '2024-06-07',
        guests: 2,
        rooms: 1,
      };

      const result = await searchService.searchHotels(params);

      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
      expect(result.total).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.metadata).toBeDefined();
    });

    it('should filter results by budget', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2024-06-01',
        checkOut: '2024-06-07',
        guests: 2,
        budget: 100,
      };

      const result = await searchService.searchHotels(params);

      expect(result.results.every(r => r.price <= 100)).toBe(true);
    });

    it('should sort results by price', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2024-06-01',
        checkOut: '2024-06-07',
        guests: 2,
        sortBy: 'price',
      };

      const result = await searchService.searchHotels(params);

      for (let i = 1; i < result.results.length; i++) {
        expect(result.results[i].price).toBeGreaterThanOrEqual(
          result.results[i - 1].price
        );
      }
    });

    it('should sort results by rating', async () => {
      const params = {
        destination: 'Paris, France',
        checkIn: '2024-06-01',
        checkOut: '2024-06-07',
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
        checkIn: '2024-06-01',
        checkOut: '2024-06-07',
        guests: 2,
        page: 1,
        limit: 5,
      };

      const result = await searchService.searchHotels(params);

      expect(result.results.length).toBeLessThanOrEqual(5);
      expect(result.limit).toBe(5);
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
