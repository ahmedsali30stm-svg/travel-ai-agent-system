import { createContextLogger } from '../utils/logger.js';
import { redis } from './RedisCache.js';

const logger = createContextLogger({ component: 'MemoryEngine' });

interface MemoryEntry {
  key: string;
  value: any;
  type: 'short_term' | 'long_term' | 'session';
  ttl?: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

interface MemoryOptions {
  ttl?: number;
  type?: 'short_term' | 'long_term' | 'session';
}

export class MemoryEngine {
  private memory = new Map<string, MemoryEntry>();

  constructor() {
    // Initialize memory engine
    logger.info('Memory engine initialized');
  }

  async get(key: string): Promise<any | null> {
    // Check in-memory first
    const entry = this.memory.get(key);
    
    if (entry) {
      // Check if expired
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        this.memory.delete(key);
        return null;
      }
      return entry.value;
    }

    // Check Redis
    const redisValue = await redis.get(key);
    if (redisValue) {
      // Store in memory for faster access
      this.memory.set(key, {
        key,
        value: redisValue,
        type: 'long_term',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return redisValue;
    }

    return null;
  }

  async set(key: string, value: any, options?: MemoryOptions): Promise<void> {
    const ttl = options?.ttl || 3600; // Default 1 hour
    const type = options?.type || 'short_term';
    
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttl);

    // Store in memory
    this.memory.set(key, {
      key,
      value,
      type,
      ttl,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt,
    });

    // Store in Redis for persistence
    await redis.set(key, value, ttl);
    
    logger.debug({ key, type, ttl }, 'Memory stored');
  }

  async delete(key: string): Promise<void> {
    this.memory.delete(key);
    await redis.del(key);
    logger.debug({ key }, 'Memory deleted');
  }

  async exists(key: string): Promise<boolean> {
    // Check memory first
    const entry = this.memory.get(key);
    if (entry) {
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        this.memory.delete(key);
        return false;
      }
      return true;
    }

    // Check Redis
    return await redis.exists(key);
  }

  async ttl(key: string): Promise<number> {
    const entry = this.memory.get(key);
    if (entry) {
      if (!entry.expiresAt) {
        return -1; // No expiration
      }
      const remaining = Math.floor(
        (entry.expiresAt.getTime() - Date.now()) / 1000
      );
      return remaining > 0 ? remaining : -2; // -2 means expired
    }
    return await redis.ttl(key);
  }

  async increment(key: string, amount = 1): Promise<number> {
    const entry = this.memory.get(key);
    if (entry) {
      const newValue = (entry.value || 0) + amount;
      entry.value = newValue;
      entry.updatedAt = new Date();
      return newValue;
    }
    return await redis.increment(key);
  }

  async decrement(key: string, amount = 1): Promise<number> {
    const entry = this.memory.get(key);
    if (entry) {
      const newValue = (entry.value || 0) - amount;
      entry.value = newValue;
      entry.updatedAt = new Date();
      return newValue;
    }
    return await redis.decrement(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    const memoryKeys = Array.from(this.memory.keys());
    const redisKeys = await redis.keys(pattern || '*');
    
    return [...new Set([...memoryKeys, ...redisKeys])];
  }

  async flush(type?: 'short_term' | 'long_term' | 'session'): Promise<void> {
    if (type) {
      // Flush specific type
      for (const [key, entry] of this.memory.entries()) {
        if (entry.type === type) {
          this.memory.delete(key);
        }
      }
    } else {
      // Flush all
      this.memory.clear();
    }
    await redis.flushall();
    logger.info({ type }, 'Memory flushed');
  }

  async stats(): Promise<{
    totalKeys: number;
    memoryKeys: number;
    redisKeys: number;
    expiredKeys: number;
  }> {
    let expiredKeys = 0;
    const now = new Date();
    
    for (const entry of this.memory.values()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys++;
      }
    }

    return {
      totalKeys: this.memory.size,
      memoryKeys: this.memory.size,
      redisKeys: 0, // Would be actual Redis key count
      expiredKeys,
    };
  }
}

export const memoryEngine = new MemoryEngine();
