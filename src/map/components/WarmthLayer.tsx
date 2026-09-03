'use client';

import { useEffect } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Global, css } from '@emotion/react';
import {
  lightPalette,
  darkPalette,
  meok,
  surface,
} from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { paintOverlays, type OverlaySpec } from '@/map/hooks/overlay';
import { useMapStore } from '@/map/hooks/useMapStore';
import { clusterWarmth, filterWarmth, isHelpful, toggleHelpful } from '@/map/warmth/warmthRepo';
import { bandOf, bandSwatch, filterByPeriod, heatPaint, moodStatOf, MOOD_BANDS } from "@/map/warmth/heatScale";
import { escapeHtml } from '@/map/utils/formatters';
import type { WarmthFilter } from '@/map/types';

/** 이 레벨 이하로 확대하면 히트맵 위에 상세 말풍선(Bud)도 함께 띄운다. */
const BUBBLE_MAX_LEVEL = 4;

/** 개별 온기를 점으로 찍는 최대 개수. 그 이상은 히트맵이 대신 말해준다. */
const SCATTER_LIMIT = 60;

/**
 * blob 지름 한계(px).
 *
 * 기본은 격자 한 칸의 실제 화면 크기에서 계산한다. 아래 값은 그 결과가
 * 점처럼 작아지거나 화면을 뒤덮지 않도록 잡아두는 안전선이다.
 */
const HEAT_BASE_SIZE = 120;
const HEAT_MIN_SIZE = 90;
const HEAT_MAX_SIZE = 360;

/** clusterWarmth가 쓰는 격자 크기(도)와 같은 식. blob 지름을 여기서 되짚는다. */
const cellSpanDegrees = (level: number) => 0.0015 * 2 ** Math.max(0, level - 3);

