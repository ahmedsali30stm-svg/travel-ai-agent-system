import Redis from 'ioredis';
import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'Redis' });

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export class RedisCache {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    // Client is created on connect() to allow graceful startup
  }

  async connect(): Promise<void> {
    try {
      this.client = new Redis(config.redis.url, {
        password: config.redis.password || undefined,
        retryStrategy(times: number) {
          if (times > 5) {
            logger.warn('Redis: max retries reached, giving up');
            return null;
          }
          const delay = Math.min(times * 200, 2000);
          return delay;
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
      }
      this.isConnected = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Redis disconnection failed:', error);
    }
  }

  private ensureConnected(): void {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis not connected');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      this.ensureConnected();
      const value = await this.client!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      this.ensureConnected();
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client!.setex(key, ttl, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
    } catch (error) {
      logger.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.ensureConnected();
      await this.client!.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      this.ensureConnected();
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      this.ensureConnected();
      return await this.client!.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error:', error);
      return -1;
    }
  }

  async increment(key: string): Promise<number> {
    try {
      this.ensureConnected();
      return await this.client!.incr(key);
    } catch (error) {
      logger.error('Redis increment error:', error);
      return 0;
    }
  }

  async decrement(key: string): Promise<number> {
    try {
      this.ensureConnected();
      return await this.client!.decr(key);
    } catch (error) {
      logger.error('Redis decrement error:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      this.ensureConnected();
      await this.client!.expire(key, seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      this.ensureConnected();
      return await this.client!.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  }

  async flushall(): Promise<void> {
    try {
      this.ensureConnected();
      await this.client!.flushall();
    } catch (error) {
      logger.error('Redis flushall error:', error);
    }
  }

  async ping(): Promise<boolean> {
    try {
      this.ensureConnected();
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  async mget<T>(...keys: string[]): Promise<(T | null)[]> {
    try {
      this.ensureConnected();
      const values = await this.client!.mget(...keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      logger.error('Redis mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    try {
      this.ensureConnected();
      const pipeline = this.client!.pipeline();
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      await pipeline.exec();
    } catch (error) {
      logger.error('Redis mset error:', error);
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const redis = new RedisCache();
