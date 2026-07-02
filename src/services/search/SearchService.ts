import { logger } from '../../utils/logger.js';
import {
  type HotelResult,
  type SearchParams,
  type SearchResponse,
  type HotelSearchProvider,
} from './types.js';
import { BookingComScraper } from './providers/BookingComScraper.js';

export class SearchService {
  private providers: Map<string, HotelSearchProvider> = new Map();
  private cache = new Map<string, { data: any; expiry: number }>();

  constructor(providers?: HotelSearchProvider[]) {
    if (providers) {
      for (const p of providers) {
        this.registerProvider(p);
      }
    } else {
      this.registerProvider(new BookingComScraper());
    }
  }

  registerProvider(provider: HotelSearchProvider): void {
    this.providers.set(provider.name, provider);
    logger.info({ provider: provider.name }, 'Search provider registered');
  }

  async searchHotels(params: SearchParams): Promise<SearchResponse<HotelResult>> {
    const startTime = Date.now();

    logger.info({
      destination: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: params.guests,
    }, 'Starting hotel search');

    const cacheKey = this.generateCacheKey('hotels', params);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      logger.debug({ cacheKey }, 'Returning cached hotel results');
      return { ...cached, metadata: { ...cached.metadata, cached: true } };
    }

    const providerNames = params.providers?.length
      ? params.providers
      : Array.from(this.providers.keys());

    const providerResults = await Promise.allSettled(
      providerNames.map((name) => {
        const provider = this.providers.get(name);
        if (!provider) {
          return Promise.reject(new Error(`Unknown provider: ${name}`));
        }
        return provider.search(params);
      })
    );

    const allResults = this.mergeResults(providerResults);

    let filteredResults = this.applyFilters(allResults, params);
    filteredResults = this.sortResults(filteredResults, params.sortBy || 'relevance');

    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

    const searchTime = Date.now() - startTime;

    const response: SearchResponse<HotelResult> = {
      results: paginatedResults,
      total: filteredResults.length,
      page,
      limit,
      hasMore: startIndex + limit < filteredResults.length,
      providers: providerNames,
      metadata: { searchTime, cached: false, filters: params.preferences || {} },
    };

    this.setCache(cacheKey, response, 300);
    logger.info({ total: response.total, searchTime, providers: providerNames }, 'Hotel search completed');

    return response;
  }

  async searchActivities(params: any): Promise<SearchResponse> {
    logger.info({ destination: params.destination }, 'Activity search not yet implemented');
    return {
      results: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
      providers: [],
      metadata: { searchTime: 0, cached: false, filters: {} },
    };
  }

  async getSuggestions(query: string): Promise<string[]> {
    if (query.length < 2) return [];
    const suggestions = [
      'Paris, France',
      'Paris Disney Resort',
      'Paris Opera Hotel',
    ];
    return suggestions.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getPriceCalendar(
    destination: string,
    checkIn: string,
    checkOut: string
  ): Promise<any> {
    return { destination, startDate: checkIn, endDate: checkOut, prices: [] };
  }

  private mergeResults(
    providerResults: PromiseSettledResult<HotelResult[]>[]
  ): HotelResult[] {
    const allResults: HotelResult[] = [];
    for (const result of providerResults) {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        logger.warn({ error: result.reason }, 'Provider search failed');
      }
    }

    const seen = new Map<string, HotelResult>();
    for (const r of allResults) {
      const key = `${r.name}_${r.location?.lat ?? 0}_${r.location?.lng ?? 0}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, r);
      } else if (r.pricePerNight < existing.pricePerNight || r.rating > existing.rating) {
        seen.set(key, r);
      }
    }

    return Array.from(seen.values());
  }

  private applyFilters(
    results: HotelResult[],
    params: SearchParams
  ): HotelResult[] {
    let filtered = results;

    if (params.budget) {
      filtered = filtered.filter((r) => r.pricePerNight <= params.budget!);
    }

    if (params.preferences?.stars) {
      filtered = filtered.filter((r) => {
        const s = r.starRating ?? Math.floor(r.rating);
        return s >= params.preferences!.stars! && s < params.preferences!.stars! + 1;
      });
    }

    if (params.preferences?.cancellationPolicy === 'free') {
      filtered = filtered.filter(
        (r) => r.cancellationPolicy?.type === 'free'
      );
    }

    if (params.preferences?.mealPlan?.includes('breakfast')) {
      filtered = filtered.filter((r) => r.breakfastAvailable);
    }

    return filtered;
  }

  private sortResults(
    results: HotelResult[],
    sortBy: string
  ): HotelResult[] {
    const sorted = [...results];

    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'popularity':
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        sorted.sort((a, b) => {
          const scoreA =
            (1 - a.pricePerNight / 1000) * 0.5 + (a.rating / 5) * 0.5;
          const scoreB =
            (1 - b.pricePerNight / 1000) * 0.5 + (b.rating / 5) * 0.5;
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
    if (cached && cached.expiry > Date.now()) return cached.data;
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, { data, expiry: Date.now() + ttlSeconds * 1000 });
  }
}