const styles = css`
  /* ------------------------------------------------------------
   * 1. 우버st 상시 지속 다층 서지(Surge) 히트맵 레이어 (확대/축소 무관 상시 표시)
   * ------------------------------------------------------------ */
  .om-heat-container {
    position: relative;
    width: var(--om-heat-size);
    height: var(--om-heat-size);
    pointer-events: none;
    user-select: none;
  }

  /* 부드러운 유기적 다중 컬러 스탑 히트 그라데이션 (가우시안 확산) */
  .om-heat-bloom {
    position: absolute;
    inset: -25%;
    border-radius: 50%;
    filter: blur(24px);
    transition: transform 0.35s ease, opacity 0.35s ease;
  }

  /* 라이트 모드: 화선지/지도 위 부드러운 곱하기(multiply) 블렌딩 */
  [data-theme='light'] .om-heat-bloom,
  :root:not([data-theme='dark']) .om-heat-bloom {
    mix-blend-mode: multiply;
    background: radial-gradient(
      circle closest-side,
      var(--om-core-color, rgba(232, 90, 24, 0.75)) 0%,
      var(--om-mid-color, rgba(245, 166, 35, 0.52)) 40%,
      var(--om-fringe-color, rgba(255, 204, 64, 0.26)) 68%,
      rgba(255, 255, 255, 0) 92%
    );
  }

  /* 다크 모드: 먹빛 마루 위 빛나는 네온 서지(screen) 블렌딩 */
  [data-theme='dark'] .om-heat-bloom {
    mix-blend-mode: screen;
    background: radial-gradient(
      circle closest-side,
      var(--om-core-color, rgba(248, 87, 0, 0.88)) 0%,
      var(--om-mid-color, rgba(248, 78, 118, 0.58)) 42%,
      var(--om-fringe-color, rgba(250, 170, 73, 0.28)) 70%,
      rgba(0, 0, 0, 0) 94%
    );
    filter: blur(28px) drop-shadow(0 0 24px var(--om-core-color, rgba(248, 87, 0, 0.45)));
  }

  /* ------------------------------------------------------------
   * 2. 우버st 마이크로 액티비티 스캐터 도트 (Scatter Activity Dots)
   * ------------------------------------------------------------ */
  .om-scatter-dot {
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
  }

  /*
    누르는 판은 24px, 보이는 점은 10px.
    9px 타깃은 모바일에서 사실상 누를 수 없었는데, 이게 개별 온기를 여는
    유일한 수단이었다. 점을 키우면 히트맵을 가리므로 판만 넓힌다.
  */
  .om-scatter-dot::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 24px;
    height: 24px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
  }

  /* 점 색도 분위기를 따른다 — 히트맵과 같은 축이어야 읽힌다. */
  .om-scatter-dot[data-mood='북적'] {
    background: ${lightPalette.juhong[500]};
  }

  .om-scatter-dot[data-mood='한적'] {
    background: ${lightPalette.cheongrok[500]};
  }

  [data-theme='dark'] .om-scatter-dot[data-mood='북적'] {
    background: ${darkPalette.juhong[400]};
  }

  [data-theme='dark'] .om-scatter-dot[data-mood='한적'] {
    background: ${darkPalette.cheongrok[400]};
  }

  .om-scatter-dot:hover,
  .om-scatter-dot:focus-visible {
    transform: scale(1.6);
    z-index: 25 !important;
  }

  .om-scatter-dot:focus-visible,
  .om-surge-card:focus-visible,
  .om-bud:focus-visible {
    outline: 3px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.9);
    z-index: 45 !important;
  }

  /* 미세 펄스 링 */
  .om-scatter-dot::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: inherit;
    opacity: 0.4;
    animation: om-scatter-pulse 2.2s ease-out infinite;
  }

  @keyframes om-scatter-pulse {
    0% { transform: scale(0.8); opacity: 0.6; }
    50% { transform: scale(1.8); opacity: 0.15; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  /* ------------------------------------------------------------
   * 3. 우버st 서지 거점 뱃지 & 장소명 라벨 (Surge Place Badge)
   * ------------------------------------------------------------ */
  /* ------------------------------------------------------------
   * 3. 우버st 서지 거점 뱃지 & 장소명 라벨 (Surge Place Badge)
   * ------------------------------------------------------------ */
  .om-surge-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: auto;
    user-select: none;
  }

  .om-surge-card:hover {
    transform: translate(-50%, -54%) scale(1.12);
    z-index: 35 !important;
  }

  /* 서지 뱃지 호버 시 팝업되는 실시간 온기 요약 카드 */
  .om-surge-hover-card {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translate(-50%, 6px) scale(0.9);
    width: 210px;
    padding: 12px 14px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 32px -4px rgba(25, 31, 40, 0.18), 0 0 0 1px rgba(25, 31, 40, 0.06);
    pointer-events: none;
    opacity: 0;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  [data-theme='dark'] .om-surge-hover-card {
    background: #25221d;
    box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .om-surge-card:hover .om-surge-hover-card {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }

  .om-surge-hover-title {
    font-size: 13.5px;
    font-weight: 700;
    color: ${meok[900]};
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  [data-theme='dark'] .om-surge-hover-title {
    color: ${meok[100]};
  }

  .om-surge-hover-mood-badge {
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(78, 89, 104, 0.08);
    color: ${meok[700]};
  }

  [data-theme='dark'] .om-surge-hover-mood-badge {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[400]};
  }

  .om-surge-hover-text {
    font-size: 12px;
    line-height: 1.45;
    color: ${meok[700]};
    margin: 0;
    background: rgba(25, 31, 40, 0.03);
    padding: 6px 8px;
    border-radius: 8px;
  }

  [data-theme='dark'] .om-surge-hover-text {
    color: ${meok[400]};
    background: rgba(255, 255, 255, 0.04);
  }

  .om-surge-hover-footer {
    font-size: 11px;
    color: ${lightPalette.juhong[500]};
    font-weight: 600;
    text-align: right;
  }

  /* 원형 서지 뱃지 */
  .om-surge-badge {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .om-surge-badge svg {
    width: 20px;
    height: 20px;
    color: #ffffff;
    stroke-width: 2.2;
  }

  /* 서지 온기 개수 카운트 뱃지 */
  .om-surge-count {
    position: absolute;
    top: -3px;
    right: -5px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: 9999px;
    background: #ffffff;
    font-size: 10px;
    font-weight: 800;
    line-height: 14px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  [data-theme='dark'] .om-surge-count {
    background: ${surface.dark.card};
  }

  /* 서지 장소 라벨 */
  .om-surge-label {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
    text-align: center;
    transition: all 0.2s ease;
  }

  [data-theme='light'] .om-surge-label,
  :root:not([data-theme='dark']) .om-surge-label {
    color: ${meok[900]};
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(4px);
    text-shadow: 0 0 3px #ffffff;
  }

  [data-theme='dark'] .om-surge-label {
    color: ${meok[100]};
    background: rgba(45, 41, 36, 0.9);
    backdrop-filter: blur(6px);
  }

  /* ------------------------------------------------------------
   * 4. 줌인 상세 한줄평 말풍선 (Detail Warmth Bud)
   * ------------------------------------------------------------ */
  .om-bud {
    position: relative;
    max-width: 230px;
    padding: 10px 14px;
    border-radius: 16px;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    backdrop-filter: blur(16px);
    user-select: none;
    pointer-events: auto;
  }

  [data-theme='light'] .om-bud,
  :root:not([data-theme='dark']) .om-bud {
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 6px 20px -2px rgba(25, 31, 40, 0.16), 0 0 0 1px rgba(25, 31, 40, 0.05);
  }

  [data-theme='dark'] .om-bud {
    background: rgba(45, 41, 36, 0.95);
    box-shadow: 0 6px 20px -2px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .om-bud:hover {
    transform: translateY(-4px) scale(1.04);
    z-index: 40 !important;
  }

  .om-bud::after {
    content: '';
    position: absolute;
    left: 24px;
    top: 100%;
    border: 6px solid transparent;
  }

  [data-theme='light'] .om-bud::after,
  :root:not([data-theme='dark']) .om-bud::after {
    border-top-color: #ffffff;
  }

  [data-theme='dark'] .om-bud::after {
    border-top-color: ${surface.dark.card};
  }

  .om-bud-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 5px;
  }

  .om-bud-title {
    font-size: 12.5px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-theme='light'] .om-bud-title,
  :root:not([data-theme='dark']) .om-bud-title {
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-bud-title {
    color: ${meok[100]};
  }

  .om-bud-head-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .om-bud-mood {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
  }

  [data-theme='light'] .om-bud-mood,
  :root:not([data-theme='dark']) .om-bud-mood {
    background: rgba(78, 89, 104, 0.08);
    color: ${meok[700]};
  }

  [data-theme='dark'] .om-bud-mood {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[400]};
  }

  .om-bud-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1.5px 6px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    border: none;
    cursor: pointer;
    background: rgba(232, 90, 24, 0.12);
    color: ${lightPalette.juhong[500]};
    transition: all 0.15s ease;
  }

  .om-bud-nav-btn:hover {
    background: ${lightPalette.juhong[500]};
    color: #ffffff;
    transform: scale(1.08);
  }

  .om-bud-nav-btn:active {
    transform: scale(0.92);
  }

  .om-bud-text {
    margin: 0;
    font-size: 12.5px;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.2s ease;
  }

  [data-theme='light'] .om-bud-text,
  :root:not([data-theme='dark']) .om-bud-text {
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-bud-text {
    color: ${meok[200]};
  }

  .om-bud[data-mine='true'] {
    outline: 2px solid ${lightPalette.juhong[500]};
  }

  [data-theme='dark'] .om-bud[data-mine='true'] {
    outline: 2px solid ${darkPalette.juhong[400]};
  }

  .om-bud-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 6px;
    padding-top: 5px;
    border-top: 1px solid rgba(78, 89, 104, 0.08);
  }

  [data-theme='dark'] .om-bud-footer {
    border-top-color: rgba(255, 255, 255, 0.08);
  }

  .om-bud-react-btn {
    display: inline-flex;
    align-items: center;
    gap: 3.5px;
    padding: 2.5px 8px;
    border-radius: 9999px;
    border: none;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    background: rgba(232, 90, 24, 0.08);
    color: ${lightPalette.juhong[500]};
    transition: all 0.15s ease;
  }

  .om-bud-react-btn:hover {
    background: rgba(232, 90, 24, 0.16);
    transform: scale(1.05);
  }

  .om-bud-react-btn.active {
    background: ${lightPalette.juhong[500]};
    color: #ffffff;
  }

  /* ------------------------------------------------------------
   * 모션 최소화
   *
   * 스캐터 펄스는 최대 60개가 동시에 도는 애니메이션이라 가장 먼저 꺼야 한다.
   * 말풍선 자동 회전은 자바스크립트 쪽에서 함께 멈춘다.
   * ------------------------------------------------------------ */
  @media (prefers-reduced-motion: reduce) {
    .om-scatter-dot,
    .om-surge-card,
    .om-heat-bloom,
    .om-bud {
      transition: none !important;
      animation: none !important;
    }

    .om-scatter-dot::after {
      animation: none !important;
      opacity: 0.25;
    }
  }
`;

