'use client';

import { useEffect } from 'react';
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
import { clusterWarmth, filterWarmth } from '@/map/warmth/warmthRepo';
import type { WarmthFilter } from '@/map/types';

/** 이 레벨 이하로 확대하면 히트맵 위에 상세 말풍선(Bud)도 함께 띄운다. */
const BUBBLE_MAX_LEVEL = 4;

/** 우버st 히트맵 기본 블롭 크기 */
const HEAT_BASE_SIZE = 110;
const HEAT_STEP_SIZE = 24;
const HEAT_MAX_SIZE = 320;

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
    width: 9px;
    height: 9px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
  }

  [data-theme='light'] .om-scatter-dot,
  :root:not([data-theme='dark']) .om-scatter-dot {
    background: ${lightPalette.juhong[500]};

  }

  [data-theme='dark'] .om-scatter-dot {
    background: ${darkPalette.juhong[400]};

  }

  .om-scatter-dot:hover {
    transform: scale(1.6);
    z-index: 25 !important;
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
    background: ${lightPalette.juhong[50]};
    color: ${lightPalette.juhong[700]};
  }

  [data-theme='dark'] .om-surge-hover-mood-badge {
    background: rgba(232, 90, 24, 0.2);
    color: ${darkPalette.juhong[200]};
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
    max-width: 220px;
    padding: 10px 14px;
    border-radius: 14px;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    backdrop-filter: blur(12px);
    user-select: none;
  }

  [data-theme='light'] .om-bud,
  :root:not([data-theme='dark']) .om-bud {
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 4px 16px -2px rgba(25, 31, 40, 0.12), 0 0 0 1px rgba(25, 31, 40, 0.04);
  }

  [data-theme='dark'] .om-bud {
    background: rgba(45, 41, 36, 0.95);
    box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .om-bud:hover {
    transform: translateY(-4px) scale(1.04);
    z-index: 35 !important;
  }

  .om-bud::after {
    content: '';
    position: absolute;
    left: 20px;
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
    font-size: 11.5px;
    font-weight: 700;
  }

  [data-theme='light'] .om-bud-head,
  :root:not([data-theme='dark']) .om-bud-head {
    color: ${lightPalette.juhong[500]};
  }

  [data-theme='dark'] .om-bud-head {
    color: ${darkPalette.juhong[400]};
  }

  .om-bud-mood {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
  }

  [data-theme='light'] .om-bud-mood,
  :root:not([data-theme='dark']) .om-bud-mood {
    background: ${lightPalette.juhong[50]};
    color: ${lightPalette.juhong[700]};
  }

  [data-theme='dark'] .om-bud-mood {
    background: ${darkPalette.juhong[900]};
    color: ${darkPalette.juhong[200]};
  }

  .om-bud-text {
    margin: 0;
    font-size: 12.5px;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-theme='light'] .om-bud-text,
  :root:not([data-theme='dark']) .om-bud-text {
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-bud-text {
    color: ${meok[100]};
  }

  .om-bud[data-mine='true'] {
    outline: 2px solid ${lightPalette.juhong[500]};
  }

  [data-theme='dark'] .om-bud[data-mine='true'] {
    outline: 2px solid ${darkPalette.juhong[400]};
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
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    if (!map || mode !== 'warmth' || warmths.length === 0) return;

    const list = filterWarmth(warmths, (category ?? 'all') as WarmthFilter);
    if (list.length === 0) return;

    const select = (placeId: string, lat: number, lng: number) => {
      const store = useMapStore.getState();
      store.setSelectedId(placeId);
      store.map?.panTo(new window.kakao.maps.LatLng(lat, lng));
      if (store.sheetSnap === 'peek') store.setSheetSnap('half');
    };

    const cells = clusterWarmth(list, level);
    const busiest = Math.max(...cells.map((c) => c.count), 1);
    const specs: OverlaySpec[] = [];

    // ─────────────────────────────────────────────────────────────
    // [1] 우버 스타일 다층 히트맵 블룸 (확대/축소 상관없이 모든 줌 레벨 상시 유지!)
    // ─────────────────────────────────────────────────────────────
    cells.forEach((cell) => {
      const ratio = cell.count / busiest; // 0.0 ~ 1.0
      // 줌 레벨이 확대될 때도 길거리/골목길 위에 넓게 번지는 유기적 열기를 유지하도록 스케일 보정
      const zoomMultiplier = level <= 2 ? 1.5 : level <= 4 ? 1.25 : 1.0;
      const size = Math.min(HEAT_MAX_SIZE, (HEAT_BASE_SIZE + cell.count * HEAT_STEP_SIZE) * zoomMultiplier);

      const el = document.createElement('div');
      el.className = 'om-heat-container';
      el.style.setProperty('--om-heat-size', `${size}px`);

      // 밀집도 및 다크/라이트 모드에 따른 컬러 램프 정의
      let coreColor: string;
      let midColor: string;
      let fringeColor: string;

      if (isDark) {
        if (ratio >= 0.6) {
          // 피크 핫스팟 (진한 다크단청 주홍 ~ 연지 핑크)
          coreColor = `rgba(248, 87, 0, ${0.78 + 0.18 * ratio})`;
          midColor = `rgba(248, 78, 118, ${0.52 + 0.18 * ratio})`;
          fringeColor = `rgba(250, 170, 73, 0.28)`;
        } else if (ratio >= 0.3) {
          // 미드 웜 (황금 ~ 주홍)
          coreColor = `rgba(248, 116, 67, ${0.68 + 0.14 * ratio})`;
          midColor = `rgba(250, 170, 73, 0.48)`;
          fringeColor = `rgba(0, 167, 106, 0.22)`;
        } else {
          // 주변부 (소프트 청록 ~ 황금)
          coreColor = `rgba(250, 170, 73, 0.52)`;
          midColor = `rgba(0, 167, 106, 0.32)`;
          fringeColor = `rgba(0, 167, 106, 0.14)`;
        }
      } else {
        if (ratio >= 0.6) {
          // 피크 핫스팟 (선명한 단청 주홍 ~ 장미)
          coreColor = `rgba(232, 90, 24, ${0.75 + 0.18 * ratio})`;
          midColor = `rgba(212, 32, 88, ${0.5 + 0.18 * ratio})`;
          fringeColor = `rgba(245, 166, 35, 0.35)`;
        } else if (ratio >= 0.3) {
          // 미드 웜 (황금 기와 ~ 주홍)
          coreColor = `rgba(240, 112, 48, ${0.6 + 0.14 * ratio})`;
          midColor = `rgba(245, 166, 35, 0.48)`;
          fringeColor = `rgba(61, 184, 152, 0.26)`;
        } else {
          // 주변부 (소프트 연두청록 ~ 황금)
          coreColor = `rgba(245, 166, 35, 0.48)`;
          midColor = `rgba(61, 184, 152, 0.3)`;
          fringeColor = `rgba(144, 212, 192, 0.16)`;
        }
      }

      el.style.setProperty('--om-core-color', coreColor);
      el.style.setProperty('--om-mid-color', midColor);
      el.style.setProperty('--om-fringe-color', fringeColor);

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
    list.slice(0, 60).forEach((w) => {
      const el = document.createElement('div');
      el.className = 'om-scatter-dot';
      el.title = `${w.placeName}: ${w.text}`;
      el.addEventListener('click', () => {
        select(w.placeId, w.lat, w.lng);
      });

      specs.push({
        lat: w.lat,
        lng: w.lng,
        el,
        yAnchor: 0.5,
        zIndex: 5,
      });
    });

    // ─────────────────────────────────────────────────────────────
    // [3] 줌 레벨에 맞춘 상단 오버레이 (서지 거점 뱃지 vs 상세 한줄평 말풍선)
    // ─────────────────────────────────────────────────────────────
    if (level <= BUBBLE_MAX_LEVEL) {
      // 🌟 상세 줌 (골목길/개별 장소 확대): 히트맵 배경 위에 말풍선(Bud)이 함께 플로팅!
      list.slice(0, 40).forEach((w) => {
        const el = document.createElement('div');
        el.className = 'om-bud';
        el.dataset.mine = String(Boolean(w.mine));

        // 좋아요 평/후기의 첫 번째 줄(문장) 추출
        const firstLine = (w.text.split('\n')[0] || '').trim();
        const cleanPreview = firstLine.includes('. ') && firstLine.length > 30
          ? firstLine.split('. ')[0] + '.'
          : firstLine;

        el.innerHTML =
          `<div class="om-bud-head">` +
          `<span>${w.placeName}</span>` +
          `<span class="om-bud-mood">${w.mood}</span>` +
          `</div>` +
          `<p class="om-bud-text" title="${w.text}">${cleanPreview}</p>`;
        el.addEventListener('click', () => select(w.placeId, w.lat, w.lng));

        specs.push({
          lat: w.lat,
          lng: w.lng,
          el,
          zIndex: w.mine ? 30 : 20,
          yAnchor: 1.15,
        });
      });
    } else {
      // 🌟 광역 줌 (시/구/동 단위): 서지 거점 뱃지 & 장소명 라벨
      cells.forEach((cell) => {
        const ratio = cell.count / busiest;
        const el = document.createElement('div');
        el.className = 'om-surge-card';

        // 뱃지 배경색 결정 (우버 서지 3단계: 다홍/크림슨 > 황금/주황 > 청록)
        let badgeBg: string;
        let badgeColor: string;

        if (isDark) {
          if (ratio >= 0.55) {
            badgeBg = darkPalette.juhong[500];
            badgeColor = darkPalette.juhong[200];
          } else if (ratio >= 0.25) {
            badgeBg = darkPalette.hwanggeum[500];
            badgeColor = darkPalette.hwanggeum[200];
          } else {
            badgeBg = darkPalette.cheongrok[500];
            badgeColor = darkPalette.cheongrok[200];
          }
        } else {
          if (ratio >= 0.55) {
            badgeBg = lightPalette.juhong[500];
            badgeColor = lightPalette.juhong[700];
          } else if (ratio >= 0.25) {
            badgeBg = lightPalette.hwanggeum[400];
            badgeColor = lightPalette.hwanggeum[700];
          } else {
            badgeBg = lightPalette.cheongrok[500];
            badgeColor = lightPalette.cheongrok[700];
          }
        }

        const firstLine = (cell.latest.text.split('\n')[0] || '').trim();
        const cleanSnippet = firstLine.length > 35 ? firstLine.slice(0, 35) + '...' : firstLine;

        el.innerHTML = `
          <div class="om-surge-badge" style="background: ${badgeBg}">
            ${SVG_WARMTH_ICON}
            <span class="om-surge-count" style="color: ${badgeColor}">${cell.count}</span>
          </div>
          <div class="om-surge-label">${cell.latest.placeName}</div>
          <div class="om-surge-hover-card">
            <div class="om-surge-hover-title">
              <span>${cell.latest.placeName}</span>
              <span class="om-surge-hover-mood-badge">${cell.latest.mood}</span>
            </div>
            <p class="om-surge-hover-text">"${cleanSnippet}"</p>
            <div class="om-surge-hover-footer">총 ${cell.count}개의 온기 기록 · 클릭하여 보기 ➔</div>
          </div>
        `;

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

    return paintOverlays(map, specs);
  }, [map, mode, warmths, category, level, isDark]);

  return <Global styles={styles} />;
}
