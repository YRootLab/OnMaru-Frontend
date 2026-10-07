'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { MAX_SPAWNS_PER_FRAME } from '../../domain/presence.policy';
import { DEFAULT_MOTION, type MotionParams } from '../../domain/presence.motion';
import { type ParticleInit, createPool, spawnParticle, updatePool } from '../particlePool';
import {
  type BeeSide,
  BEE_DISPLAY_H,
  beeWorldLantern,
  canSpawnBee,
  getBeePosition,
} from '../beeFlightPath';

export type FxMode = 'light' | 'bee';

export interface WarmthParticleEvent {
  x: number;      // 0–1 가로 위치 비율
  isMine: boolean;
}

// ─── Bee mode constants ───────────────────────────────────────────────────────
const SPRITE_SIZE = 32;
const LIFE_BASE_MS = 1_200;
const LIFE_SPREAD_MS = 600;
const VX_SPREAD = 0.05;
const VY_BASE = 0.04;
const VY_SPREAD = 0.03;

// ─── Light mode constants ─────────────────────────────────────────────────────
const LIGHT_SPRITE_SIZE = 12; // pre-built at 12px, drawn at 3–6 CSS px
const LIGHT_LIFE_MIN = 1_500;
const LIGHT_LIFE_MAX = 2_500;
const LIGHT_VY_MIN = 0.020; // px/ms = 20px/s
const LIGHT_VY_MAX = 0.040;
const LIGHT_VX_DRIFT = 0.015; // ±15px/s
const LIGHT_ME_MIN = 3;
const LIGHT_ME_MAX = 5;
const LIGHT_OTHER_MIN = 1;
const LIGHT_OTHER_MAX = 2;
// alpha sine flicker: ω = 0.010 rad/ms ≈ 1.6 Hz (< 3 Hz)
const LIGHT_FLICKER_W = 0.010;

// ─── Shared constants ─────────────────────────────────────────────────────────
const REDUCED_LIFE_MS = 300;
const MAX_DPR = 2;
const ME_BEE_RATE_LIMIT = 3;        // me 10초 안에 3회 초과 시 제한
const ME_BEE_RATE_WINDOW_MS = 10_000;
const OTHER_COALESCE_MS = 1_000;    // other 1초 코얼레싱 창

type OtherBatchCallback = (count: number) => void;

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function makeCanvas(size: number): { canvas: AnyCanvas; ctx: AnyCtx | null } {
  let canvas: AnyCanvas;
  try { canvas = new OffscreenCanvas(size, size); }
  catch {
    const el = document.createElement('canvas');
    el.width = size; el.height = size; canvas = el;
  }
  const ctx = (
    (canvas as OffscreenCanvas).getContext?.('2d') ??
    (canvas as HTMLCanvasElement).getContext?.('2d')
  ) as AnyCtx | null;
  return { canvas, ctx };
}

