import { describe, it, expect } from 'vitest';
import { generateUUID } from './uuid';

describe('generateUUID', () => {
  it('generates a valid RFC 4122 v4 UUID format (8-4-4-4-12)', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (let i = 0; i < 20; i++) {
      const id = generateUUID();
      expect(id).toMatch(uuidRegex);
    }
  });

  it('generates distinct IDs on successive calls', () => {
    const id1 = generateUUID();
    const id2 = generateUUID();
    expect(id1).not.toBe(id2);
  });
});
