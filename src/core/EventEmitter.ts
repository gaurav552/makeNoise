/**
 * SimpleEventEmitter
 * 
 * A lightweight event emitter implementation for the MakeNoise player.
 * Provides event subscription, unsubscription, and emission capabilities
 * with error handling for handler execution.
 */

import type { PlayerEvents, EventHandler, EventEmitter } from './types';

/**
 * Simple event emitter implementation
 * Manages event subscriptions and emissions for the player
 */
export class SimpleEventEmitter implements EventEmitter {
  private _events: Map<PlayerEvents, Set<EventHandler>>;

  constructor() {
    this._events = new Map();
  }

  /**
   * Subscribe to an event
   * @param event - The event name to subscribe to
   * @param handler - The handler function to call when the event is emitted
   */
  on(event: PlayerEvents, handler: EventHandler): void {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   * @param event - The event name to unsubscribe from
   * @param handler - The specific handler function to remove
   */
  off(event: PlayerEvents, handler: EventHandler): void {
    const handlers = this._events.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event with optional payload
   * @param event - The event name to emit
   * @param payload - Optional data to pass to event handlers
   */
  emit(event: PlayerEvents, payload?: any): void {
    const handlers = this._events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param event - Optional event name. If omitted, removes all listeners for all events
   */
  removeAllListeners(event?: PlayerEvents): void {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
  }
}
