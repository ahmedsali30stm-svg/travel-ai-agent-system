# Session Manager

> Cookie and session persistence for maintaining state across scraping operations.

---

## Overview

The Session Manager handles cookie storage, session persistence, and state management, enabling long-running scraping operations that maintain authentication and user state.

---

## Session Manager Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SESSION MANAGER ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         SESSION STORE                                       │ │
│  │                                                                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │ │
│  │  │  Cookie     │  │  Local     │  │  Session    │  │  IndexedDB  │     │ │
│  │  │  Store      │  │  Storage   │  │  Storage    │  │  Store      │     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         SESSION OPERATIONS                                  │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Save     │ │  Load     │ │  Merge    │ │  Export   │ │  Import   │  │ │
│  │  │  Session  │ │  Session  │ │  Sessions │ │  Session  │ │  Session  │  │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                      ↓                                          │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         SESSION FEATURES                                   │ │
│  │                                                                            │ │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐  │ │
│  │  │  Cookie   │ │  Storage  │ │  IndexedDB│ │  Cache    │ │  Fingerprint│ │ │
│  │  │  Persistence│ │ Persistence│ │ Persistence│ │ Persistence│ │ Persistence│ │ │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Session Manager Implementation

```typescript
import { BrowserContext, Cookie } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface SessionConfig {
  // Storage path
  storagePath: string;
  
  // Encryption
  encryption: boolean;
  encryptionKey?: string;
  
  // TTL
  ttl: number;
  
  // Compression
  compression: boolean;
  
  // Backup
  backup: boolean;
  backupInterval: number;
}

interface SessionData {
  // Session ID
  id: string;
  
  // Cookies
  cookies: Cookie[];
  
  // Local storage
  localStorage: Record<string, string>;
  
  // Session storage
  sessionStorage: Record<string, string>;
  
  // IndexedDB
  indexedDB?: any;
  
  // Metadata
  metadata: {
    createdAt: number;
    lastUpdated: number;
    expiresAt: number;
    domain: string;
    userAgent: string;
  };
}

class SessionManager {
  private sessions: Map<string, SessionData>;
  private config: SessionConfig;
  
  constructor(config: SessionConfig) {
    this.config = config;
    this.sessions = new Map();
    
    // Load existing sessions
    this.loadSessions();
    
    // Start cleanup
    this.startCleanup();
  }
  
  // Save session from context
  async save(
    contextId: string,
    context: BrowserContext,
    domain: string
  ): Promise<string> {
    // Get cookies
    const cookies = await context.cookies();
    
    // Get local storage
    const localStorage = await this.getExternalStorage(context);
    
    // Get session storage
    const sessionStorage = await this.getSessionStorage(context);
    
    // Create session data
    const sessionData: SessionData = {
      id: this.generateId(),
      cookies,
      localStorage,
      sessionStorage,
      metadata: {
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        expiresAt: Date.now() + this.config.ttl,
        domain,
        userAgent: await context.browser()!.newContext().then(c => c.browser()!.version || ''),
      },
    };
    
    // Encrypt if enabled
    if (this.config.encryption) {
      sessionData.cookies = this.encrypt(sessionData.cookies);
    }
    
    // Store session
    this.sessions.set(sessionData.id, sessionData);
    
    // Persist to disk
    await this.persistSession(sessionData);
    
    return sessionData.id;
  }
  
  // Load session to context
  async load(
    sessionId: string,
    context: BrowserContext
  ): Promise<boolean> {
    // Get session data
    let sessionData = this.sessions.get(sessionId);
    
    // Try to load from disk
    if (!sessionData) {
      sessionData = await this.loadFromDisk(sessionId);
    }
    
    if (!sessionData) {
      return false;
    }
    
    // Check expiration
    if (Date.now() > sessionData.metadata.expiresAt) {
      await this.delete(sessionId);
      return false;
    }
    
    // Decrypt if enabled
    if (this.config.encryption) {
      sessionData.cookies = this.decrypt(sessionData.cookies);
    }
    
    // Set cookies
    await context.addCookies(sessionData.cookies);
    
    // Set local storage
    await this.setLocalStorage(context, sessionData.localStorage);
    
    // Set session storage
    await this.setSessionStorage(context, sessionData.sessionStorage);
    
    return true;
  }
  
  // Get external storage
  private async getExternalStorage(
    context: BrowserContext
  ): Promise<Record<string, string>> {
    const page = await context.newPage();
    
    const storage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      return data;
    });
    
    await page.close();
    return storage;
  }
  
  // Set external storage
  private async setLocalStorage(
    context: BrowserContext,
    storage: Record<string, string>
  ): Promise<void> {
    const page = await context.newPage();
    
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, storage);
    
    await page.close();
  }
  
  // Get session storage
  private async getSessionStorage(
    context: BrowserContext
  ): Promise<Record<string, string>> {
    const page = await context.newPage();
    
    const storage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data[key] = sessionStorage.getItem(key) || '';
        }
      }
      return data;
    });
    
    await page.close();
    return storage;
  }
  
  // Set session storage
  private async setSessionStorage(
    context: BrowserContext,
    storage: Record<string, string>
  ): Promise<void> {
    const page = await context.newPage();
    
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        sessionStorage.setItem(key, value);
      }
    }, storage);
    
    await page.close();
  }
  
  // Persist session to disk
  private async persistSession(session: SessionData): Promise<void> {
    const filePath = path.join(
      this.config.storagePath,
      `${session.id}.json`
    );
    
    // Create directory if not exists
    await fs.mkdir(this.config.storagePath, { recursive: true });
    
    // Write to disk
    await fs.writeFile(filePath, JSON.stringify(session));
  }
  
  // Load session from disk
  private async loadFromDisk(sessionId: string): Promise<SessionData | null> {
    try {
      const filePath = path.join(
        this.config.storagePath,
        `${sessionId}.json`
      );
      
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
  
  // Delete session
  async delete(sessionId: string): Promise<void> {
    // Remove from memory
    this.sessions.delete(sessionId);
    
    // Remove from disk
    try {
      const filePath = path.join(
        this.config.storagePath,
        `${sessionId}.json`
      );
      
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore delete errors
    }
  }
  
  // Load all sessions
  private async loadSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.storagePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionId = file.replace('.json', '');
          const session = await this.loadFromDisk(sessionId);
          
          if (session) {
            this.sessions.set(sessionId, session);
          }
        }
      }
    } catch (error) {
      // Ignore load errors
    }
  }
  
  // Start cleanup
  private startCleanup(): void {
    setInterval(async () => {
      await this.cleanup();
    }, 3600000); // 1 hour
  }
  
  // Cleanup expired sessions
  private async cleanup(): Promise<void> {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions) {
      if (now > session.metadata.expiresAt) {
        await this.delete(sessionId);
      }
    }
  }
  
  // Export session
  async export(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    return JSON.stringify(session);
  }
  
  // Import session
  async import(sessionData: string): Promise<string> {
    const session: SessionData = JSON.parse(sessionData);
    
    // Generate new ID
    session.id = this.generateId();
    
    // Update timestamps
    session.metadata.lastUpdated = Date.now();
    session.metadata.expiresAt = Date.now() + this.config.ttl;
    
    // Store session
    this.sessions.set(session.id, session);
    
    // Persist to disk
    await this.persistSession(session);
    
    return session.id;
  }
  
  // Merge sessions
  async merge(sessionIds: string[]): Promise<string> {
    const cookies: Cookie[] = [];
    const localStorage: Record<string, string> = {};
    const sessionStorage: Record<string, string> = {};
    
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      
      if (session) {
        cookies.push(...session.cookies);
        Object.assign(localStorage, session.localStorage);
        Object.assign(sessionStorage, session.sessionStorage);
      }
    }
    
    // Create merged session
    const mergedSession: SessionData = {
      id: this.generateId(),
      cookies,
      localStorage,
      sessionStorage,
      metadata: {
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        expiresAt: Date.now() + this.config.ttl,
        domain: '',
        userAgent: '',
      },
    };
    
    // Store merged session
    this.sessions.set(mergedSession.id, mergedSession);
    
    // Persist to disk
    await this.persistSession(mergedSession);
    
    return mergedSession.id;
  }
  
  // Encrypt data
  private encrypt(data: any): any {
    const key = this.config.encryptionKey || 'default-key';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      data: encrypted,
    };
  }
  
  // Decrypt data
  private decrypt(data: any): any {
    const key = this.config.encryptionKey || 'default-key';
    const iv = Buffer.from(data.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let decrypted = decipher.update(data.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  // Generate unique ID
  private generateId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Get session stats
  getStats(): SessionStats {
    const sessions = Array.from(this.sessions.values());
    
    return {
      total: sessions.length,
      active: sessions.filter(s => Date.now() < s.metadata.expiresAt).length,
      expired: sessions.filter(s => Date.now() > s.metadata.expiresAt).length,
      totalCookies: sessions.reduce((sum, s) => sum + s.cookies.length, 0),
      totalStorageSize: this.calculateStorageSize(sessions),
    };
  }
  
  // Calculate storage size
  private calculateStorageSize(sessions: SessionData[]): number {
    return sessions.reduce((sum, session) => {
      const cookieSize = JSON.stringify(session.cookies).length;
      const localStorageSize = JSON.stringify(session.localStorage).length;
      const sessionStorageSize = JSON.stringify(session.sessionStorage).length;
      return sum + cookieSize + localStorageSize + sessionStorageSize;
    }, 0);
  }
}
```

---

## Session Configuration

```yaml
sessionManager:
  # Storage settings
  storagePath: ./sessions
  
  # Encryption
  encryption: true
  encryptionKey: ${SESSION_ENCRYPTION_KEY}
  
  # TTL
  ttl: 86400000 # 24 hours
  
  # Compression
  compression: true
  
  # Backup
  backup: true
  backupInterval: 3600000 # 1 hour
  
  # Cleanup
  cleanup:
    enabled: true
    interval: 3600000 # 1 hour
    maxSessions: 1000
```

---

## Session Statistics

```typescript
interface SessionStats {
  // Counts
  total: number;
  active: number;
  expired: number;
  
  // Data
  totalCookies: number;
  totalStorageSize: number;
  
  // Performance
  avgSaveTime: number;
  avgLoadTime: number;
}
```
