'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { MAX_SPAWNS_PER_FRAME } from '../../domain/presence.policy';
import { type ParticleInit, createPool, spawnParticle, updatePool } from '../particlePool';
import {
  type BeeSide,
  BEE_DISPLAY_H,
  BEE_FLIGHT_MS,
  beeWorldLantern,
  canSpawnBee,
  getBeePosition,
} from '../beeFlightPath';

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
const MAX_DPR = 2;

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

async function loadBeeSprite(url: string, dpr: number): Promise<BeeSprite | null> {
  try {
    let origW: number;
    let origH: number;
    let srcImg: CanvasImageSource;

    if (typeof createImageBitmap !== 'undefined') {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const bitmap = await createImageBitmap(await resp.blob());
      origW = bitmap.width;
      origH = bitmap.height;
      srcImg = bitmap;
    } else {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      origW = img.naturalWidth;
      origH = img.naturalHeight;
      srcImg = img;
    }

    if (origH === 0) return null;
    const scaledDpr = Math.min(dpr, MAX_DPR);
    const physH = Math.round(BEE_DISPLAY_H * scaledDpr);
    const physW = Math.round(origW * physH / origH);
    const cssH = BEE_DISPLAY_H;
    const cssW = (origW / origH) * BEE_DISPLAY_H;

    try {
      const oc = new OffscreenCanvas(physW, physH);
      const octx = oc.getContext('2d')!;
      octx.drawImage(srcImg, 0, 0, physW, physH);
      if ('close' in srcImg && typeof (srcImg as ImageBitmap).close === 'function') {
        (srcImg as ImageBitmap).close();
      }
      return { image: oc, cssW, cssH };
    } catch {
      return { image: srcImg, cssW, cssH };
    }
  } catch {
    return null;
  }
}

export interface UseWarmthParticlesResult {
  enqueueWarmth: (event: WarmthParticleEvent) => void;
  /** 벤치마크용: 최근 프레임 통계 (undefined = 루프 미실행) */
  frameStats: RefObject<{ fps: number; avgFrameMs: number } | undefined>;
}

export function useWarmthParticles(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  opts: { poolingEnabled?: boolean; beeMode?: boolean } = {},
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

  // Bee flight state
  const beeModeRef = useRef(opts.beeMode ?? true);
  const beeSpriteRef = useRef<BeeSpriteSet | null>(null); // null = not yet loaded
  const beeActiveRef = useRef<BeeState[]>([]);

  // Sync beeMode option reactively via ref
  useEffect(() => {
    beeModeRef.current = opts.beeMode ?? true;
  }, [opts.beeMode]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onMqChange = (e: MediaQueryListEvent) => { reducedMotionRef.current = e.matches; };
    mq.addEventListener('change', onMqChange);
    return () => mq.removeEventListener('change', onMqChange);
  }, []);

  // Load bee sprites once on mount; set to {me:null,other:null} on failure (graceful fallback)
  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio ?? 1, MAX_DPR);
    Promise.all([
      loadBeeSprite('/presence/me.png', dpr),
      loadBeeSprite('/presence/other.png', dpr),
    ]).then(([me, other]) => {
      beeSpriteRef.current = { me, other };
    });
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
            x: Math.max(24, Math.min(w - 24, evt.x * w + (Math.random() - 0.5) * 20)),
            y: h * 0.75,
            vx: reduced ? 0 : (Math.random() - 0.5) * VX_SPREAD,
            vy: reduced ? 0 : -(VY_BASE + Math.random() * VY_SPREAD),
            maxLife: reduced ? REDUCED_LIFE_MS : LIFE_BASE_MS + Math.random() * LIFE_SPREAD_MS,
            isMine: evt.isMine,
          };
          spawnFromPool(init);
        }
      }

      const activeParticleCount = updatePool(poolRef.current, dt);

      // 만료된 벌 제거
      beeActiveRef.current = beeActiveRef.current.filter(
        (bee) => now - bee.startTimeMs < bee.duration,
      );

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // 파티클 렌더
      if (spritesRef.current) {
        const half = SPRITE_SIZE / 2;
        for (const p of poolRef.current) {
          if (!p.active) continue;
          ctx.globalAlpha = p.life / p.maxLife;
          // 반딧불이 특유의 자연스러운 부유(Sway) 흔들림
          const sway = Math.sin((p.maxLife - p.life) * 0.005) * 6;
          ctx.drawImage(
            (p.isMine ? spritesRef.current.mine : spritesRef.current.other) as CanvasImageSource,
            p.x + sway - half,
            p.y - half,
            SPRITE_SIZE,
            SPRITE_SIZE,
          );
        }
        ctx.globalAlpha = 1;
      }

      // 벌 비행 렌더 (파티클 위, reduced-motion이면 건너뜀)
      const beeSprites = beeSpriteRef.current;
      if (!reducedMotionRef.current && beeModeRef.current && beeSprites) {
        for (const bee of beeActiveRef.current) {
          const t = Math.min(1, (now - bee.startTimeMs) / bee.duration);
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

          // 꼬리 파티클: 랜턴 위치에서 기존 파티클 풀로 방출 (40% 확률로 프레임 간격 조절)
          if (t < 0.9 && Math.random() < 0.4) {
            const lantern = beeWorldLantern(pos, sp.cssW, sp.cssH);
            spawnParticle(poolRef.current, {
              x: lantern.x,
              y: lantern.y,
              vx: (Math.random() - 0.5) * 0.025,
              vy: -(0.012 + Math.random() * 0.012),
              maxLife: 450 + Math.random() * 300,
              isMine: bee.side === 'me',
            });
          }
        }
        ctx.globalAlpha = 1;
      }

      // 활성 파티클도 큐도 비행 벌도 없으면 루프 정지 (유휴 시 CPU 0)
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
    if (!spritesRef.current) {
      spritesRef.current = { mine: buildGlowSprite(true), other: buildGlowSprite(false) };
    }
    queueRef.current.push(event);

    // 벌 비행: reduced-motion이 아니고, 스프라이트 로드 완료이고, 슬롯 여유 있을 때
    if (
      !reducedMotionRef.current &&
      beeModeRef.current &&
      beeSpriteRef.current !== null
    ) {
      const side: BeeSide = event.isMine ? 'me' : 'other';
      const sp = event.isMine ? beeSpriteRef.current.me : beeSpriteRef.current.other;
      // 스프라이트가 null(로드 실패)이면 파티클만 — 벌 비행 없음
      if (sp && canSpawnBee(beeActiveRef.current.length)) {
        beeActiveRef.current.push({
          startX: event.x,
          side,
          startTimeMs: performance.now(),
          duration: BEE_FLIGHT_MS,
        });
      }
    }

    startLoop();
  }, []);

  // 캔버스 크기 동기화 + visibilitychange
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvasRef.current) return;
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      // fixed position 캔버스이므로 뷰포트 크기를 직접 사용
      // (스크롤 페이지 전체 높이로 계산되어 파티클이 화면 밖으로 날아가는 현상 방지)
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvasRef.current.width = Math.round(w * dpr);
      canvasRef.current.height = Math.round(h * dpr);
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;
      sizeRef.current = { w, h, dpr };
    }

    syncSize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncSize, 100);
    }
    window.addEventListener('resize', handleResize);

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        stopLoop();
      } else {
        // 복귀 시 누적 큐 및 비행 중 벌 폐기 (폭죽 방지)
        queueRef.current.length = 0;
        beeActiveRef.current.length = 0;
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      stopLoop();
    };
  }, [canvasRef]);

  return { enqueueWarmth, frameStats };
}
