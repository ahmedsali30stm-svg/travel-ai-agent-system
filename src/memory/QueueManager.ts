import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'QueueManager' });

interface QueueJob {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

interface QueueOptions {
  concurrency?: number;
  maxAttempts?: number;
  retryDelay?: number;
}

export class QueueManager {
  private queues = new Map<string, QueueJob[]>();
  private processors = new Map<string, (data: any) => Promise<any>>();
  private isProcessing = new Map<string, boolean>();

  constructor() {
    // Initialize queue manager
    logger.info('Queue manager initialized');
  }

  async addJob(
    queueName: string,
    type: string,
    data: any,
    options?: { priority?: number; maxAttempts?: number }
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: QueueJob = {
      id: jobId,
      type,
      data,
      status: 'pending',
      priority: options?.priority || 0,
      attempts: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: new Date(),
    };

    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }

    this.queues.get(queueName)!.push(job);
    
    // Sort by priority (higher priority first)
    this.queues.get(queueName)!.sort((a, b) => b.priority - a.priority);
    
    logger.info({ jobId, queueName, type }, 'Job added to queue');
    
    // Start processing if not already
    this.processQueue(queueName);
    
    return jobId;
  }

  async processJob(
    queueName: string,
    processor: (data: any) => Promise<any>
  ): Promise<void> {
    this.processors.set(queueName, processor);
    logger.info({ queueName }, 'Queue processor registered');
  }

  private async processQueue(queueName: string): Promise<void> {
    if (this.isProcessing.get(queueName)) {
      return;
    }

    this.isProcessing.set(queueName, true);
    
    const queue = this.queues.get(queueName);
    if (!queue || queue.length === 0) {
      this.isProcessing.set(queueName, false);
      return;
    }

    const processor = this.processors.get(queueName);
    if (!processor) {
      logger.warn({ queueName }, 'No processor registered for queue');
      this.isProcessing.set(queueName, false);
      return;
    }

    // Get next pending job
    const job = queue.find(j => j.status === 'pending');
    if (!job) {
      this.isProcessing.set(queueName, false);
      return;
    }

    // Update job status
    job.status = 'processing';
    job.startedAt = new Date();
    job.attempts++;
    
    logger.info({ jobId: job.id, queueName }, 'Processing job');
    
    try {
      await processor(job.data);
      
      job.status = 'completed';
      job.completedAt = new Date();
      
      logger.info({ jobId: job.id, queueName }, 'Job completed');
      
      // Remove completed job after delay
      setTimeout(() => {
        const index = queue.indexOf(job);
        if (index > -1) {
          queue.splice(index, 1);
        }
      }, 60000); // Keep for 1 minute
      
    } catch (error) {
      job.status = 'failed';
      job.failedAt = new Date();
      job.error = error instanceof Error ? error.message : String(error);
      
      logger.error({ jobId: job.id, queueName, error }, 'Job failed');
      
      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        job.startedAt = undefined;
        job.completedAt = undefined;
        job.failedAt = undefined;
        job.error = undefined;
        
        logger.info({ jobId: job.id, attempts: job.attempts }, 'Retrying job');
      }
    }
    
    this.isProcessing.set(queueName, false);
    
    // Process next job
    this.processQueue(queueName);
  }

  async getJob(jobId: string): Promise<QueueJob | null> {
    for (const queue of this.queues.values()) {
      const job = queue.find(j => j.id === jobId);
      if (job) {
        return job;
      }
    }
    return null;
  }

  async getQueueStats(queueName: string): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const queue = this.queues.get(queueName) || [];
    
    return {
      pending: queue.filter(j => j.status === 'pending').length,
      processing: queue.filter(j => j.status === 'processing').length,
      completed: queue.filter(j => j.status === 'completed').length,
      failed: queue.filter(j => j.status === 'failed').length,
    };
  }

  async pauseQueue(queueName: string): Promise<void> {
    this.isProcessing.set(queueName, true);
    logger.info({ queueName }, 'Queue paused');
  }

  async resumeQueue(queueName: string): Promise<void> {
    this.isProcessing.set(queueName, false);
    this.processQueue(queueName);
    logger.info({ queueName }, 'Queue resumed');
  }

  async clearQueue(queueName: string): Promise<void> {
    this.queues.set(queueName, []);
    logger.info({ queueName }, 'Queue cleared');
  }
}

export const queueManager = new QueueManager();
