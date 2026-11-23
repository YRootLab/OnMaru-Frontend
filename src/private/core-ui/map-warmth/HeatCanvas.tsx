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


const MAX_KERNELS = 140;
const MAX_AMBIENT_RIPPLES = 24;
const MAX_EMBER_SPOTS = 18;
const MAX_CLICK_BURSTS = 6;
const BURST_DURATION_MS = 820;
const ZOOM_RESUME_FALLBACK_MS = 420;
const FIELD_SCALE = 0.2;
const FIELD_MAX_DIM = 360;
const KERNEL_SPRITE_SIZE = 96;
const CLICK_DRAG_THRESHOLD_PX = 6;

const CONGESTION_LABEL: Record<HeatSpot['congestionLevel'], string> = {
  relaxed: '여유',
  moderate: '보통',
  busy: '붐빔',
  surge: '급상승',
};

const CONGESTION_DOT: Record<HeatSpot['congestionLevel'], string> = {
  relaxed: '#E5A910',
  moderate: '#FF8A1E',
  busy: '#FF5500',
  surge: '#E03E00',
};

function formatCompactVisitors(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '';
  if (count >= 10000) return `${(count / 10000).toFixed(1).replace(/\.0$/, '')}만명`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}천명`;
  return `${Math.round(count)}명`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createKernelSprite(): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = KERNEL_SPRITE_SIZE;
  sprite.height = KERNEL_SPRITE_SIZE;
  const g = sprite.getContext('2d');
  if (!g) return sprite;

  const half = KERNEL_SPRITE_SIZE / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  KERNEL_STOPS.forEach((color, i) => grad.addColorStop(i / (KERNEL_STOPS.length - 1), color));
  g.fillStyle = grad;
  g.beginPath();
  g.arc(half, half, half, 0, Math.PI * 2);
  g.fill();
  return sprite;
}

interface VisibleSpot {
  id: string;
  placeId: string;
  name: string;
  district: string;
  visitorCount: number;
  x: number;
  y: number;
  radius: number;
  weight: number;
  seed: number;
  congestionLevel: HeatSpot['congestionLevel'];
  hoverLevel: number;
  ambientRipple: boolean;
  emitEmbers: boolean;
  spot: HeatSpot;
}

interface PointerState {
  x: number;
  y: number;
  downClientX: number;
  downClientY: number;
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
  const influenceR = Math.max(radius * 1.28, 108);
  if (dist >= influenceR) return { proximity: 0, dist, dx, dy };
  const proximity = Math.pow(1 - dist / influenceR, 1.35);
  return { proximity, dist, dx, dy };
}

function drawHeatmapFxFrame(
  ctx: CanvasRenderingContext2D,
  fieldCanvas: HTMLCanvasElement,
  fieldCtx: CanvasRenderingContext2D | null,
  kernelSprite: HTMLCanvasElement,
  lut: Uint8ClampedArray | null,
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
): { closestSpot: VisibleSpot | null; closestCenter: { x: number; y: number } | null } {
  ctx.clearRect(0, 0, width, height);
  if (spots.length === 0 && bursts.length === 0) {
    return { closestSpot: null, closestCenter: null };
  }

  const t = nowMs * 0.001;
  const lerpStep = Math.min(1, Math.max(0.1, dtSec * 9.5));

  let maxProximity = 0;
  let closestSpot: VisibleSpot | null = null;
  let closestCenter: { x: number; y: number } | null = null;

  const animated: {
    spot: VisibleSpot;
    cx: number;
    cy: number;
    phase: number;
    breath: number;
    rx: number;
    ry: number;
    angle: number;
    effectiveWeight: number;
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
    }

    const targetHover = Math.max(prox, isBadgeHovered ? 1 : 0, isSelected ? 0.9 : 0);
    spot.hoverLevel += (targetHover - spot.hoverLevel) * lerpStep;
    if (spot.hoverLevel < 0.002) spot.hoverLevel = 0;

    const phase = spot.seed * Math.PI * 2;
    const freq = 1.25 + spot.weight * 1.15;
    const wave1 = Math.sin(t * freq + phase);
    const wave2 = Math.sin(t * freq * 1.85 + phase * 2.1);
    const breath = wave1 * 0.7 + wave2 * 0.3; // -1 .. 1

    // Noticeable organic sway + cursor magnetic attraction
    const driftAmp = spot.radius * (0.07 + spot.weight * 0.045);
    const driftX = Math.cos(t * 0.85 + phase) * driftAmp;
    const driftY = Math.sin(t * 0.72 + phase * 1.43) * driftAmp;

    let pullX = 0;
    let pullY = 0;
    if (prox > 0.03 && dist > 1) {
      const pull = prox * Math.min(22, spot.radius * 0.22);
      pullX = (dx / dist) * pull;
      pullY = (dy / dist) * pull;
    }

    const cx = spot.x + driftX + pullX;
    const cy = spot.y + driftY + pullY;

    if (prox > maxProximity && prox > 0.14) {
      maxProximity = prox;
      closestSpot = spot;
      closestCenter = { x: cx, y: cy };
    }

    const aspect = 0.84 + spot.seed * 0.32;
    const hoverScale = 1 + spot.hoverLevel * 0.26;
    const pulseX = 1 + breath * (0.14 + spot.weight * 0.06);
    const pulseY = 1 + Math.cos(t * freq * 0.92 + phase) * (0.12 + spot.weight * 0.05);
    const rx = spot.radius * pulseX * hoverScale;
    const ry = spot.radius * aspect * pulseY * hoverScale;
    const angle = spot.seed * Math.PI + Math.sin(t * 0.55 + phase) * 0.35;
    const effectiveWeight = Math.min(
      1,
      spot.weight * (0.86 + (breath * 0.5 + 0.5) * 0.24) + spot.hoverLevel * 0.28,
    );

    animated.push({ spot, cx, cy, phase, breath, rx, ry, angle, effectiveWeight });
  }

  // Pass 1: Real-time fluid metaball density field -> LUT -> silky upscaled GPU draw
  if (fieldCtx && lut && fieldCanvas.width > 1 && fieldCanvas.height > 1) {
    const fw = fieldCanvas.width;
    const fh = fieldCanvas.height;
    const sx = fw / width;
    const sy = fh / height;

    fieldCtx.clearRect(0, 0, fw, fh);
    fieldCtx.globalCompositeOperation = 'lighter';

    for (const item of animated) {
      const { spot, cx, cy, phase, rx, ry, angle, effectiveWeight } = item;
      const fx = cx * sx;
      const fy = cy * sy;
      const frx = rx * sx;
      const fry = ry * sy;

      fieldCtx.save();
      fieldCtx.translate(fx, fy);
      fieldCtx.rotate(angle);
      fieldCtx.globalAlpha = effectiveWeight;
      fieldCtx.drawImage(kernelSprite, -frx, -fry, frx * 2, fry * 2);

      // Secondary orbiting thermal eddy breaks up rigid circle silhouettes into organic blobs
      if (spot.weight >= 0.38 || spot.hoverLevel > 0.12) {
        const eddyAngle = t * (0.9 + spot.seed * 0.6) + phase;
        const eddyOffX = Math.cos(eddyAngle) * frx * 0.24;
        const eddyOffY = Math.sin(eddyAngle) * fry * 0.24;
        const eddyR = Math.max(frx, fry) * 0.64;
        fieldCtx.globalAlpha = effectiveWeight * 0.42;
        fieldCtx.drawImage(kernelSprite, eddyOffX - eddyR, eddyOffY - eddyR, eddyR * 2, eddyR * 2);
      }
      fieldCtx.restore();
    }

    // Cursor liquid warmth bridge: nearby heat blobs reach out & fuse toward the pointer
    if (pointer.active && !pointer.dragging && maxProximity > 0.08) {
      const px = pointer.x * sx;
      const py = pointer.y * sy;
      const pr = (48 + maxProximity * 44) * sx;
      fieldCtx.save();
      fieldCtx.globalAlpha = Math.min(0.68, maxProximity * 0.62);
      fieldCtx.drawImage(kernelSprite, px - pr, py - pr, pr * 2, pr * 2);
      fieldCtx.restore();
    }

    fieldCtx.globalCompositeOperation = 'source-over';
    fieldCtx.globalAlpha = 1;

    const img = fieldCtx.getImageData(0, 0, fw, fh);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const density = data[i + 3];
      if (density === 0) continue;
      const at = density * 4;
      data[i] = lut[at];
      data[i + 1] = lut[at + 1];
      data[i + 2] = lut[at + 2];
      data[i + 3] = lut[at + 3];
    }
    fieldCtx.putImageData(img, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fieldCanvas, 0, 0, width, height);
    ctx.restore();
  }

  // Pass 2: Expanding thermal ripple waves & luminous hotspot beacons
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (const { spot, cx, cy, phase } of animated) {
    const isInteractive = spot.hoverLevel > 0.08;

    // Luminous ember heart on notable/hovered spots so hotspots feel tangible & clickable
    if (spot.ambientRipple || isInteractive) {
      const pulse = 0.72 + 0.28 * Math.sin(t * (2.6 + spot.seed * 1.4) + phase);
      const beaconR = (4.2 + spot.weight * 2.8 + spot.hoverLevel * 4.5) * (0.9 + pulse * 0.2);
      const glowR = beaconR * (3.2 + spot.hoverLevel * 1.4);

      const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      const glowAlpha = Math.min(0.85, (0.34 + spot.weight * 0.24 + spot.hoverLevel * 0.36) * pulse);
      if (isDark) {
        coreGlow.addColorStop(0, `rgba(255, 252, 224, ${glowAlpha.toFixed(3)})`);
        coreGlow.addColorStop(0.35, `rgba(255, 206, 86, ${(glowAlpha * 0.65).toFixed(3)})`);
        coreGlow.addColorStop(1, 'rgba(255, 110, 20, 0)');
      } else {
        coreGlow.addColorStop(0, `rgba(255, 248, 210, ${(glowAlpha * 0.95).toFixed(3)})`);
        coreGlow.addColorStop(0.38, `rgba(255, 110, 16, ${(glowAlpha * 0.62).toFixed(3)})`);
        coreGlow.addColorStop(1, 'rgba(255, 85, 0, 0)');
      }
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Crisp inner core dot
      ctx.beginPath();
      ctx.arc(cx, cy, beaconR * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(255, 250, 225, ${(0.72 + spot.hoverLevel * 0.25).toFixed(3)})`
        : `rgba(255, 255, 248, ${(0.75 + spot.hoverLevel * 0.22).toFixed(3)})`;
      ctx.fill();
    }

    if (!spot.ambientRipple && !isInteractive) continue;

    // Thermal expanding rings
    const ringCount = spot.congestionLevel === 'surge' || spot.hoverLevel > 0.3 ? 2 : 1;
    const period = spot.hoverLevel > 0.22 ? 1.85 : Math.max(2.35, 3.85 - spot.weight * 1.25);

    for (let ringIdx = 0; ringIdx < ringCount; ringIdx++) {
      const progress = (t / period + spot.seed + ringIdx / ringCount) % 1;
      const eased = 1 - Math.pow(1 - progress, 2.3);
      const ringR = spot.radius * (0.18 + eased * (1.02 + spot.hoverLevel * 0.26));
      const envelope = Math.sin(progress * Math.PI);
      const ringAlpha = Math.min(
        0.82,
        envelope * (0.28 + spot.weight * 0.24 + spot.hoverLevel * 0.36),
      );
      if (ringAlpha < 0.015) continue;

      const lineW = (1.6 + spot.hoverLevel * 1.4) * (1 - progress * 0.3);

      // Soft outer halo
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.lineWidth = lineW * 3.4;
      ctx.strokeStyle = isDark
        ? `rgba(255, 198, 80, ${(ringAlpha * 0.28).toFixed(3)})`
        : `rgba(255, 118, 22, ${(ringAlpha * 0.26).toFixed(3)})`;
      ctx.stroke();

      // High-contrast thermal crest
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.lineWidth = lineW;
      ctx.strokeStyle = isDark
        ? `rgba(255, 242, 178, ${ringAlpha.toFixed(3)})`
        : `rgba(255, 245, 220, ${(ringAlpha * 0.85).toFixed(3)})`;
      ctx.stroke();
    }

    // Floating warm ember motes gently rising from hotspots
    if (spot.emitEmbers || spot.hoverLevel > 0.35) {
      const emberCount = spot.hoverLevel > 0.35 ? 4 : 2;
      for (let eIdx = 0; eIdx < emberCount; eIdx++) {
        const eSeed = (spot.seed * 7.31 + eIdx * 0.37) % 1;
        const life = (t * (0.38 + eSeed * 0.22) + eSeed) % 1;
        const rise = life * spot.radius * (0.78 + spot.hoverLevel * 0.25);
        const spreadX =
          (eSeed - 0.5) * spot.radius * 0.55 + Math.sin(t * 2.1 + eSeed * 12) * 8;
        const ex = cx + spreadX;
        const ey = cy - rise;
        const eAlpha = Math.sin(life * Math.PI) * (0.45 + spot.hoverLevel * 0.42);
        const er = (1.6 + eSeed * 1.8) * (1 - life * 0.45);
        if (eAlpha < 0.03) continue;

        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255, 244, 188, ${eAlpha.toFixed(3)})`
          : `rgba(255, 240, 175, ${eAlpha.toFixed(3)})`;
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // Pass 3: Click/tap thermal shockwave bursts
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
      const alpha = (1 - p) * 0.82;
      const r1 = 12 + eased * burst.maxR;

      ctx.beginPath();
      ctx.arc(burst.x, burst.y, r1, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, 3 * (1 - p * 0.5));
      ctx.strokeStyle = isDark
        ? `rgba(255, 240, 168, ${alpha.toFixed(3)})`
        : `rgba(255, 86, 12, ${alpha.toFixed(3)})`;
      ctx.stroke();

      if (p > 0.12) {
        const p2 = (p - 0.12) / 0.88;
        const r2 = 8 + (1 - Math.pow(1 - p2, 2.2)) * burst.maxR * 0.74;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, r2, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(0.8, 2 * (1 - p2 * 0.5));
        ctx.strokeStyle = isDark
          ? `rgba(255, 190, 72, ${((1 - p2) * 0.55).toFixed(3)})`
          : `rgba(255, 236, 168, ${((1 - p2) * 0.72).toFixed(3)})`;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  return { closestSpot, closestCenter };
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
    scheduleRef.current?.();
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

    // Floating interactive tooltip card for hovered heatmap spot (neutral surface, title on top)
    const tooltip = document.createElement('div');
    tooltip.className = 'om-heat-tooltip';
    tooltip.style.cssText = [
      'position:absolute',
      'left:0',
      'top:0',
      'pointer-events:none',
      'z-index:12',
      'opacity:0',
      'transform:translate(-50%,-100%) translateY(-10px) scale(0.96)',
      'transition:opacity 140ms ease, transform 140ms ease',
      'padding:8px 12px',
      'border-radius:12px',
      'white-space:nowrap',
      'backdrop-filter:blur(10px)',
      isDark
        ? 'background:rgba(24,24,26,0.92);border:1px solid rgba(255,255,255,0.12);color:#f5f5f4;box-shadow:0 8px 24px rgba(0,0,0,0.42);'
        : 'background:rgba(255,255,255,0.94);border:1px solid rgba(0,0,0,0.08);color:#18181b;box-shadow:0 8px 24px rgba(0,0,0,0.12);',
    ].join(';');
    holder.appendChild(tooltip);

    const blurScratch = document.createElement('canvas');
    const fieldCanvas = document.createElement('canvas');
    const kernelSprite = createKernelSprite();

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
    let activeTooltipId: string | null = null;

    let visibleSpots: VisibleSpot[] = [];
    const pointer: PointerState = {
      x: 0,
      y: 0,
      downClientX: 0,
      downClientY: 0,
      active: false,
      dragging: false,
    };
    const bursts: ClickBurst[] = [];

    const hideTooltip = () => {
      if (activeTooltipId !== null) {
        activeTooltipId = null;
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translate(-50%,-100%) translateY(-10px) scale(0.96)';
      }
    };

    const updateTooltip = (
      spot: VisibleSpot | null,
      center: { x: number; y: number } | null,
      W: number,
      H: number,
    ) => {
      if (!spot || !center || pointer.dragging || isZooming) {
        hideTooltip();
        return;
      }

      const relX = center.x - W / 2;
      const relY = center.y - H / 2 - Math.min(26, Math.max(12, spot.radius * 0.22));
      tooltip.style.left = `${relX.toFixed(1)}px`;
      tooltip.style.top = `${relY.toFixed(1)}px`;

      if (activeTooltipId !== spot.id) {
        activeTooltipId = spot.id;
        const title = escapeHtml((spot.name || spot.district || '온기 지역').replace(/\s*일대$/, ''));
        const statusLabel = CONGESTION_LABEL[spot.congestionLevel] ?? '보통';
        const dotColor = CONGESTION_DOT[spot.congestionLevel] ?? '#FF8A1E';
        const visitors = formatCompactVisitors(spot.visitorCount);
        const subColor = isDark ? '#a1a1aa' : '#52525b';

        tooltip.innerHTML = `
          <div style="font-size:13px;font-weight:700;line-height:1.25;letter-spacing:-0.01em;">${title}</div>
          <div style="margin-top:3px;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500;color:${subColor};">
            <span style="display:inline-flex;align-items:center;gap:4px;">
              <span style="width:7px;height:7px;border-radius:9999px;background:${dotColor};display:inline-block;"></span>
              ${statusLabel}
            </span>
            ${visitors ? `<span>· 외지인 ${visitors}</span>` : ''}
          </div>
        `;
      }

      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translate(-50%,-100%) translateY(-4px) scale(1)';
    };

    const stopFxLoop = () => {
      if (fxFrame) {
        cancelAnimationFrame(fxFrame);
        fxFrame = 0;
      }
      lastFxTime = 0;
      hideTooltip();
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
        hideTooltip();
        return;
      }

      const fxCtx = fxCanvas.getContext('2d');
      const fieldCtx = fieldCanvas.getContext('2d', { willReadFrequently: true });
      if (!fxCtx) {
        fxFrame = 0;
        return;
      }

      const dtSec = lastFxTime > 0 ? Math.min(0.05, (nowMs - lastFxTime) * 0.001) : 1 / 60;
      lastFxTime = nowMs;

      const { closestSpot, closestCenter } = drawHeatmapFxFrame(
        fxCtx,
        fieldCanvas,
        fieldCtx,
        kernelSprite,
        heatmapLutRef.current,
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

      updateTooltip(closestSpot, closestCenter, fxCanvas.width, fxCanvas.height);
      fxFrame = requestAnimationFrame(tickFx);
    };

    const syncFxLoop = () => {
      const isAnimatedHeatmap =
        warmthViewTypeRef.current === 'heatmap' && !reducedMotionRef.current && visibleSpots.length > 0;

      // In animated heatmap mode, hide the static base canvas so the fluid real-time
      // thermal field on fxCanvas drives 100% of the visual motion without frozen edges.
      canvas.style.opacity = isAnimatedHeatmap ? '0' : '1';

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

      // Size low-res fluid thermal field canvas (fast real-time LUT colorization)
      const scaleRatio = Math.min(FIELD_SCALE, FIELD_MAX_DIM / Math.max(W, H));
      fieldCanvas.width = Math.max(48, Math.round(W * scaleRatio));
      fieldCanvas.height = Math.max(48, Math.round(H * scaleRatio));

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
        const needsStaticPaint = reducedMotionRef.current;
        if (needsStaticPaint) ctx.globalCompositeOperation = 'lighter';

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
          if (needsStaticPaint) {
            stampKernel(ctx, x, y, radius, weight, seed);
          }
          nextVisibleSpots.push({
            id: spot.id,
            placeId: spot.placeId,
            name: spot.name,
            district: spot.district,
            visitorCount: spot.visitorCount,
            x,
            y,
            radius,
            weight,
            seed,
            congestionLevel: spot.congestionLevel,
            hoverLevel: prevHoverById.get(spot.id) ?? 0,
            ambientRipple: false,
            emitEmbers: false,
            spot,
          });
          painted += 1;
        }
        if (needsStaticPaint) ctx.globalCompositeOperation = 'source-over';

        // Prioritize hottest visible spots for ambient ripples and rising ember motes
        const rankedSpots = [...nextVisibleSpots].sort((a, b) => b.weight - a.weight);
        rankedSpots.slice(0, MAX_AMBIENT_RIPPLES).forEach((s, idx) => {
          if (
            s.congestionLevel === 'surge' ||
            s.congestionLevel === 'busy' ||
            s.weight >= 0.4 ||
            idx < 8
          ) {
            s.ambientRipple = true;
          }
        });
        rankedSpots.slice(0, MAX_EMBER_SPOTS).forEach((s) => {
          if (s.weight >= 0.42 || s.congestionLevel === 'surge' || s.congestionLevel === 'busy') {
            s.emitEmbers = true;
          }
        });

        visibleSpots = nextVisibleSpots;

        if (!needsStaticPaint) {
          syncFxLoop();
          return;
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
      hideTooltip();
    };

    const onZoomStart = () => {
      isZooming = true;
      hideTooltip();
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
      const targetRect = fxCanvas.style.display !== 'none'
        ? fxCanvas.getBoundingClientRect()
        : canvas.getBoundingClientRect();
      if (targetRect.width < 2 || targetRect.height < 2) return;
      pointer.x = ((e.clientX - targetRect.left) / targetRect.width) * fxCanvas.width;
      pointer.y = ((e.clientY - targetRect.top) / targetRect.height) * fxCanvas.height;
      pointer.active = true;
    };

    const findClosestVisibleSpot = (px: number, py: number) => {
      let closestSpot: VisibleSpot | null = null;
      let bestProx = 0;
      for (const spot of visibleSpots) {
        const { proximity } = computePointerProximity(px, py, spot.x, spot.y, spot.radius);
        if (proximity > bestProx) {
          bestProx = proximity;
          closestSpot = spot;
        }
      }
      return { closestSpot, bestProx };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (warmthViewTypeRef.current !== 'heatmap' || reducedMotionRef.current) return;
      updatePointerFromEvent(e);
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.dragging = false;
      hideTooltip();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (warmthViewTypeRef.current !== 'heatmap' || reducedMotionRef.current) return;
      pointer.downClientX = e.clientX;
      pointer.downClientY = e.clientY;
      updatePointerFromEvent(e);

      const { closestSpot, bestProx } = findClosestVisibleSpot(pointer.x, pointer.y);
      if (closestSpot && bestProx > 0.08) {
        if (bursts.length >= MAX_CLICK_BURSTS) bursts.shift();
        bursts.push({
          x: pointer.x,
          y: pointer.y,
          maxR: Math.max(76, closestSpot.radius * 1.18),
          bornAt: typeof performance !== 'undefined' ? performance.now() : Date.now(),
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasDragging = pointer.dragging;
      pointer.dragging = false;
      if (warmthViewTypeRef.current !== 'heatmap' || reducedMotionRef.current || wasDragging) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, select, textarea, [role="button"], .om-surge-pill-wrap')) {
        return;
      }

      const moved = Math.hypot(
        e.clientX - pointer.downClientX,
        e.clientY - pointer.downClientY,
      );
      if (moved > CLICK_DRAG_THRESHOLD_PX) return;

      updatePointerFromEvent(e);
      const { closestSpot, bestProx } = findClosestVisibleSpot(pointer.x, pointer.y);
      if (closestSpot && bestProx > 0.2) {
        useMapStore.getState().setSelectedHeatSpot(closestSpot.spot);
        useMapStore.getState().setSelectedId(closestSpot.placeId);
      }
    };

    paint();
    window.kakao.maps.event.addListener(map, 'idle', schedule);
    window.kakao.maps.event.addListener(map, 'dragstart', onDragStart);
    window.kakao.maps.event.addListener(map, 'zoom_start', onZoomStart);

    const ro = node ? new ResizeObserver(schedule) : null;
    if (node && ro) ro.observe(node);

    // Use capture phase so Kakao map's internal drag layer never swallows pointer tracking
    if (node) {
      node.addEventListener('pointermove', onPointerMove, { capture: true, passive: true });
      node.addEventListener('pointerleave', onPointerLeave, { passive: true });
      node.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
      node.addEventListener('pointerup', onPointerUp, { capture: true, passive: true });
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
        node.removeEventListener('pointermove', onPointerMove, { capture: true });
        node.removeEventListener('pointerleave', onPointerLeave);
        node.removeEventListener('pointerdown', onPointerDown, { capture: true });
        node.removeEventListener('pointerup', onPointerUp, { capture: true });
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