// 우버 서지 아이콘 SVG (단청 온기 / 불꽃 형태)
const SVG_WARMTH_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
</svg>
`;

export default function WarmthLayer() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const warmths = useMapStore((s) => s.warmths);
  const category = useMapStore((s) => s.category);
  const level = useMapStore((s) => s.level);
  const period = useMapStore((s) => s.warmthPeriod);
  const center = useMapStore((s) => s.center);
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!map || mode !== 'warmth' || warmths.length === 0) return;

    const scoped = filterByPeriod(warmths, period);
    const list = filterWarmth(scoped, (category ?? 'all') as WarmthFilter);
    if (list.length === 0) return;

    const select = (placeId: string, lat: number, lng: number) => {
      const store = useMapStore.getState();
      store.setSelectedId(placeId);
      store.map?.panTo(new window.kakao.maps.LatLng(lat, lng));
      if (store.sheetSnap === 'peek') store.setSheetSnap('half');
    };

    const cells = clusterWarmth(list, level);

    /*
      진하기 기준을 '화면 안'에서 잡는다.

      예전에는 전국 최댓값으로 나눴다. 전주만 확대해도 색이 서울 기준에 묶여
      거의 변하지 않았고, 확대할수록 온 화면이 옅어졌다. 지금 보고 있는 영역에서
      가장 두터운 셀을 1로 두면, 어디를 보든 그 안의 농담이 읽힌다.
    */
    const bounds = map.getBounds?.();
    const inView = (lat: number, lng: number) =>
      !bounds || bounds.contain(new window.kakao.maps.LatLng(lat, lng));

    const visibleCells = cells.filter((cell) => inView(cell.lat, cell.lng));
    const busiest = Math.max(...(visibleCells.length ? visibleCells : cells).map((c) => c.count), 1);

    const specs: OverlaySpec[] = [];

    // ─────────────────────────────────────────────────────────────
    // [1] 분위기 히트맵
    //
    //   색   — 북적(주홍) ↔ 반반(황금) ↔ 한적(청록)
    //   진하기 — 그 자리에 쌓인 온기 수 (화면 안 최댓값 기준)
    //   크기  — 격자 한 칸의 실제 지리 범위. 줌을 따라간다.
    //
    // 예전에는 색·크기가 둘 다 '개수' 하나에서 나왔다. 그건 유명한 곳을 칠하는
    // 것이지 온기를 보여주는 게 아니다. 온기가 가진 축(mood)을 색으로 올린다.
    // ─────────────────────────────────────────────────────────────
    cells.forEach((cell) => {
      const stat = moodStatOf(cell.items);
      if (stat.ratio === null) return;

      const strength = cell.count / busiest;
      const paint = heatPaint(stat.ratio, strength, isDark);

      /*
        blob 지름을 격자 한 칸의 화면 크기에서 뽑는다.
        예전에는 110 + count*24 px 고정이라 확대하면 열기가 쪼그라들어
        "이 일대가 이런 분위기"라는 뜻이 사라졌다.
      */
      const projection = map.getProjection?.();
      let size = HEAT_BASE_SIZE;

      if (projection) {
        const half = cellSpanDegrees(level) / 2;
        const a = projection.containerPointFromCoords(
          new window.kakao.maps.LatLng(cell.lat - half, cell.lng - half),
        );
        const b = projection.containerPointFromCoords(
          new window.kakao.maps.LatLng(cell.lat + half, cell.lng + half),
        );
        size = Math.abs(b.x - a.x);
      }

      // 온기가 두터울수록 조금 더 번지게 두되, 셀 범위에서 크게 벗어나지 않는다.
      size = Math.max(HEAT_MIN_SIZE, Math.min(HEAT_MAX_SIZE, size * (1 + strength * 0.35)));

      const el = document.createElement('div');
      el.className = 'om-heat-container';
      el.dataset.band = paint.band;
      el.style.setProperty('--om-heat-size', `${Math.round(size)}px`);
      el.style.setProperty('--om-core-color', paint.core);
      el.style.setProperty('--om-mid-color', paint.mid);
      el.style.setProperty('--om-fringe-color', paint.fringe);

      const bloom = document.createElement('div');
      bloom.className = 'om-heat-bloom';
      el.appendChild(bloom);

      specs.push({
        lat: cell.lat,
        lng: cell.lng,
        el,
        yAnchor: 0.5,
        zIndex: 1,
      });
    });

    // ─────────────────────────────────────────────────────────────
    // [2] 우버 스타일 마이크로 액티비티 스캐터 도트 (Scatter Activity Dots)
    // ─────────────────────────────────────────────────────────────
    list.slice(0, SCATTER_LIMIT).forEach((w) => {
      const el = document.createElement('div');
      el.className = 'om-scatter-dot';
      el.dataset.mood = w.mood;

      /*
        점 자체는 9px이지만 누르는 판은 24px이다 (::before).
        9px 타깃은 모바일에서 사실상 누를 수 없었다 — 온기 하나를 여는
        유일한 수단인데도 그랬다.
      */
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `${w.placeName}, ${w.mood}. ${w.text}`);

      const open = () => select(w.placeId, w.lat, w.lng);
      el.addEventListener('click', open);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

      specs.push({
        lat: w.lat,
        lng: w.lng,
        el,
        yAnchor: 0.5,
        zIndex: 5,
      });
    });

    const timers: NodeJS.Timeout[] = [];

    // ─────────────────────────────────────────────────────────────
    // [3] 줌 레벨에 맞춘 상단 오버레이 (서지 거점 뱃지 vs 상세 한줄평 말풍선)
    // ─────────────────────────────────────────────────────────────
    if (level <= BUBBLE_MAX_LEVEL) {
      // 🌟 상세 줌 (골목길/개별 장소 확대): 동일 장소의 후기를 단일 말풍선(Bud)으로 그룹화하여 넘겨볼 수 있는 캐러셀로 렌더링
      const placeGroups = new Map<string, typeof list>();
      list.forEach((w) => {
        const key = w.placeId || w.placeName || `${w.lat.toFixed(4)}_${w.lng.toFixed(4)}`;
        const group = placeGroups.get(key) || [];
        group.push(w);
        placeGroups.set(key, group);
      });

      placeGroups.forEach((group) => {
        const first = group[0];
        const el = document.createElement('div');
        el.className = 'om-bud';
        const isMine = group.some((w) => w.mine);
        el.dataset.mine = String(isMine);

        let currentIdx = 0;

        const renderBud = () => {
          const w = group[currentIdx];
          const total = group.length;
          const firstLine = (w.text.split('\n')[0] || '').trim();
          const cleanPreview =
            firstLine.includes('. ') && firstLine.length > 30
              ? firstLine.split('. ')[0] + '.'
              : firstLine;

          const pagerHtml =
            total > 1
              ? `<button type="button" class="om-bud-nav-btn" title="다음 온기 이야기 보기 (${currentIdx + 1}/${total})">
                   <span>${currentIdx + 1}/${total} ↻</span>
                 </button>`
              : '';

          const isHelped = isHelpful(w.id);
          const reactHtml = `
            <div class="om-bud-footer">
              <button type="button" class="om-bud-react-btn ${isHelped ? 'active' : ''}" title="따뜻해요 공감 남기기">
                <span>🔥</span>
                <span>${isHelped ? '따뜻해요' : '공감'}</span>
              </button>
            </div>
          `;

          // placeName·text는 사용자가 쓴 값이다. 따옴표 하나로 마크업이 깨졌었다.
          el.innerHTML = `
            <div class="om-bud-head">
              <span class="om-bud-title">${escapeHtml(w.placeName)}</span>
              <div class="om-bud-head-right">
                <span class="om-bud-mood">${escapeHtml(w.mood)}</span>
                ${pagerHtml}
              </div>
            </div>
            <p class="om-bud-text" title="${escapeHtml(w.text)}">${escapeHtml(cleanPreview)}</p>
            ${reactHtml}
          `;

          const navBtn = el.querySelector('.om-bud-nav-btn');
          if (navBtn) {
            navBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              currentIdx = (currentIdx + 1) % total;
              renderBud();
            });
          }

          const reactBtn = el.querySelector('.om-bud-react-btn');
          if (reactBtn) {
            reactBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              toggleHelpful(w.id);
              renderBud();
            });
          }
        };

        renderBud();

        /*
          후기가 여러 개인 장소는 4.5초마다 다음 온기로 넘어간다.

          모션을 줄인 사용자에게는 돌리지 않는다 — 읽는 중에 글이 바뀌는 것은
          장식이 아니라 방해다. 대신 [1/3 ↻] 버튼이 남아 있어 직접 넘길 수 있다.
        */
        if (group.length > 1 && !reduced) {
          const timer = setInterval(() => {
            currentIdx = (currentIdx + 1) % group.length;
            renderBud();
          }, 4500);
          timers.push(timer);

          // 마우스를 올리거나 포커스가 닿으면 멈춘다. 읽는 동안은 그대로 둔다.
          const pause = () => clearInterval(timer);
          el.addEventListener('mouseenter', pause);
          el.addEventListener('focusin', pause);
        }

        el.addEventListener('click', () => {
          select(first.placeId, first.lat, first.lng);
        });

        specs.push({
          lat: first.lat,
          lng: first.lng,
          el,
          zIndex: isMine ? 30 : 20,
          yAnchor: 1.15,
        });
      });
    } else {
      // 🌟 광역 줌 (시/구/동 단위): 서지 거점 뱃지 & 장소명 라벨
      cells.forEach((cell) => {
        const el = document.createElement('div');
        el.className = 'om-surge-card';

        /*
          배지 색도 히트맵과 같은 축을 쓴다 — 분위기.
          예전에는 개수(count/busiest)로 색을 골라서, 배지는 "많이 남겨진 곳"을
          말하고 그 아래 blob은 다른 것을 말하는 상태였다. 둘을 맞춘다.
        */
        const stat = moodStatOf(cell.items);
        const ratio = stat.ratio ?? 0;
        const band = bandOf(ratio);
        const moodLabel = MOOD_BANDS.find((b) => b.id === band)?.label ?? '반반';
        const quietPct = Math.round((1 - ratio) * 100);

        const badgeBg = bandSwatch(band, isDark);
        const badgeColor = isDark ? surface.dark.card : meok[900];

        const firstLine = (cell.latest.text.split('\n')[0] || '').trim();
        const cleanSnippet = firstLine.length > 35 ? firstLine.slice(0, 35) + '...' : firstLine;

        el.innerHTML = `
          <div class="om-surge-badge" style="background: ${badgeBg}">
            ${SVG_WARMTH_ICON}
            <span class="om-surge-count" style="color: ${badgeColor}">${cell.count}</span>
          </div>
          <div class="om-surge-label">${escapeHtml(cell.latest.placeName)}</div>
          <div class="om-surge-hover-card">
            <div class="om-surge-hover-title">
              <span>${escapeHtml(cell.latest.placeName)}</span>
              <span class="om-surge-hover-mood-badge">${moodLabel}</span>
            </div>
            <p class="om-surge-hover-text">"${escapeHtml(cleanSnippet)}"</p>
            <div class="om-surge-hover-footer">온기 ${cell.count}개 · 한적 ${quietPct}% · 북적 ${100 - quietPct}%</div>
          </div>
        `;

        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute(
          'aria-label',
          `${cell.latest.placeName} 일대, 온기 ${cell.count}개, ${moodLabel}. 확대해서 보기`,
        );

        el.addEventListener('click', () => {
          const m = useMapStore.getState().map;
          m?.setLevel(Math.max(1, m.getLevel() - 2), { animate: true });
          m?.panTo(new window.kakao.maps.LatLng(cell.lat, cell.lng));
          select(cell.latest.placeId, cell.lat, cell.lng);
        });

        specs.push({
          lat: cell.lat,
          lng: cell.lng,
          el,
          yAnchor: 0.5,
          zIndex: 12,
        });
      });
    }

    const cleanupOverlays = paintOverlays(map, specs);

    return () => {
      timers.forEach(clearInterval);
      if (cleanupOverlays) cleanupOverlays();
    };
  }, [map, mode, warmths, category, level, period, center, isDark, reduced]);

  return <Global styles={styles} />;
}
