import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'Cache' });

interface CacheEntry<T> {
  value: T;
  expiresAt: Date;
  createdAt: Date;
}

interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export class LRUCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options?: CacheOptions) {
    this.maxSize = options?.maxSize || 1000;
    this.defaultTTL = options?.ttl || 300000; // 5 minutes
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    // Delete if exists
    this.cache.delete(key);

    // Check if at capacity
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiresAt = new Date();
    expiresAt.setMilliseconds(expiresAt.getMilliseconds() + (ttl || this.defaultTTL));

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: new Date(),
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    const values: T[] = [];
    const now = new Date();
    
    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now) {
        values.push(entry.value);
      }
    }
    
    return values;
  }

  entries(): [string, T][] {
    const entries: [string, T][] = [];
    const now = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt > now) {
        entries.push([key, entry.value]);
      }
    }
    
    return entries;
  }

  cleanup(): number {
    let removed = 0;
    const now = new Date();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }

  stats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expired: number;
  } {
    let expired = 0;
    const now = new Date();
    
    for (const entry of this.cache.values()) {
      if (entry.expiresAt < now) {
        expired++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
      expired,
    };
  }
}

export class CacheManager {
  private caches = new Map<string, LRUCache>();

  getCache<T>(name: string, options?: CacheOptions): LRUCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new LRUCache<T>(options));
    }
    return this.caches.get(name) as LRUCache<T>;
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  cleanup(): number {
    let totalRemoved = 0;
    for (const cache of this.caches.values()) {
      totalRemoved += cache.cleanup();
    }
    return totalRemoved;
  }

  stats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.stats();
    }
    
    return stats;
  }
}

export const cacheManager = new CacheManager();

// Pre-configured caches
export const searchCache = cacheManager.getCache('search', {
  ttl: 300000, // 5 minutes
  maxSize: 1000,
});

export const priceCache = cacheManager.getCache('price', {
  ttl: 60000, // 1 minute
  maxSize: 5000,
});

export const userCache = cacheManager.getCache('user', {
  ttl: 900000, // 15 minutes
  maxSize: 10000,
});
