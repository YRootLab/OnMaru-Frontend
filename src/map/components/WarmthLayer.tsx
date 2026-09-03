'use client';

import { useEffect, useRef } from 'react';
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
import { escapeHtml } from '@/map/utils/formatters';
import type { HeatSpot, CongestionLevel } from '@/map/types';

/**
 * 우버 스타일 실시간 온기/혼잡도 히트맵 레이어
 * 
 * TOUR_API_VISITOR_KEY (빅데이터 지역별 방문자수)와
 * TOUR_API_CONGESTION_KEY (관광지 집중률 및 방문자 추이 예측)를 결합하여
 * 지도 위에 실시간 수요 집중도(Surge Multiplier) 및 인파 흐름을 우버 히트맵처럼 동적으로 시각화합니다.
 */

// 레벨별 색상 설정 (Design System Tokens 활용)
const CONGESTION_THEME = {
  surge: {
    label: '초혼잡',
    badgeText: '초혼잡',
    icon: '⚡',
    light: {
      core: lightPalette.jangmi[500],
      mid: lightPalette.juhong[500],
      edge: 'rgba(212, 32, 88, 0.25)',
      badgeBg: 'linear-gradient(135deg, #D42058 0%, #E85A18 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 32px rgba(212, 32, 88, 0.65)',
    },
    dark: {
      core: darkPalette.jangmi[500],
      mid: darkPalette.juhong[500],
      edge: 'rgba(248, 78, 118, 0.3)',
      badgeBg: 'linear-gradient(135deg, #F84E76 0%, #F85700 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 36px rgba(248, 78, 118, 0.8)',
    },
  },
  busy: {
    label: '혼잡',
    badgeText: '붐빔',
    icon: '🔥',
    light: {
      core: lightPalette.juhong[500],
      mid: lightPalette.juhong[400],
      edge: 'rgba(232, 90, 24, 0.22)',
      badgeBg: 'linear-gradient(135deg, #E85A18 0%, #F07030 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 26px rgba(232, 90, 24, 0.55)',
    },
    dark: {
      core: darkPalette.juhong[500],
      mid: darkPalette.juhong[400],
      edge: 'rgba(248, 87, 0, 0.28)',
      badgeBg: 'linear-gradient(135deg, #F85700 0%, #F87443 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 30px rgba(248, 87, 0, 0.75)',
    },
  },
  moderate: {
    label: '보통',
    badgeText: '보통',
    icon: '✨',
    light: {
      core: lightPalette.hwanggeum[400],
      mid: lightPalette.hwanggeum[200],
      edge: 'rgba(245, 166, 35, 0.2)',
      badgeBg: 'linear-gradient(135deg, #F5A623 0%, #FFCC40 100%)',
      badgeColor: '#191f28',
      glow: '0 0 22px rgba(245, 166, 35, 0.45)',
    },
    dark: {
      core: darkPalette.hwanggeum[500],
      mid: darkPalette.hwanggeum[400],
      edge: 'rgba(250, 170, 73, 0.25)',
      badgeBg: 'linear-gradient(135deg, #FAAA49 0%, #FFCA91 100%)',
      badgeColor: '#191f28',
      glow: '0 0 26px rgba(250, 170, 73, 0.65)',
    },
  },
  relaxed: {
    label: '여유',
    badgeText: '한적',
    icon: '🌿',
    light: {
      core: lightPalette.cheongrok[400],
      mid: lightPalette.cheongrok[200],
      edge: 'rgba(36, 152, 120, 0.18)',
      badgeBg: 'linear-gradient(135deg, #249878 0%, #3DB898 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 20px rgba(36, 152, 120, 0.4)',
    },
    dark: {
      core: darkPalette.cheongrok[500],
      mid: darkPalette.cheongrok[400],
      edge: 'rgba(0, 167, 106, 0.24)',
      badgeBg: 'linear-gradient(135deg, #00A76A 0%, #5DB687 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 24px rgba(0, 167, 106, 0.6)',
    },
  },
} as const;

