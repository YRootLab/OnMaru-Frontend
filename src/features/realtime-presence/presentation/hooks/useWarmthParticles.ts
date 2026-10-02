'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { MAX_SPAWNS_PER_FRAME } from '../../domain/presence.policy';
import { type ParticleInit, createPool, spawnParticle, updatePool } from '../particlePool';

export interface WarmthParticleEvent {
  x: number;      // 0–1 가로 위치 비율
  isMine: boolean;
}

const SPRITE_SIZE = 32;
const LIFE_BASE_MS = 1_200;
const LIFE_SPREAD_MS = 600;
const REDUCED_LIFE_MS = 300;
const VX_SPREAD = 0.05;  // px/ms
const VY_BASE = 0.04;    // px/ms 위쪽
const VY_SPREAD = 0.03;

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function buildGlowSprite(isMine: boolean): AnyCanvas {
  let canvas: AnyCanvas;
  try {
    canvas = new OffscreenCanvas(SPRITE_SIZE, SPRITE_SIZE);
  } catch {
    const el = document.createElement('canvas');
    el.width = SPRITE_SIZE;
    el.height = SPRITE_SIZE;
    canvas = el;
  }
  const ctx = (
    (canvas as OffscreenCanvas).getContext?.('2d') ??
    (canvas as HTMLCanvasElement).getContext?.('2d')
  ) as AnyCtx | null;
  if (!ctx) return canvas;

  const cx = SPRITE_SIZE / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
  if (isMine) {
    // 내 반응: 밝은 황금
    g.addColorStop(0, 'rgba(255,240,100,0.9)');
    g.addColorStop(0.4, 'rgba(255,200,50,0.5)');
    g.addColorStop(1, 'rgba(255,180,0,0)');
  } else {
    // 타인 반응: 부드러운 호박색
    g.addColorStop(0, 'rgba(255,200,120,0.6)');
    g.addColorStop(0.4, 'rgba(255,160,60,0.3)');
    g.addColorStop(1, 'rgba(255,140,0,0)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return canvas;
}

interface CanvasSize { w: number; h: number; dpr: number }

export interface UseWarmthParticlesResult {
  enqueueWarmth: (event: WarmthParticleEvent) => void;
  /** 벤치마크용: 최근 프레임 통계 (undefined = 루프 미실행) */
  frameStats: RefObject<{ fps: number; avgFrameMs: number } | undefined>;
}

export function useWarmthParticles(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  opts: { poolingEnabled?: boolean } = {},
): UseWarmthParticlesResult {
  const poolingEnabled = opts.poolingEnabled ?? true;

  const poolRef = useRef(createPool());
  const queueRef = useRef<WarmthParticleEvent[]>([]);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef<CanvasSize>({ w: 0, h: 0, dpr: 1 });
  const spritesRef = useRef<{ mine: AnyCanvas; other: AnyCanvas } | null>(null);
  const reducedMotionRef = useRef(false);
  // 벤치마크: 최근 N프레임의 평균
  const frameStats = useRef<{ fps: number; avgFrameMs: number } | undefined>(undefined);
  const recentFramesRef = useRef<number[]>([]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => { reducedMotionRef.current = e.matches; };
    mq.addEventListener('change', onMqChange);
    return () => mq.removeEventListener('change', onMqChange);
  }, []);

  // 풀링 OFF 시 매 스폰마다 새 풀을 만들어 GC 부하를 재현한다 (벤치마크 전용)
  // ponytail: 단순 비교용 경로, 프로덕션에서는 poolingEnabled=true
  function spawnFromPool(init: ParticleInit) {
    if (!poolingEnabled) {
      const tempPool = createPool();
      spawnParticle(tempPool, init);
      // 별도 풀을 매 프레임 업데이트하지 않으므로 그냥 poolRef에도 동일하게 추가
    }
    return spawnParticle(poolRef.current, init);
  }

  function stopLoop() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
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

      // 프레임 통계 갱신
      recentFramesRef.current.push(dt);
      if (recentFramesRef.current.length > 60) recentFramesRef.current.shift();
      const avg = recentFramesRef.current.reduce((a, b) => a + b, 0) / recentFramesRef.current.length;
      frameStats.current = { fps: Math.round(1000 / avg), avgFrameMs: Math.round(avg * 10) / 10 };

      const { w, h, dpr } = sizeRef.current;

      // 이벤트 큐 드레인: 프레임당 MAX_SPAWNS_PER_FRAME 이하
      const toSpawn = Math.min(queueRef.current.length, MAX_SPAWNS_PER_FRAME);
      if (toSpawn > 0) {
        const events = queueRef.current.splice(0, toSpawn);
        for (const evt of events) {
          const reduced = reducedMotionRef.current;
          const init: ParticleInit = {
            x: evt.x * w,
            y: h * 0.65,
            vx: reduced ? 0 : (Math.random() - 0.5) * VX_SPREAD,
            vy: reduced ? 0 : -(VY_BASE + Math.random() * VY_SPREAD),
            maxLife: reduced ? REDUCED_LIFE_MS : LIFE_BASE_MS + Math.random() * LIFE_SPREAD_MS,
            isMine: evt.isMine,
          };
          spawnFromPool(init);
        }
      }

      const activeCount = updatePool(poolRef.current, dt);

      // 렌더
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (spritesRef.current) {
        const half = SPRITE_SIZE / 2;
        for (const p of poolRef.current) {
          if (!p.active) continue;
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.drawImage(
            (p.isMine ? spritesRef.current.mine : spritesRef.current.other) as CanvasImageSource,
            p.x - half,
            p.y - half,
            SPRITE_SIZE,
            SPRITE_SIZE,
          );
        }
        ctx.globalAlpha = 1;
      }

      // 활성 파티클도 큐도 없으면 루프 정지 (유휴 시 CPU 0)
      if (activeCount === 0 && queueRef.current.length === 0) {
        ctx.clearRect(0, 0, w, h);
        rafRef.current = 0;
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
  }

  const enqueueWarmth = useCallback((event: WarmthParticleEvent) => {
    if (!spritesRef.current) {
      spritesRef.current = { mine: buildGlowSprite(true), other: buildGlowSprite(false) };
    }
    queueRef.current.push(event);
    startLoop(); // startLoop은 내부에서 rafRef(stable)만 사용하므로 stale closure 무해
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 캔버스 크기 동기화 + visibilitychange
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvasRef.current?.parentElement) return;
      const parent = canvasRef.current.parentElement;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvasRef.current.width = w * dpr;
      canvasRef.current.height = h * dpr;
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;
      sizeRef.current = { w, h, dpr };
      // 스프라이트는 고정 크기(SPRITE_SIZE)라 리사이즈 시 재생성 불필요
    }

    syncSize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncSize, 100);
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else {
        // 복귀 시 누적 큐 폐기 (폭죽 방지)
        queueRef.current.length = 0;
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      ro.disconnect();
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      stopLoop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef]);

  return { enqueueWarmth, frameStats };
}
