import { config } from '../config/index.js';
import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'Worker' });

interface WorkerJob {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

type JobProcessor = (data: any) => Promise<void>;

export class Worker {
  private queues = new Map<string, WorkerJob[]>();
  private processors = new Map<string, JobProcessor>();
  private isProcessing = new Map<string, boolean>();
  private pollInterval = 1000;

  constructor() {
    // Start polling for jobs
    this.startPolling();
  }

  async addJob(queueName: string, type: string, data: any): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: WorkerJob = {
      id: jobId,
      type,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }

    this.queues.get(queueName)!.push(job);
    
    logger.info({ jobId, queueName, type }, 'Job added');
    
    return jobId;
  }

  process(queueName: string, processor: JobProcessor): void {
    this.processors.set(queueName, processor);
    logger.info({ queueName }, 'Processor registered');
  }

  private startPolling(): void {
    setInterval(() => this.poll(), this.pollInterval);
  }

  private async poll(): Promise<void> {
    for (const [queueName, queue] of this.queues.entries()) {
      if (this.isProcessing.get(queueName)) {
        continue;
      }

      const processor = this.processors.get(queueName);
      if (!processor) {
        continue;
      }

      const job = queue.find(j => j.status === 'pending');
      if (!job) {
        continue;
      }

      this.isProcessing.set(queueName, true);
      
      try {
        job.status = 'processing';
        job.startedAt = new Date();
        job.attempts++;
        
        await processor(job.data);
        
        job.status = 'completed';
        job.completedAt = new Date();
        
        logger.info({ jobId: job.id, queueName }, 'Job completed');
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
        }
      }
      
      this.isProcessing.set(queueName, false);
    }
  }

  async getJob(jobId: string): Promise<WorkerJob | null> {
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
    logger.info({ queueName }, 'Queue resumed');
  }

  async clearQueue(queueName: string): Promise<void> {
    this.queues.set(queueName, []);
    logger.info({ queueName }, 'Queue cleared');
  }
}

export const worker = new Worker();
