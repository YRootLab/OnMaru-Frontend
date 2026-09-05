'use client';

import { useEffect, useMemo } from 'react';
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
import HeatCanvas from './warmth/HeatCanvas';

/**
 * 실시간 온기/발길 훈기(薰氣) 레이어
 * 
 * 한옥 마을과 고택 일대에 머무는 사람들의 따스한 정(情)과 발길의 기척을
 * 은은한 호롱불/등불 훈기 블룸과 단아한 한지(창호지) 뱃지로 시각화합니다.
 */

const GOTHIC_FONT = "'Pretendard', 'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

const ICONS = {
  sparkles: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
  flame: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  sun: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  wind: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7A2.5 2.5 0 1 1 20 12H2"/><path d="M15.5 16.5A2.5 2.5 0 1 0 18 19H2"/><path d="M12.5 3.5A2.5 2.5 0 1 1 15 6H2"/></svg>`,
  mapPin: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  users: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

const CONGESTION_CONFIG = {
  surge: {
    label: '북적이는 정',
    subLabel: '사람과 온기가 모인 활기',
    badgeText: '온기 가득',
    iconSvg: ICONS.sparkles,
    light: {
      badgeBg: surface.light.card,
      badgeColor: meok[900],
      accentColor: lightPalette.juhong[500],
      tagBg: lightPalette.juhong[500],
      tagColor: surface.light.card,
    },
    dark: {
      badgeBg: surface.dark.surface,
      badgeColor: meok[100],
      accentColor: darkPalette.juhong[400],
      tagBg: darkPalette.juhong[500],
      tagColor: meok[100],
    },
  },
  busy: {
    label: '따스한 온기',
    subLabel: '발길이 이어지는 훈기',
    badgeText: '따스한 정',
    iconSvg: ICONS.flame,
    light: {
      badgeBg: surface.light.card,
      badgeColor: meok[900],
      accentColor: lightPalette.hwanggeum[500],
      tagBg: lightPalette.hwanggeum[500],
      tagColor: surface.light.card,
    },
    dark: {
      badgeBg: surface.dark.surface,
      badgeColor: meok[100],
      accentColor: darkPalette.hwanggeum[400],
      tagBg: darkPalette.hwanggeum[500],
      tagColor: meok[100],
    },
  },
  moderate: {
    label: '은은한 볕뉘',
    subLabel: '햇살 드는 평온한 쉼',
    badgeText: '은은한 볕',
    iconSvg: ICONS.sun,
    light: {
      badgeBg: surface.light.card,
      badgeColor: meok[900],
      accentColor: lightPalette.hwanggeum[400],
      tagBg: lightPalette.hwanggeum[400],
      tagColor: meok[900],
    },
    dark: {
      badgeBg: surface.dark.surface,
      badgeColor: meok[100],
      accentColor: darkPalette.hwanggeum[400],
      tagBg: darkPalette.hwanggeum[400],
      tagColor: meok[900],
    },
  },
  relaxed: {
    label: '고즈넉한 쉼',
    subLabel: '바람 소리 벗 삼는 고요',
    badgeText: '고즈넉한 쉼',
    iconSvg: ICONS.wind,
    light: {
      badgeBg: surface.light.card,
      badgeColor: meok[900],
      accentColor: lightPalette.cheongrok[500],
      tagBg: lightPalette.cheongrok[500],
      tagColor: surface.light.card,
    },
    dark: {
      badgeBg: surface.dark.surface,
      badgeColor: meok[100],
      accentColor: darkPalette.cheongrok[400],
      tagBg: darkPalette.cheongrok[500],
      tagColor: meok[100],
    },
  },
} as const;

function formatVisitorCompact(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만 걸음`;
  }
  return `${num.toLocaleString()}걸음`;
}

const styles = css`
  /* ------------------------------------------------------------
   * 한지(창호지) 감성의 단아한 발길 훈기 뱃지
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
    transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .om-surge-pill-wrap:hover {
    transform: translate(-50%, -54%) scale(1.08);
    z-index: 50 !important;
  }

  .om-surge-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 13px 0 10px;
    border-radius: 9999px;
    border: none;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 18px -2px rgba(25, 31, 40, 0.16), 0 1px 3px rgba(0, 0, 0, 0.08);
    font-family: ${GOTHIC_FONT};
    transition: all 0.2s ease;
  }

  .om-surge-pill-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    line-height: 1;
  }

  .om-surge-pill-text {
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }

  .om-surge-pill-name {
    font-size: 12px;
    font-weight: 500;
    opacity: 0.85;
    white-space: nowrap;
  }

  /* ------------------------------------------------------------
   * 3. 한옥 서화첩 스타일의 지능형 정취 카드 (Directed Popover)
   * ------------------------------------------------------------ */
  .om-surge-popover {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 6px) scale(0.94);
    width: 240px;
    padding: 14px 16px;
    border-radius: 18px;
    border: none;
    opacity: 0;
    pointer-events: none;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 100;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: ${GOTHIC_FONT};
  }

  /* 상단 배치 (기본) */
  .om-surge-popover.dir-top {
    bottom: calc(100% + 10px);
    transform: translate(-50%, 6px) scale(0.94);
  }

  /* 하단 배치 (화면 상단 침범 방지) */
  .om-surge-popover.dir-bottom {
    top: calc(100% + 10px);
    transform: translate(-50%, -6px) scale(0.94);
  }

  [data-theme='light'] .om-surge-popover,
  :root:not([data-theme='dark']) .om-surge-popover {
    background: ${surface.light.card};
    box-shadow: 0 16px 40px -4px rgba(0, 0, 0, 0.16);
  }

  [data-theme='dark'] .om-surge-popover {
    background: ${surface.dark.surface};
    box-shadow: 0 16px 40px -4px rgba(0, 0, 0, 0.75);
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
    border-top-color: ${surface.light.card};
  }

  [data-theme='dark'] .om-surge-popover.dir-top::after {
    border-top-color: ${surface.dark.surface};
  }

  .om-surge-popover.dir-bottom::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-bottom-color: ${surface.light.card};
  }

  [data-theme='dark'] .om-surge-popover.dir-bottom::after {
    border-bottom-color: ${surface.dark.surface};
  }

  .om-popover-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .om-popover-title {
    font-size: 14px;
    font-weight: 700;
    color: ${meok[900]};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-theme='dark'] .om-popover-title {
    color: ${meok[100]};
  }

  .om-popover-tier {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }

  .om-popover-gauge {
    width: 100%;
    height: 4px;
    border-radius: 9999px;
    background: rgba(120, 120, 120, 0.15);
    overflow: hidden;
  }

  .om-popover-gauge-bar {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.3s ease;
  }

  .om-popover-body {
    display: flex;
    flex-direction: column;
    gap: 5px;
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

  .om-row-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .om-popover-val {
    font-weight: 600;
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-popover-val {
    color: ${meok[100]};
  }

  .om-popover-hint {
    margin-top: 4px;
    padding: 6px 8px;
    border-radius: 8px;
    background: rgba(120, 120, 120, 0.08);
    font-size: 10.5px;
    color: ${lightPalette.juhong[500]};
    font-weight: 600;
    text-align: center;
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

  /*
    히트맵과 뱃지가 같은 스팟 목록을 본다.
    heatSpots가 비면 화면에 잡힌 장소·온기 데이터로 폴백한다.
  */
  const baseList = useMemo<HeatSpot[]>(() => {
    let list: HeatSpot[] = heatSpots;
    if (list.length === 0) {
      const warmths = useMapStore.getState().warmths;
      const candidates = items.length > 0 ? items : warmths;
      if (candidates.length > 0) {
        list = (candidates as any[]).slice(0, 40).map((it) => {
          const placeName = it.name || it.placeName || '';
          const addr = (it.addr || '').replace(/일대/g, '').trim();
          const parts = addr.split(/\s+/);
          const district = parts[1] || parts[0] || '전국';
          const dong = parts[2] || '';
          const zoneName = dong ? `${district} ${dong} 일대` : `${district} 일대`;

          return {
            id: `auto-${it.id}`,
            placeId: it.placeId || it.id,
            name: placeName || (zoneName !== '전국 일대' ? zoneName : '한옥마을 일대'),
            lat: it.lat,
            lng: it.lng,
            district: placeName || district,
            visitorCount: 110000,
            congestionScore: 45,
            congestionLevel: 'moderate' as CongestionLevel,
            surgeMultiplier: 1.5,
            intensity: 0.5,
          };
        });
      }
    }

    return list;
  }, [heatSpots, items]);

  useEffect(() => {
    if (!map || mode !== 'warmth' || baseList.length === 0) return;

    // 화면 안 겹침 방지 스마트 클러스터링 (Smart Distance Clustering)
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

      // 주변 거리(px) 이내 스팟 탐색 및 병합 (화면 상 겹침 방지)
      const clusterThreshold = level <= 3 ? 35 : level <= 5 ? 70 : level <= 7 ? 100 : 130;

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
          : `${spot.name} 외 ${count - 1}곳`;

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

    // API로부터 수집된 전국 각지의 온기 클러스터 전체를 인위적으로 자르지 않고(통제 배제),
    // 동서남북 고르게 온기가 피어나도록 전량 렌더링
    const displayClusters = clusters;

    const specs: OverlaySpec[] = [];

    // 3. 발광 히트 블룸 및 지능형 팝오버 뱃지 렌더링
    displayClusters.forEach((item) => {
      const cfg = CONGESTION_CONFIG[item.congestionLevel] || CONGESTION_CONFIG.moderate;
      const pal = isDark ? cfg.dark : cfg.light;

      // ─── 권역별 수요 집중도 뱃지 및 지능형 방향 팝오버 ───
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

      const visitorText = formatVisitorCompact(item.visitorCount);

      // 대표 명소 또는 지역 명칭 산출 (단순 구/군 대신 실제 명소 이름 우선)
      const cleanName = item.name.replace(/\s*일대$/, '').replace(/\s*외\s*\d+곳/, '').replace(/\s*\(\d+곳\)/, '');
      const badgeTitle = cleanName || item.district || '한옥 일대';

      pillWrap.innerHTML = `
        <div class="om-surge-pill" style="background: ${pal.badgeBg}; color: ${pal.badgeColor};">
          <span class="om-surge-pill-icon" style="color: ${pal.accentColor};">${cfg.iconSvg}</span>
          <span class="om-surge-pill-text">${cfg.badgeText}</span>
          <span class="om-surge-pill-name">· ${escapeHtml(badgeTitle)}</span>
        </div>

        <div class="om-surge-popover ${popoverDir}">
          <div class="om-popover-head">
            <span class="om-popover-title">${escapeHtml(item.name)}</span>
            <span class="om-popover-tier" style="background: ${pal.tagBg}; color: ${pal.tagColor};">
              ${cfg.iconSvg} ${cfg.label}
            </span>
          </div>

          <div class="om-popover-gauge">
            <div class="om-popover-gauge-bar" style="width: ${item.congestionScore}%; background: ${pal.tagBg};"></div>
          </div>

          <div class="om-popover-body">
            <div class="om-popover-row">
              <span class="om-row-label">${ICONS.sparkles} 마루의 정취</span>
              <span class="om-popover-val">${cfg.subLabel}</span>
            </div>
            <div class="om-popover-row">
              <span class="om-row-label">${ICONS.users} 머문 발자취</span>
              <span class="om-popover-val">${visitorText}의 온기</span>
            </div>
            <div class="om-popover-row">
              <span class="om-row-label">${ICONS.mapPin} 마을 일대</span>
              <span class="om-popover-val">${escapeHtml(item.district || '한옥 마을')}</span>
            </div>
          </div>

          <div class="om-popover-hint">클릭하여 고즈넉한 풍경 둘러보기</div>
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
  }, [map, mode, baseList, level, isDark]);

  return (
    <>
      <Global styles={styles} />
      <HeatCanvas spots={baseList} />
    </>
  );
}
