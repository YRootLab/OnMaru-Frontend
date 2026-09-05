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

  /*
    스팟 목록은 ref로 넘긴다. 날짜 스크러버를 드래그하면 목록이 프레임마다 새로
    오는데, 그때마다 아래 이펙트가 다시 돌면 오버레이를 지웠다 만들기를 반복한다.
    오버레이는 한 번만 만들고, 목록이 바뀌면 다시 칠하기만 한다.
  */
  const spotsRef = useRef(spots);
  const scheduleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    lutRef.current = bakeRamp(isDark ? RAMP_DARK : RAMP_LIGHT);
  }, [isDark]);

  // 스팟(=선택한 날)이 바뀌면 다시 칠한다. rAF가 연속된 스크럽을 한 프레임으로 묶는다.
  useEffect(() => {
    spotsRef.current = spots;
    scheduleRef.current?.();
  }, [spots]);

  useEffect(() => {
    if (!map || mode !== 'warmth') return;
    if (!window.kakao?.maps) return;

    /*
      카카오는 오버레이를 붙일 때 콘텐츠 크기를 한 번 재서 앵커 음수 마진을 박고
      다시 재지 않는다. 캔버스를 직접 콘텐츠로 주면 캔버스를 키운 뒤 위치가 어긋난다.
      그래서 크기 0짜리 홀더를 콘텐츠로 준다. 0을 재면 마진도 0이라,
      홀더의 좌상단이 곧 지도 중심점이 되고 캔버스는 그 안에서 우리가 배치한다.
    */
    const holder = document.createElement('div');
    holder.className = 'om-heat-holder';
    holder.style.cssText = 'position:relative;width:0;height:0;pointer-events:none;';

    const canvas = document.createElement('canvas');
    canvas.className = 'om-heat-canvas';
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    holder.appendChild(canvas);

    const overlay = new window.kakao.maps.CustomOverlay({
      position: map.getCenter(),
      content: holder,
      xAnchor: 0,
      yAnchor: 0,
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

      const viewW = node.clientWidth;
      const viewH = node.clientHeight;

      /*
        화면보다 1.5배 넓게 그려둔다. 드래그하는 동안에는 오버레이가 지도와 같이
        움직이므로 다시 그릴 필요가 없고, 손을 놓았을 때(idle) 한 번만 갱신한다.
        ponytail: devicePixelRatio를 1로 고정한다. 히트맵은 원래 흐릿해서 2배로
        그려도 눈에 차이가 없고, 픽셀 수만 4배가 된다. 선명함이 필요해지면 여기부터 본다.
      */
      const W = Math.min(2400, Math.round(viewW * 1.5));
      const H = Math.min(2400, Math.round(viewH * 1.5));
      // 첫 프레임에는 지도 노드 레이아웃이 아직 잡히기 전일 수 있다. ResizeObserver가 다시 부른다.
      if (W < 2 || H < 2) return;

      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      const radius = kernelRadius(level);

      // 홀더의 좌상단이 지도 중심이다. 캔버스를 그 절반만큼 끌어올려 중심에 맞춘다.
      const center = map.getCenter();
      overlay.setPosition(center);
      canvas.style.left = `${-W / 2}px`;
      canvas.style.top = `${-H / 2}px`;

      const centerPt = projection.pointFromCoords(center);
      const originX = centerPt.x - W / 2;
      const originY = centerPt.y - H / 2;

      // ── 1. 밀도 패스: 알파를 누적한다 ──
      ctx.clearRect(0, 0, W, H);
      let painted = 0;

      for (const spot of spotsRef.current) {
        const pt = projection.pointFromCoords(
          new window.kakao.maps.LatLng(spot.lat, spot.lng),
        );
        const x = pt.x - originX;
        const y = pt.y - originY;
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
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    scheduleRef.current = schedule;

    /*
      첫 장은 곧바로 그린다. rAF는 뒤이은 이벤트를 한 프레임으로 묶는 용도일 뿐인데,
      백그라운드 탭에서는 rAF가 아예 돌지 않아 첫 장까지 rAF에 맡기면 영영 비어 있게 된다.
    */
    paint();
    window.kakao.maps.event.addListener(map, 'idle', schedule);
    window.kakao.maps.event.addListener(map, 'zoom_changed', schedule);

    /*
      지도 노드가 자리를 잡는 순간(첫 레이아웃)과 창 크기가 바뀔 때 다시 그린다.
      idle은 지도를 움직여야만 오므로, 이것이 없으면 첫 프레임에 크기가 0이었을 때
      영영 다시 그리지 않는다.
    */
    const node = map.getNode?.();
    const ro = node ? new ResizeObserver(schedule) : null;
    if (node && ro) ro.observe(node);

    // 백그라운드에 있던 탭으로 돌아왔을 때 (그동안 idle도 rAF도 오지 않았다)
    document.addEventListener('visibilitychange', schedule);

    return () => {
      cancelAnimationFrame(frame);
      scheduleRef.current = null;
      ro?.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      window.kakao.maps.event.removeListener(map, 'idle', schedule);
      window.kakao.maps.event.removeListener(map, 'zoom_changed', schedule);
      overlay.setMap(null);
    };
  }, [map, mode, level, isDark]);

  return null;
}

/**
 * 범례가 쓰는 CSS 그라데이션. 히트맵과 같은 램프에서 나오므로
 * 지도 색과 범례 색이 어긋날 수 없다.
 */
export function rampCss(isDark: boolean): string {
  const stops = isDark ? RAMP_DARK : RAMP_LIGHT;
  const parts = Object.keys(stops)
    .map(Number)
    .sort((a, b) => a - b)
    .map((at) => `${stops[at]} ${Math.round(at * 100)}%`);

  return `linear-gradient(to right, ${parts.join(', ')})`;
}
