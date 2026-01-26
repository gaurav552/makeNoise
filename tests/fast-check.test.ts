import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Fast-Check Setup', () => {
  it('should have fast-check available for property-based testing', () => {
    expect(fc).toBeDefined();
    expect(fc.assert).toBeDefined();
  });

  it('should run a simple property test', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      })
    );
  });

  it('should run property test with multiple values', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutative property
      })
    );
  });
});
