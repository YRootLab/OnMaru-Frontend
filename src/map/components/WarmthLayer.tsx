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
import { intensityOf, levelOf } from '@/map/warmth/congestion';
import {
  compareText,
  medianOf,
  quietestWeekday,
  weekdayPattern,
} from '@/map/warmth/weekPattern';

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

/** 외지인 방문객 수. 사람 수라서 '걸음'이 아니라 '명'으로 센다. */
function formatVisitorCompact(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만 명`;
  return `${Math.round(num).toLocaleString()}명`;
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

  .om-surge-pill-name {
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }

  /*
    권역마다 다른 값. 등급 문구는 같은 구면 늘 같아서 뱃지끼리 구별이 안 됐다.
    색은 히트맵 램프와 같은 말을 한다 — 붉은 쪽이 피할 곳, 청록이 갈 만한 곳.
  */
  .om-surge-pill-delta {
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .om-surge-pill-delta.is-busy {
    color: ${lightPalette.juhong[500]};
  }

  .om-surge-pill-delta.is-quiet {
    color: ${lightPalette.cheongrok[500]};
  }

  .om-surge-pill-delta.is-flat {
    color: ${meok[500]};
  }

  [data-theme='dark'] .om-surge-pill-delta.is-busy {
    color: ${darkPalette.juhong[400]};
  }

  [data-theme='dark'] .om-surge-pill-delta.is-quiet {
    color: ${darkPalette.cheongrok[400]};
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

  /*
    터치 기기에는 hover가 없다. 예전에는 그래서 이 카드를 볼 방법이 아예 없었고,
    탭하면 곧장 지도가 확대돼 정보를 지나쳤다. 탭으로 여는 상태를 따로 둔다.
  */
  .om-surge-pill-wrap:hover .om-surge-popover,
  .om-surge-pill-wrap.is-open .om-surge-popover {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }

  .om-surge-pill-wrap.is-open {
    z-index: 90;
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

  /* 선택한 날 한 줄 — 스크러버가 가리키는 날이 여기 그대로 온다. */
  .om-popover-now {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin: 0;
    font-size: 12px;
  }

  .om-now-day {
    color: ${meok[700]};
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  [data-theme='dark'] .om-now-day {
    color: ${meok[400]};
  }

  .om-now-delta {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .om-now-delta.is-busy {
    color: ${lightPalette.juhong[500]};
  }

  .om-now-delta.is-quiet {
    color: ${lightPalette.cheongrok[500]};
  }

  .om-now-delta.is-flat {
    color: ${meok[500]};
  }

  [data-theme='dark'] .om-now-delta.is-busy {
    color: ${darkPalette.juhong[400]};
  }

  [data-theme='dark'] .om-now-delta.is-quiet {
    color: ${darkPalette.cheongrok[400]};
  }

  /*
    요일 패턴. 이 팝오버가 답하는 질문은 '언제 가면 조용한가' 하나뿐이라
    막대 일곱 개와 문장 한 줄 외에는 아무것도 두지 않는다.
  */
  .om-week {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .om-week-chart {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 46px;
  }

  .om-week-col {
    flex: 1 1 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: 100%;
  }

  .om-week-bar-track {
    flex: 1;
    width: 100%;
    display: flex;
    align-items: flex-end;
  }

  .om-week-bar {
    width: 100%;
    border-radius: 3px 3px 0 0;
    background: rgba(78, 89, 104, 0.22);
  }

  [data-theme='dark'] .om-week-bar {
    background: rgba(255, 255, 255, 0.18);
  }

  .om-week-col.is-quiet .om-week-bar {
    background: ${lightPalette.cheongrok[500]};
  }

  [data-theme='dark'] .om-week-col.is-quiet .om-week-bar {
    background: ${darkPalette.cheongrok[500]};
  }

  .om-week-label {
    font-size: 10.5px;
    font-weight: 500;
    color: ${meok[500]};
    line-height: 1;
  }

  .om-week-col.is-quiet .om-week-label {
    color: ${lightPalette.cheongrok[500]};
    font-weight: 700;
  }

  [data-theme='dark'] .om-week-col.is-quiet .om-week-label {
    color: ${darkPalette.cheongrok[400]};
  }

  .om-week-say {
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    color: ${meok[700]};
  }

  .om-week-say b {
    font-weight: 700;
    color: ${lightPalette.cheongrok[500]};
  }

  [data-theme='dark'] .om-week-say {
    color: ${meok[400]};
  }

  [data-theme='dark'] .om-week-say b {
    color: ${darkPalette.cheongrok[400]};
  }

  .om-popover-foot {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11.5px;
    color: ${meok[500]};
  }

  .om-popover-foot span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-variant-numeric: tabular-nums;
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
  /** 권역의 30일 혼잡도. 요일 패턴과 '평소 대비'가 여기서 나온다. */
  series?: number[];
  primarySpot: HeatSpot;
}

export default function WarmthLayer() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const heatSpots = useMapStore((s) => s.heatSpots);
  const items = useMapStore((s) => s.items);
  const level = useMapStore((s) => s.level);
  const heatDayIndex = useMapStore((s) => s.heatDayIndex);
  const heatDays = useMapStore((s) => s.heatDays);
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

    /*
      스크러버가 고른 날의 값으로 혼잡도를 갈아끼운다.
      히트맵 캔버스도 뱃지도 이 목록 하나만 보기 때문에, 날짜를 아는 곳은 여기뿐이다.
      시계열이 없는 권역(매칭 실패·폴백)은 원래 값을 그대로 쓴다.
    */
    return list.map((spot) => {
      const score = spot.series?.[heatDayIndex];
      if (score === undefined) return spot;

      return {
        ...spot,
        congestionScore: score,
        congestionLevel: levelOf(score),
        intensity: intensityOf(score),
      };
    });
  }, [heatSpots, items, heatDayIndex]);

  useEffect(() => {
    if (!map || mode !== 'warmth' || baseList.length === 0) return;

    /*
      뱃지는 시군구(권역) 하나에 하나다.

      혼잡도는 시군구 단위로 산출되는 값이다. 그런데 예전에는 화면 픽셀 거리로 묶어서,
      같은 구 안에서도 스팟이 떨어져 있으면 뱃지가 갈라졌다. 그 결과 '중구'가 네 번 뜨고
      네 개가 전부 같은 숫자를 보여줬다 — 하나의 사실을 네 번 말한 셈이다.
      방문객 수는 한술 더 떠서 같은 구의 값을 뱃지 개수만큼 더하고 있었다.

      데이터가 가진 정직한 해상도가 시군구이므로, 뱃지도 거기에 맞춘다.
    */
    const zoneMap = new Map<string, ClusteredHeatSpot>();

    baseList.forEach((spot) => {
      const key = spot.district || spot.name;
      const zone = zoneMap.get(key);

      if (!zone) {
        zoneMap.set(key, {
          key: `zone-${key}`,
          lat: spot.lat,
          lng: spot.lng,
          name: key,
          count: 1,
          district: key,
          // 권역 단위 값이라 합치지 않는다. 더하면 같은 수를 여러 번 세게 된다.
          visitorCount: spot.visitorCount,
          congestionScore: spot.congestionScore,
          congestionLevel: spot.congestionLevel,
          surgeMultiplier: spot.surgeMultiplier,
          intensity: spot.intensity,
          series: spot.series,
          primarySpot: spot,
        });
        return;
      }

      // 뱃지는 권역의 무게중심에 선다 — 첫 스팟 위가 아니라 한옥들이 모인 가운데다.
      zone.lat = (zone.lat * zone.count + spot.lat) / (zone.count + 1);
      zone.lng = (zone.lng * zone.count + spot.lng) / (zone.count + 1);
      zone.count += 1;
      if (!zone.series && spot.series) zone.series = spot.series;
    });

    /*
      주소 표기가 흔들려 같은 동네가 두 이름으로 갈리는 일이 있다 —
      대부분 '전주시 완산구'로 잡히는데 한둘이 '완산구'로만 남는 식이다.
      짧은 이름이 긴 이름의 꼬리면 같은 곳이므로, 시계열을 가진 쪽으로 합친다.
    */
    for (const [key, zone] of [...zoneMap]) {
      if (zone.series) continue;

      const host = [...zoneMap.values()].find(
        (other) => other !== zone && other.series && other.district.endsWith(key),
      );
      if (!host) continue;

      host.lat = (host.lat * host.count + zone.lat * zone.count) / (host.count + zone.count);
      host.lng = (host.lng * host.count + zone.lng * zone.count) / (host.count + zone.count);
      host.count += zone.count;
      zoneMap.delete(key);
    }

    // 화면에 걸린 권역은 전부 세운다. 권역 단위라 개수가 저절로 적다.
    const displayClusters = [...zoneMap.values()];

    const projection = map.getProjection?.();
    const specs: OverlaySpec[] = [];

    const canHover =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: hover)').matches
        : true;

    const closeAllPopovers = () => {
      document
        .querySelectorAll('.om-surge-pill-wrap.is-open')
        .forEach((el) => el.classList.remove('is-open'));
    };

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
      const zoneName = (item.district || item.name || '한옥 일대').replace(/\s*일대$/, '');

      /*
        뱃지에는 권역마다 '다른' 값을 싣는다.
        예전 뱃지는 '온기 가득'이라는 등급 문구를 달았는데, 등급은 같은 구면 늘 같아서
        뱃지 여러 개가 서로를 구별하는 정보를 하나도 담지 못했다.
        그 권역 자신의 30일 중앙값과 견준 편차는 권역마다 다르므로,
        뱃지가 늘어서 있어도 한눈에 읽힌다.
      */
      const series = item.series ?? [];
      const baseline = medianOf(series);
      const compare = series.length > 0 ? compareText(item.congestionScore, baseline) : null;
      const deltaClass = compare ? `is-${compare.tone}` : 'is-flat';
      const deltaText = compare
        ? compare.tone === 'flat'
          ? '평소만큼'
          : `${compare.delta > 0 ? '+' : ''}${compare.delta}%`
        : '';

      // 요일 패턴 — 이 팝오버가 답하려는 질문은 '언제 가면 조용한가' 하나다.
      const week = weekdayPattern(series, heatDays);
      const quietest = quietestWeekday(week);
      const weekMax = week.length > 0 ? Math.max(...week.map((w) => w.avg)) : 1;
      const weekMin = week.length > 0 ? Math.min(...week.map((w) => w.avg)) : 0;
      const weekSpan = Math.max(weekMax - weekMin, 1);

      /*
        막대 높이는 px로 직접 계산한다. 트랙이 flex로 늘어난 높이라
        퍼센트 높이가 해석되지 않아 전부 납작해진다.
        바닥은 이 권역의 최저 요일 — 0부터 그리면 요일 간 차이가 뭉개진다.
      */
      const weekBars = week
        .map((w) => {
          const height = Math.round(8 + ((w.avg - weekMin) / weekSpan) * 26);
          const isQuiet = quietest !== null && w.full === quietest.full;
          return `
            <div class="om-week-col${isQuiet ? ' is-quiet' : ''}" title="${w.full} 평균 혼잡도 ${Math.round(w.avg)}">
              <div class="om-week-bar-track"><div class="om-week-bar" style="height: ${height}px"></div></div>
              <span class="om-week-label">${w.short}</span>
            </div>`;
        })
        .join('');

      const dayStamp = heatDays[heatDayIndex];
      const dayLabel = dayStamp
        ? `${Number(dayStamp.ymd.slice(4, 6))}월 ${Number(dayStamp.ymd.slice(6, 8))}일 ${dayStamp.weekday}`
        : '';

      pillWrap.innerHTML = `
        <div class="om-surge-pill" style="background: ${pal.badgeBg}; color: ${pal.badgeColor};">
          <span class="om-surge-pill-icon" style="color: ${pal.accentColor};">${cfg.iconSvg}</span>
          <span class="om-surge-pill-name">${escapeHtml(zoneName)}</span>
          ${deltaText ? `<span class="om-surge-pill-delta ${deltaClass}">${deltaText}</span>` : ''}
        </div>

        <div class="om-surge-popover ${popoverDir}">
          <div class="om-popover-head">
            <span class="om-popover-title">${escapeHtml(zoneName)}</span>
            <span class="om-popover-tier" style="background: ${pal.tagBg}; color: ${pal.tagColor};">
              ${cfg.iconSvg} ${cfg.label}
            </span>
          </div>

          ${
            compare
              ? `<p class="om-popover-now">
                   <span class="om-now-day">${escapeHtml(dayLabel)}</span>
                   <span class="om-now-delta ${deltaClass}">${compare.text}</span>
                 </p>`
              : ''
          }

          ${
            week.length > 0
              ? `<div class="om-week">
                   <div class="om-week-chart">${weekBars}</div>
                   ${
                     quietest
                       ? `<p class="om-week-say">이 동네는 <b>${quietest.full}</b>이 가장 조용합니다</p>`
                       : `<p class="om-week-say">요일별 차이가 뚜렷하지 않습니다</p>`
                   }
                 </div>`
              : `<div class="om-popover-gauge">
                   <div class="om-popover-gauge-bar" style="width: ${item.congestionScore}%; background: ${pal.tagBg};"></div>
                 </div>`
          }

          <div class="om-popover-foot">
            <span>${ICONS.users} 외지인 ${visitorText}</span>
            <span>${ICONS.mapPin} 한옥 ${item.count}곳</span>
          </div>

          <div class="om-popover-hint">눌러서 이 권역 둘러보기</div>
        </div>
      `;

      pillWrap.addEventListener('click', (e) => {
        e.stopPropagation();

        /*
          터치에서는 첫 탭이 카드를 펴는 데 쓰인다.
          이동은 카드 안의 '눌러서 이 권역 둘러보기'가 맡는다 —
          그 버튼도 이 핸들러를 타는데, 그때는 이미 열려 있으므로 아래로 내려간다.
        */
        if (!canHover && !pillWrap.classList.contains('is-open')) {
          closeAllPopovers();
          pillWrap.classList.add('is-open');
          return;
        }

        // 클릭 시 해당 지점으로 카메라 줌인 이동
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

    // 지도 아무 데나 누르면 펴둔 카드를 접는다 (데스크톱에서는 열린 카드가 없어 무해하다)
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.om-surge-pill-wrap')) return;
      closeAllPopovers();
    };
    document.addEventListener('click', onDocumentClick);

    const cleanup = paintOverlays(map, specs);
    return () => {
      document.removeEventListener('click', onDocumentClick);
      closeAllPopovers();
      if (cleanup) cleanup();
    };
  }, [map, mode, baseList, level, isDark, heatDays, heatDayIndex]);

  return (
    <>
      <Global styles={styles} />
      <HeatCanvas spots={baseList} />
    </>
  );
}
