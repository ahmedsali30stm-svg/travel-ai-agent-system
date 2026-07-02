import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'CronScheduler' });

interface CronJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
}

export class CronScheduler {
  private jobs = new Map<string, CronJob>();
  private intervals = new Map<string, NodeJS.Timeout>();

  schedule(name: string, schedule: string, handler: () => Promise<void>): void {
    const job: CronJob = {
      name,
      schedule,
      handler,
      isRunning: false,
    };

    this.jobs.set(name, job);
    
    // Parse schedule and set interval
    const intervalMs = this.parseSchedule(schedule);
    if (intervalMs > 0) {
      const interval = setInterval(() => this.runJob(name), intervalMs);
      this.intervals.set(name, interval);
      
      // Calculate next run time
      job.nextRun = new Date(Date.now() + intervalMs);
    }
    
    logger.info({ name, schedule }, 'Cron job scheduled');
  }

  private parseSchedule(schedule: string): number {
    // Simple schedule parser
    // Supports: "1m", "5m", "1h", "1d", etc.
    const match = schedule.match(/^(\d+)([mhd])$/);
    if (!match) {
      return 0;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }

  private async runJob(name: string): Promise<void> {
    const job = this.jobs.get(name);
    if (!job || job.isRunning) {
      return;
    }

    job.isRunning = true;
    job.lastRun = new Date();
    
    try {
      await job.handler();
      logger.info({ name }, 'Cron job completed');
    } catch (error) {
      logger.error({ name, error }, 'Cron job failed');
    } finally {
      job.isRunning = false;
      
      // Update next run time
      const intervalMs = this.parseSchedule(job.schedule);
      if (intervalMs > 0) {
        job.nextRun = new Date(Date.now() + intervalMs);
      }
    }
  }

  stop(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
    
    this.jobs.delete(name);
    logger.info({ name }, 'Cron job stopped');
  }

  stopAll(): void {
    for (const [name] of this.intervals) {
      this.stop(name);
    }
    logger.info('All cron jobs stopped');
  }

  getJobs(): CronJob[] {
    return Array.from(this.jobs.values());
  }

  getStatus(): { name: string; lastRun?: Date; nextRun?: Date; isRunning: boolean }[] {
    return Array.from(this.jobs.values()).map(job => ({
      name: job.name,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      isRunning: job.isRunning,
    }));
  }
}

export const cronScheduler = new CronScheduler();
