import { createContextLogger } from '../utils/logger.js';
import { database } from '../memory/Database.js';
import { redis } from '../memory/RedisCache.js';

const logger = createContextLogger({ component: 'HealthCheck' });

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  latency?: number;
  timestamp: Date;
}

interface HealthCheckConfig {
  timeout: number;
  interval: number;
  retries: number;
}

export class HealthChecker {
  private checks = new Map<string, () => Promise<boolean>>();
  private results = new Map<string, HealthCheckResult>();
  private config: HealthCheckConfig;
  private periodicTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<HealthCheckConfig>) {
    this.config = {
      timeout: config?.timeout || 5000,
      interval: config?.interval || 30000,
      retries: config?.retries || 3,
    };
  }

  register(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
    logger.info({ name }, 'Health check registered');
  }

  async check(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      return {
        name,
        status: 'unhealthy',
        message: 'Check not found',
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        await Promise.race([
          check(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
          ),
        ]);

        const result: HealthCheckResult = {
          name,
          status: 'healthy',
          latency: Date.now() - startTime,
          timestamp: new Date(),
        };

        this.results.set(name, result);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.config.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    const result: HealthCheckResult = {
      name,
      status: 'unhealthy',
      message: lastError?.message || 'Check failed',
      latency: Date.now() - startTime,
      timestamp: new Date(),
    };

    this.results.set(name, result);
    return result;
  }

  async checkAll(): Promise<HealthCheckResult[]> {
    const checks = Array.from(this.checks.entries()).map(([name]) =>
      this.check(name)
    );
    return Promise.all(checks);
  }

  async isHealthy(): Promise<boolean> {
    const results = await this.checkAll();
    return results.every(r => r.status === 'healthy');
  }

  getResults(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }

  startPeriodicChecks(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
    }
    this.periodicTimer = setInterval(async () => {
      await this.checkAll();
    }, this.config.interval);
    logger.info({ interval: this.config.interval }, 'Periodic health checks started');
  }

  stopPeriodicChecks(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
      logger.info('Periodic health checks stopped');
    }
  }
}

export const healthChecker = new HealthChecker();

// Register default health checks
healthChecker.register('database', async () => {
  return database.healthCheck();
});

healthChecker.register('redis', async () => {
  return redis.ping();
});

healthChecker.register('memory', async () => {
  const used = process.memoryUsage();
  const threshold = 1024 * 1024 * 1024; // 1GB
  return used.heapUsed < threshold;
});

healthChecker.register('eventLoop', async () => {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1e6;
      resolve(delay < 100); // Event loop lag < 100ms
    });
  });
});
