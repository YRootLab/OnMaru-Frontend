'use client';

import { useEffect, useRef } from 'react';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
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
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  const lutRef = useRef<Uint8ClampedArray | null>(null);
  const heatmapLutRef = useRef<Uint8ClampedArray | null>(null);
  const warmthViewTypeRef = useRef(warmthViewType);
  const levelRef = useRef(level);






  const spotsRef = useRef(spots);
  const scheduleRef = useRef<(() => void) | null>(null);
  const districtsRef = useRef<DistrictFeature[]>([]);

  const pathCacheRef = useRef<{ key: string; paths: Map<DistrictFeature, Path2D> }>({
    key: '',
    paths: new Map(),
  });


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
    holder.appendChild(canvas);








    const blurScratch = document.createElement('canvas');

    const overlay = new window.kakao.maps.CustomOverlay({
      position: map.getCenter(),
      content: holder,
      xAnchor: 0,
      yAnchor: 0,
      zIndex: 1,
    });
    overlay.setMap(map);

    let frame = 0;

    const paint = () => {
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


      const center = map.getCenter();
      overlay.setPosition(center);
      canvas.style.left = `${-W / 2}px`;
      canvas.style.top = `${-H / 2}px`;

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
          stampKernel(ctx, x, y, radius, weight, seedFromCoords(spot.lng, spot.lat));
          painted += 1;
        }
        ctx.globalCompositeOperation = 'source-over';











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

      if (painted === 0) return;


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
    };














    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    scheduleRef.current = schedule;





    paint();
    window.kakao.maps.event.addListener(map, 'idle', schedule);






    const node = map.getNode?.();
    const ro = node ? new ResizeObserver(schedule) : null;
    if (node && ro) ro.observe(node);


    document.addEventListener('visibilitychange', schedule);

    return () => {
      cancelAnimationFrame(frame);
      scheduleRef.current = null;
      ro?.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      window.kakao.maps.event.removeListener(map, 'idle', schedule);
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