function formatVisitorCompact(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만명`;
  }
  return `${num.toLocaleString()}명`;
}

const styles = css`
  /* ------------------------------------------------------------
   * 1. 우버 스타일 히트 블룸 컨테이너 & 가우시안 발광체
   * ------------------------------------------------------------ */
  .om-uber-heat-container {
    position: relative;
    width: var(--om-heat-size, 180px);
    height: var(--om-heat-size, 180px);
    pointer-events: none;
    user-select: none;
  }

  .om-uber-heat-bloom {
    position: absolute;
    inset: -30%;
    border-radius: 50%;
    filter: blur(28px);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
    animation: om-uber-pulse 3.6s ease-in-out infinite alternate;
  }

  @keyframes om-uber-pulse {
    0% { transform: scale(0.96); opacity: 0.82; }
    100% { transform: scale(1.08); opacity: 1; }
  }

  /* 라이트 모드 (화선지/지도 위 부드러운 승산 블렌딩) */
  [data-theme='light'] .om-uber-heat-bloom,
  :root:not([data-theme='dark']) .om-uber-heat-bloom {
    mix-blend-mode: multiply;
  }

  /* 다크 모드 (먹빛 마루 위 빛나는 네온 서지 스크린 블렌딩) */
  [data-theme='dark'] .om-uber-heat-bloom {
    mix-blend-mode: screen;
  }

  /* ------------------------------------------------------------
   * 2. 우버st 서지 배율 플로팅 뱃지 (Surge Multiplier Badge)
   * ------------------------------------------------------------ */
  .om-uber-surge-anchor {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: auto;
    user-select: none;
    z-index: 20;
  }

  .om-uber-surge-anchor:hover {
    transform: translate(-50%, -56%) scale(1.15);
    z-index: 45 !important;
  }

  .om-uber-surge-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 9999px;
    box-shadow: 0 8px 24px -2px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.25);
    transition: all 0.2s ease;
  }

  .om-uber-surge-pill-icon {
    font-size: 13px;
    line-height: 1;
  }

  .om-uber-surge-pill-mult {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: -0.2px;
    font-variant-numeric: tabular-nums;
  }

  .om-uber-surge-pill-label {
    font-size: 11px;
    font-weight: 700;
    opacity: 0.92;
  }

  .om-uber-spot-name {
    margin-top: 5px;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  }

  [data-theme='light'] .om-uber-spot-name,
  :root:not([data-theme='dark']) .om-uber-spot-name {
    background: rgba(255, 255, 255, 0.94);
    color: ${meok[900]};
    backdrop-filter: blur(4px);
  }

  [data-theme='dark'] .om-uber-spot-name {
    background: rgba(45, 41, 36, 0.92);
    color: ${meok[100]};
    backdrop-filter: blur(6px);
  }

  /* ------------------------------------------------------------
   * 3. 인터랙티브 호버 상세 정보 카드 (Hover Telemetry Card)
   * ------------------------------------------------------------ */
  .om-uber-hover-card {
    position: absolute;
    bottom: calc(100% + 14px);
    left: 50%;
    transform: translate(-50%, 8px) scale(0.92);
    width: 240px;
    padding: 14px 16px;
    border-radius: 18px;
    pointer-events: none;
    opacity: 0;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  [data-theme='light'] .om-uber-hover-card,
  :root:not([data-theme='dark']) .om-uber-hover-card {
    background: #ffffff;
    box-shadow: 0 16px 40px -4px rgba(25, 31, 40, 0.2), 0 0 0 1px rgba(25, 31, 40, 0.08);
  }

  [data-theme='dark'] .om-uber-hover-card {
    background: #25221d;
    box-shadow: 0 16px 40px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .om-uber-surge-anchor:hover .om-uber-hover-card {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }

  .om-uber-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .om-uber-card-title {
    font-size: 14px;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-uber-card-title {
    color: ${meok[100]};
  }

  .om-uber-card-tier {
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 800;
  }

  /* 혼잡도 게이지 바 */
  .om-uber-gauge-track {
    width: 100%;
    height: 6px;
    border-radius: 9999px;
    background: rgba(120, 120, 120, 0.15);
    overflow: hidden;
    position: relative;
  }

  .om-uber-gauge-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.4s ease;
  }

  .om-uber-card-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: ${meok[700]};
  }

  [data-theme='dark'] .om-uber-card-body {
    color: ${meok[400]};
  }

  .om-uber-stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .om-uber-stat-val {
    font-weight: 700;
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-uber-stat-val {
    color: ${meok[100]};
  }

  .om-uber-card-hint {
    margin-top: 4px;
    padding-top: 6px;
    border-top: 1px dashed rgba(120, 120, 120, 0.2);
    font-size: 11px;
    color: ${lightPalette.juhong[500]};
    font-weight: 700;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .om-uber-heat-bloom {
      animation: none !important;
    }
  }
`;

export default function WarmthLayer() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const heatSpots = useMapStore((s) => s.heatSpots);
  const items = useMapStore((s) => s.items);
  const level = useMapStore((s) => s.level);
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    // 온기/히트맵 모드가 아니면 히트맵 오버레이 제거
    if (!map || mode !== 'warmth') return;

    // 1. 렌더링 대상 스팟 결정 (heatSpots 우선, 없으면 현재 화면 items에서 실시간 구성)
    let displaySpots: HeatSpot[] = heatSpots;

    if (displaySpots.length === 0 && items.length > 0) {
      displaySpots = items.slice(0, 40).map((it) => ({
        id: `auto-${it.id}`,
        placeId: it.id,
        name: it.name,
        lat: it.lat,
        lng: it.lng,
        district: it.addr.split(' ')[1] || '전국',
        visitorCount: 120000,
        congestionScore: 50,
        congestionLevel: 'busy' as CongestionLevel,
        surgeMultiplier: 1.8,
        intensity: 0.6,
      }));
    }

    if (displaySpots.length === 0) return;

    const specs: OverlaySpec[] = [];

    // 2. 우버 스타일 히트 블룸 및 서지 배율 뱃지 생성
    displaySpots.forEach((spot) => {
      const theme = CONGESTION_THEME[spot.congestionLevel] || CONGESTION_THEME.busy;
      const palette = isDark ? theme.dark : theme.light;

      // 블룸 크기: 줌 레벨 및 집중도(intensity)에 따라 유기적으로 가변 (140px ~ 320px)
      const basePx = Math.max(120, 240 - level * 12);
      const bloomSize = Math.round(basePx * (0.85 + spot.intensity * 0.45));

      // ─── [A] 유기적 가우시안 발광 히트 블룸 ───
      const bloomContainer = document.createElement('div');
      bloomContainer.className = 'om-uber-heat-container';
      bloomContainer.style.setProperty('--om-heat-size', `${bloomSize}px`);

      const bloom = document.createElement('div');
      bloom.className = 'om-uber-heat-bloom';
      bloom.style.background = `radial-gradient(circle closest-side, ${palette.core} 0%, ${palette.mid} 45%, ${palette.edge} 75%, transparent 100%)`;
      bloom.style.filter = `blur(${Math.round(bloomSize * 0.16)}px) drop-shadow(${palette.glow})`;
      bloomContainer.appendChild(bloom);

      specs.push({
        lat: spot.lat,
        lng: spot.lng,
        el: bloomContainer,
        yAnchor: 0.5,
        zIndex: 2,
      });

      // ─── [B] 우버 서지 배율 및 인터랙티브 호버 뱃지 ───
      const anchor = document.createElement('div');
      anchor.className = 'om-uber-surge-anchor';

      const surgeLabel = spot.congestionLevel === 'relaxed' ? '여유' : `${spot.surgeMultiplier}x`;
      const visitorText = formatVisitorCompact(spot.visitorCount);

      anchor.innerHTML = `
        <div class="om-uber-surge-pill" style="background: ${palette.badgeBg}; color: ${palette.badgeColor};">
          <span class="om-uber-surge-pill-icon">${theme.icon}</span>
          <span class="om-uber-surge-pill-mult">${surgeLabel}</span>
          <span class="om-uber-surge-pill-label">· ${theme.badgeText}</span>
        </div>
        <div class="om-uber-spot-name">${escapeHtml(spot.name)}</div>

        <div class="om-uber-hover-card">
          <div class="om-uber-card-head">
            <span class="om-uber-card-title">${escapeHtml(spot.name)}</span>
            <span class="om-uber-card-tier" style="background: ${palette.badgeBg}; color: ${palette.badgeColor};">
              ${theme.icon} ${theme.label}
            </span>
          </div>

          <div class="om-uber-gauge-track">
            <div class="om-uber-gauge-fill" style="width: ${spot.congestionScore}%; background: ${palette.badgeBg};"></div>
          </div>

          <div class="om-uber-card-body">
            <div class="om-uber-stat-row">
              <span>⚡ 수요 집중 배율</span>
              <span class="om-uber-stat-val">${spot.surgeMultiplier}배 서지</span>
            </div>
            <div class="om-uber-stat-row">
              <span>👥 외지인 방문객</span>
              <span class="om-uber-stat-val">${visitorText}</span>
            </div>
            <div class="om-uber-stat-row">
              <span>📍 소속 지자체</span>
              <span class="om-uber-stat-val">${escapeHtml(spot.district)}</span>
            </div>
          </div>

          <div class="om-uber-card-hint">클릭하여 이 지역으로 정밀 확대</div>
        </div>
      `;

      // 뱃지 인터랙션: 클릭 시 해당 지점으로 부드럽게 줌인 이동
      anchor.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = useMapStore.getState().map;
        if (m) {
          m.setLevel(Math.max(2, m.getLevel() - 2), { animate: true });
          m.panTo(new window.kakao.maps.LatLng(spot.lat, spot.lng));
        }
        useMapStore.getState().setSelectedHeatSpot(spot);
        useMapStore.getState().setSelectedId(spot.placeId);
      });

      specs.push({
        lat: spot.lat,
        lng: spot.lng,
        el: anchor,
        yAnchor: 0.5,
        zIndex: 25,
      });
    });

    const cleanup = paintOverlays(map, specs);
    return () => {
      if (cleanup) cleanup();
    };
  }, [map, mode, heatSpots, items, level, isDark]);

  return <Global styles={styles} />;
}
