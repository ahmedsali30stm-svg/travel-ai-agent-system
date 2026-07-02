import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'StateManager' });

interface State {
  key: string;
  value: any;
  version: number;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

interface StateOptions {
  version?: number;
  metadata?: Record<string, any>;
}

export class StateManager {
  private states = new Map<string, State>();
  private watchers = new Map<string, Set<(value: any) => void>>();

  constructor() {
    // Initialize state manager
    logger.info('State manager initialized');
  }

  async get(key: string): Promise<any | null> {
    const state = this.states.get(key);
    return state ? state.value : null;
  }

  async set(key: string, value: any, options?: StateOptions): Promise<void> {
    const existingState = this.states.get(key);
    const version = options?.version || (existingState?.version || 0) + 1;
    
    const state: State = {
      key,
      value,
      version,
      updatedAt: new Date(),
      metadata: options?.metadata,
    };

    this.states.set(key, state);
    
    // Notify watchers
    const watchers = this.watchers.get(key);
    if (watchers) {
      for (const watcher of watchers) {
        try {
          watcher(value);
        } catch (error) {
          logger.error({ key, error }, 'Watcher error');
        }
      }
    }
    
    logger.debug({ key, version }, 'State updated');
  }

  async delete(key: string): Promise<void> {
    this.states.delete(key);
    
    // Notify watchers
    const watchers = this.watchers.get(key);
    if (watchers) {
      for (const watcher of watchers) {
        try {
          watcher(null);
        } catch (error) {
          logger.error({ key, error }, 'Watcher error');
        }
      }
    }
    
    logger.debug({ key }, 'State deleted');
  }

  async exists(key: string): Promise<boolean> {
    return this.states.has(key);
  }

  async version(key: string): Promise<number> {
    const state = this.states.get(key);
    return state ? state.version : 0;
  }

  async watch(key: string, callback: (value: any) => void): Promise<() => void> {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    
    this.watchers.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const watchers = this.watchers.get(key);
      if (watchers) {
        watchers.delete(callback);
      }
    };
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.states.keys());
    
    if (!pattern) {
      return allKeys;
    }
    
    // Simple pattern matching
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    
    return allKeys.filter(key => regex.test(key));
  }

  async snapshot(): Promise<Record<string, any>> {
    const snapshot: Record<string, any> = {};
    
    for (const [key, state] of this.states.entries()) {
      snapshot[key] = {
        value: state.value,
        version: state.version,
        updatedAt: state.updatedAt,
      };
    }
    
    return snapshot;
  }

  async restore(snapshot: Record<string, any>): Promise<void> {
    this.states.clear();
    
    for (const [key, data] of Object.entries(snapshot)) {
      this.states.set(key, {
        key,
        value: data.value,
        version: data.version,
        updatedAt: new Date(data.updatedAt),
      });
    }
    
    logger.info({ keys: Object.keys(snapshot).length }, 'State restored from snapshot');
  }

  async clear(): Promise<void> {
    this.states.clear();
    this.watchers.clear();
    logger.info('State cleared');
  }

  async stats(): Promise<{
    totalKeys: number;
    totalWatchers: number;
  }> {
    let totalWatchers = 0;
    for (const watchers of this.watchers.values()) {
      totalWatchers += watchers.size;
    }

    return {
      totalKeys: this.states.size,
      totalWatchers,
    };
  }
}

export const stateManager = new StateManager();
