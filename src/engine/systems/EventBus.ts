/**
 * Central event bus for game event distribution
 * Implements pub/sub pattern for decoupled system communication
 */

import {
  GameEvent,
  EventHandler,
  EventFilter,
  EventListener,
  EventListenerRegistry,
} from '../types/events.types';

export class EventBus implements EventListenerRegistry {
  private listenerMap = new Map<string, EventListener[]>();
  private eventHistory: GameEvent[] = [];
  private maxHistorySize = 100;
  private isProcessing = false;
  private pendingEvents: GameEvent[] = [];

  /**
   * Subscribe to an event
   */
  on<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    filter?: EventFilter<T>
  ): string {
    return this.add(eventType, handler, filter, false);
  }

  /**
   * Subscribe to event once
   */
  once<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    filter?: EventFilter<T>
  ): string {
    return this.add(eventType, handler, filter, true);
  }

  /**
   * Unsubscribe from event
   */
  off(id: string): boolean {
    return this.remove(id);
  }

  /**
   * Publish an event to all listeners
   */
  emit<T extends GameEvent>(event: T): void {
    if (this.isProcessing) {
      // Queue events during batch processing
      this.pendingEvents.push(event);
      return;
    }

    this.isProcessing = true;

    try {
      this.processEvent(event);

      // Process queued events
      while (this.pendingEvents.length > 0) {
        const nextEvent = this.pendingEvents.shift()!;
        this.processEvent(nextEvent);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Emit multiple events (batch processing)
   */
  emitBatch<T extends GameEvent>(events: T[]): void {
    this.isProcessing = true;

    try {
      for (const event of events) {
        this.processEvent(event);
      }

      // Process queued events
      while (this.pendingEvents.length > 0) {
        const nextEvent = this.pendingEvents.shift()!;
        this.processEvent(nextEvent);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get all listeners for an event type
   */
  getListeners(eventType?: string): EventListener[] {
    if (!eventType) {
      const all: EventListener[] = [];
      for (const listeners of this.listenerMap.values()) {
        all.push(...listeners);
      }
      return all;
    }

    return this.listenerMap.get(eventType) ?? [];
  }

  /**
   * Clear all listeners (optionally for specific event)
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.listenerMap.delete(eventType);
    } else {
      this.listenerMap.clear();
    }
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): GameEvent[] {
    if (!limit) return [...this.eventHistory];
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Check if any listeners exist for event type
   */
  hasListeners(eventType: string): boolean {
    return (this.listenerMap.get(eventType)?.length ?? 0) > 0;
  }

  /**
   * Get listener count
   */
  getListenerCount(eventType?: string): number {
    if (!eventType) {
      let count = 0;
      for (const listeners of this.listenerMap.values()) {
        count += listeners.length;
      }
      return count;
    }

    return this.listenerMap.get(eventType)?.length ?? 0;
  }

  // ────────────────────────────────────────────────────────────────────────

  /**
   * Add listener (internal)
   */
  add<T extends GameEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    filter?: EventFilter<T>,
    once?: boolean
  ): string {
    const id = this.generateListenerId();

    const listener: EventListener = {
      id,
      event: eventType,
      handler: handler as EventHandler,
      filter: filter as EventFilter | undefined,
      once,
    };

    if (!this.listenerMap.has(eventType)) {
      this.listenerMap.set(eventType, []);
    }

    this.listenerMap.get(eventType)!.push(listener);
    return id;
  }

  /**
   * Remove listener (internal)
   */
  remove(id: string): boolean {
    for (const listeners of this.listenerMap.values()) {
      const index = listeners.findIndex((l) => l.id === id);
      if (index >= 0) {
        listeners.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Process single event
   */
  private processEvent(event: GameEvent): void {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get listeners for this event type
    const listeners = this.listenerMap.get(event.type) ?? [];

    // Call each listener
    for (const listener of listeners) {
      // Check filter
      if (listener.filter && !listener.filter(event as any)) {
        continue;
      }

      try {
        // Call handler
        const result = listener.handler(event as any);

        // Handle async handlers
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`[EventBus] Error in listener for ${event.type}:`, err);
          });
        }
      } catch (err) {
        console.error(`[EventBus] Error in listener for ${event.type}:`, err);
      }

      // Remove once-listeners
      if (listener.once) {
        this.remove(listener.id);
      }
    }
  }

  /**
   * Generate unique listener ID
   */
  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Wait for event (returns promise)
   */
  async waitFor<T extends GameEvent>(
    eventType: T['type'],
    timeout?: number
  ): Promise<T | null> {
    return new Promise((resolve) => {
      const timer = timeout ? setTimeout(() => resolve(null), timeout) : null;

      const id = this.once(eventType, (event) => {
        if (timer) clearTimeout(timer);
        resolve(event as T);
      });

      // If timeout provided but 0, cleanup immediately
      if (timeout === 0) {
        this.off(id);
        resolve(null);
      }
    });
  }

  /**
   * Create snapshot of current state for debugging
   */
  getDebugInfo(): {
    listenerCount: number;
    eventTypeCount: number;
    historySize: number;
    isProcessing: boolean;
    queuedEvents: number;
  } {
    let listenerCount = 0;
    for (const listeners of this.listenerMap.values()) {
      listenerCount += listeners.length;
    }

    return {
      listenerCount,
      eventTypeCount: this.listenerMap.size,
      historySize: this.eventHistory.length,
      isProcessing: this.isProcessing,
      queuedEvents: this.pendingEvents.length,
    };
  }
}

/**
 * Global event bus singleton
 */
export const eventBus = new EventBus();
