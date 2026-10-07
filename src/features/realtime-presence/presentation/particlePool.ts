export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;  // px/ms
  vy: number;  // px/ms (음수 = 위쪽)
  life: number;    // 남은 수명 ms
  maxLife: number;
  isMine: boolean;
  /** Draw size in CSS px; 0 = use renderer default (SPRITE_SIZE) */
  drawSize: number;
}

export interface ParticleInit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  maxLife: number;
  isMine: boolean;
  /** Draw size override in CSS px; omit to use renderer default */
  drawSize?: number;
}

export const POOL_SIZE = 64;

export function createPool(): Particle[] {
  return Array.from({ length: POOL_SIZE }, () => ({
    active: false,
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 1,
    isMine: false,
    drawSize: 0,
  }));
}

// 빈 슬롯에 파티클을 활성화하고 슬롯 인덱스를 반환한다.
// 풀이 가득 차면 -1 반환 — 가장 오래된 것을 덮어쓰지 않는다(시각적 튐 방지).
export function spawnParticle(pool: Particle[], init: ParticleInit): number {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) {
      const p = pool[i];
      p.active = true;
      p.x = init.x;
      p.y = init.y;
      p.vx = init.vx;
      p.vy = init.vy;
      p.maxLife = init.maxLife;
      p.life = init.maxLife;
      p.isMine = init.isMine;
      p.drawSize = init.drawSize ?? 0;
      return i;
    }
  }
  return -1;
}

// dt를 최대 50ms로 클램프 후 위치·수명을 갱신하고 활성 파티클 수를 반환한다.
export function updatePool(pool: Particle[], dt: number): number {
  const safeDt = Math.min(dt, 50);
  let active = 0;
  for (const p of pool) {
    if (!p.active) continue;
    p.life -= safeDt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * safeDt;
    p.y += p.vy * safeDt;
    active++;
  }
  return active;
}

export function countActive(pool: Particle[]): number {
  let n = 0;
  for (const p of pool) if (p.active) n++;
  return n;
}
