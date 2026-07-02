import { createContextLogger } from '../utils/logger.js';

const logger = createContextLogger({ component: 'EventManager' });

interface Event {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  source?: string;
  metadata?: Record<string, any>;
}

type EventHandler = (event: Event) => Promise<void>;

export class EventManager {
  private handlers = new Map<string, Set<EventHandler>>();
  private eventHistory: Event[] = [];
  private maxHistorySize = 1000;

  constructor() {
    // Initialize event manager
    logger.info('Event manager initialized');
  }

  async on(type: string, handler: EventHandler): Promise<() => void> {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    
    this.handlers.get(type)!.add(handler);
    
    logger.debug({ type }, 'Event handler registered');
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  async once(type: string, handler: EventHandler): Promise<() => void> {
    const wrappedHandler: EventHandler = async (event) => {
      await handler(event);
      // Remove after first call
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(wrappedHandler);
      }
    };
    
    return this.on(type, wrappedHandler);
  }

  async emit(type: string, data: any, options?: { source?: string; metadata?: Record<string, any> }): Promise<void> {
    const event: Event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      source: options?.source,
      metadata: options?.metadata,
    };

    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify handlers
    const handlers = this.handlers.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          logger.error({ type, eventId: event.id, error }, 'Event handler error');
        }
      }
    }

    logger.debug({ type, eventId: event.id }, 'Event emitted');
  }

  async off(type: string, handler?: EventHandler): Promise<void> {
    if (handler) {
      // Remove specific handler
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
      }
    } else {
      // Remove all handlers for type
      this.handlers.delete(type);
    }
  }

  async getHistory(type?: string, limit?: number): Promise<Event[]> {
    let history = this.eventHistory;
    
    if (type) {
      history = history.filter(e => e.type === type);
    }
    
    if (limit) {
      history = history.slice(-limit);
    }
    
    return history;
  }

  async clearHistory(): Promise<void> {
    this.eventHistory = [];
    logger.info('Event history cleared');
  }

  async stats(): Promise<{
    totalHandlers: number;
    handlersByType: Record<string, number>;
    historySize: number;
  }> {
    const handlersByType: Record<string, number> = {};
    let totalHandlers = 0;
    
    for (const [type, handlers] of this.handlers.entries()) {
      handlersByType[type] = handlers.size;
      totalHandlers += handlers.size;
    }

    return {
      totalHandlers,
      handlersByType,
      historySize: this.eventHistory.length,
    };
  }
}

export const eventManager = new EventManager();
