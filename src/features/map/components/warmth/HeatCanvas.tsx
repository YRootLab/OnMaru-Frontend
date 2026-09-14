'use client';

import { useEffect, useRef } from 'react';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import type { HeatSpot } from '@/features/map/types';

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

/*
  밀도(0~255)를 색으로 바꾸는 램프.

  예전에는 밀도 22%까지 완전히 투명했다. '색은 경고, 여백은 추천'이라는 규칙을
  칠하기에까지 밀어붙인 건데, 혼잡도의 바닥값이 0.25라 한적한 권역은 집계가 멀쩡히
  있어도 사실상 안 칠해졌다. 지도에서 빈 곳이 '한적하다'와 '자료가 없다' 두 가지를
  동시에 뜻하게 되니, 보는 사람은 후자로 읽는다.

  그래서 여백은 '집계 없음' 하나만 뜻하게 하고, 집계가 있으면 한적해도 옅게 칠한다.
  '갈 만한 곳'이라는 말은 색이 아니라 뱃지의 편차(−18% 한적)와 요일 패턴이 한다.
  색상은 여전히 하나다 — 무지개로 갈라지지 않고 진하기 하나로만 말한다.
*/
const RAMP_LIGHT: Record<number, string> = {
  0.0: 'rgba(232, 90, 24, 0)', // 집계 없음
  0.05: 'rgba(255, 203, 168, 0.2)', // juhong 100 — 한적해도 있으면 보인다
  0.25: 'rgba(255, 204, 64, 0.34)', // hwanggeum 200
  0.45: 'rgba(245, 166, 35, 0.52)', // hwanggeum 400
  0.65: 'rgba(240, 112, 48, 0.68)', // juhong 400
  0.85: 'rgba(232, 90, 24, 0.84)', // juhong 500
  1.0: 'rgba(160, 58, 10, 0.92)', // juhong 700 — 가장 붐비는 core
};

/** 다크는 먹빛 바닥(#1C1A17) 위라 밀도가 오를수록 밝아져야 한다. */
const RAMP_DARK: Record<number, string> = {
  0.0: 'rgba(151, 49, 0, 0)',
  0.05: 'rgba(151, 49, 0, 0.3)', // juhong 700
  0.25: 'rgba(151, 49, 0, 0.5)',
  0.45: 'rgba(248, 87, 0, 0.62)', // juhong 500
  0.65: 'rgba(250, 170, 73, 0.74)', // hwanggeum 500
  0.85: 'rgba(255, 220, 184, 0.86)', // hwanggeum 200
  1.0: 'rgba(255, 220, 184, 0.94)', // 가장 붐비는 core
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

/*
  커널 하나가 덮는 땅의 반경.

  넓힐수록 확대해도 빈 구간이 안 생기지만, 지나치면 화면이 통째로 물든다.
  여백이 곧 '갈 만한 곳'이라는 이 지도의 규칙이 흐려지므로, 동네 하나가
  아니라 골목 몇 개를 덮는 크기로 잡는다.
*/
const KERNEL_METERS = 350;

/**
 * 커널 반경(px)을 화면이 아니라 땅에서 뽑는다.
 *
 * 예전에는 줌 레벨로 px를 직접 정하고 110px에서 잘랐다. 그러면 확대할수록 얼룩이
 * 땅에 비해 작아진다 — 혼잡도는 시군구 하나에 하나뿐인 값인데 얼룩만 쪼그라드니,
 * 스팟 사이로 들어가면 칠할 것이 하나도 남지 않아 히트맵이 통째로 사라진 것처럼 보였다.
 *
 * 위도 1도는 약 111km다. 그 비례로 KERNEL_METERS가 지금 화면에서 몇 px인지 재면,
 * 확대할수록 얼룩도 땅을 따라 커져서 비는 구간이 생기지 않는다.
 */
function kernelRadiusPx(
  projection: { pointFromCoords: (ll: unknown) => { x: number; y: number } },
  center: { getLat: () => number; getLng: () => number },
): number {
  const degrees = KERNEL_METERS / 111_000;
  const here = projection.pointFromCoords(center);
  const north = projection.pointFromCoords(
    new window.kakao.maps.LatLng(center.getLat() + degrees, center.getLng()),
  );

  /*
    상한이 필요하다. 커널 하나가 칠하는 넓이는 반경의 제곱으로 늘어서,
    720px까지 열어두었더니 스팟 80개에 프레임당 1억 픽셀이 넘어 렌더러가 죽었다.
    300px면 화면 한 뼘을 덮으면서도 비용이 한 자릿수 배로 남는다.
  */
  return Math.min(300, Math.max(40, Math.abs(north.y - here.y)));
}

/** 한 프레임에 찍는 커널 수 상한. 넘치면 붐비는 쪽부터 남긴다. */
const MAX_KERNELS = 160;

/* ------------------------------------------------------------
 * 시군구 행정경계
 *
 * 혼잡도는 시군구 하나에 하나뿐인 값이니, 칠해야 할 모양도 그 시군구의 실제 경계다.
 * 예전에는 한옥들이 퍼진 범위로 원을 그려 근사했는데, 그러면 '왜 중구가 동그랗냐'는
 * 질문에 답할 수가 없다. 경계를 그대로 칠하면 색이 가리키는 땅과 값이 나온 땅이 같아진다.
 *
 * 데이터는 public/data/districts.json (scripts/build-districts.mjs가 만든다).
 * 온기 모드에 처음 들어올 때 한 번만 받는다 — 정보 모드만 쓰는 사람은 내려받지 않는다.
 * ------------------------------------------------------------ */

interface DistrictFeature {
  name: string;
  code: string;
  /** [minLng, minLat, maxLng, maxLat] — 포함 검사를 대부분 여기서 쳐낸다. */
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
        // 경계를 못 받아도 지도는 돌아가야 한다 — 아래에서 원형 커널로 물러난다.
        console.warn('시군구 경계 데이터를 불러오지 못했습니다. 원형 근사로 그립니다.', err);
        return [];
      });
  }

  return districtsPromise;
}