function buildGlowSprite(isMine: boolean): AnyCanvas {
  const { canvas, ctx } = makeCanvas(SPRITE_SIZE);
  if (!ctx) return canvas;
  const cx = SPRITE_SIZE / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  if (isMine) {
    g.addColorStop(0, 'rgba(255,240,100,0.9)');
    g.addColorStop(0.4, 'rgba(255,200,50,0.5)');
    g.addColorStop(1, 'rgba(255,180,0,0)');
  } else {
    g.addColorStop(0, 'rgba(255,200,120,0.6)');
    g.addColorStop(0.4, 'rgba(255,160,60,0.3)');
    g.addColorStop(1, 'rgba(255,140,0,0)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return canvas;
}

function buildLightSprite(isMine: boolean): AnyCanvas {
  const SZ = LIGHT_SPRITE_SIZE;
  const { canvas, ctx } = makeCanvas(SZ);
  if (!ctx) return canvas;
  const cx = SZ / 2;
  // Tight radial gradient — no shadowBlur, no large spread
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  if (isMine) {
    g.addColorStop(0,   'rgba(255,248,100,1)');
    g.addColorStop(0.35,'rgba(255,210,40,0.85)');
    g.addColorStop(0.65,'rgba(255,170,0,0.35)');
    g.addColorStop(1,   'rgba(255,140,0,0)');
  } else {
    g.addColorStop(0,   'rgba(255,235,80,0.78)');
    g.addColorStop(0.35,'rgba(255,185,30,0.52)');
    g.addColorStop(0.65,'rgba(255,145,0,0.2)');
    g.addColorStop(1,   'rgba(255,120,0,0)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SZ, SZ);
  return canvas;
}

interface CanvasSize { w: number; h: number; dpr: number }

interface BeeSprite {
  image: CanvasImageSource;
  cssW: number;
  cssH: number;
}

interface BeeSpriteSet {
  me: BeeSprite | null;
  other: BeeSprite | null;
}

interface BeeState {
  startX: number;
  side: BeeSide;
  startTimeMs: number;
  duration: number;
}

async function loadBeeSprite(url: string, dpr: number, beeH = BEE_DISPLAY_H): Promise<BeeSprite | null> {
  try {
    let origW: number, origH: number, srcImg: CanvasImageSource;
    if (typeof createImageBitmap !== 'undefined') {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const bitmap = await createImageBitmap(await resp.blob());
      origW = bitmap.width; origH = bitmap.height; srcImg = bitmap;
    } else {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el); el.onerror = reject; el.src = url;
      });
      origW = img.naturalWidth; origH = img.naturalHeight; srcImg = img;
    }
    if (origH === 0) return null;
    const scaledDpr = Math.min(dpr, MAX_DPR);
    const physH = Math.round(beeH * scaledDpr);
    const physW = Math.round(origW * physH / origH);
    const cssH = beeH;
    const cssW = (origW / origH) * beeH;
    try {
      const oc = new OffscreenCanvas(physW, physH);
      const octx = oc.getContext('2d')!;
      octx.drawImage(srcImg, 0, 0, physW, physH);
      if ('close' in srcImg && typeof (srcImg as ImageBitmap).close === 'function') {
        (srcImg as ImageBitmap).close();
      }
      return { image: oc, cssW, cssH };
    } catch { return { image: srcImg, cssW, cssH }; }
  } catch { return null; }
}

export interface UseWarmthParticlesOptions {
  poolingEnabled?: boolean;
  /** 'light' = 작은 깜빡이는 입자(기본), 'bee' = 벌 비행 */
  fx?: FxMode;
  motionParams?: Partial<MotionParams>;
  onOtherBatch?: OtherBatchCallback;
}

export interface UseWarmthParticlesResult {
  enqueueWarmth: (event: WarmthParticleEvent) => void;
  frameStats: RefObject<{ fps: number; avgFrameMs: number } | undefined>;
}

export function useWarmthParticles(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  opts: UseWarmthParticlesOptions = {},
): UseWarmthParticlesResult {
  const poolingEnabled = opts.poolingEnabled ?? true;

  const poolRef = useRef(createPool());
  const queueRef = useRef<WarmthParticleEvent[]>([]);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef<CanvasSize>({ w: 0, h: 0, dpr: 1 });
  const reducedMotionRef = useRef(false);
  const frameStats = useRef<{ fps: number; avgFrameMs: number } | undefined>(undefined);
  const recentFramesRef = useRef<number[]>([]);

  // Motion params ref
  const motionRef = useRef<MotionParams>({ ...DEFAULT_MOTION, ...opts.motionParams });
  const fxRef = useRef<FxMode>(opts.fx ?? 'light');
  const onOtherBatchRef = useRef<OtherBatchCallback | undefined>(opts.onOtherBatch);

  useEffect(() => { motionRef.current = { ...DEFAULT_MOTION, ...opts.motionParams }; }, [opts.motionParams]);
  useEffect(() => { fxRef.current = opts.fx ?? 'light'; }, [opts.fx]);
  useEffect(() => { onOtherBatchRef.current = opts.onOtherBatch; }, [opts.onOtherBatch]);

  // ─── Sprites ─────────────────────────────────────────────────────────────
  const glowSpritesRef = useRef<{ mine: AnyCanvas; other: AnyCanvas } | null>(null);
  const lightSpritesRef = useRef<{ me: AnyCanvas; other: AnyCanvas } | null>(null);
  const beeSpriteRef = useRef<BeeSpriteSet | null>(null);
  const beeActiveRef = useRef<BeeState[]>([]);

  // Rate limiting / coalescing
  const meBeeTimestampsRef = useRef<number[]>([]);
  const otherCoalesceRef = useRef<{
    count: number;
    timer: ReturnType<typeof setTimeout> | null;
  }>({ count: 0, timer: null });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => { reducedMotionRef.current = e.matches; };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Bee 스프라이트 로드 (beeH 변경 시 재로드)
  const beeH = opts.motionParams?.beeH ?? DEFAULT_MOTION.beeH;
  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio ?? 1, MAX_DPR);
    beeSpriteRef.current = null;
    Promise.all([
      loadBeeSprite('/images/me.png', dpr, motionRef.current.beeH),
      loadBeeSprite('/images/other.png', dpr, motionRef.current.beeH),
    ]).then(([me, other]) => {
      beeSpriteRef.current = { me, other };
    });
  }, [beeH]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Loop ────────────────────────────────────────────────────────────────
  function stopLoop() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
  }

  function startLoop() {
    if (rafRef.current) return;
    lastTimeRef.current = performance.now();

    function loop(now: number) {
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = 0; return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = 0; return; }

      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      recentFramesRef.current.push(dt);
      if (recentFramesRef.current.length > 60) recentFramesRef.current.shift();
      const avg = recentFramesRef.current.reduce((a, b) => a + b, 0) / recentFramesRef.current.length;
      frameStats.current = { fps: Math.round(1000 / avg), avgFrameMs: Math.round(avg * 10) / 10 };

      const { w, h, dpr } = sizeRef.current;
      const motion = motionRef.current;
      const fx = fxRef.current;

      // ── Queue drain ──────────────────────────────────────────────────────
      const toSpawn = Math.min(queueRef.current.length, MAX_SPAWNS_PER_FRAME);
      if (toSpawn > 0) {
        const events = queueRef.current.splice(0, toSpawn);
        for (const evt of events) {
          const reduced = reducedMotionRef.current;
          if (fx === 'light') {
            if (!lightSpritesRef.current) {
              lightSpritesRef.current = { me: buildLightSprite(true), other: buildLightSprite(false) };
            }
            const px = Math.max(4, Math.min(w - 4,
              evt.x * w + (Math.random() - 0.5) * motion.startXJitter));
            spawnParticle(poolRef.current, {
              x: px,
              y: h * 0.88,
              vx: reduced ? 0 : (Math.random() - 0.5) * LIGHT_VX_DRIFT * 2,
              vy: reduced ? 0 : -(LIGHT_VY_MIN + Math.random() * (LIGHT_VY_MAX - LIGHT_VY_MIN)),
              maxLife: reduced ? REDUCED_LIFE_MS : LIGHT_LIFE_MIN + Math.random() * (LIGHT_LIFE_MAX - LIGHT_LIFE_MIN),
              isMine: evt.isMine,
              drawSize: reduced ? 5 : 3 + Math.random() * 3, // 3–6 CSS px
            });
          } else {
            // Bee mode: 1 glow particle
            if (!glowSpritesRef.current) {
              glowSpritesRef.current = { mine: buildGlowSprite(true), other: buildGlowSprite(false) };
            }
            spawnParticle(poolRef.current, {
              x: Math.max(24, Math.min(w - 24,
                evt.x * w + (Math.random() - 0.5) * motion.startXJitter)),
              y: h * 0.75,
              vx: reduced ? 0 : (Math.random() - 0.5) * VX_SPREAD,
              vy: reduced ? 0 : -(VY_BASE + Math.random() * VY_SPREAD),
              maxLife: reduced ? REDUCED_LIFE_MS : LIFE_BASE_MS + Math.random() * LIFE_SPREAD_MS,
              isMine: evt.isMine,
              drawSize: 0, // 0 = use glow sprite at SPRITE_SIZE
            });
          }
        }
      }

      const activeParticleCount = updatePool(poolRef.current, dt);

      // 만료된 벌 제거
      beeActiveRef.current = beeActiveRef.current.filter(
        (bee) => now - bee.startTimeMs < bee.duration,
      );

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ── Particle render ──────────────────────────────────────────────────
      for (const p of poolRef.current) {
        if (!p.active) continue;

        if (p.drawSize > 0) {
          // Light particle
          if (!lightSpritesRef.current) continue;
          const sz = p.drawSize;
          const half = sz / 2;
          const elapsed = p.maxLife - p.life;
          const fadeAlpha = p.life / p.maxLife;
          const flicker = 0.3 * Math.sin(elapsed * LIGHT_FLICKER_W) + 0.7;
          const otherMul = p.isMine ? 1 : 0.72;
          ctx.globalAlpha = fadeAlpha * flicker * otherMul;
          const sway = Math.sin(elapsed * 0.005) * motion.sineAmp * 0.4;
          ctx.drawImage(
            (p.isMine ? lightSpritesRef.current.me : lightSpritesRef.current.other) as CanvasImageSource,
            p.x + sway - half, p.y - half, sz, sz,
          );
        } else {
          // Glow particle (bee mode)
          if (!glowSpritesRef.current) continue;
          const sz = SPRITE_SIZE;
          const half = sz / 2;
          ctx.globalAlpha = p.life / p.maxLife;
          const sway = Math.sin((p.maxLife - p.life) * 0.005) * motion.sineAmp;
          ctx.drawImage(
            (p.isMine ? glowSpritesRef.current.mine : glowSpritesRef.current.other) as CanvasImageSource,
            p.x + sway - half, p.y - half, sz, sz,
          );
        }
      }
      ctx.globalAlpha = 1;

      // ── Bee render (bee mode only) ───────────────────────────────────────
      const beeSprites = beeSpriteRef.current;
      if (!reducedMotionRef.current && fx === 'bee' && beeSprites) {
        for (const bee of beeActiveRef.current) {
          const rawT = Math.min(1, (now - bee.startTimeMs) / bee.duration);
          const t = bee.side === 'other' ? easeOut(rawT) : rawT;
          const pos = getBeePosition(t, bee.startX, bee.side, { w, h });
          const sp = bee.side === 'me' ? beeSprites.me : beeSprites.other;
          if (!sp) continue;

          ctx.save();
          ctx.globalAlpha = pos.alpha;
          ctx.translate(pos.x, pos.y);
          ctx.rotate(pos.angle);
          ctx.scale(pos.scale, pos.scale);
          ctx.drawImage(sp.image, -sp.cssW / 2, -sp.cssH / 2, sp.cssW, sp.cssH);
          ctx.restore();

          if (t < 0.9 && Math.random() < motion.tailRate) {
            const lantern = beeWorldLantern(pos, sp.cssW, sp.cssH);
            spawnParticle(poolRef.current, {
              x: lantern.x, y: lantern.y,
              vx: (Math.random() - 0.5) * 0.025,
              vy: -(0.012 + Math.random() * 0.012),
              maxLife: 450 + Math.random() * 300,
              isMine: bee.side === 'me',
              drawSize: motion.tailParticleSize,
            });
          }
        }
        ctx.globalAlpha = 1;
      }

      if (
        activeParticleCount === 0 &&
        queueRef.current.length === 0 &&
        beeActiveRef.current.length === 0
      ) {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = 0;
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  const enqueueWarmth = useCallback((event: WarmthParticleEvent) => {
    const now = performance.now();
    const fx = fxRef.current;
    const reduced = reducedMotionRef.current;

    if (fx === 'light') {
      if (event.isMine) {
        // me 속도제한: 10초 안에 3회 초과 → 개수 절반
        meBeeTimestampsRef.current = meBeeTimestampsRef.current.filter(
          (t) => now - t < ME_BEE_RATE_WINDOW_MS,
        );
        const overLimit = meBeeTimestampsRef.current.length >= ME_BEE_RATE_LIMIT;
        meBeeTimestampsRef.current.push(now);

        const count = reduced ? 1 : (overLimit
          ? Math.max(1, Math.ceil((LIGHT_ME_MIN + LIGHT_ME_MAX) / 2 / 2))
          : LIGHT_ME_MIN + Math.floor(Math.random() * (LIGHT_ME_MAX - LIGHT_ME_MIN + 1)));
        for (let i = 0; i < count; i++) queueRef.current.push({ x: event.x, isMine: true });
      } else {
        // other 코얼레싱: 1초 창, 첫 이벤트만 파티클
        const coalesce = otherCoalesceRef.current;
        coalesce.count++;
        if (coalesce.timer === null) {
          const count = reduced ? 1 : LIGHT_OTHER_MIN + Math.floor(Math.random() * (LIGHT_OTHER_MAX - LIGHT_OTHER_MIN + 1));
          for (let i = 0; i < count; i++) queueRef.current.push({ x: event.x, isMine: false });
          coalesce.timer = setTimeout(() => {
            const total = coalesce.count;
            coalesce.count = 0; coalesce.timer = null;
            if (total > 1) onOtherBatchRef.current?.(total);
          }, OTHER_COALESCE_MS);
        }
      }
    } else {
      // Bee mode
      if (!glowSpritesRef.current) {
        glowSpritesRef.current = { mine: buildGlowSprite(true), other: buildGlowSprite(false) };
      }
      queueRef.current.push(event);

      if (event.isMine) {
        // me 속도제한: 10초 안에 3회 초과 → 벌 생략
        if (!reduced && beeSpriteRef.current !== null) {
          meBeeTimestampsRef.current = meBeeTimestampsRef.current.filter(
            (t) => now - t < ME_BEE_RATE_WINDOW_MS,
          );
          const sp = beeSpriteRef.current.me;
          if (
            sp &&
            meBeeTimestampsRef.current.length < ME_BEE_RATE_LIMIT &&
            canSpawnBee(beeActiveRef.current.length)
          ) {
            meBeeTimestampsRef.current.push(now);
            beeActiveRef.current.push({
              startX: event.x, side: 'me', startTimeMs: now,
              duration: motionRef.current.meDurationMs,
            });
          }
        }
      } else {
        // other 코얼레싱: 1초 창, 첫 이벤트만 벌
        const coalesce = otherCoalesceRef.current;
        coalesce.count++;
        if (coalesce.timer === null) {
          if (!reduced && beeSpriteRef.current !== null) {
            const sp = beeSpriteRef.current.other;
            if (sp && canSpawnBee(beeActiveRef.current.length)) {
              beeActiveRef.current.push({
                startX: event.x, side: 'other', startTimeMs: now,
                duration: motionRef.current.otherDurationMs,
              });
            }
          }
          coalesce.timer = setTimeout(() => {
            const total = coalesce.count;
            coalesce.count = 0; coalesce.timer = null;
            if (total > 1) onOtherBatchRef.current?.(total);
          }, OTHER_COALESCE_MS);
        }
      }
    }

    startLoop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvasRef.current) return;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      canvasRef.current.width = Math.round(w * dpr);
      canvasRef.current.height = Math.round(h * dpr);
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;
      sizeRef.current = { w, h, dpr };
    }
    syncSize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    function handleResize() { clearTimeout(resizeTimer); resizeTimer = setTimeout(syncSize, 100); }
    window.addEventListener('resize', handleResize);

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else {
        queueRef.current.length = 0;
        beeActiveRef.current.length = 0;
        meBeeTimestampsRef.current.length = 0;
        if (otherCoalesceRef.current.timer !== null) {
          clearTimeout(otherCoalesceRef.current.timer);
          otherCoalesceRef.current.timer = null;
          otherCoalesceRef.current.count = 0;
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      stopLoop();
    };
  }, [canvasRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return { enqueueWarmth, frameStats };
}
