/**
 * Event Bus
 * 
 * Central event system for NeoProxy Runtime.
 * All events flow through this bus and can be observed by any component.
 * 
 * Events are immutable once emitted and include:
 * - timestamp
 * - unique ID
 * - type
 * - source
 * - payload
 */

export interface GenesisEvent {
  id: string;
  type: string;
  source: string;
  payload: Record<string, any>;
  timestamp: number;
  capability?: string;
}

export interface EventBusSubscription {
  eventType: string | '*';
  callback: (event: GenesisEvent) => void;
}

class EventBusImpl {
  private events: GenesisEvent[] = [];
  private subscribers: EventBusSubscription[] = [];
  private maxEvents: number = 1000;

  /**
   * Emit an event to the bus
   */
  emit(event: Omit<GenesisEvent, 'id' | 'timestamp'>): GenesisEvent {
    const enriched: GenesisEvent = {
      ...event,
      timestamp: Date.now(),
      id: this.generateId()
    };

    this.events.push(enriched);

    // Trim old events if exceeding max
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Notify subscribers
    this.notifySubscribers(enriched);

    return enriched;
  }

  /**
   * Get all events (optionally filtered by type)
   */
  getAll(type?: string): GenesisEvent[] {
    if (!type) {
      return [...this.events];
    }
    return this.events.filter(e => e.type === type);
  }

  /**
   * Get recent events with limit
   */
  getRecent(limit: number = 50): GenesisEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Subscribe to events
   * Use '*' for all events or specify event type
   */
  subscribe(eventType: string | '*', callback: (event: GenesisEvent) => void): () => void {
    const subscription: EventBusSubscription = { eventType, callback };
    this.subscribers.push(subscription);

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== subscription);
    };
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    console.log('[EventBus] Cleared all events');
  }

  /**
   * Get event statistics
   */
  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    
    for (const event of this.events) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }

    return {
      total: this.events.length,
      byType
    };
  }

  /**
   * Generate unique event ID
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Notify all matching subscribers
   */
  private notifySubscribers(event: GenesisEvent): void {
    for (const sub of this.subscribers) {
      if (sub.eventType === '*' || sub.eventType === event.type) {
        try {
          sub.callback(event);
        } catch (error) {
          console.error('[EventBus] Subscriber error:', error);
        }
      }
    }
  }
}

// Export singleton instance
export const eventBus = new EventBusImpl();

console.log('[EventBus] Initialized');