/** 광선 교차법. 링 위의 점이 정확히 걸리는 경우는 시군구 규모에서 문제가 되지 않는다. */
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

/**
 * 좌표가 어느 시군구 안에 있는지 찾는다.
 *
 * 이름이나 코드로 맞추지 않는 이유가 있다. '중구'는 전국에 여섯 곳이고,
 * 데이터랩과 통계청은 코드 체계도 다르다(전북 45 대 52). 좌표는 그런 사정이 없다.
 */
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

/**
 * 같은 좌표를 다시 묻지 않는다.
 * 스팟 목록은 날짜를 문지를 때마다 새로 만들어지지만 좌표는 그대로라,
 * 캐시가 없으면 드래그 한 번에 포함 검사를 수천 번 되풀이하게 된다.
 */
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
  const warmthViewTypeRef = useRef(warmthViewType);

  /*
    스팟 목록은 ref로 넘긴다. 날짜 스크러버를 드래그하면 목록이 프레임마다 새로
    오는데, 그때마다 아래 이펙트가 다시 돌면 오버레이를 지웠다 만들기를 반복한다.
    오버레이는 한 번만 만들고, 목록이 바뀌면 다시 칠하기만 한다.
  */
  const spotsRef = useRef(spots);
  const scheduleRef = useRef<(() => void) | null>(null);
  const districtsRef = useRef<DistrictFeature[]>([]);
  // 투영된 경계 경로. 지도가 움직이면 통째로 버린다.
  const pathCacheRef = useRef<{ key: string; paths: Map<DistrictFeature, Path2D> }>({
    key: '',
    paths: new Map(),
  });

  // 뷰 모드(행정구역 경계 vs 순수 원형 히트맵)가 바뀌면 다시 칠한다.
  useEffect(() => {
    warmthViewTypeRef.current = warmthViewType;
    scheduleRef.current?.();
  }, [warmthViewType]);

  // 경계 데이터는 온기 모드에 들어올 때 한 번만 받고, 도착하면 다시 칠한다.
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

      // 홀더의 좌상단이 지도 중심이다. 캔버스를 그 절반만큼 끌어올려 중심에 맞춘다.
      const center = map.getCenter();
      overlay.setPosition(center);
      canvas.style.left = `${-W / 2}px`;
      canvas.style.top = `${-H / 2}px`;

      const centerPt = projection.pointFromCoords(center);
      const originX = centerPt.x - W / 2;
      const originY = centerPt.y - H / 2;

      /*
        ── 1. 밀도 패스: 권역 하나에 커널 하나 ──

        예전에는 스팟마다 커널을 찍었다. 그러면 한옥이 서른 곳 모인 구는 커널이 서른 번
        겹쳐 새까매지고, 두 곳뿐인 구는 옅게 남는다 — 혼잡도 점수가 똑같은데도 그렇다.
        색이 '얼마나 붐비나'와 '한옥이 몇 개인가'를 섞어 말한 셈이고, 축소할수록
        스팟이 한 점에 몰려 과포화가 심해졌다(팀에서 '너무 진하다'고 한 그 증상이다).

        혼잡도는 시군구에 하나뿐인 값이니 칠하기도 한 번이면 된다.
        그러면 진하기는 오직 혼잡도만 뜻하고, 줌을 바꿔도 같은 날은 같은 진하기로 남는다.
      */
      ctx.clearRect(0, 0, W, H);

      const baseRadius = kernelRadiusPx(projection, center);
      const features = districtsRef.current;

      const project = (lng: number, lat: number) => {
        const pt = projection.pointFromCoords(new window.kakao.maps.LatLng(lat, lng));
        return { x: pt.x - originX, y: pt.y - originY };
      };

      /*
        스팟을 경계 안으로 넣는다. 같은 시군구에 여러 스팟이 있어도 한 번만 칠하고,
        진하기는 그 권역의 혼잡도 하나에서 온다.
        경계를 못 찾은 스팟(섬·해안·데이터 밖)은 원형 커널로 남긴다.
      */
      // 지도가 움직였으면 투영해둔 경로는 못 쓴다.
      const viewKey = `${level}_${Math.round(originX)}_${Math.round(originY)}_${W}x${H}`;
      if (pathCacheRef.current.key !== viewKey) {
        pathCacheRef.current = { key: viewKey, paths: new Map() };
      }
      const pathCache = pathCacheRef.current.paths;

      const filled = new Map<DistrictFeature, number>();
      const loose: { x: number; y: number; weight: number }[] = [];

      for (const spot of spotsRef.current) {
        const weight = Math.min(1, Math.max(0.12, spot.intensity));
        const feature = features.length > 0 ? lookupDistrict(features, spot.lng, spot.lat) : null;

        if (feature) {
          filled.set(feature, Math.max(filled.get(feature) ?? 0, weight));
          continue;
        }

        const { x, y } = project(spot.lng, spot.lat);
        loose.push({ x, y, weight });
      }

      let painted = 0;

      if (warmthViewTypeRef.current === 'heatmap') {
        // ── [초기 버전] 순수 원형 밀도 히트맵 (행정 경계선 없는 부드러운 방사형 가우시안 훈기) ──
        const radius = Math.min(220, Math.max(52, Math.round(baseRadius * 1.55)));
        for (const spot of spotsRef.current) {
          if (painted >= MAX_KERNELS) break;
          const { x, y } = project(spot.lng, spot.lat);
          if (
            x < -radius ||
            y < -radius ||
            x > W + radius ||
            y > H + radius
          ) {
            continue;
          }

          const weight = Math.min(1, Math.max(0.18, spot.intensity));
          stampKernel(ctx, x, y, radius, weight);
          painted += 1;
        }
      } else {
        // ── [행정구역 버전] 시·군·구 행정 경계(districts.json) 폴리곤 채색 ──
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';

        for (const [feature, weight] of filled) {
          const min = project(feature.bbox[0], feature.bbox[3]);
          const max = project(feature.bbox[2], feature.bbox[1]);
          // 화면 밖 권역은 좌표를 옮기지도 않는다 — 전국에는 250개가 있다.
          if (max.x < 0 || max.y < 0 || min.x > W || min.y > H) continue;

          /*
            투영한 경로는 지도가 움직이기 전까지 그대로다.
            날짜를 재생하면 170ms마다 다시 칠하는데, 그때마다 좌표 수만 개를 다시
            투영할 이유가 없다 — 바뀌는 것은 알파뿐이다.
          */
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

          /*
            권역이 화면보다 커지면 면을 물린다.

            확대해 한 구 안에 들어가면 그 구가 화면을 통째로 덮는데, 그때 경계선은
            이미 화면 밖이라 형태는 아무 정보도 주지 못하면서 색만 짙게 남는다.
            값은 뱃지가 말하고 있으니, 여기서는 지도가 읽히는 쪽을 택한다.
          */
          const cover = (Math.abs(max.x - min.x) * Math.abs(max.y - min.y)) / (W * H);
          const damp = cover > 1 ? Math.max(0.4, 1 / Math.sqrt(cover)) : 1;

          ctx.globalAlpha = weight * damp;
          ctx.fill(path);

          /*
            테두리를 면보다 한 칸 진하게 얹는다.

            평평한 면은 지형 타일 위에서 묽어 보인다. 커널은 가운데가 진해서 저절로
            형태가 잡혔지만 채우기는 그렇지 않다. 경계를 쓰기로 한 이상 경계가 읽혀야
            하므로 가장자리를 살린다 — 알파만 올리므로 색은 같은 램프에서 나온다.
            색 하나로만 말한다는 규칙은 그대로다.
          */
          ctx.globalAlpha = Math.min(1, weight + 0.22);
          ctx.stroke(path);

          painted += 1;
        }

        // ── 경계 밖 스팟은 예전 방식대로 ──
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

          stampKernel(ctx, spot.x, spot.y, radius, spot.weight);
          painted += 1;
        }
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
