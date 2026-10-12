import { describe, expect, it } from 'vitest';
import { getSeasonParticles } from './seasonParticles';

describe('seasonal particle placement', () => {
  it('spreads particles across both screen axes instead of aligning them on a line', () => {
    const particles = getSeasonParticles(11, 28);
    const horizontal = particles.map((item) => Number.parseInt(item.left, 10));
    const vertical = particles.map((item) => Number.parseInt(item.top, 10));

    expect(Math.max(...horizontal) - Math.min(...horizontal)).toBeGreaterThan(75);
    expect(Math.max(...vertical) - Math.min(...vertical)).toBeGreaterThan(75);
    expect(new Set(particles.map((item) => `${item.left}/${item.top}`)).size).toBe(28);
    expect(getSeasonParticles(11, 28)).toEqual(particles);
    expect(getSeasonParticles(12, 28)).not.toEqual(particles);
  });
});
