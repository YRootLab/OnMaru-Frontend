'use client';

import { useEffect, useMemo } from 'react';
import { Global, css } from '@emotion/react';
import gsap from 'gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { mapIconSvg } from '@/features/map/utils/mapIconSvg';
import {
  lightPalette,
  darkPalette,
  meok,
  surface,
 fontSize, } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { paintOverlays, type OverlaySpec } from '@/features/map/hooks/overlay';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { escapeHtml } from '@/features/map/utils/formatters';
import type { HeatSpot, CongestionLevel } from '@/features/map/types';
import HeatCanvas from './HeatCanvas';
import { intensityOf, levelOf } from '@/features/map/warmth/congestion';
import {
  compareText,
  medianOf,
  quietestWeekday,
  weekdayPattern,
} from '@/features/map/warmth/weekPattern';








const GOTHIC_FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

const ICONS = {
  sparkles: mapIconSvg('sparkles', 13),
  flame: mapIconSvg('flame', 13),
  sun: mapIconSvg('sun', 13),
  wind: mapIconSvg('leaf', 13),
  mapPin: mapIconSvg('mapPin', 12),
  users: mapIconSvg('users', 12),
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
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만 명`;
  return `${Math.round(num).toLocaleString()}명`;
}

const styles = css`



  .om-surge-pill-wrap {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    transform: translate(-50%, -50%);
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    z-index: 25;
    transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .om-surge-pill-wrap:hover,
  .om-surge-pill-wrap.is-hovered,
  .om-surge-pill-wrap.is-open {
    transform: translate(-50%, -52%) scale(1.06);
    z-index: 99999 !important;
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
    box-shadow: 0 2px 8px rgba(25, 31, 40, 0.1);
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
    font-size: ${fontSize.xs};
    font-weight: 700;
    letter-spacing: -0.2px;
    white-space: nowrap;
  }





  .om-surge-pill-delta {
    font-size: ${fontSize.xs};
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .om-surge-pill-delta.is-busy {
    color: ${lightPalette.hwanggeum[900]};
  }

  .om-surge-pill-delta.is-quiet {
    color: ${lightPalette.cheongrok[500]};
  }

  .om-surge-pill-delta.is-flat {
    color: ${meok[500]};
  }

  [data-theme='dark'] .om-surge-pill-delta.is-busy {
    color: ${darkPalette.hwanggeum[400]};
  }

  [data-theme='dark'] .om-surge-pill-delta.is-quiet {
    color: ${darkPalette.cheongrok[400]};
  }




  .om-surge-popover {
    position: absolute;
    left: 50%;
    transform: translate(-50%, 6px) scale(0.94);
    width: 252px;
    padding: 14px 16px;
    border-radius: 18px;
    border: none;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: ${GOTHIC_FONT};
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }


  .om-surge-popover.dir-top {
    bottom: calc(100% + 10px);
    transform: translate(-50%, 6px) scale(0.94);
  }


  .om-surge-popover.dir-bottom {
    top: calc(100% + 10px);
    transform: translate(-50%, -6px) scale(0.94);
  }

  [data-theme='light'] .om-surge-popover,
  :root:not([data-theme='dark']) .om-surge-popover {
    background: #ffffff;
    border: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  [data-theme='dark'] .om-surge-popover {
    background: #1e1c18;
    border: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }




  .om-surge-pill-wrap:hover .om-surge-popover,
  .om-surge-pill-wrap.is-hovered .om-surge-popover,
  .om-surge-pill-wrap.is-open .om-surge-popover {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
    pointer-events: auto;
  }

  .om-surge-pill-wrap.is-open,
  .om-surge-pill-wrap.is-hovered {
    z-index: 99999 !important;
  }


  .om-surge-popover.dir-top::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 7px solid transparent;
    border-top-color: #ffffff;
  }

  [data-theme='dark'] .om-surge-popover.dir-top::after {
    border-top-color: #1e1c18;
  }

  .om-surge-popover.dir-bottom::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 7px solid transparent;
    border-bottom-color: #ffffff;
  }

  [data-theme='dark'] .om-surge-popover.dir-bottom::after {
    border-bottom-color: #1e1c18;
  }

  .om-popover-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .om-popover-title {
    font-size: ${fontSize.sm};
    font-weight: 500;
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
    font-size: ${fontSize.micro};
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


  .om-popover-now {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin: 0;
    font-size: ${fontSize.xs};
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
    color: ${lightPalette.hwanggeum[900]};
  }

  .om-now-delta.is-quiet {
    color: ${lightPalette.cheongrok[500]};
  }

  .om-now-delta.is-flat {
    color: ${meok[500]};
  }

  [data-theme='dark'] .om-now-delta.is-busy {
    color: ${darkPalette.hwanggeum[400]};
  }

  [data-theme='dark'] .om-now-delta.is-quiet {
    color: ${darkPalette.cheongrok[400]};
  }





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
    font-size: ${fontSize.micro};
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
    font-size: ${fontSize.xs};
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
    font-size: ${fontSize.xs};
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
    font-size: ${fontSize.micro};
    color: ${lightPalette.hwanggeum[900]};
    font-weight: 500;
    text-align: center;
  }


  @keyframes om-bubble-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(232, 90, 24, 0.6), 0 4px 16px rgba(232, 90, 24, 0.35);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 14px rgba(232, 90, 24, 0), 0 6px 24px rgba(232, 90, 24, 0.6);
      transform: scale(1.05);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(232, 90, 24, 0), 0 4px 16px rgba(232, 90, 24, 0.35);
      transform: scale(1);
    }
  }

  @keyframes om-bubble-pulse-gold {
    0% {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.55), 0 4px 14px rgba(245, 158, 11, 0.3);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 12px rgba(245, 158, 11, 0), 0 6px 22px rgba(245, 158, 11, 0.5);
      transform: scale(1.04);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0), 0 4px 14px rgba(245, 158, 11, 0.3);
      transform: scale(1);
    }
  }

  .om-warmth-bubble-wrap {
    position: relative;
    user-select: none;
    z-index: 25;
    cursor: pointer;
    font-family: ${GOTHIC_FONT};
  }

  .om-warmth-bubble {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease;
    text-align: center;
    color: #ffffff;
    padding: 6px;
    box-sizing: border-box;
  }

  .om-warmth-bubble-wrap:hover .om-warmth-bubble,
  .om-warmth-bubble-wrap.is-hovered .om-warmth-bubble {
    transform: scale(1.15) translateY(-3px) !important;
    z-index: 100 !important;
  }

  .om-warmth-bubble--surge {
    background: radial-gradient(circle at 35% 35%, #ff8c5a 0%, #e85a18 65%, #bf3900 100%);
    border: none;
    animation: om-bubble-pulse 2.4s infinite ease-in-out;
  }

  .om-warmth-bubble--busy {
    background: radial-gradient(circle at 35% 35%, #ffd269 0%, #f59e0b 65%, #cb6e04 100%);
    border: none;
    animation: om-bubble-pulse-gold 2.8s infinite ease-in-out;
  }

  .om-warmth-bubble--moderate {
    background: radial-gradient(circle at 35% 35%, #ffea9f 0%, #fbbf24 65%, #d97706 100%);
    border: none;
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
  }

  [data-theme='dark'] .om-warmth-bubble--surge {
    box-shadow: 0 0 16px rgba(232, 90, 24, 0.65);
  }

  [data-theme='dark'] .om-warmth-bubble--busy {
    box-shadow: 0 0 14px rgba(245, 158, 11, 0.6);
  }

  [data-theme='dark'] .om-warmth-bubble--moderate {
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.5);
  }

  .om-bubble-icon {
    font-size: 14px;
    line-height: 1;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
    margin-bottom: 2px;
  }

  .om-bubble-count {
    font-size: 13px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
    font-variant-numeric: tabular-nums;
  }

  .om-bubble-name {
    font-size: 9.5px;
    font-weight: 600;
    line-height: 1.1;
    opacity: 0.95;
    max-width: 62px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    margin-top: 1px;
  }
`;

interface MacroRegionDef {
  key: string;
  name: string;
  lat: number;
  lng: number;
}

const MACRO_REGIONS: Record<string, MacroRegionDef> = {
  seoul: { key: 'seoul', name: '서울', lat: 37.5665, lng: 126.978 },
  gyeonggi: { key: 'gyeonggi', name: '경기·인천', lat: 37.4, lng: 127.1 },
  gangwon: { key: 'gangwon', name: '강원', lat: 37.75, lng: 128.35 },
  chungbuk: { key: 'chungbuk', name: '충북', lat: 36.8, lng: 127.75 },
  chungnam: { key: 'chungnam', name: '대전·충남', lat: 36.35, lng: 127.1 },
  jeonbuk: { key: 'jeonbuk', name: '전북', lat: 35.75, lng: 127.15 },
  jeonnam: { key: 'jeonnam', name: '광주·전남', lat: 34.95, lng: 126.9 },
  gyeongbuk: { key: 'gyeongbuk', name: '대구·경북', lat: 36.25, lng: 128.7 },
  gyeongnam: { key: 'gyeongnam', name: '부산·경남', lat: 35.3, lng: 128.6 },
  jeju: { key: 'jeju', name: '제주', lat: 33.38, lng: 126.55 },
};

function getMacroRegion(district: string, name: string, lat: number, lng: number): MacroRegionDef {
  const d = `${district} ${name}`;

  if (lat < 34.0 || d.includes('제주') || d.includes('서귀포')) {
    return MACRO_REGIONS.jeju;
  }
  if (
    d.includes('서울') ||
    (/(종로|중구|용산|성동|광진|동대문|중랑|성북|강북|도봉|노원|은평|서대문|마포|양천|강서|구로|금천|영등포|동작|관악|서초|강남|송파|강동)구/.test(d) &&
      lat >= 37.42 && lat <= 37.7 && lng >= 126.75 && lng <= 127.2)
  ) {
    return MACRO_REGIONS.seoul;
  }
  if (
    d.includes('경기') || d.includes('인천') ||
    /(수원|성남|용인|고양|안양|부천|광명|평택|안산|과천|구리|남양주|오산|시흥|군포|의왕|하남|파주|이천|안성|김포|화성|광주|양주|포천|여주|연천|가평|양평|강화|옹진)/.test(d) ||
    (lat >= 36.95 && lat <= 38.3 && lng >= 126.3 && lng <= 127.65)
  ) {
    return MACRO_REGIONS.gyeonggi;
  }
  if (
    d.includes('강원') ||
    /(춘천|원주|강릉|동해|태백|속초|삼척|홍천|횡성|영월|평창|정선|철원|화천|양구|인제|고성|양양)/.test(d) ||
    (lat >= 37.05 && lng >= 127.8)
  ) {
    return MACRO_REGIONS.gangwon;
  }
  if (
    d.includes('충북') || d.includes('충청북') ||
    /(청주|충주|제천|보은|옥천|영동|증평|진천|괴산|음성|단양)/.test(d)
  ) {
    return MACRO_REGIONS.chungbuk;
  }
  if (
    d.includes('충남') || d.includes('충청남') || d.includes('대전') || d.includes('세종') ||
    /(천안|공주|보령|아산|서산|논산|계룡|당진|금산|부여|서천|청양|홍성|예산|태안|대덕|유성)/.test(d) ||
    (lat >= 35.95 && lat <= 37.1 && lng >= 126.0 && lng <= 127.5)
  ) {
    return MACRO_REGIONS.chungnam;
  }
  if (
    d.includes('전북') || d.includes('전라북') ||
    /(전주|완산|덕진|군산|익산|정읍|남원|김제|완주|진안|무주|장수|임실|순창|고창|부안)/.test(d) ||
    (lat >= 35.35 && lat < 36.15 && lng >= 126.3 && lng <= 127.85)
  ) {
    return MACRO_REGIONS.jeonbuk;
  }
  if (
    d.includes('전남') || d.includes('전라남') || d.includes('광주') ||
    /(목포|여수|순천|나주|광양|담양|곡성|구례|고흥|보성|화순|장흥|강진|해남|영암|무안|함평|영광|장성|완도|진도|신안)/.test(d) ||
    (lat < 35.45 && lng <= 127.8)
  ) {
    return MACRO_REGIONS.jeonnam;
  }
  if (
    d.includes('경북') || d.includes('경상북') || d.includes('대구') ||
    /(포항|경주|김천|안동|구미|영주|영천|상주|문경|경산|의성|청송|영양|영덕|청도|고령|성주|칠곡|예천|봉화|울진|울릉)/.test(d) ||
    (lat >= 35.6 && lng >= 128.1)
  ) {
    return MACRO_REGIONS.gyeongbuk;
  }
  if (
    d.includes('경남') || d.includes('경상남') || d.includes('부산') || d.includes('울산') ||
    /(창원|진주|통영|사천|김해|밀양|거제|양산|의령|함안|창녕|고성|남해|하동|산청|함양|거창|합천)/.test(d) ||
    (lat < 35.6 && lng >= 127.8)
  ) {
    return MACRO_REGIONS.gyeongnam;
  }

  let nearest = MACRO_REGIONS.gyeonggi;
  let minDist = Infinity;
  for (const m of Object.values(MACRO_REGIONS)) {
    const dist = (m.lat - lat) ** 2 + (m.lng - lng) ** 2;
    if (dist < minDist) {
      minDist = dist;
      nearest = m;
    }
  }
  return nearest;
}

function getCityDistrict(district: string, name: string): string {
  const raw = (district || name || '').replace(/\s*일대$/, '').trim();
  const siMatch = raw.match(/^([가-힣]+시)\s+[가-힣]+구$/);
  if (siMatch) return siMatch[1];

  const metroGuMatch = raw.match(/^[가-힣]+(?:특별시|광역시|특별자치시)\s+([가-힣]+(?:구|군))$/);
  if (metroGuMatch) return metroGuMatch[1];

  const parts = raw.split(/\s+/);
  if (parts.length >= 2 && parts[0].endsWith('시') && parts[1].endsWith('구')) {
    return parts[0];
  }

  return parts[0] || raw;
}

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
  const warmthViewType = useMapStore((s) => s.warmthViewType);
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';
  const reducedMotion = usePrefersReducedMotion();





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







    const zoneMap = new Map<string, ClusteredHeatSpot>();

    if (level >= 9) {

      baseList.forEach((spot) => {
        const macro = getMacroRegion(spot.district, spot.name, spot.lat, spot.lng);
        const key = `macro-${macro.key}`;
        const zone = zoneMap.get(key);

        if (!zone) {
          zoneMap.set(key, {
            key,
            lat: macro.lat,
            lng: macro.lng,
            name: macro.name,
            count: 1,
            district: macro.name,
            visitorCount: spot.visitorCount,
            congestionScore: spot.congestionScore,
            congestionLevel: spot.congestionLevel,
            surgeMultiplier: spot.surgeMultiplier,
            intensity: spot.intensity,
            series: spot.series ? [...spot.series] : undefined,
            primarySpot: spot,
          });
          return;
        }

        zone.count += 1;
        zone.visitorCount = Math.max(zone.visitorCount, spot.visitorCount);
        zone.congestionScore = Math.round(
          (zone.congestionScore * (zone.count - 1) + spot.congestionScore) / zone.count,
        );
        zone.congestionLevel = levelOf(zone.congestionScore);
        zone.intensity = Math.max(zone.intensity, spot.intensity);
        if (spot.visitorCount > (zone.primarySpot.visitorCount || 0)) {
          zone.primarySpot = spot;
        }
        if (!zone.series && spot.series) {
          zone.series = [...spot.series];
        } else if (zone.series && spot.series) {
          zone.series = zone.series.map((val, idx) =>
            Math.round((val + (spot.series![idx] ?? val)) / 2),
          );
        }
      });
    } else {









      baseList.forEach((spot) => {
        const cityDist = getCityDistrict(spot.district, spot.name);
        const key = `city-${cityDist}`;
        const zone = zoneMap.get(key);

        if (!zone) {
          zoneMap.set(key, {
            key,
            lat: spot.lat,
            lng: spot.lng,
            name: cityDist,
            count: 1,
            district: cityDist,
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

        zone.lat = (zone.lat * zone.count + spot.lat) / (zone.count + 1);
        zone.lng = (zone.lng * zone.count + spot.lng) / (zone.count + 1);
        zone.count += 1;
        if (spot.visitorCount > zone.visitorCount) {
          zone.visitorCount = spot.visitorCount;
          zone.congestionScore = spot.congestionScore;
          zone.congestionLevel = spot.congestionLevel;
          zone.primarySpot = spot;
        }
        if (!zone.series && spot.series) zone.series = spot.series;
      });


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
    }

    const displayClusters = [...zoneMap.values()];
    const projection = map.getProjection?.();


    let visibleClusters = displayClusters;
    if (projection && level <= 8) {
      const minDistancePx = level <= 5 ? 65 : 75;
      const sorted = [...displayClusters].sort(
        (a, b) => (b.visitorCount || 0) - (a.visitorCount || 0),
      );
      const placedPoints: { x: number; y: number }[] = [];
      visibleClusters = sorted.filter((item) => {
        const pt = projection.pointFromCoords(new window.kakao.maps.LatLng(item.lat, item.lng));
        if (!pt) return true;
        const collision = placedPoints.some((p) => {
          const dx = p.x - pt.x;
          const dy = p.y - pt.y;
          return dx * dx + dy * dy < minDistancePx * minDistancePx;
        });
        if (collision) return false;
        placedPoints.push(pt);
        return true;
      });
    }

    const specs: OverlaySpec[] = [];

    const canHover =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: hover)').matches
        : true;

    const closeAllPopovers = () => {
      document
        .querySelectorAll(
          '.om-surge-pill-wrap.is-open, .om-surge-pill-wrap.is-hovered, .om-warmth-bubble-wrap.is-open, .om-warmth-bubble-wrap.is-hovered',
        )
        .forEach((el) => {
          el.classList.remove('is-open');
          el.classList.remove('is-hovered');
          const overlay = (el as any).__kakaoOverlay;
          if (overlay && typeof overlay.setZIndex === 'function') {
            overlay.setZIndex(25);
          }
          let parent: HTMLElement | null = (el as HTMLElement).parentElement;
          while (parent && parent !== document.body) {
            if (parent.style && (parent.style.position === 'absolute' || parent.style.zIndex)) {
              parent.style.zIndex = '25';
              break;
            }
            parent = parent.parentElement;
          }
        });
    };


    visibleClusters.forEach((item, clusterIndex) => {
      const cfg = CONGESTION_CONFIG[item.congestionLevel] || CONGESTION_CONFIG.moderate;
      const pal = isDark ? cfg.dark : cfg.light;


      const pillWrap = document.createElement('div');
      pillWrap.className = 'om-surge-pill-wrap';


      let popoverDir = 'dir-top';
      if (projection) {
        const screenPt = projection.pointFromCoords(new window.kakao.maps.LatLng(item.lat, item.lng));
        if (screenPt && screenPt.y < 260) {
          popoverDir = 'dir-bottom';
        }
      }

      const visitorText = formatVisitorCompact(item.visitorCount);
      const zoneName = (item.name || item.district || '한옥 일대').replace(/\s*일대$/, '');








      const series = item.series ?? [];
      const baseline = medianOf(series);
      const compare = series.length > 0 ? compareText(item.congestionScore, baseline) : null;
      const deltaClass = compare ? `is-${compare.tone}` : 'is-flat';
      const deltaText = compare
        ? compare.tone === 'flat'
          ? '평소만큼'
          : `${compare.delta > 0 ? '+' : ''}${compare.delta}%`
        : '';


      const week = weekdayPattern(series, heatDays);
      const quietest = quietestWeekday(week);
      const weekMax = week.length > 0 ? Math.max(...week.map((w) => w.avg)) : 1;
      const weekMin = week.length > 0 ? Math.min(...week.map((w) => w.avg)) : 0;
      const weekSpan = Math.max(weekMax - weekMin, 1);






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

      const hintText =
        level >= 9
          ? '눌러서 시·군·구 권역 둘러보기'
          : level >= 6
            ? '눌러서 세부 한옥 명소 둘러보기'
            : '눌러서 상세 위치 보기';

      const triggerHtml = `
        <div class="om-surge-pill" style="background: ${pal.badgeBg}; color: ${pal.badgeColor};">
          <span class="om-surge-pill-icon" style="color: ${pal.accentColor};">${cfg.iconSvg}</span>
          <span class="om-surge-pill-name">${escapeHtml(zoneName)}</span>
          ${deltaText ? `<span class="om-surge-pill-delta ${deltaClass}">${deltaText}</span>` : ''}
        </div>
      `;

      pillWrap.innerHTML = `
        ${triggerHtml}

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
                       ? `<p class="om-week-say">이 동네는 <b>${quietest.full}</b>이 가장 조용해요</p>`
                       : `<p class="om-week-say">요일별 차이가 뚜렷하지 않아요</p>`
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

          <div class="om-popover-hint">${hintText}</div>
        </div>
      `;








      const pillEl = pillWrap.querySelector<HTMLElement>('.om-surge-pill');
      if (pillEl && !reducedMotion) {
        gsap.set(pillEl, { opacity: 0, scale: 0.4, y: 8, transformOrigin: '50% 50%' });
        gsap.to(pillEl, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.45,
          delay: Math.min(clusterIndex, 12) * 0.045,
          ease: 'back.out(1.7)',
          clearProps: 'opacity,transform,transformOrigin',
        });
      }

      if (compare && compare.tone !== 'flat') {
        const deltaEl = pillWrap.querySelector<HTMLElement>('.om-surge-pill-delta');
        if (deltaEl) {
          if (reducedMotion) {
            deltaEl.textContent = deltaText;
          } else {
            const counter = { value: 0 };
            gsap.to(counter, {
              value: compare.delta,
              duration: 0.6,
              delay: Math.min(clusterIndex, 12) * 0.045 + 0.15,
              ease: 'power2.out',
              onUpdate: () => {
                const rounded = Math.round(counter.value);
                deltaEl.textContent = `${rounded > 0 ? '+' : ''}${rounded}%`;
              },
            });
          }
        }
      }

      const setZIndex = (z: number) => {
        const overlay = (pillWrap as any).__kakaoOverlay;
        if (overlay && typeof overlay.setZIndex === 'function') {
          overlay.setZIndex(z);
        }
        let parent: HTMLElement | null = pillWrap.parentElement;
        while (parent && parent !== document.body) {
          if (parent.style && (parent.style.position === 'absolute' || parent.style.zIndex)) {
            parent.style.zIndex = String(z);
            break;
          }
          parent = parent.parentElement;
        }
      };

      pillWrap.addEventListener('mouseenter', () => {
        setZIndex(99999);
        pillWrap.classList.add('is-hovered');
      });

      pillWrap.addEventListener('mouseleave', () => {
        pillWrap.classList.remove('is-hovered');
        if (!pillWrap.classList.contains('is-open')) {
          setZIndex(25);
        }
      });

      pillWrap.addEventListener('click', (e) => {
        e.stopPropagation();






        if (!canHover && !pillWrap.classList.contains('is-open')) {
          closeAllPopovers();
          pillWrap.classList.add('is-open');
          setZIndex(99999);
          return;
        }


        const m = useMapStore.getState().map;
        const nextLevel = level >= 9 ? 7 : level >= 6 ? 4 : Math.max(2, level - 1);
        if (m) {
          m.setLevel(nextLevel, { animate: true });
          m.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
        }
        useMapStore.getState().setCenter({ lat: item.lat, lng: item.lng }, nextLevel);
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


    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.om-surge-pill-wrap, .om-warmth-bubble-wrap')) return;
      closeAllPopovers();
    };
    document.addEventListener('click', onDocumentClick);

    const cleanup = paintOverlays(map, specs);
    return () => {
      document.removeEventListener('click', onDocumentClick);
      closeAllPopovers();
      if (cleanup) cleanup();
    };
  }, [map, mode, baseList, level, isDark, heatDays, heatDayIndex, warmthViewType, reducedMotion]);

  return (
    <>
      <Global styles={styles} />
      <HeatCanvas spots={baseList} />
    </>
  );
}
