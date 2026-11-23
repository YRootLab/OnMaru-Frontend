'use client';

import { useEffect, useRef } from 'react';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { HeatSpot } from '@/features/map/types';


const RAMP_LIGHT: Record<number, string> = {
  0.0: 'rgba(255, 184, 0, 0)',
  0.05: 'rgba(255, 235, 150, 0.22)',
  0.25: 'rgba(255, 208, 38, 0.38)',
  0.45: 'rgba(255, 175, 45, 0.55)',
  0.65: 'rgba(255, 130, 30, 0.70)',
  0.85: 'rgba(255, 85, 0, 0.84)',
  1.0: 'rgba(230, 71, 0, 0.92)',
};


const RAMP_DARK: Record<number, string> = {
  0.0: 'rgba(217, 64, 0, 0)',
  0.05: 'rgba(217, 64, 0, 0.3)',
  0.25: 'rgba(230, 71, 0, 0.5)',
  0.45: 'rgba(255, 85, 0, 0.65)',
  0.65: 'rgba(255, 163, 107, 0.76)',
  0.85: 'rgba(255, 208, 38, 0.88)',
  1.0: 'rgba(255, 235, 150, 0.95)',
};


const HEATMAP_RAMP_LIGHT: Record<number, string> = {
  0.0: 'rgba(255, 210, 60, 0)',
  0.06: 'rgba(255, 235, 140, 0.32)',
  0.16: 'rgba(255, 215, 50, 0.50)',
  0.3: 'rgba(255, 190, 40, 0.64)',
  0.45: 'rgba(255, 160, 30, 0.76)',
  0.6: 'rgba(255, 125, 15, 0.85)',
  0.75: 'rgba(255, 95, 0, 0.91)',
  0.88: 'rgba(240, 80, 0, 0.95)',
  1.0: 'rgba(217, 64, 0, 0.98)',
};


const HEATMAP_RAMP_DARK: Record<number, string> = {
  0.0: 'rgba(217, 64, 0, 0)',
  0.06: 'rgba(230, 71, 0, 0.35)',
  0.16: 'rgba(255, 85, 0, 0.54)',
  0.3: 'rgba(255, 120, 48, 0.68)',
  0.45: 'rgba(255, 163, 60, 0.78)',
  0.6: 'rgba(255, 195, 50, 0.87)',
  0.75: 'rgba(255, 220, 80, 0.93)',
  0.88: 'rgba(255, 240, 140, 0.96)',
  1.0: 'rgba(255, 250, 200, 0.98)',
};


function bakeRamp(stops: Record<number, string>): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 1;
  const g = c.getContext('2d');
  if (!g) return new Uint8ClampedArray(1024);

  const grad = g.createLinearGradient(0, 0, 256, 0);
  for (const at of Object.keys(stops)) grad.addColorStop(Number(at), stops[Number(at)]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 1);

  return g.getImageData(0, 0, 256, 1).data;
}


function seedFromCoords(lng: number, lat: number): number {
  const s = Math.sin(lng * 12.9898 + lat * 78.233) * 43758.5453;
  return s - Math.floor(s);
}


