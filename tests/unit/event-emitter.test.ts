/**
 * Unit tests for SimpleEventEmitter
 * 
 * Tests event subscription, unsubscription, emission, and error handling
 */

import { describe, it, expect, vi } from 'vitest';
import { SimpleEventEmitter } from '../../src/core/EventEmitter';
import type { PlayerEvents } from '../../src/core/types';

describe('SimpleEventEmitter', () => {
  describe('on() - Event Subscription', () => {
    it('should register a handler for an event', () => {
      const emitter = new SimpleEventEmitter();
      const handler = vi.fn();
      
      emitter.on('play', handler);
      emitter.emit('play');
      
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple handlers for the same event', () => {
      const emitter = new SimpleEventEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      emitter.on('play', handler1);
      emitter.on('play', handler2);
      emitter.emit('play');
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should pass payload to event handlers', () => {
      const emitter = new SimpleEventEmitter();
      const handler = vi.fn();
      const payload = { time: 42 };
      
      emitter.on('timeupdate', handler);
      emitter.emit('timeupdate', payload);
      
      expect(handler).toHaveBeenCalledWith(payload);
    });
  });

  describe('off() - Event Unsubscription', () => {
    it('should unregister a specific handler', () => {
      const emitter = new SimpleEventEmitter();
      const handler = vi.fn();
      
      emitter.on('pause', handler);
      emitter.off('pause', handler);
      emitter.emit('pause');
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove the specified handler, not others', () => {
      const emitter = new SimpleEventEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      emitter.on('pause', handler1);
      emitter.on('pause', handler2);
      emitter.off('pause', handler1);
      emitter.emit('pause');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle removing non-existent handler gracefully', () => {
      const emitter = new SimpleEventEmitter();
      const handler = vi.fn();
      
      expect(() => {
        emitter.off('play', handler);
      }).not.toThrow();
    });
  });

  describe('emit() - Event Emission', () => {
    it('should not throw if no handlers are registered', () => {
      const emitter = new SimpleEventEmitter();
      
      expect(() => {
        emitter.emit('play');
      }).not.toThrow();
    });

    it('should call all registered handlers in order', () => {
      const emitter = new SimpleEventEmitter();
      const callOrder: number[] = [];
      
      emitter.on('statechange', () => callOrder.push(1));
      emitter.on('statechange', () => callOrder.push(2));
      emitter.on('statechange', () => callOrder.push(3));
      emitter.emit('statechange');
      
      expect(callOrder).toEqual([1, 2, 3]);
    });

    it('should handle errors in handlers without stopping other handlers', () => {
      const emitter = new SimpleEventEmitter();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const handler1 = vi.fn(() => { throw new Error('Handler 1 error'); });
      const handler2 = vi.fn();
      
      emitter.on('error', handler1);
      emitter.on('error', handler2);
      emitter.emit('error');
      
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeAllListeners() - Cleanup', () => {
    it('should remove all handlers for a specific event', () => {
      const emitter = new SimpleEventEmitter();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      emitter.on('play', handler1);
      emitter.on('play', handler2);
      emitter.removeAllListeners('play');
      emitter.emit('play');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should remove all handlers for all events when no event specified', () => {
      const emitter = new SimpleEventEmitter();
      const playHandler = vi.fn();
      const pauseHandler = vi.fn();
      
      emitter.on('play', playHandler);
      emitter.on('pause', pauseHandler);
      emitter.removeAllListeners();
      emitter.emit('play');
      emitter.emit('pause');
      
      expect(playHandler).not.toHaveBeenCalled();
      expect(pauseHandler).not.toHaveBeenCalled();
    });

    it('should not affect other events when removing specific event', () => {
      const emitter = new SimpleEventEmitter();
      const playHandler = vi.fn();
      const pauseHandler = vi.fn();
      
      emitter.on('play', playHandler);
      emitter.on('pause', pauseHandler);
      emitter.removeAllListeners('play');
      emitter.emit('play');
      emitter.emit('pause');
      
      expect(playHandler).not.toHaveBeenCalled();
      expect(pauseHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle same handler registered multiple times', () => {
      const emitter = new SimpleEventEmitter();
      const handler = vi.fn();
      
      emitter.on('play', handler);
      emitter.on('play', handler);
      emitter.emit('play');
      
      // Set only stores unique handlers, so should be called once
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined payload', () => {
      const emitter = new SimpleEventEmitter();
      const handler = vi.fn();
      
      emitter.on('play', handler);
      emitter.emit('play', undefined);
      
      expect(handler).toHaveBeenCalledWith(undefined);
    });

    it('should handle null payload', () => {
      const emitter = new SimpleEventEmitter();
      const handler = vi.fn();
      
      emitter.on('trackchange', handler);
      emitter.emit('trackchange', null);
      
      expect(handler).toHaveBeenCalledWith(null);
    });
  });
});
