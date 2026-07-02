import { logger } from '../../utils/logger.js';

interface SearchResult {
  id: string;
  name: string;
  type: 'hotel' | 'activity' | 'flight';
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  provider: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  amenities?: string[];
  availability: boolean;
  metadata?: Record<string, any>;
}

interface SearchParams {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
  budget?: number;
  preferences?: {
    stars?: number;
    amenities?: string[];
    mealPlan?: string;
    cancellationPolicy?: string;
  };
  providers?: string[];
  sortBy?: string;
  page?: number;
  limit?: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  providers: string[];
  metadata: {
    searchTime: number;
    cached: boolean;
    filters: Record<string, any>;
  };
}

export class SearchService {
  private cache = new Map<string, { data: any; expiry: number }>();

  async searchHotels(params: SearchParams): Promise<SearchResponse> {
    const startTime = Date.now();
    
    logger.info({
      destination: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: params.guests,
    }, 'Starting hotel search');

    // Check cache
    const cacheKey = this.generateCacheKey('hotels', params);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      logger.info({ cacheKey }, 'Returning cached results');
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        },
      };
    }

    // Search across providers
    const providers = params.providers || ['hotelbeds', 'booking', 'expedia'];
    const searchPromises = providers.map(provider => 
      this.searchProvider(provider, 'hotels', params)
    );

    const providerResults = await Promise.allSettled(searchPromises);
    
    // Merge and deduplicate results
    const allResults = this.mergeResults(providerResults);
    
    // Apply filters
    let filteredResults = this.applyFilters(allResults, params);
    
    // Sort results
    filteredResults = this.sortResults(filteredResults, params.sortBy || 'relevance');
    
    // Paginate
    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

    const searchTime = Date.now() - startTime;
    
    const response: SearchResponse = {
      results: paginatedResults,
      total: filteredResults.length,
      page,
      limit,
      hasMore: startIndex + limit < filteredResults.length,
      providers,
      metadata: {
        searchTime,
        cached: false,
        filters: params.preferences || {},
      },
    };

    // Cache results
    this.setCache(cacheKey, response, 300); // 5 minutes cache
    
    logger.info({
      total: response.total,
      searchTime,
      providers,
    }, 'Hotel search completed');

    return response;
  }

  async searchActivities(params: any): Promise<SearchResponse> {
    const startTime = Date.now();
    
    logger.info({
      destination: params.destination,
      date: params.date,
      category: params.category,
    }, 'Starting activity search');

    // Similar implementation to searchHotels
    // For now, return mock data
    const mockResults: SearchResult[] = [
      {
        id: 'act_1',
        name: 'City Walking Tour',
        type: 'activity',
        price: 45,
        currency: 'USD',
        rating: 4.8,
        reviewCount: 256,
        image: 'https://example.com/tour.jpg',
        provider: 'viator',
        availability: true,
      },
    ];

    return {
      results: mockResults,
      total: mockResults.length,
      page: 1,
      limit: 20,
      hasMore: false,
      providers: ['viator'],
      metadata: {
        searchTime: Date.now() - startTime,
        cached: false,
        filters: {},
      },
    };
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) {
      return [];
    }
    const suggestions = [
      'Paris, France',
      'Paris Disney Resort',
      'Paris Opera Hotel',
    ];
    
    return suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getPriceCalendar(
    destination: string,
    checkIn: string,
    checkOut: string
  ): Promise<any> {
    // Implement price calendar
    return {
      destination,
      startDate: checkIn,
      endDate: checkOut,
      prices: [],
    };
  }

  private async searchProvider(
    provider: string,
    type: string,
    params: SearchParams
  ): Promise<SearchResult[]> {
    // Implement provider-specific search
    logger.info({ provider, type }, `Searching ${provider}`);
    
    // Mock implementation
    return [];
  }

  private mergeResults(providerResults: PromiseSettledResult<SearchResult[]>[]): SearchResult[] {
    const allResults: SearchResult[] = [];
    
    for (const result of providerResults) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      }
    }
    
    // Deduplicate by name and location
    const seen = new Map<string, SearchResult>();
    
    for (const result of allResults) {
      const key = `${result.name}_${result.location?.lat}_${result.location?.lng}`;
      if (!seen.has(key)) {
        seen.set(key, result);
      } else {
        // Keep the one with better price or rating
        const existing = seen.get(key)!;
        if (result.price < existing.price || result.rating > existing.rating) {
          seen.set(key, result);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  private applyFilters(results: SearchResult[], params: SearchParams): SearchResult[] {
    let filtered = results;
    
    if (params.budget) {
      filtered = filtered.filter(r => r.price <= params.budget!);
    }
    
    if (params.preferences?.stars) {
      filtered = filtered.filter(r => {
        const rating = r.rating;
        return rating >= params.preferences!.stars! && rating < params.preferences!.stars! + 1;
      });
    }
    
    if (params.preferences?.amenities) {
      filtered = filtered.filter(r => {
        if (!r.amenities) return false;
        return params.preferences!.amenities!.every(a => r.amenities!.includes(a));
      });
    }
    
    return filtered;
  }

  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    const sorted = [...results];
    
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        // relevance - combine price and rating
        sorted.sort((a, b) => {
          const scoreA = (1 - a.price / 1000) * 0.5 + (a.rating / 5) * 0.5;
          const scoreB = (1 - b.price / 1000) * 0.5 + (b.rating / 5) * 0.5;
          return scoreB - scoreA;
        });
    }
    
    return sorted;
  }

  private generateCacheKey(type: string, params: SearchParams): string {
    return `${type}_${JSON.stringify(params)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }
}
