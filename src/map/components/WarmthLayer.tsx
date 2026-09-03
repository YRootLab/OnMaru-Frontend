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
 * 실시간 온기/혼잡도 히트맵 레이어 (스마트 클러스터링 및 충돌 방지)
 * 
 * TOUR_API_VISITOR_KEY & TOUR_API_CONGESTION_KEY 기반
 * 권역별 수요 집중도 뱃지, 지능형 방향 팝오버, 유기적 가우시안 발광 블룸 제공.
 */

const CONGESTION_CONFIG = {
  surge: {
    label: '초혼잡',
    icon: '⚡',
    light: {
      core: lightPalette.jangmi[500],
      mid: lightPalette.juhong[500],
      edge: 'rgba(212, 32, 88, 0.22)',
      badgeBg: 'linear-gradient(135deg, #D42058 0%, #E85A18 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 28px rgba(212, 32, 88, 0.6)',
    },
    dark: {
      core: darkPalette.jangmi[500],
      mid: darkPalette.juhong[500],
      edge: 'rgba(248, 78, 118, 0.28)',
      badgeBg: 'linear-gradient(135deg, #F84E76 0%, #F85700 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 32px rgba(248, 78, 118, 0.75)',
    },
  },
  busy: {
    label: '혼잡',
    icon: '🔥',
    light: {
      core: lightPalette.juhong[500],
      mid: lightPalette.juhong[400],
      edge: 'rgba(232, 90, 24, 0.2)',
      badgeBg: 'linear-gradient(135deg, #E85A18 0%, #F07030 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 24px rgba(232, 90, 24, 0.5)',
    },
    dark: {
      core: darkPalette.juhong[500],
      mid: darkPalette.juhong[400],
      edge: 'rgba(248, 87, 0, 0.25)',
      badgeBg: 'linear-gradient(135deg, #F85700 0%, #F87443 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 28px rgba(248, 87, 0, 0.7)',
    },
  },
  moderate: {
    label: '보통',
    icon: '✨',
    light: {
      core: lightPalette.hwanggeum[400],
      mid: lightPalette.hwanggeum[200],
      edge: 'rgba(245, 166, 35, 0.18)',
      badgeBg: 'linear-gradient(135deg, #F5A623 0%, #FFCC40 100%)',
      badgeColor: '#191f28',
      glow: '0 0 20px rgba(245, 166, 35, 0.4)',
    },
    dark: {
      core: darkPalette.hwanggeum[500],
      mid: darkPalette.hwanggeum[400],
      edge: 'rgba(250, 170, 73, 0.22)',
      badgeBg: 'linear-gradient(135deg, #FAAA49 0%, #FFCA91 100%)',
      badgeColor: '#191f28',
      glow: '0 0 24px rgba(250, 170, 73, 0.6)',
    },
  },
  relaxed: {
    label: '여유',
    icon: '🌿',
    light: {
      core: lightPalette.cheongrok[400],
      mid: lightPalette.cheongrok[200],
      edge: 'rgba(36, 152, 120, 0.16)',
      badgeBg: 'linear-gradient(135deg, #249878 0%, #3DB898 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 18px rgba(36, 152, 120, 0.35)',
    },
    dark: {
      core: darkPalette.cheongrok[500],
      mid: darkPalette.cheongrok[400],
      edge: 'rgba(0, 167, 106, 0.2)',
      badgeBg: 'linear-gradient(135deg, #00A76A 0%, #5DB687 100%)',
      badgeColor: '#ffffff',
      glow: '0 0 22px rgba(0, 167, 106, 0.55)',
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
   * 1. 발광 히트 블룸
   * ------------------------------------------------------------ */
  .om-heat-container {
    position: relative;
    width: var(--om-heat-size, 160px);
    height: var(--om-heat-size, 160px);
    pointer-events: none;
    user-select: none;
  }

  .om-heat-bloom {
    position: absolute;
    inset: -25%;
    border-radius: 50%;
    filter: blur(24px);
    transition: transform 0.35s ease, opacity 0.35s ease;
    animation: om-heat-breathing 4s ease-in-out infinite alternate;
    opacity: 0.78;
  }

  [data-theme='dark'] .om-heat-bloom {
    opacity: 0.88;
  }

  /* ------------------------------------------------------------
   * 2. 권역별 수요 집중도 알약 뱃지
   * ------------------------------------------------------------ */
  .om-surge-pill-wrap {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -50%);
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    z-index: 15;
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .om-surge-pill-wrap:hover {
    transform: translate(-50%, -52%) scale(1.1);
    z-index: 50 !important;
  }

  .om-surge-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 12px 0 10px;
    border-radius: 9999px;
    box-shadow: 0 6px 18px -2px rgba(0, 0, 0, 0.28), 0 0 0 1.5px rgba(255, 255, 255, 0.4);
    transition: all 0.18s ease;
  }

  .om-surge-pill-icon {
    font-size: 13px;
    line-height: 1;
  }

  .om-surge-pill-text {
    font-size: 12.5px;
    font-weight: 800;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }

  .om-surge-pill-name {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.94;
    white-space: nowrap;
  }

  /* ------------------------------------------------------------
   * 3. 지능형 호버 상세 카드 (Smart Directed Popover)
   * ------------------------------------------------------------ */
  .om-surge-popover {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 6px) scale(0.94);
    width: 230px;
    padding: 13px 15px;
    border-radius: 16px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  /* 상단 배치 (기본) */
  .om-surge-popover.dir-top {
    bottom: calc(100% + 10px);
    transform: translate(-50%, 6px) scale(0.94);
  }

  /* 하단 배치 (화면 상단 영역 침범 방지) */
  .om-surge-popover.dir-bottom {
    top: calc(100% + 10px);
    transform: translate(-50%, -6px) scale(0.94);
  }

  [data-theme='light'] .om-surge-popover,
  :root:not([data-theme='dark']) .om-surge-popover {
    background: #ffffff;
    box-shadow: 0 14px 36px -4px rgba(25, 31, 40, 0.22), 0 0 0 1px rgba(25, 31, 40, 0.08);
  }

  [data-theme='dark'] .om-surge-popover {
    background: #25221d;
    box-shadow: 0 14px 36px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
  }

  .om-surge-pill-wrap:hover .om-surge-popover {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }

  /* 꼬리 화살표 */
  .om-surge-popover.dir-top::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #ffffff;
  }

  [data-theme='dark'] .om-surge-popover.dir-top::after {
    border-top-color: #25221d;
  }

  .om-surge-popover.dir-bottom::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: #ffffff;
  }

  [data-theme='dark'] .om-surge-popover.dir-bottom::after {
    border-bottom-color: #25221d;
  }

  .om-popover-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .om-popover-title {
    font-size: 13.5px;
    font-weight: 800;
    color: ${meok[900]};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-theme='dark'] .om-popover-title {
    color: ${meok[100]};
  }

  .om-popover-tier {
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 800;
  }

  .om-popover-gauge {
    width: 100%;
    height: 5px;
    border-radius: 9999px;
    background: rgba(120, 120, 120, 0.15);
    overflow: hidden;
  }

  .om-popover-gauge-bar {
    height: 100%;
    border-radius: 9999px;
  }

  .om-popover-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 11.5px;
    color: ${meok[700]};
  }

  [data-theme='dark'] .om-popover-body {
    color: ${meok[400]};
  }

  .om-popover-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .om-popover-val {
    font-weight: 700;
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-popover-val {
    color: ${meok[100]};
  }

  .om-popover-hint {
    margin-top: 3px;
    padding-top: 5px;
    border-top: 1px dashed rgba(120, 120, 120, 0.18);
    font-size: 10.5px;
    color: ${lightPalette.juhong[500]};
    font-weight: 700;
    text-align: center;
  }

  @media (prefers-reduced-motion: reduce) {
    .om-heat-bloom {
      animation: none !important;
    }
  }
`;

interface ClusteredHeatSpot {
  key: string;
  lat: number;
  lng: number;
  name: string;
  count: number;
  district: string;
  visitorCount: number;
  congestionScore: number;
  congestionLevel: CongestionLevel;
  surgeMultiplier: number;
  intensity: number;
  primarySpot: HeatSpot;
}

export default function WarmthLayer() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const heatSpots = useMapStore((s) => s.heatSpots);
  const items = useMapStore((s) => s.items);
  const level = useMapStore((s) => s.level);
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  useEffect(() => {
    if (!map || mode !== 'warmth') return;

    // 1. 기초 스팟 데이터 확보 (heatSpots 우선, 없을 시 장소/온기 데이터로 폴백)
    let baseList: HeatSpot[] = heatSpots;
    if (baseList.length === 0) {
      const warmths = useMapStore.getState().warmths;
      const candidates = items.length > 0 ? items : warmths;
      if (candidates.length > 0) {
        baseList = (candidates as any[]).slice(0, 40).map((it) => {
          const name = it.name || it.placeName || '해당 권역 일대';
          const addr = (it.addr || '').replace(/일대/g, '').trim();
          const parts = addr.split(/\s+/);
          const district = parts[1] || parts[0] || '전국';
          const dong = parts[2] || '';
          const zoneName = dong ? `${district} ${dong} 일대` : `${district} 일대`;

          return {
            id: `auto-${it.id}`,
            placeId: it.placeId || it.id,
            name: zoneName !== '전국 일대' ? zoneName : `${name} 일대`,
            lat: it.lat,
            lng: it.lng,
            district,
            visitorCount: 110000,
            congestionScore: 45,
            congestionLevel: 'moderate' as CongestionLevel,
            surgeMultiplier: 1.5,
            intensity: 0.5,
          };
        });
      }
    }

    if (baseList.length === 0) return;

    // 2. 화면 안 겹침 방지 스마트 클러스터링 (Smart Distance Clustering)
    // 줌 레벨에 따라 화면 상에서 65px 이내에 위치한 스팟들을 단일 거점 뱃지로 병합
    const projection = map.getProjection?.();
    const clusters: ClusteredHeatSpot[] = [];
    const used = new Set<string>();

    const getScreenDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      if (!projection) return 9999;
      const p1 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat1, lng1));
      const p2 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat2, lng2));
      return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    };

    baseList.forEach((spot, i) => {
      if (used.has(spot.id)) return;

      const group: HeatSpot[] = [spot];
      used.add(spot.id);

      // 주변 거리(px) 이내 스팟 탐색 및 병합
      // 확대 레벨(level <= 4)에서는 30px 이내만 병합하여 골목마다의 스팟들이 사라지지 않도록 보호
      const clusterThreshold = level <= 4 ? 30 : level <= 6 ? 45 : 65;

      for (let j = i + 1; j < baseList.length; j++) {
        const other = baseList[j];
        if (used.has(other.id)) continue;
        const dPx = getScreenDistance(spot.lat, spot.lng, other.lat, other.lng);
        if (dPx < clusterThreshold) {
          group.push(other);
          used.add(other.id);
        }
      }

      const count = group.length;
      const sumLat = group.reduce((acc, it) => acc + it.lat, 0);
      const sumLng = group.reduce((acc, it) => acc + it.lng, 0);
      const totalVisitors = group.reduce((acc, it) => acc + it.visitorCount, 0);
      const maxSurge = Math.max(...group.map((it) => it.surgeMultiplier));
      const maxScore = Math.max(...group.map((it) => it.congestionScore));

      // 그룹 내 가장 혼잡도가 높은 스팟의 레벨을 대표 레벨로 채택
      const rankOrder: Record<CongestionLevel, number> = { surge: 4, busy: 3, moderate: 2, relaxed: 1 };
      const dominantLevel = group.reduce((best, it) =>
        rankOrder[it.congestionLevel] > rankOrder[best] ? it.congestionLevel : best,
        group[0].congestionLevel,
      );

      const displayName =
        count === 1
          ? spot.name
          : `${spot.district || spot.name} 일대 (${count}곳)`;

      clusters.push({
        key: `cluster-${spot.id}-${count}`,
        lat: sumLat / count,
        lng: sumLng / count,
        name: displayName,
        count,
        district: spot.district,
        visitorCount: totalVisitors,
        congestionScore: maxScore,
        congestionLevel: dominantLevel,
        surgeMultiplier: maxSurge,
        intensity: Math.min(1, Math.max(0.25, maxScore / 100)),
        primarySpot: group[0],
      });
    });

    const specs: OverlaySpec[] = [];

    // 3. 발광 히트 블룸 및 지능형 팝오버 뱃지 렌더링
    clusters.forEach((item) => {
      const cfg = CONGESTION_CONFIG[item.congestionLevel] || CONGESTION_CONFIG.moderate;
      const pal = isDark ? cfg.dark : cfg.light;

      // 블룸 크기: 줌 레벨과 강도에 맞추어 유기적으로 조절
      // 확대할수록(level이 작아질수록) 주변 골목과 건물에 부드럽고 따뜻하게 퍼지도록 확장
      const basePx = Math.max(160, 360 - level * 18);
      const bloomSize = Math.round(basePx * (0.85 + item.intensity * 0.45));

      // ─── [A] 유기적 가우시안 발광 블룸 ───
      const bloomWrap = document.createElement('div');
      bloomWrap.className = 'om-heat-container';
      bloomWrap.style.setProperty('--om-heat-size', `${bloomSize}px`);

      const bloom = document.createElement('div');
      bloom.className = 'om-heat-bloom';
      bloom.style.background = `radial-gradient(circle closest-side, ${pal.core} 0%, ${pal.mid} 45%, ${pal.edge} 75%, transparent 100%)`;
      bloom.style.filter = `blur(${Math.round(bloomSize * 0.16)}px) drop-shadow(${pal.glow})`;
      bloomWrap.appendChild(bloom);

      specs.push({
        lat: item.lat,
        lng: item.lng,
        el: bloomWrap,
        yAnchor: 0.5,
        zIndex: 2,
      });

      // ─── [B] 권역별 수요 집중도 뱃지 및 지능형 방향 팝오버 ───
      const pillWrap = document.createElement('div');
      pillWrap.className = 'om-surge-pill-wrap';

      // 화면 상단 여백 계산 (화면 Y좌표가 160px 미만이면 아래로 팝오버 오픈)
      let popoverDir = 'dir-top';
      if (projection) {
        const screenPt = projection.pointFromCoords(new window.kakao.maps.LatLng(item.lat, item.lng));
        if (screenPt && screenPt.y < 160) {
          popoverDir = 'dir-bottom';
        }
      }

      const surgeLabel = item.congestionLevel === 'relaxed' ? '여유 1.0x' : `${item.surgeMultiplier}x`;
      const visitorText = formatVisitorCompact(item.visitorCount);

      pillWrap.innerHTML = `
        <div class="om-surge-pill" style="background: ${pal.badgeBg}; color: ${pal.badgeColor};">
          <span class="om-surge-pill-icon">${cfg.icon}</span>
          <span class="om-surge-pill-text">${surgeLabel}</span>
          <span class="om-surge-pill-name">· ${escapeHtml(item.district || '권역')}</span>
        </div>

        <div class="om-surge-popover ${popoverDir}">
          <div class="om-popover-head">
            <span class="om-popover-title">${escapeHtml(item.name)}</span>
            <span class="om-popover-tier" style="background: ${pal.badgeBg}; color: ${pal.badgeColor};">
              ${cfg.icon} ${cfg.label}
            </span>
          </div>

          <div class="om-popover-gauge">
            <div class="om-popover-gauge-bar" style="width: ${item.congestionScore}%; background: ${pal.badgeBg};"></div>
          </div>

          <div class="om-popover-body">
            <div class="om-popover-row">
              <span>⚡ 관광객 집중률</span>
              <span class="om-popover-val">${item.surgeMultiplier}배 (${cfg.label})</span>
            </div>
            <div class="om-popover-row">
              <span>👥 외지인 방문객</span>
              <span class="om-popover-val">${visitorText}</span>
            </div>
            <div class="om-popover-row">
              <span>📍 소속 권역</span>
              <span class="om-popover-val">${escapeHtml(item.district || '전국')}</span>
            </div>
          </div>

          <div class="om-popover-hint">클릭하여 이 지역으로 확대</div>
        </div>
      `;

      // 클릭 시 해당 지점으로 카메라 줌인 이동
      pillWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = useMapStore.getState().map;
        if (m) {
          m.setLevel(Math.max(2, m.getLevel() - 2), { animate: true });
          m.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
        }
        useMapStore.getState().setSelectedHeatSpot(item.primarySpot);
        useMapStore.getState().setSelectedId(item.primarySpot.placeId);
      });

      specs.push({
        lat: item.lat,
        lng: item.lng,
        el: pillWrap,
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
