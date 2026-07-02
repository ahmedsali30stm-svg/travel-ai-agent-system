# Download Manager

> File download handling and management for web scraping operations.

---

## Overview

The Download Manager handles file downloads, tracks download progress, and manages downloaded files.

---

## Download Manager Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DOWNLOAD MANAGER ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         DOWNLOAD TRACKING                                  │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Download  │ │  Progress │ │  Status   │ │  Speed    │ │  ETA     │  │ │
│  │  │  Monitor  │ │  Tracker  │ │  Manager  │ │  Monitor  │ │  Calculator│ │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         FILE MANAGEMENT                                     │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  File     │ │  File     │ │  File     │ │  File     │ │  File     │  │ │
│  │  │  Organize │ │  Rename   │ │  Compress │ │  Verify   │ │  Cleanup  │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         DOWNLOAD TYPES                                     │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Single   │ │  Batch    │ │  Parallel │ │  Resume   │ │  Retry    │  │ │
│  │  │  Download │ │  Download │ │  Download │ │  Download │ │  Download │  │ │
│  │  └───────────┘ └───────────┘ └───────── └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Download Manager Implementation

```typescript
import { Page, Download } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

interface DownloadConfig {
  // Download directory
  downloadPath: string;
  
  // Parallel downloads
  maxParallel: number;
  
  // Retry settings
  maxRetries: number;
  retryDelay: number;
  
  // Timeout settings
  timeout: number;
  
  // File settings
  allowedExtensions: string[];
  maxFileSize: number;
  
  // Organization
  organizeByType: boolean;
  organizeByDate: boolean;
}

interface DownloadTask {
  // Task ID
  id: string;
  
  // URL
  url: string;
  
  // Filename
  filename: string;
  
  // Status
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  
  // Progress
  progress: {
    downloaded: number;
    total: number;
    percentage: number;
    speed: number;
    eta: number;
  };
  
  // Metadata
  metadata: {
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    duration?: number;
    mimeType?: string;
    extension?: string;
  };
  
  // Error
  error?: string;
}

class DownloadManager {
  private page: Page;
  private config: DownloadConfig;
  private tasks: Map<string, DownloadTask>;
  private queue: string[];
  private active: Set<string>;
  
  constructor(page: Page, config: DownloadConfig) {
    this.page = page;
    this.config = config;
    this.tasks = new Map();
    this.queue = [];
    this.active = new Set();
    
    // Ensure download directory exists
    this.ensureDownloadDir();
  }
  
  // Ensure download directory exists
  private async ensureDownloadDir(): Promise<void> {
    await fs.mkdir(this.config.downloadPath, { recursive: true });
  }
  
  // Download single file
  async download(url: string, filename?: string): Promise<DownloadTask> {
    // Create task
    const task = this.createTask(url, filename);
    
    // Add to queue
    this.queue.push(task.id);
    
    // Process queue
    await this.processQueue();
    
    return task;
  }
  
  // Download multiple files
  async downloadBatch(urls: string[]): Promise<DownloadTask[]> {
    const tasks: DownloadTask[] = [];
    
    for (const url of urls) {
      const task = this.createTask(url);
      this.queue.push(task.id);
      tasks.push(task);
    }
    
    // Process queue
    await this.processQueue();
    
    return tasks;
  }
  
  // Create download task
  private createTask(url: string, filename?: string): DownloadTask {
    const id = this.generateId();
    const extension = path.extname(new URL(url).pathname);
    const name = filename || path.basename(new URL(url).pathname);
    
    const task: DownloadTask = {
      id,
      url,
      filename: name,
      status: 'pending',
      progress: {
        downloaded: 0,
        total: 0,
        percentage: 0,
        speed: 0,
        eta: 0,
      },
      metadata: {
        createdAt: Date.now(),
        extension,
      },
    };
    
    this.tasks.set(id, task);
    return task;
  }
  
  // Process download queue
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.active.size < this.config.maxParallel) {
      const taskId = this.queue.shift()!;
      const task = this.tasks.get(taskId)!;
      
      if (task.status === 'cancelled') {
        continue;
      }
      
      this.active.add(taskId);
      this.startDownload(task).finally(() => {
        this.active.delete(taskId);
        this.processQueue();
      });
    }
  }
  
  // Start download
  private async startDownload(task: DownloadTask): Promise<void> {
    task.status = 'downloading';
    task.metadata.startedAt = Date.now();
    
    try {
      // Get download
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: this.config.timeout }),
        this.page.evaluate((url) => {
          const a = document.createElement('a');
          a.href = url;
          a.download = '';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }, task.url),
      ]);
      
      // Get filename
      const suggestedFilename = download.suggestedFilename();
      task.filename = suggestedFilename || task.filename;
      
      // Check file extension
      if (!this.isAllowedExtension(task.filename)) {
        throw new Error(`File extension not allowed: ${task.filename}`);
      }
      
      // Get file path
      const filePath = await this.getFilePath(task);
      
      // Save file
      await download.saveAs(filePath);
      
      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Check file size
      if (stats.size > this.config.maxFileSize) {
        throw new Error(`File size exceeds limit: ${stats.size}`);
      }
      
      // Update task
      task.status = 'completed';
      task.progress.downloaded = stats.size;
      task.progress.total = stats.size;
      task.progress.percentage = 100;
      task.metadata.completedAt = Date.now();
      task.metadata.duration = task.metadata.completedAt - task.metadata.startedAt!;
      
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      
      // Retry if needed
      if (task.metadata.duration === undefined) {
        await this.retryDownload(task);
      }
    }
  }
  
  // Retry download
  private async retryDownload(task: DownloadTask): Promise<void> {
    for (let i = 0; i < this.config.maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      
      try {
        await this.startDownload(task);
        return;
      } catch (error) {
        continue;
      }
    }
  }
  
  // Get file path
  private async getFilePath(task: DownloadTask): Promise<string> {
    let dir = this.config.downloadPath;
    
    // Organize by type
    if (this.config.organizeByType && task.metadata.extension) {
      dir = path.join(dir, this.getFileTypeDir(task.metadata.extension));
      await fs.mkdir(dir, { recursive: true });
    }
    
    // Organize by date
    if (this.config.organizeByDate) {
      const date = new Date().toISOString().split('T')[0];
      dir = path.join(dir, date);
      await fs.mkdir(dir, { recursive: true });
    }
    
    return path.join(dir, task.filename);
  }
  
  // Get file type directory
  private getFileTypeDir(extension: string): string {
    const typeMap: Record<string, string> = {
      '.jpg': 'images',
      '.jpeg': 'images',
      '.png': 'images',
      '.gif': 'images',
      '.webp': 'images',
      '.pdf': 'documents',
      '.doc': 'documents',
      '.docx': 'documents',
      '.xls': 'documents',
      '.xlsx': 'documents',
      '.zip': 'archives',
      '.rar': 'archives',
      '.7z': 'archives',
      '.mp4': 'videos',
      '.avi': 'videos',
      '.mov': 'videos',
    };
    
    return typeMap[extension.toLowerCase()] || 'other';
  }
  
  // Check if extension is allowed
  private isAllowedExtension(filename: string): boolean {
    if (this.config.allowedExtensions.length === 0) {
      return true;
    }
    
    const extension = path.extname(filename).toLowerCase();
    return this.config.allowedExtensions.includes(extension);
  }
  
  // Cancel download
  cancel(taskId: string): void {
    const task = this.tasks.get(taskId);
    
    if (task) {
      task.status = 'cancelled';
      
      // Remove from queue
      this.queue = this.queue.filter(id => id !== taskId);
    }
  }
  
  // Cancel all downloads
  cancelAll(): void {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'pending' || task.status === 'downloading') {
        this.cancel(taskId);
      }
    }
  }
  
  // Get task status
  getStatus(taskId: string): DownloadTask | null {
    return this.tasks.get(taskId) || null;
  }
  
  // Get all tasks
  getAllTasks(): DownloadTask[] {
    return Array.from(this.tasks.values());
  }
  
  // Get completed tasks
  getCompletedTasks(): DownloadTask[] {
    return this.getAllTasks().filter(t => t.status === 'completed');
  }
  
  // Get failed tasks
  getFailedTasks(): DownloadTask[] {
    return this.getAllTasks().filter(t => t.status === 'failed');
  }
  
  // Get active tasks
  getActiveTasks(): DownloadTask[] {
    return this.getAllTasks().filter(t => t.status === 'downloading');
  }
  
  // Get pending tasks
  getPendingTasks(): DownloadTask[] {
    return this.getAllTasks().filter(t => t.status === 'pending');
  }
  
  // Get download stats
  getStats(): DownloadStats {
    const tasks = this.getAllTasks();
    
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      active: tasks.filter(t => t.status === 'downloading').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      totalSize: tasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.progress.downloaded, 0),
      avgSpeed: this.calculateAvgSpeed(tasks),
      avgDuration: this.calculateAvgDuration(tasks),
    };
  }
  
  // Calculate average speed
  private calculateAvgSpeed(tasks: DownloadTask[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.metadata.duration);
    
    if (completedTasks.length === 0) {
      return 0;
    }
    
    const totalSpeed = completedTasks.reduce((sum, t) => {
      return sum + t.progress.downloaded / (t.metadata.duration! / 1000);
    }, 0);
    
    return totalSpeed / completedTasks.length;
  }
  
  // Calculate average duration
  private calculateAvgDuration(tasks: DownloadTask[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.metadata.duration);
    
    if (completedTasks.length === 0) {
      return 0;
    }
    
    const totalDuration = completedTasks.reduce((sum, t) => {
      return sum + t.metadata.duration!;
    }, 0);
    
    return totalDuration / completedTasks.length;
  }
  
  // Generate unique ID
  private generateId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Download Configuration

```yaml
downloadManager:
  # Download directory
  downloadPath: ./downloads
  
  # Parallel downloads
  maxParallel: 5
  
  # Retry settings
  maxRetries: 3
  retryDelay: 5000
  
  # Timeout settings
  timeout: 300000 # 5 minutes
  
  # File settings
  allowedExtensions:
    - .jpg
    - .jpeg
    - .png
    - .gif
    - .webp
    - .pdf
    - .doc
    - .docx
    - .xls
    - .xlsx
    - .zip
    - .rar
  maxFileSize: 104857600 # 100 MB
  
  # Organization
  organizeByType: true
  organizeByDate: true
```

---

## Download Statistics

```typescript
interface DownloadStats {
  // Counts
  total: number;
  completed: number;
  failed: number;
  active: number;
  pending: number;
  cancelled: number;
  
  // Size
  totalSize: number;
  avgFileSize: number;
  
  // Performance
  avgSpeed: number;
  avgDuration: number;
  
  // Success rate
  successRate: number;
}
```
