# Logger

> Comprehensive logging system for web scraping operations.

---

## Overview

The Logger provides structured logging with multiple log levels, transports, and formatting options.

---

## Logger Implementation

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
  source: string;
  stack?: string;
}

interface LoggerConfig {
  level: LogLevel;
  transports: Transport[];
  format: 'json' | 'text' | 'pretty';
  context: Record<string, any>;
}

interface Transport {
  type: 'console' | 'file' | 'http' | 'elasticsearch';
  config: any;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor(config: LoggerConfig) {
    this.config = config;
    
    // Start flush interval
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000);
  }
  
  // Log debug message
  debug(message: string, context: Record<string, any> = {}): void {
    this.log('debug', message, context);
  }
  
  // Log info message
  info(message: string, context: Record<string, any> = {}): void {
    this.log('info', message, context);
  }
  
  // Log warning message
  warn(message: string, context: Record<string, any> = {}): void {
    this.log('warn', message, context);
  }
  
  // Log error message
  error(message: string, context: Record<string, any> = {}): void {
    this.log('error', message, context);
  }
  
  // Log fatal message
  fatal(message: string, context: Record<string, any> = {}): void {
    this.log('fatal', message, context);
  }
  
  // Log message
  private log(level: LogLevel, message: string, context: Record<string, any>): void {
    // Check log level
    if (!this.shouldLog(level)) {
      return;
    }
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context: {
        ...this.config.context,
        ...context,
      },
      source: this.getSource(),
    };
    
    // Add stack trace for errors
    if (level === 'error' || level === 'fatal') {
      entry.stack = new Error().stack;
    }
    
    // Add to buffer
    this.logBuffer.push(entry);
    
    // Flush if buffer is full
    if (this.logBuffer.length >= 100) {
      this.flush();
    }
  }
  
  // Check if should log
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const configIndex = levels.indexOf(this.config.level);
    const messageIndex = levels.indexOf(level);
    
    return messageIndex >= configIndex;
  }
  
  // Get source
  private getSource(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';
    
    const lines = stack.split('\n');
    const callerLine = lines[4] || lines[3] || '';
    const match = callerLine.match(/at\s+(.+?)\s+\((.+?)\)/);
    
    return match ? `${match[1]} (${match[2]})` : 'unknown';
  }
  
  // Flush logs
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }
    
    const entries = [...this.logBuffer];
    this.logBuffer = [];
    
    // Send to transports
    for (const transport of this.config.transports) {
      try {
        await this.sendToTransport(transport, entries);
      } catch (error) {
        console.error('Failed to send logs to transport:', error);
      }
    }
  }
  
  // Send to transport
  private async sendToTransport(transport: Transport, entries: LogEntry[]): Promise<void> {
    switch (transport.type) {
      case 'console':
        await this.sendToConsole(transport.config, entries);
        break;
      case 'file':
        await this.sendToFile(transport.config, entries);
        break;
      case 'http':
        await this.sendToHttp(transport.config, entries);
        break;
      case 'elasticsearch':
        await this.sendToElasticsearch(transport.config, entries);
        break;
    }
  }
  
  // Send to console
  private async sendToConsole(config: any, entries: LogEntry[]): Promise<void> {
    for (const entry of entries) {
      const formatted = this.formatEntry(entry);
      
      switch (entry.level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
        case 'fatal':
          console.error(formatted);
          break;
      }
    }
  }
  
  // Send to file
  private async sendToFile(config: any, entries: LogEntry[]): Promise<void> {
    const filePath = config.path || './logs/app.log';
    const dir = path.dirname(filePath);
    
    await fs.mkdir(dir, { recursive: true });
    
    const lines = entries.map(entry => this.formatEntry(entry));
    await fs.appendFile(filePath, lines.join('\n') + '\n');
  }
  
  // Send to HTTP
  private async sendToHttp(config: any, entries: LogEntry[]): Promise<void> {
    await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(entries),
    });
  }
  
  // Send to Elasticsearch
  private async sendToElasticsearch(config: any, entries: LogEntry[]): Promise<void> {
    const index = config.index || 'scraper-logs';
    const url = `${config.url}/${index}/_bulk`;
    
    const body = entries
      .map(entry => JSON.stringify({ index: {} }) + '\n' + JSON.stringify(entry))
      .join('\n');
    
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
      },
      body,
    });
  }
  
  // Format entry
  private formatEntry(entry: LogEntry): string {
    switch (this.config.format) {
      case 'json':
        return JSON.stringify(entry);
      case 'pretty':
        return this.prettyFormat(entry);
      case 'text':
      default:
        return this.textFormat(entry);
    }
  }
  
  // Text format
  private textFormat(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const contextStr = Object.entries(entry.context)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    
    return `${timestamp} [${entry.level.toUpperCase()}] ${entry.message} ${contextStr}`;
  }
  
  // Pretty format
  private prettyFormat(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const contextStr = Object.entries(entry.context)
      .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
      .join('\n');
    
    return `
${timestamp} ${level} ${entry.message}
${contextStr}
`;
  }
  
  // Create child logger
  child(context: Record<string, any>): Logger {
    return new Logger({
      ...this.config,
      context: {
        ...this.config.context,
        ...context,
      },
    });
  }
  
  // Cleanup
  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}
```

---

## Logger Configuration

```yaml
logger:
  # Log level
  level: info
  
  # Format
  format: json
  
  # Default context
  context:
    service: scraper
    environment: production
  
  # Transports
  transports:
    - type: console
      config:
        colorize: true
    
    - type: file
      config:
        path: ./logs/scraper.log
        maxSize: 104857600 # 100 MB
        maxFiles: 10
    
    - type: http
      config:
        url: https://logs.example.com/ingest
        headers:
          Authorization: Bearer ${LOG_TOKEN}
    
    - type: elasticsearch
      config:
        url: https://elasticsearch.example.com
        index: scraper-logs
        username: ${ES_USERNAME}
        password: ${ES_PASSWORD}
```

---

## Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| debug | Detailed debugging info | Development troubleshooting |
| info | General operational events | Normal operation tracking |
| warn | Unexpected but non-critical | Degraded performance |
| error | Failure that needs attention | Request failures, extraction errors |
| fatal | Critical failure | System crashes, data corruption |
