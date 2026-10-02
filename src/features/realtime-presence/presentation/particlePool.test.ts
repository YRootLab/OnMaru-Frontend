import { describe, expect, it } from 'vitest';
import { POOL_SIZE, countActive, createPool, spawnParticle, updatePool } from './particlePool';

const base = (overrides = {}) => ({
  x: 100, y: 200, vx: 0, vy: -0.1, maxLife: 100, isMine: false,
  ...overrides,
});

describe('spawnParticle', () => {
  it('빈 슬롯에 활성화하고 인덱스 반환', () => {
    const pool = createPool();
    const idx = spawnParticle(pool, base());
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(pool[idx].active).toBe(true);
    expect(pool[idx].life).toBe(100);
    expect(pool[idx].isMine).toBe(false);
  });

  it('풀이 가득 차면 -1 반환 (덮어쓰기 없음)', () => {
    const pool = createPool();
    for (let i = 0; i < POOL_SIZE; i++) {
      spawnParticle(pool, base({ maxLife: 9999 }));
    }
    expect(spawnParticle(pool, base())).toBe(-1);
    expect(countActive(pool)).toBe(POOL_SIZE);
  });

  it('만료된 슬롯은 재사용된다', () => {
    const pool = createPool();
    for (let i = 0; i < POOL_SIZE; i++) {
      spawnParticle(pool, base({ maxLife: 10 }));
    }
    updatePool(pool, 20); // 전부 만료
    expect(countActive(pool)).toBe(0);
    const idx = spawnParticle(pool, base({ maxLife: 9999 }));
    expect(idx).toBeGreaterThanOrEqual(0);
  });
});

describe('updatePool', () => {
  it('dt만큼 수명을 소모하고 위치 이동', () => {
    const pool = createPool();
    const idx = spawnParticle(pool, base({ x: 0, y: 0, vx: 0, vy: -0.1, maxLife: 100 }));
    updatePool(pool, 30);
    expect(pool[idx].life).toBeCloseTo(70);
    expect(pool[idx].y).toBeCloseTo(-3);
    expect(pool[idx].active).toBe(true);
  });

  it('수명이 다하면 비활성화', () => {
    const pool = createPool();
    const idx = spawnParticle(pool, base({ maxLife: 50 }));
    updatePool(pool, 50);
    expect(pool[idx].active).toBe(false);
  });

  it('dt 상한 50ms: 200ms를 넘겨도 50ms만 적용', () => {
    const pool = createPool();
    const idx = spawnParticle(pool, base({ x: 0, y: 0, vx: 0, vy: -0.1, maxLife: 100 }));
    updatePool(pool, 200); // 클램프 → 50ms
    expect(pool[idx].y).toBeCloseTo(-5);   // -0.1 * 50 = -5
    expect(pool[idx].life).toBeCloseTo(50); // 100 - 50 = 50 > 0
    expect(pool[idx].active).toBe(true);
  });

  it('활성 파티클 수를 반환', () => {
    const pool = createPool();
    spawnParticle(pool, base({ maxLife: 100 }));
    spawnParticle(pool, base({ maxLife: 10 }));
    const remaining = updatePool(pool, 20); // 두 번째(10ms) 만료
    expect(remaining).toBe(1);
  });

  it('모두 만료되면 0 반환', () => {
    const pool = createPool();
    spawnParticle(pool, base({ maxLife: 10 }));
    expect(updatePool(pool, 100)).toBe(0);
  });
});
