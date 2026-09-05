'use client';

import { useEffect, useRef } from 'react';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { HeatSpot } from '@/map/types';

/**
 * 온기 밀도 히트맵 (커널 누적 방식)
 *
 * 예전에는 스팟 하나마다 radial-gradient div를 얹고 blur와 mix-blend-mode로
 * 겹침을 흉내냈다. 그래서 스팟이 겹칠수록 합성 비용이 붙었고, 확대하면
 * 레이어가 통째로 사라지는 일이 있었다.
 *
 * 여기서는 캔버스 한 장에 그린다.
 *   1) 밀도 패스 — 스팟마다 알파 커널을 누적한다. 겹치는 만큼 알파가 쌓인다.
 *   2) 채색 패스 — 쌓인 알파를 256칸 램프에 통과시켜 색으로 바꾼다.
 * 우버를 비롯한 밀도 히트맵이 쓰는 방식 그대로다.
 *
 * 램프의 규칙은 하나다 — 한적한 곳에는 아무것도 칠하지 않는다.
 * 색은 추천이 아니라 경고다. 여백이 곧 "갈 만한 곳"이라는 뜻이므로
 * 램프의 앞 구간(밀도 22% 미만)은 알파가 0이다.
 */

/** 밀도(0~255)를 색으로 바꾸는 램프. 앞 구간은 완전히 투명하다. */
const RAMP_LIGHT: Record<number, string> = {
  0.0: 'rgba(232, 90, 24, 0)',
  0.22: 'rgba(255, 203, 168, 0)', // 여기까지 여백 — 한적한 곳은 칠하지 않는다
  0.38: 'rgba(255, 204, 64, 0.42)', // hwanggeum 200
  0.58: 'rgba(245, 166, 35, 0.62)', // hwanggeum 400
  0.78: 'rgba(240, 112, 48, 0.78)', // juhong 400
  0.9: 'rgba(232, 90, 24, 0.88)', // juhong 500
  1.0: 'rgba(160, 58, 10, 0.92)', // juhong 700 — 가장 붐비는 core
};

/** 다크는 먹빛 바닥(#1C1A17) 위라 밀도가 오를수록 밝아져야 한다. */
const RAMP_DARK: Record<number, string> = {
  0.0: 'rgba(248, 87, 0, 0)',
  0.22: 'rgba(248, 87, 0, 0)',
  0.38: 'rgba(151, 49, 0, 0.45)', // juhong 700
  0.58: 'rgba(248, 87, 0, 0.65)', // juhong 500
  0.78: 'rgba(250, 170, 73, 0.8)', // hwanggeum 500
  1.0: 'rgba(255, 220, 184, 0.92)', // hwanggeum 200 — 가장 붐비는 core
};

/** 램프를 256칸 룩업 테이블로 굽는다. 보간과 알파 처리는 캔버스에 맡긴다. */
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

/**
 * 커널 하나. 가운데가 진하고 가장자리로 갈수록 흐려지는 가우시안 근사다.
 * 이 모양이 곧 히트맵의 해상도라, blur 필터를 따로 쓸 필요가 없다.
 */
function stampKernel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  weight: number,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(0, 0, 0, 1)');
  g.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)');
  g.addColorStop(0.7, 'rgba(0, 0, 0, 0.16)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.globalAlpha = weight;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** 줌 레벨별 커널 반경(px). 레벨이 작을수록(확대) 넓게 번진다. */
function kernelRadius(level: number): number {
  return Math.min(110, Math.max(38, 26 + (12 - level) * 6));
}

interface Props {
  spots: HeatSpot[];
}

export default function HeatCanvas({ spots }: Props) {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const level = useMapStore((s) => s.level);
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  const lutRef = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    lutRef.current = bakeRamp(isDark ? RAMP_DARK : RAMP_LIGHT);
  }, [isDark]);

  useEffect(() => {
    if (!map || mode !== 'warmth' || spots.length === 0) return;
    if (!window.kakao?.maps) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'om-heat-canvas';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'block';

    const overlay = new window.kakao.maps.CustomOverlay({
      position: map.getCenter(),
      content: canvas,
      xAnchor: 0.5,
      yAnchor: 0.5,
      zIndex: 1, // 수요 집중도 뱃지(zIndex 25) 아래에 깔린다
    });
    overlay.setMap(map);

    let frame = 0;

    const paint = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const projection = map.getProjection?.();
      const node = map.getNode?.();
      const lut = lutRef.current;
      if (!ctx || !projection || !node || !lut) return;

      /*
        화면보다 1.5배 넓게 그려둔다. 드래그하는 동안에는 오버레이가 지도와 같이
        움직이므로 다시 그릴 필요가 없고, 손을 놓았을 때(idle) 한 번만 갱신한다.
        ponytail: devicePixelRatio를 1로 고정한다. 히트맵은 원래 흐릿해서 2배로
        그려도 눈에 차이가 없고, 픽셀 수만 4배가 된다. 선명함이 필요해지면 여기부터 본다.
      */
      const W = Math.min(2400, Math.round(node.clientWidth * 1.5));
      const H = Math.min(2400, Math.round(node.clientHeight * 1.5));
      if (W < 2 || H < 2) return;

      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      const center = map.getCenter();
      const centerPt = projection.pointFromCoords(center);
      const radius = kernelRadius(level);

      // ── 1. 밀도 패스: 알파를 누적한다 ──
      ctx.clearRect(0, 0, W, H);
      let painted = 0;

      for (const spot of spots) {
        const pt = projection.pointFromCoords(
          new window.kakao.maps.LatLng(spot.lat, spot.lng),
        );
        const x = W / 2 + (pt.x - centerPt.x);
        const y = H / 2 + (pt.y - centerPt.y);
        if (x < -radius || y < -radius || x > W + radius || y > H + radius) continue;

        stampKernel(ctx, x, y, radius, Math.min(1, Math.max(0.12, spot.intensity)));
        painted += 1;
      }

      ctx.globalAlpha = 1;
      if (painted === 0) return;

      // ── 2. 채색 패스: 쌓인 알파를 램프에 통과시킨다 ──
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
      overlay.setPosition(center);
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };

    schedule();
    window.kakao.maps.event.addListener(map, 'idle', schedule);
    window.kakao.maps.event.addListener(map, 'zoom_changed', schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.kakao.maps.event.removeListener(map, 'idle', schedule);
      window.kakao.maps.event.removeListener(map, 'zoom_changed', schedule);
      overlay.setMap(null);
    };
  }, [map, mode, spots, level, isDark]);

  return null;
}