const KERNEL_STOPS = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  const alpha = i === 8 ? 0 : Math.exp(-4.5 * t * t);
  return `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
});


function stampKernel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  weight: number,
  seed = 0,
) {
  const aspect = 0.82 + seed * 0.36;
  const angle = seed * Math.PI;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(1, aspect);

  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  KERNEL_STOPS.forEach((color, i) => g.addColorStop(i / (KERNEL_STOPS.length - 1), color));

  ctx.globalAlpha = weight;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}


const KERNEL_METERS = 350;


function kernelRadiusPx(
  projection: { pointFromCoords: (ll: unknown) => { x: number; y: number } },
  center: { getLat: () => number; getLng: () => number },
): number {
  const degrees = KERNEL_METERS / 111_000;
  const here = projection.pointFromCoords(center);
  const north = projection.pointFromCoords(
    new window.kakao.maps.LatLng(center.getLat() + degrees, center.getLng()),
  );

  return Math.min(300, Math.max(40, Math.abs(north.y - here.y)));
}


const MAX_KERNELS = 160;
const MAX_AMBIENT_RIPPLES = 28;
const MAX_CLICK_BURSTS = 6;
const BURST_DURATION_MS = 780;
const ZOOM_RESUME_FALLBACK_MS = 450;

interface VisibleSpot {
  id: string;
  placeId: string;
  x: number;
  y: number;
  radius: number;
  weight: number;
  seed: number;
  congestionLevel: HeatSpot['congestionLevel'];
  hoverLevel: number;
  ambientRipple: boolean;
}

interface PointerState {
  x: number;
  y: number;
  active: boolean;
  dragging: boolean;
}

interface ClickBurst {
  x: number;
  y: number;
  maxR: number;
  bornAt: number;
}

export function computePointerProximity(
  pointerX: number,
  pointerY: number,
  spotX: number,
  spotY: number,
  radius: number,
): { proximity: number; dist: number; dx: number; dy: number } {
  const dx = pointerX - spotX;
  const dy = pointerY - spotY;
  const dist = Math.hypot(dx, dy);
  const influenceR = Math.max(radius * 1.18, 96);
  if (dist >= influenceR) return { proximity: 0, dist, dx, dy };
  const proximity = Math.pow(1 - dist / influenceR, 1.45);
  return { proximity, dist, dx, dy };
}

function drawHeatmapFxFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  spots: VisibleSpot[],
  pointer: PointerState,
  bursts: ClickBurst[],
  selectedSpot: HeatSpot | null,
  hoveredId: string | null,
  isDark: boolean,
  nowMs: number,
  dtSec: number,
) {
  ctx.clearRect(0, 0, width, height);
  if (spots.length === 0 && bursts.length === 0) return;

  const t = nowMs * 0.001;
  const lerpStep = Math.min(1, Math.max(0.08, dtSec * 8.5));
  let maxProximity = 0;

  // Pass 1: Breathing organic warmth aura & luminous core
  ctx.save();
  ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';

  const renderedCenters: {
    spot: VisibleSpot;
    cx: number;
    cy: number;
    phase: number;
  }[] = [];

  for (const spot of spots) {
    const isSelected =
      selectedSpot !== null &&
      (selectedSpot.id === spot.id || selectedSpot.placeId === spot.placeId);
    const isBadgeHovered =
      hoveredId !== null && (hoveredId === spot.placeId || hoveredId === spot.id);

    let prox = 0;
    let dx = 0;
    let dy = 0;
    let dist = Infinity;
    if (pointer.active && !pointer.dragging) {
      const hit = computePointerProximity(pointer.x, pointer.y, spot.x, spot.y, spot.radius);
      prox = hit.proximity;
      dx = hit.dx;
      dy = hit.dy;
      dist = hit.dist;
      if (prox > maxProximity) maxProximity = prox;
    }

    const targetHover = Math.max(prox, isBadgeHovered ? 1 : 0, isSelected ? 0.85 : 0);
    spot.hoverLevel += (targetHover - spot.hoverLevel) * lerpStep;
    if (spot.hoverLevel < 0.002) spot.hoverLevel = 0;

    const phase = spot.seed * Math.PI * 2;
    const freq = 1.05 + spot.weight * 0.95;
    const breath01 = Math.sin(t * freq + phase) * 0.5 + 0.5;

    // Subtle organic center wander + magnetic attraction toward cursor
    const driftAmp = spot.radius * (0.045 + spot.weight * 0.03);
    const driftX = Math.cos(t * 0.65 + phase) * driftAmp;
    const driftY = Math.sin(t * 0.52 + phase * 1.37) * driftAmp;

    let pullX = 0;
    let pullY = 0;
    if (prox > 0.04 && dist > 1) {
      const pull = prox * Math.min(14, spot.radius * 0.14);
      pullX = (dx / dist) * pull;
      pullY = (dy / dist) * pull;
    }

    const cx = spot.x + driftX + pullX;
    const cy = spot.y + driftY + pullY;
    renderedCenters.push({ spot, cx, cy, phase });

    // Organic elliptical breathing aura
    const angle = spot.seed * Math.PI + Math.sin(t * 0.4 + phase) * 0.25;
    const hoverScale = 1 + spot.hoverLevel * 0.2;
    const scaleX = (0.9 + breath01 * (0.16 + spot.weight * 0.08)) * hoverScale;
    const scaleY =
      (0.82 + spot.seed * 0.28 + Math.cos(t * freq * 0.85 + phase) * 0.07) * hoverScale;
    const auraR = spot.radius * 0.94;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.scale(scaleX, scaleY);

    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, auraR);
    if (isDark) {
      const alpha = Math.min(
        0.72,
        0.18 + spot.weight * 0.18 + breath01 * 0.09 + spot.hoverLevel * 0.24,
      );
      aura.addColorStop(0, `rgba(255, 232, 148, ${(alpha * 0.92).toFixed(3)})`);
      aura.addColorStop(0.32, `rgba(255, 168, 52, ${(alpha * 0.72).toFixed(3)})`);
      aura.addColorStop(0.68, `rgba(255, 92, 16, ${(alpha * 0.34).toFixed(3)})`);
      aura.addColorStop(1, 'rgba(217, 64, 0, 0)');
    } else {
      const alpha = Math.min(
        0.66,
        0.16 + spot.weight * 0.16 + breath01 * 0.08 + spot.hoverLevel * 0.22,
      );
      aura.addColorStop(0, `rgba(255, 86, 10, ${alpha.toFixed(3)})`);
      aura.addColorStop(0.35, `rgba(255, 142, 24, ${(alpha * 0.72).toFixed(3)})`);
      aura.addColorStop(0.68, `rgba(255, 198, 56, ${(alpha * 0.34).toFixed(3)})`);
      aura.addColorStop(1, 'rgba(255, 220, 100, 0)');
    }

    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Luminous ember core shimmer for hotspots and hovered/selected spots
    if (spot.weight >= 0.45 || spot.hoverLevel > 0.06) {
      const shimmer = 0.76 + 0.24 * Math.sin(t * (2.5 + spot.seed * 1.5) + phase * 2);
      const coreR = Math.max(10, spot.radius * (0.24 + spot.hoverLevel * 0.14));
      const coreAlpha = Math.min(
        0.75,
        ((spot.weight - 0.35) * 0.28 + spot.hoverLevel * 0.42) * shimmer,
      );
      if (coreAlpha > 0.02) {
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        if (isDark) {
          coreGrad.addColorStop(0, `rgba(255, 248, 210, ${coreAlpha.toFixed(3)})`);
          coreGrad.addColorStop(0.45, `rgba(255, 192, 72, ${(coreAlpha * 0.55).toFixed(3)})`);
          coreGrad.addColorStop(1, 'rgba(255, 120, 20, 0)');
        } else {
          coreGrad.addColorStop(0, `rgba(255, 236, 170, ${(coreAlpha * 0.85).toFixed(3)})`);
          coreGrad.addColorStop(0.42, `rgba(255, 118, 24, ${(coreAlpha * 0.62).toFixed(3)})`);
          coreGrad.addColorStop(1, 'rgba(255, 85, 0, 0)');
        }
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // Pass 2: Expanding thermal ripple waves
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (const { spot, cx, cy } of renderedCenters) {
    const isInteractive = spot.hoverLevel > 0.08;
    if (!spot.ambientRipple && !isInteractive) continue;

    const ringCount =
      spot.congestionLevel === 'surge' || spot.hoverLevel > 0.35 ? 2 : 1;
    const period =
      spot.hoverLevel > 0.25 ? 2.15 : Math.max(2.65, 4.35 - spot.weight * 1.35);

    for (let ringIdx = 0; ringIdx < ringCount; ringIdx++) {
      const offset = ringIdx / ringCount;
      const progress = (t / period + spot.seed + offset) % 1;
      const eased = 1 - Math.pow(1 - progress, 2.2);
      const ringR = spot.radius * (0.22 + eased * (0.96 + spot.hoverLevel * 0.22));
      const envelope = Math.sin(progress * Math.PI);
      const ringAlpha = Math.min(
        0.68,
        envelope * (0.17 + spot.weight * 0.2 + spot.hoverLevel * 0.34),
      );
      if (ringAlpha < 0.015) continue;

      const lineW = (1.35 + spot.hoverLevel * 1.25) * (1 - progress * 0.35);

      // Soft outer thermal halo
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.lineWidth = lineW * 3.2;
      ctx.strokeStyle = isDark
        ? `rgba(255, 186, 68, ${(ringAlpha * 0.24).toFixed(3)})`
        : `rgba(255, 120, 24, ${(ringAlpha * 0.22).toFixed(3)})`;
      ctx.stroke();

      // Crisp thermal wave crest
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.lineWidth = lineW;
      ctx.strokeStyle = isDark
        ? `rgba(255, 224, 130, ${ringAlpha.toFixed(3)})`
        : `rgba(255, 86, 12, ${ringAlpha.toFixed(3)})`;
      ctx.stroke();
    }
  }
  ctx.restore();

  // Pass 3: Subtle cursor warmth shimmer when exploring warm zones
  if (pointer.active && !pointer.dragging && maxProximity > 0.05) {
    const cursorR = 54 + maxProximity * 40;
    const cursorAlpha = Math.min(0.32, maxProximity * 0.28);
    ctx.save();
    ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
    const cursorGrad = ctx.createRadialGradient(
      pointer.x,
      pointer.y,
      0,
      pointer.x,
      pointer.y,
      cursorR,
    );
    if (isDark) {
      cursorGrad.addColorStop(0, `rgba(255, 236, 168, ${cursorAlpha.toFixed(3)})`);
      cursorGrad.addColorStop(0.5, `rgba(255, 146, 48, ${(cursorAlpha * 0.45).toFixed(3)})`);
      cursorGrad.addColorStop(1, 'rgba(255, 85, 0, 0)');
    } else {
      cursorGrad.addColorStop(0, `rgba(255, 132, 32, ${cursorAlpha.toFixed(3)})`);
      cursorGrad.addColorStop(0.55, `rgba(255, 190, 56, ${(cursorAlpha * 0.4).toFixed(3)})`);
      cursorGrad.addColorStop(1, 'rgba(255, 210, 80, 0)');
    }
    ctx.fillStyle = cursorGrad;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, cursorR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Pass 4: Click/tap ripple bursts
  if (bursts.length > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i];
      const elapsed = nowMs - burst.bornAt;
      if (elapsed >= BURST_DURATION_MS) {
        bursts.splice(i, 1);
        continue;
      }
      const p = elapsed / BURST_DURATION_MS;
      const eased = 1 - Math.pow(1 - p, 2.6);
      const alpha = (1 - p) * 0.62;
      const r1 = 10 + eased * burst.maxR;

      ctx.beginPath();
      ctx.arc(burst.x, burst.y, r1, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(0.8, 2.6 * (1 - p * 0.55));
      ctx.strokeStyle = isDark
        ? `rgba(255, 230, 145, ${alpha.toFixed(3)})`
        : `rgba(255, 85, 0, ${alpha.toFixed(3)})`;
      ctx.stroke();

      if (p > 0.14) {
        const p2 = (p - 0.14) / 0.86;
        const r2 = 6 + (1 - Math.pow(1 - p2, 2.2)) * burst.maxR * 0.72;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, r2, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(0.6, 1.8 * (1 - p2 * 0.5));
        ctx.strokeStyle = isDark
          ? `rgba(255, 180, 72, ${((1 - p2) * 0.42).toFixed(3)})`
          : `rgba(255, 152, 36, ${((1 - p2) * 0.42).toFixed(3)})`;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}


interface DistrictFeature {
  name: string;
  code: string;

  bbox: [number, number, number, number];
  rings: [number, number][][];
}

let districtsPromise: Promise<DistrictFeature[]> | null = null;

function loadDistricts(): Promise<DistrictFeature[]> {
  if (!districtsPromise) {
    districtsPromise = fetch('/data/districts.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json) => (Array.isArray(json?.features) ? (json.features as DistrictFeature[]) : []))
      .catch((err) => {

        console.warn('시군구 경계 데이터를 불러오지 못했습니다. 원형 근사로 그립니다.', err);
        return [];
      });
  }

  return districtsPromise;
}


function ringContains(ring: [number, number][], lng: number, lat: number): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}


function findDistrict(
  features: DistrictFeature[],
  lng: number,
  lat: number,
): DistrictFeature | null {
  for (const feature of features) {
    const [minLng, minLat, maxLng, maxLat] = feature.bbox;
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;

    for (const ring of feature.rings) {
      if (ringContains(ring, lng, lat)) return feature;
    }
  }

  return null;
}


const districtCache = new Map<string, DistrictFeature | null>();

function lookupDistrict(
  features: DistrictFeature[],
  lng: number,
  lat: number,
): DistrictFeature | null {
  const key = `${lng},${lat}`;
  const cached = districtCache.get(key);
  if (cached !== undefined) return cached;

  const found = findDistrict(features, lng, lat);
  districtCache.set(key, found);
  return found;
}

interface Props {
  spots: HeatSpot[];
}

export default function HeatCanvas({ spots }: Props) {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const level = useMapStore((s) => s.level);
  const warmthViewType = useMapStore((s) => s.warmthViewType);
  const selectedHeatSpot = useMapStore((s) => s.selectedHeatSpot);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const reducedMotion = usePrefersReducedMotion();
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  const lutRef = useRef<Uint8ClampedArray | null>(null);
  const heatmapLutRef = useRef<Uint8ClampedArray | null>(null);
  const warmthViewTypeRef = useRef(warmthViewType);
  const levelRef = useRef(level);
  const selectedSpotRef = useRef(selectedHeatSpot);
  const hoveredIdRef = useRef(hoveredId);
  const reducedMotionRef = useRef(reducedMotion);

  const spotsRef = useRef(spots);
  const scheduleRef = useRef<(() => void) | null>(null);
  const syncFxRef = useRef<(() => void) | null>(null);
  const districtsRef = useRef<DistrictFeature[]>([]);

  const pathCacheRef = useRef<{ key: string; paths: Map<DistrictFeature, Path2D> }>({
    key: '',
    paths: new Map(),
  });

  useEffect(() => {
    selectedSpotRef.current = selectedHeatSpot;
  }, [selectedHeatSpot]);

  useEffect(() => {
    hoveredIdRef.current = hoveredId;
  }, [hoveredId]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    syncFxRef.current?.();
  }, [reducedMotion]);

  useEffect(() => {
    warmthViewTypeRef.current = warmthViewType;
    scheduleRef.current?.();
  }, [warmthViewType]);


  useEffect(() => {
    if (mode !== 'warmth') return;

    let alive = true;
    loadDistricts().then((features) => {
      if (!alive) return;
      districtsRef.current = features;
      scheduleRef.current?.();
    });

    return () => {
      alive = false;
    };
  }, [mode]);

  useEffect(() => {
    lutRef.current = bakeRamp(isDark ? RAMP_DARK : RAMP_LIGHT);
    heatmapLutRef.current = bakeRamp(isDark ? HEATMAP_RAMP_DARK : HEATMAP_RAMP_LIGHT);
  }, [isDark]);


  useEffect(() => {
    spotsRef.current = spots;
    scheduleRef.current?.();
  }, [spots]);


  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (!map || mode !== 'warmth') return;
    if (!window.kakao?.maps) return;

    const holder = document.createElement('div');
    holder.className = 'om-heat-holder';
    holder.style.cssText = 'position:relative;width:0;height:0;pointer-events:none;';

    const canvas = document.createElement('canvas');
    canvas.className = 'om-heat-canvas';
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    canvas.style.transition = 'opacity 180ms ease';
    holder.appendChild(canvas);

    const fxCanvas = document.createElement('canvas');
    fxCanvas.className = 'om-heat-fx-canvas';
    fxCanvas.style.position = 'absolute';
    fxCanvas.style.pointerEvents = 'none';
    fxCanvas.style.transition = 'opacity 160ms ease';
    fxCanvas.style.display = 'none';
    holder.appendChild(fxCanvas);

    const blurScratch = document.createElement('canvas');

    const overlay = new window.kakao.maps.CustomOverlay({
      position: map.getCenter(),
      content: holder,
      xAnchor: 0,
      yAnchor: 0,
      zIndex: 1,
    });
    overlay.setMap(map);

    let paintFrame = 0;
    let fxFrame = 0;
    let lastFxTime = 0;
    let isZooming = false;
    let zoomResumeTimer: ReturnType<typeof setTimeout> | null = null;

    let visibleSpots: VisibleSpot[] = [];
    const pointer: PointerState = { x: 0, y: 0, active: false, dragging: false };
    const bursts: ClickBurst[] = [];

    const stopFxLoop = () => {
      if (fxFrame) {
        cancelAnimationFrame(fxFrame);
        fxFrame = 0;
      }
      lastFxTime = 0;
    };

    const clearFxCanvas = () => {
      const fxCtx = fxCanvas.getContext('2d');
      if (fxCtx && fxCanvas.width > 0 && fxCanvas.height > 0) {
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      }
    };

    const shouldRunFx = () =>
      warmthViewTypeRef.current === 'heatmap' &&
      !reducedMotionRef.current &&
      !document.hidden &&
      !isZooming &&
      visibleSpots.length > 0 &&
      fxCanvas.width > 1 &&
      fxCanvas.height > 1;

    const tickFx = (nowMs: number) => {
      if (!shouldRunFx()) {
        fxFrame = 0;
        lastFxTime = 0;
        return;
      }

      const fxCtx = fxCanvas.getContext('2d');
      if (!fxCtx) {
        fxFrame = 0;
        return;
      }

      const dtSec = lastFxTime > 0 ? Math.min(0.05, (nowMs - lastFxTime) * 0.001) : 1 / 60;
      lastFxTime = nowMs;

      drawHeatmapFxFrame(
        fxCtx,
        fxCanvas.width,
        fxCanvas.height,
        visibleSpots,
        pointer,
        bursts,
        selectedSpotRef.current,
        hoveredIdRef.current,
        isDark,
        nowMs,
        dtSec,
      );

      fxFrame = requestAnimationFrame(tickFx);
    };

    const syncFxLoop = () => {
      const isAnimatedHeatmap =
        warmthViewTypeRef.current === 'heatmap' && !reducedMotionRef.current && visibleSpots.length > 0;

      canvas.style.opacity = isAnimatedHeatmap ? '0.74' : '1';

      if (!isAnimatedHeatmap) {
        stopFxLoop();
        clearFxCanvas();
        fxCanvas.style.display = 'none';
        fxCanvas.style.opacity = '0';
        return;
      }

      fxCanvas.style.display = 'block';
      fxCanvas.style.opacity = isZooming ? '0' : '1';

      if (shouldRunFx()) {
        if (!fxFrame) {
          lastFxTime = 0;
          fxFrame = requestAnimationFrame(tickFx);
        }
      } else {
        stopFxLoop();
      }
    };
    syncFxRef.current = syncFxLoop;

    const paint = () => {
      if (zoomResumeTimer !== null) {
        clearTimeout(zoomResumeTimer);
        zoomResumeTimer = null;
      }
      isZooming = false;
      pointer.dragging = false;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const projection = map.getProjection?.();
      const node = map.getNode?.();
      const lut =
        warmthViewTypeRef.current === 'heatmap' ? heatmapLutRef.current : lutRef.current;
      if (!ctx || !projection || !node || !lut) return;

      const viewW = node.clientWidth;
      const viewH = node.clientHeight;

      const W = Math.min(2400, Math.round(viewW * 1.5));
      const H = Math.min(2400, Math.round(viewH * 1.5));

      if (W < 2 || H < 2) return;

      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      fxCanvas.width = W;
      fxCanvas.height = H;
      fxCanvas.style.width = `${W}px`;
      fxCanvas.style.height = `${H}px`;

      const center = map.getCenter();
      overlay.setPosition(center);
      const leftPx = `${-W / 2}px`;
      const topPx = `${-H / 2}px`;
      canvas.style.left = leftPx;
      canvas.style.top = topPx;
      fxCanvas.style.left = leftPx;
      fxCanvas.style.top = topPx;

      const centerPt = projection.pointFromCoords(center);
      const originX = centerPt.x - W / 2;
      const originY = centerPt.y - H / 2;

      ctx.clearRect(0, 0, W, H);

      const baseRadius = kernelRadiusPx(projection, center);
      const features = districtsRef.current;

      const project = (lng: number, lat: number) => {
        const pt = projection.pointFromCoords(new window.kakao.maps.LatLng(lat, lng));
        return { x: pt.x - originX, y: pt.y - originY };
      };

      const viewKey = `${levelRef.current}_${Math.round(originX)}_${Math.round(originY)}_${W}x${H}`;
      if (pathCacheRef.current.key !== viewKey) {
        pathCacheRef.current = { key: viewKey, paths: new Map() };
      }
      const pathCache = pathCacheRef.current.paths;

      const filled = new Map<DistrictFeature, number>();
      const loose: { x: number; y: number; weight: number; seed: number }[] = [];

      for (const spot of spotsRef.current) {
        const weight = Math.min(1, Math.max(0.12, spot.intensity));
        const feature = features.length > 0 ? lookupDistrict(features, spot.lng, spot.lat) : null;

        if (feature) {
          filled.set(feature, Math.max(filled.get(feature) ?? 0, weight));
          continue;
        }

        const { x, y } = project(spot.lng, spot.lat);
        loose.push({ x, y, weight, seed: seedFromCoords(spot.lng, spot.lat) });
      }

      let painted = 0;
      const prevHoverById = new Map<string, number>();
      for (const prev of visibleSpots) {
        if (prev.hoverLevel > 0) prevHoverById.set(prev.id, prev.hoverLevel);
      }
      const nextVisibleSpots: VisibleSpot[] = [];

      if (warmthViewTypeRef.current === 'heatmap') {
        const maxRadius = Math.min(220, Math.max(52, Math.round(baseRadius * 1.55)));
        ctx.globalCompositeOperation = 'lighter';
        for (const spot of spotsRef.current) {
          if (painted >= MAX_KERNELS) break;
          const { x, y } = project(spot.lng, spot.lat);
          if (
            x < -maxRadius ||
            y < -maxRadius ||
            x > W + maxRadius ||
            y > H + maxRadius
          ) {
            continue;
          }

          const weight = Math.min(1, Math.max(0.18, spot.intensity));
          const radius = Math.round(maxRadius * (0.55 + weight * 0.45));
          const seed = seedFromCoords(spot.lng, spot.lat);
          stampKernel(ctx, x, y, radius, weight, seed);
          nextVisibleSpots.push({
            id: spot.id,
            placeId: spot.placeId,
            x,
            y,
            radius,
            weight,
            seed,
            congestionLevel: spot.congestionLevel,
            hoverLevel: prevHoverById.get(spot.id) ?? 0,
            ambientRipple: false,
          });
          painted += 1;
        }
        ctx.globalCompositeOperation = 'source-over';

        // Pick top hottest visible spots for ambient ripples to keep the map airy
        const rippleCandidates = nextVisibleSpots
          .filter(
            (s) =>
              s.congestionLevel === 'surge' ||
              s.congestionLevel === 'busy' ||
              s.weight >= 0.48,
          )
          .sort((a, b) => b.weight - a.weight)
          .slice(0, MAX_AMBIENT_RIPPLES);
        for (const candidate of rippleCandidates) {
          candidate.ambientRipple = true;
        }

        if (painted > 0) {
          blurScratch.width = W;
          blurScratch.height = H;
          const scratchCtx = blurScratch.getContext('2d');
          if (scratchCtx) {
            scratchCtx.clearRect(0, 0, W, H);
            scratchCtx.filter = 'blur(6px)';
            scratchCtx.drawImage(canvas, 0, 0);
            scratchCtx.filter = 'none';

            ctx.clearRect(0, 0, W, H);
            ctx.drawImage(blurScratch, 0, 0);
          }
        }
      } else {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';

        for (const [feature, weight] of filled) {
          const min = project(feature.bbox[0], feature.bbox[3]);
          const max = project(feature.bbox[2], feature.bbox[1]);

          if (max.x < 0 || max.y < 0 || min.x > W || min.y > H) continue;

          let path = pathCache.get(feature);

          if (!path) {
            path = new Path2D();

            for (const ring of feature.rings) {
              for (let i = 0; i < ring.length; i++) {
                const { x, y } = project(ring[i][0], ring[i][1]);
                if (i === 0) path.moveTo(x, y);
                else path.lineTo(x, y);
              }
              path.closePath();
            }

            pathCache.set(feature, path);
          }

          const cover = (Math.abs(max.x - min.x) * Math.abs(max.y - min.y)) / (W * H);
          const damp = cover > 1 ? Math.max(0.4, 1 / Math.sqrt(cover)) : 1;

          ctx.globalAlpha = weight * damp;
          ctx.fill(path);

          ctx.globalAlpha = Math.min(1, weight + 0.22);
          ctx.stroke(path);

          painted += 1;
        }

        for (const spot of loose) {
          if (painted >= MAX_KERNELS) break;
          const radius = baseRadius;
          if (
            spot.x < -radius ||
            spot.y < -radius ||
            spot.x > W + radius ||
            spot.y > H + radius
          ) {
            continue;
          }

          stampKernel(ctx, spot.x, spot.y, radius, spot.weight, spot.seed);
          painted += 1;
        }
      }

      ctx.globalAlpha = 1;
      visibleSpots = nextVisibleSpots;

      if (painted === 0) {
        syncFxLoop();
        return;
      }

      const img = ctx.getImageData(0, 0, W, H);
      const px = img.data;

      for (let i = 0; i < px.length; i += 4) {
        const density = px[i + 3];
        if (density === 0) continue;

        const at = density * 4;
        px[i] = lut[at];
        px[i + 1] = lut[at + 1];
        px[i + 2] = lut[at + 2];
        px[i + 3] = lut[at + 3];
      }

      ctx.putImageData(img, 0, 0);
      syncFxLoop();
    };

    const schedule = () => {
      cancelAnimationFrame(paintFrame);
      paintFrame = requestAnimationFrame(paint);
    };
    scheduleRef.current = schedule;

    const onDragStart = () => {
      pointer.dragging = true;
    };

    const onZoomStart = () => {
      isZooming = true;
      syncFxLoop();
      if (zoomResumeTimer !== null) clearTimeout(zoomResumeTimer);
      zoomResumeTimer = setTimeout(() => {
        zoomResumeTimer = null;
        if (isZooming) {
          isZooming = false;
          syncFxLoop();
        }
      }, ZOOM_RESUME_FALLBACK_MS);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopFxLoop();
      } else {
        schedule();
      }
    };

    const node = map.getNode?.() as HTMLElement | null;

    const updatePointerFromEvent = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      pointer.x = ((e.clientX - rect.left) / rect.width) * fxCanvas.width;
      pointer.y = ((e.clientY - rect.top) / rect.height) * fxCanvas.height;
      pointer.active = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (warmthViewTypeRef.current !== 'heatmap' || reducedMotionRef.current) return;
      updatePointerFromEvent(e);
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.dragging = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (warmthViewTypeRef.current !== 'heatmap' || reducedMotionRef.current) return;
      updatePointerFromEvent(e);

      // Spawn a subtle thermal burst when clicking/tapping inside a warm zone
      let closestSpot: VisibleSpot | null = null;
      let bestProx = 0;
      for (const spot of visibleSpots) {
        const { proximity } = computePointerProximity(
          pointer.x,
          pointer.y,
          spot.x,
          spot.y,
          spot.radius,
        );
        if (proximity > bestProx) {
          bestProx = proximity;
          closestSpot = spot;
        }
      }

      if (closestSpot && bestProx > 0.08) {
        if (bursts.length >= MAX_CLICK_BURSTS) bursts.shift();
        bursts.push({
          x: pointer.x,
          y: pointer.y,
          maxR: Math.max(70, closestSpot.radius * 1.12),
          bornAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
        });
      }
    };

    const onPointerUp = () => {
      pointer.dragging = false;
    };

    paint();
    window.kakao.maps.event.addListener(map, 'idle', schedule);
    window.kakao.maps.event.addListener(map, 'dragstart', onDragStart);
    window.kakao.maps.event.addListener(map, 'zoom_start', onZoomStart);

    const ro = node ? new ResizeObserver(schedule) : null;
    if (node && ro) ro.observe(node);

    if (node) {
      node.addEventListener('pointermove', onPointerMove, { passive: true });
      node.addEventListener('pointerleave', onPointerLeave, { passive: true });
      node.addEventListener('pointerdown', onPointerDown, { passive: true });
      node.addEventListener('pointerup', onPointerUp, { passive: true });
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelAnimationFrame(paintFrame);
      stopFxLoop();
      if (zoomResumeTimer !== null) clearTimeout(zoomResumeTimer);
      scheduleRef.current = null;
      syncFxRef.current = null;
      ro?.disconnect();
      if (node) {
        node.removeEventListener('pointermove', onPointerMove);
        node.removeEventListener('pointerleave', onPointerLeave);
        node.removeEventListener('pointerdown', onPointerDown);
        node.removeEventListener('pointerup', onPointerUp);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.kakao.maps.event.removeListener(map, 'idle', schedule);
      window.kakao.maps.event.removeListener(map, 'dragstart', onDragStart);
      window.kakao.maps.event.removeListener(map, 'zoom_start', onZoomStart);
      overlay.setMap(null);
    };
  }, [map, mode, isDark]);

  return null;
}





export function rampCss(isDark: boolean): string {
  const stops = isDark ? RAMP_DARK : RAMP_LIGHT;
  const parts = Object.keys(stops)
    .map(Number)
    .sort((a, b) => a - b)
    .map((at) => `${stops[at]} ${Math.round(at * 100)}%`);

  return `linear-gradient(to right, ${parts.join(', ')})`;
}
