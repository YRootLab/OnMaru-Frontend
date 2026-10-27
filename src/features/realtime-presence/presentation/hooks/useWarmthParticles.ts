'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { MAX_SPAWNS_PER_FRAME } from '../../domain/presence.policy';
import { DEFAULT_MOTION, type MotionParams } from '../../domain/presence.motion';
import { type ParticleInit, createPool, spawnParticle, updatePool } from '../particlePool';

export interface WarmthParticleEvent {
  x: number;      // 0–1 가로 위치 비율
  isMine: boolean;
}

// ─── Light mode constants ─────────────────────────────────────────────────────
const LIGHT_SPRITE_SIZE = 12;
const LIGHT_LIFE_MIN = 1_500;
const LIGHT_LIFE_MAX = 2_500;
const LIGHT_VY_MIN = 0.020;
const LIGHT_VY_MAX = 0.040;
const LIGHT_VX_DRIFT = 0.015;
const LIGHT_ME_MIN = 3;
const LIGHT_ME_MAX = 5;
const LIGHT_OTHER_MIN = 1;
const LIGHT_OTHER_MAX = 2;
const LIGHT_FLICKER_W = 0.010;
const REDUCED_LIFE_MS = 300;
const MAX_DPR = 2;
const ME_RATE_LIMIT = 3;
const ME_RATE_WINDOW_MS = 10_000;
const OTHER_COALESCE_MS = 1_000;

type OtherBatchCallback = (count: number) => void;

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

function buildLightSprite(isMine: boolean): AnyCanvas {
  const SZ = LIGHT_SPRITE_SIZE;
  const { canvas, ctx } = makeCanvas(SZ);
  if (!ctx) return canvas;
  const cx = SZ / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  if (isMine) {
    g.addColorStop(0,    'rgba(255,248,100,1)');
    g.addColorStop(0.35, 'rgba(255,210,40,0.85)');
    g.addColorStop(0.65, 'rgba(255,170,0,0.35)');
    g.addColorStop(1,    'rgba(255,140,0,0)');
  } else {
    g.addColorStop(0,    'rgba(255,235,80,0.78)');
    g.addColorStop(0.35, 'rgba(255,185,30,0.52)');
    g.addColorStop(0.65, 'rgba(255,145,0,0.2)');
    g.addColorStop(1,    'rgba(255,120,0,0)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SZ, SZ);
  return canvas;
}

interface CanvasSize { w: number; h: number; dpr: number }

export interface UseWarmthParticlesOptions {
  poolingEnabled?: boolean;
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
  const poolRef = useRef(createPool());
  const queueRef = useRef<WarmthParticleEvent[]>([]);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef<CanvasSize>({ w: 0, h: 0, dpr: 1 });
  const reducedMotionRef = useRef(false);
  const frameStats = useRef<{ fps: number; avgFrameMs: number } | undefined>(undefined);
  const recentFramesRef = useRef<number[]>([]);

  const motionRef = useRef<MotionParams>({ ...DEFAULT_MOTION, ...opts.motionParams });
  const onOtherBatchRef = useRef<OtherBatchCallback | undefined>(opts.onOtherBatch);

  useEffect(() => { motionRef.current = { ...DEFAULT_MOTION, ...opts.motionParams }; }, [opts.motionParams]);
  useEffect(() => { onOtherBatchRef.current = opts.onOtherBatch; }, [opts.onOtherBatch]);

  const lightSpritesRef = useRef<{ me: AnyCanvas; other: AnyCanvas } | null>(null);
  const meRateTimestampsRef = useRef<number[]>([]);
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

      const toSpawn = Math.min(queueRef.current.length, MAX_SPAWNS_PER_FRAME);
      if (toSpawn > 0) {
        if (!lightSpritesRef.current) {
          lightSpritesRef.current = { me: buildLightSprite(true), other: buildLightSprite(false) };
        }
        const events = queueRef.current.splice(0, toSpawn);
        const reduced = reducedMotionRef.current;
        for (const evt of events) {
          const px = Math.max(4, Math.min(w - 4,
            evt.x * w + (Math.random() - 0.5) * motion.startXJitter));
          spawnParticle(poolRef.current, {
            x: px,
            y: h * 0.88,
            vx: reduced ? 0 : (Math.random() - 0.5) * LIGHT_VX_DRIFT * 2,
            vy: reduced ? 0 : -(LIGHT_VY_MIN + Math.random() * (LIGHT_VY_MAX - LIGHT_VY_MIN)),
            maxLife: reduced ? REDUCED_LIFE_MS : LIGHT_LIFE_MIN + Math.random() * (LIGHT_LIFE_MAX - LIGHT_LIFE_MIN),
            isMine: evt.isMine,
            drawSize: reduced ? 5 : 3 + Math.random() * 3,
          } satisfies ParticleInit);
        }
      }

      const activeParticleCount = updatePool(poolRef.current, dt);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const p of poolRef.current) {
        if (!p.active || !lightSpritesRef.current) continue;
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
      }
      ctx.globalAlpha = 1;

      if (activeParticleCount === 0 && queueRef.current.length === 0) {
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
    const reduced = reducedMotionRef.current;

    if (event.isMine) {
      meRateTimestampsRef.current = meRateTimestampsRef.current.filter(
        (t) => now - t < ME_RATE_WINDOW_MS,
      );
      const overLimit = meRateTimestampsRef.current.length >= ME_RATE_LIMIT;
      meRateTimestampsRef.current.push(now);

      const count = reduced ? 1 : (overLimit
        ? Math.max(1, Math.ceil((LIGHT_ME_MIN + LIGHT_ME_MAX) / 2 / 2))
        : LIGHT_ME_MIN + Math.floor(Math.random() * (LIGHT_ME_MAX - LIGHT_ME_MIN + 1)));
      for (let i = 0; i < count; i++) queueRef.current.push({ x: event.x, isMine: true });
    } else {
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
        meRateTimestampsRef.current.length = 0;
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
