import { createContextLogger } from '../utils/logger.js';
import { redis } from './RedisCache.js';
import { memoryEngine } from './MemoryEngine.js';
import { stateManager } from './StateManager.js';
import { eventManager } from './EventManager.js';

const logger = createContextLogger({ component: 'MemoryIndex' });

export interface MemoryIndex {
  // Cache operations
  cache: {
    get: typeof memoryEngine.get;
    set: typeof memoryEngine.set;
    delete: typeof memoryEngine.delete;
    exists: typeof memoryEngine.exists;
  };

  // State operations
  state: {
    get: typeof stateManager.get;
    set: typeof stateManager.set;
    delete: typeof stateManager.delete;
    watch: typeof stateManager.watch;
  };

  // Event operations
  events: {
    on: typeof eventManager.on;
    once: typeof eventManager.once;
    emit: typeof eventManager.emit;
    off: typeof eventManager.off;
  };

  // Redis operations
  redis: {
    get: typeof redis.get;
    set: typeof redis.set;
    del: typeof redis.del;
    exists: typeof redis.exists;
    increment: typeof redis.increment;
    decrement: typeof redis.decrement;
  };

  // Utility methods
  stats: () => Promise<{
    cache: any;
    state: any;
    events: any;
  }>;

  flush: () => Promise<void>;
}

class MemoryManager implements MemoryIndex {
  cache: MemoryIndex['cache'] = {
    get: memoryEngine.get.bind(memoryEngine),
    set: memoryEngine.set.bind(memoryEngine),
    delete: memoryEngine.delete.bind(memoryEngine),
    exists: memoryEngine.exists.bind(memoryEngine),
  };

  state: MemoryIndex['state'] = {
    get: stateManager.get.bind(stateManager),
    set: stateManager.set.bind(stateManager),
    delete: stateManager.delete.bind(stateManager),
    watch: stateManager.watch.bind(stateManager),
  };

  events: MemoryIndex['events'] = {
    on: eventManager.on.bind(eventManager),
    once: eventManager.once.bind(eventManager),
    emit: eventManager.emit.bind(eventManager),
    off: eventManager.off.bind(eventManager),
  };

  redis: MemoryIndex['redis'] = {
    get: redis.get.bind(redis),
    set: redis.set.bind(redis),
    del: redis.del.bind(redis),
    exists: redis.exists.bind(redis),
    increment: redis.increment.bind(redis),
    decrement: redis.decrement.bind(redis),
  };

  async stats() {
    const [cacheStats, stateStats, eventStats] = await Promise.all([
      memoryEngine.stats(),
      stateManager.stats(),
      eventManager.stats(),
    ]);

    return {
      cache: cacheStats,
      state: stateStats,
      events: eventStats,
    };
  }

  async flush() {
    await Promise.all([
      memoryEngine.flush(),
      stateManager.clear(),
      eventManager.clearHistory(),
    ]);
    logger.info('All memory flushed');
  }
}

export const memory = new MemoryManager();
