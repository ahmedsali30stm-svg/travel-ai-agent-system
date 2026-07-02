import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'SearchProvider' });

interface SearchProviderConfig {
  name: string;
  apiKey?: string;
  secret?: string;
  baseUrl: string;
  rateLimit: number;
  timeout: number;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  provider: string;
  availability: boolean;
  metadata?: Record<string, any>;
}

interface ProviderResponse {
  success: boolean;
  results: SearchResult[];
  total: number;
  error?: string;
}

export abstract class SearchProvider {
  protected config: SearchProviderConfig;
  protected requestCount = 0;
  protected lastRequestTime = 0;

  constructor(config: SearchProviderConfig) {
    this.config = config;
  }

  abstract search(params: any): Promise<ProviderResponse>;

  protected async makeRequest<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // Check rate limit
    await this.checkRateLimit();
    
    const url = `${this.config.baseUrl}${endpoint}`;
    
    logger.debug({ provider: this.config.name, endpoint }, 'Making request');
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(this.config.timeout),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.requestCount++;
      this.lastRequestTime = Date.now();
      
      return await response.json();
    } catch (error) {
      logger.error({ provider: this.config.name, endpoint, error }, 'Request failed');
      throw error;
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / this.config.rateLimit;
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  getStats() {
    return {
      name: this.config.name,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}

export class HotelbedsProvider extends SearchProvider {
  constructor() {
    super({
      name: 'hotelbeds',
      baseUrl: 'https://api.hotelbeds.com/hotel-api/1.0',
      rateLimit: 10,
      timeout: 15000,
    });
  }

  async search(params: any): Promise<ProviderResponse> {
    // Implement Hotelbeds search
    return { success: true, results: [], total: 0 };
  }
}

export class BookingProvider extends SearchProvider {
  constructor() {
    super({
      name: 'booking',
      baseUrl: 'https://distribution-xml.booking.com/2.0',
      rateLimit: 5,
      timeout: 15000,
    });
  }

  async search(params: any): Promise<ProviderResponse> {
    // Implement Booking.com search
    return { success: true, results: [], total: 0 };
  }
}

export class ExpediaProvider extends SearchProvider {
  constructor() {
    super({
      name: 'expedia',
      baseUrl: 'https://api.expedia.com',
      rateLimit: 5,
      timeout: 15000,
    });
  }

  async search(params: any): Promise<ProviderResponse> {
    // Implement Expedia search
    return { success: true, results: [], total: 0 };
  }
}

export class ViatorProvider extends SearchProvider {
  constructor() {
    super({
      name: 'viator',
      baseUrl: 'https://api.viator.com/partner',
      rateLimit: 10,
      timeout: 15000,
    });
  }

  async search(params: any): Promise<ProviderResponse> {
    // Implement Viator search
    return { success: true, results: [], total: 0 };
  }
}

export class AmadeusProvider extends SearchProvider {
  constructor() {
    super({
      name: 'amadeus',
      baseUrl: 'https://api.amadeus.com/v2',
      rateLimit: 10,
      timeout: 15000,
    });
  }

  async search(params: any): Promise<ProviderResponse> {
    // Implement Amadeus search
    return { success: true, results: [], total: 0 };
  }
}

export class ProviderRegistry {
  private providers = new Map<string, SearchProvider>();

  constructor() {
    this.registerProvider(new HotelbedsProvider());
    this.registerProvider(new BookingProvider());
    this.registerProvider(new ExpediaProvider());
    this.registerProvider(new ViatorProvider());
    this.registerProvider(new AmadeusProvider());
  }

  registerProvider(provider: SearchProvider): void {
    this.providers.set(provider['config'].name, provider);
    logger.info({ provider: provider['config'].name }, 'Provider registered');
  }

  getProvider(name: string): SearchProvider | undefined {
    return this.providers.get(name);
  }

  getProviders(): SearchProvider[] {
    return Array.from(this.providers.values());
  }

  async searchAll(params: any): Promise<ProviderResponse[]> {
    const searchPromises = this.getProviders().map(provider =>
      provider.search(params).catch(error => ({
        success: false,
        results: [],
        total: 0,
        error: error.message,
      }))
    );

    return Promise.all(searchPromises);
  }

  getStats() {
    return this.getProviders().map(provider => provider.getStats());
  }
}

export const providerRegistry = new ProviderRegistry();
