'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { gsap } from 'gsap';
import { logger } from '@/lib/log';
import { meok, lightPalette, palette, fontSize } from '@/design-system/tokens';
import { escapeHtml, safeImageUrl } from '@/features/map/utils/formatters';
import { mapIconSvg, type MapIconName } from '@/features/map/utils/mapIconSvg';
import { calculateTravelEstimate } from '@/features/map/utils/geo';
import { isHanok } from '@/features/map/utils/isHanok';
import {
  advanceMarkerEntranceState,
  type MarkerEntranceState,
} from './markerEntrancePolicy';
import { toast } from 'sonner';
import { useMapStore } from '../hooks/useMapStore';
import { getInfoPlaceMarkerPresentation, selectInfoMarkerItems } from '../services/infoMarker.service';
import { useStampStore } from '@/features/stamp/presentation/useStampStore';
import type { PlaceCategory } from '../types';
import { focusMapOnPlace } from '../presentation/mapPlaceFocus';
import { getSelectedMarkerVisualStyle } from '../presentation/markerSelectionPresentation';
import {
  fadeInEl,
  retireOverlays,
  cancelActiveAnimations,
  canCrossfade,
  type ZoomDir,
} from '../presentation/overlayTransitionCoordinator';

const log = logger('map');
const selectedMarkerLight = getSelectedMarkerVisualStyle('light');
const selectedMarkerDark = getSelectedMarkerVisualStyle('dark');


const CATEGORY_ICONS: Record<PlaceCategory, MapIconName> = {
  spot: 'landmark',
  culture: 'bookOpen',
  stay: 'home',
  food: 'utensils',
  cafe: 'coffee',
  experience: 'sparkles',
  festival: 'calendar',
  market: 'shoppingBag',
};

export function renderCategoryIconSvg(category: PlaceCategory, size = 15): string {
  return mapIconSvg(CATEGORY_ICONS[category] ?? 'landmark', size);
}


export const CATEGORY_STYLES: Record<
  PlaceCategory,
  {
    main: string;
    lightBg: string;
    lightBorder: string;
    border: string;
    clusterBg: string;
    iconSvg: string;
  }
> = {
  // [보고 배우다 그룹] 고택: kobalt[600], 문화유산: kobalt[700] (명도 1단계 차이)
  spot: {
    main: palette.kobalt[600],
    lightBg: palette.kobalt[50],
    lightBorder: palette.kobalt[200],
    border: palette.kobalt[600],
    clusterBg: palette.kobalt[600],
    iconSvg: renderCategoryIconSvg('spot', 14),
  },

  culture: {
    main: palette.kobalt[700],
    lightBg: palette.kobalt[50],
    lightBorder: palette.kobalt[200],
    border: palette.kobalt[700],
    clusterBg: palette.kobalt[700],
    iconSvg: renderCategoryIconSvg('culture', 14),
  },

  // [머물다 그룹] 숙소: jangmi[600]
  stay: {
    main: palette.jangmi[600],
    lightBg: palette.jangmi[50],
    lightBorder: palette.jangmi[200],
    border: palette.jangmi[600],
    clusterBg: palette.jangmi[600],
    iconSvg: renderCategoryIconSvg('stay', 14),
  },

  // [먹다 그룹] 전통 맛집: cheongrok[700], 한옥 카페: cheongrok[600], 전통 시장: cheongrok[800]
  // 클러스터 숫자 뱃지 배경은 작은 글씨 대비 확보를 위해 먹다 그룹은 cheongrok[800] 사용
  food: {
    main: palette.cheongrok[700],
    lightBg: palette.cheongrok[50],
    lightBorder: palette.cheongrok[200],
    border: palette.cheongrok[700],
    clusterBg: palette.cheongrok[800],
    iconSvg: renderCategoryIconSvg('food', 14),
  },

  cafe: {
    main: palette.cheongrok[600],
    lightBg: palette.cheongrok[50],
    lightBorder: palette.cheongrok[200],
    border: palette.cheongrok[600],
    clusterBg: palette.cheongrok[800],
    iconSvg: renderCategoryIconSvg('cafe', 14),
  },

  market: {
    main: palette.cheongrok[800],
    lightBg: palette.cheongrok[50],
    lightBorder: palette.cheongrok[200],
    border: palette.cheongrok[800],
    clusterBg: palette.cheongrok[800],
    iconSvg: renderCategoryIconSvg('market', 14),
  },

  // [놀다 그룹] 전통 체험: jaha[500], 축제: jaha[600] (명도 1단계 차이)
  experience: {
    main: palette.jaha[500],
    lightBg: palette.jaha[50],
    lightBorder: palette.jaha[200],
    border: palette.jaha[500],
    clusterBg: palette.jaha[500],
    iconSvg: renderCategoryIconSvg('experience', 14),
  },

  festival: {
    main: palette.jaha[600],
    lightBg: palette.jaha[50],
    lightBorder: palette.jaha[200],
    border: palette.jaha[600],
    clusterBg: palette.jaha[600],
    iconSvg: renderCategoryIconSvg('festival', 14),
  },
};

const styles = css`



  @keyframes om-pin-spring {
    0% { transform: translateY(-2px) scale(1); }
    35% { transform: translateY(-16px) scale(1.22); }
    65% { transform: translateY(-3px) scale(0.95); }
    100% { transform: translateY(-6px) scale(1.15); }
  }

  @keyframes om-halo-pulse {
    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
  }

  @keyframes om-eq-wave {
    0%, 100% { height: 3px; }
    50% { height: 10px; }
  }




  .om-pin {
    position: relative;
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 36px;
    padding: 4px 10px 4px 5px;
    border-radius: 14px;
    background: #ffffff;
    border: 1.5px solid rgba(25, 31, 40, 0.12);
    box-shadow: 0 4px 16px -2px rgba(25, 31, 40, 0.22), 0 1px 4px rgba(25, 31, 40, 0.1);
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    color: ${meok[900]};
    white-space: nowrap;
    cursor: pointer;
    transform: translateY(-2px);
    transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
    user-select: none;
  }

  .om-pin:hover,
  .om-pin[data-hovered='true'] {
    box-shadow: 0 6px 18px -2px rgba(25, 31, 40, 0.28), 0 0 0 2px rgba(25, 31, 40, 0.07);
    z-index: 100 !important;
  }

  .om-pin:active {
    transform: translateY(-2px) scale(0.94);
    transition: transform 0.08s ease;
  }

  .om-pin::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 8px;
    height: 8px;
    background: #ffffff;
    border-right: 1.5px solid rgba(25, 31, 40, 0.12);
    border-bottom: 1.5px solid rgba(25, 31, 40, 0.12);
    transform: translate(-50%, -4px) rotate(45deg);
  }

  .om-pin-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  .om-pin-name {
    max-width: min(180px, 42vw);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .om-pin-dist {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 500;
    color: #6b7684;
    white-space: nowrap;
    opacity: 0.85;
  }

  .om-pin-hanok-tag {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    height: 20px;
    padding: 0 6px;
    border: 1px solid ${palette.juhong[200]};
    border-radius: 5px;
    background: ${palette.juhong[50]};
    color: ${palette.juhong[700]};
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }



  .om-pin-eq {
    display: inline-flex;
    align-items: flex-end;
    gap: 1.5px;
    height: 10px;
    margin-left: 2px;
  }

  .om-pin-eq span {
    width: 2px;
    background: ${lightPalette.jangmi[500]};
    border-radius: 1px;
    animation: om-eq-wave 0.8s ease-in-out infinite alternate;
  }
  .om-pin-eq span:nth-of-type(2) { animation-delay: 0.25s; }
  .om-pin-eq span:nth-of-type(3) { animation-delay: 0.5s; }


  .om-pin-hover-card {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translate(-50%, 4px);
    width: max-content;
    min-width: 220px;
    max-width: 275px;
    padding: 10px 12px;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 12px 32px -4px rgba(25, 31, 40, 0.22), 0 1px 4px rgba(25, 31, 40, 0.08);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.16s ease, transform 0.16s ease;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-sizing: border-box;
  }

  [data-theme='dark'] .om-pin-hover-card {
    background: #24211c;
    border: 1px solid rgba(255, 255, 255, 0.09);
    box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  .om-pin:hover .om-pin-hover-card,
  .om-pin[data-hovered='true'] .om-pin-hover-card,
  .om-badge-pin:hover .om-pin-hover-card,
  .om-badge-pin[data-hovered='true'] .om-pin-hover-card {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  .om-pin-hover-thumb {
    width: 100%;
    height: 90px;
    border-radius: 9px;
    object-fit: cover;
    background: #f0eae0;
  }

  .om-pin-hover-title {
    font-family: var(--font-traditional);
    font-size: 14px;
    font-weight: 700;
    color: ${meok[900]};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
    line-height: 1.35;
  }

  [data-theme='dark'] .om-pin-hover-title {
    color: #ffffff;
  }

  .om-pin-hover-meta {
    font-family: var(--font-traditional-body);
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    color: ${meok[500]};
    white-space: nowrap;
    line-height: 1.4;
  }

  .om-pin-hover-cat {
    flex-shrink: 0;
  }

  .om-pin-hover-sep {
    color: ${meok[400]};
    flex-shrink: 0;
    margin: 0 1px;
  }

  .om-pin-hover-dist {
    flex-shrink: 0;
    color: ${meok[500]};
    white-space: nowrap;
  }

  [data-theme='dark'] .om-pin-hover-meta {
    color: ${meok[400]};
  }

  [data-theme='dark'] .om-pin-hover-sep {
    color: rgba(255, 255, 255, 0.25);
  }

  [data-theme='dark'] .om-pin-hover-dist {
    color: ${meok[400]};
  }


  .om-pin-stamp-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #b91c1c;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 4px rgba(185, 28, 28, 0.4);
    pointer-events: none;
    z-index: 5;
  }


  .om-pin[data-selected='true'],
  .om-pin[data-detail='true'] {
    color: ${selectedMarkerLight.foreground} !important;
    background: ${selectedMarkerLight.background} !important;
    border-color: ${selectedMarkerLight.border} !important;
    box-shadow: 0 5px 18px -2px rgba(25, 31, 40, 0.28);
    transform: ${selectedMarkerLight.transform};
    animation: ${selectedMarkerLight.animation} !important;
    z-index: 40 !important;
    opacity: 1 !important;
  }

  [data-theme='dark'] .om-pin[data-selected='true'],
  [data-theme='dark'] .om-pin[data-detail='true'] {
    color: ${selectedMarkerDark.foreground} !important;
    background: ${selectedMarkerDark.background} !important;
    border-color: ${selectedMarkerDark.border} !important;
  }














  .om-pin--traditional {
    border: 2px solid #EAB308 !important;
    box-shadow:
      0 0 0 2.5px #FDE047,
      0 4px 16px rgba(234, 179, 8, 0.45),
      0 2px 6px rgba(0, 0, 0, 0.08) !important;
  }

  .om-pin--traditional::after {
    border-right: 2px solid #EAB308 !important;
    border-bottom: 2px solid #EAB308 !important;
    background: #ffffff !important;
  }


  .om-pin-trad-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1.5px 5.5px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;
    background: #FEF08A;
    color: #854D0E;
    flex-shrink: 0;
  }

  .om-pin--traditional::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 1px;
    width: 14px;
    height: 14px;
    pointer-events: none;
  }







  [data-theme='dark'] .om-pin--traditional {
    filter: invert(100%) hue-rotate(180deg) brightness(105%) contrast(95%);
    background: #191F28 !important;
    color: #ffffff !important;
    border: 2px solid #FACC15 !important;
    box-shadow:
      0 0 0 2.5px #FDE047,
      0 0 18px rgba(250, 204, 21, 0.85),
      0 6px 18px rgba(0, 0, 0, 0.6) !important;
  }

  [data-theme='dark'] .om-pin--traditional::after {
    background: #191F28 !important;
    border-right: 2px solid #FACC15 !important;
    border-bottom: 2px solid #FACC15 !important;
  }

  [data-theme='dark'] .om-pin--traditional .om-pin-trad-chip {
    background: #FEF08A !important;
    color: #854D0E !important;
    font-weight: 800 !important;
  }

  [data-theme='dark'] .om-pin--traditional::before {
    color: #FACC15 !important;
    text-shadow: 0 0 8px rgba(250, 204, 21, 0.95) !important;
  }


  @keyframes om-star-twinkle {
    0% { transform: scale(1) rotate(0deg); }
    45% { transform: scale(1.65) rotate(90deg); }
    70% { transform: scale(1.15) rotate(150deg); }
    100% { transform: scale(1.35) rotate(180deg); }
  }

  @keyframes om-star-burst {
    0% { opacity: 0.35; transform: scale(0.5) rotate(0deg); }
    50% { opacity: 1; transform: scale(1.5) rotate(70deg); }
    100% { opacity: 0.95; transform: scale(1.1) rotate(110deg); }
  }






  .om-pin-stars {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }

  .om-pin-stars span {
    position: absolute;
    line-height: 1;
    color: #EAB308;
    opacity: 1;
    font-weight: 700;
    text-shadow: 0 0 6px rgba(250, 204, 21, 0.7);
    transform-origin: 50% 50%;
    transition: opacity 0.2s ease;
  }

  [data-theme='dark'] .om-pin-stars span {
    color: #FACC15 !important;
    opacity: 1 !important;
    text-shadow: 0 0 8px rgba(250, 204, 21, 0.95) !important;
  }

  .om-pin--traditional:hover .om-pin-stars span,
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span,
  .om-badge-pin--traditional:hover .om-pin-stars span,
  .om-badge-pin--traditional[data-hovered='true'] .om-pin-stars span {
    animation: om-star-burst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  }

  .om-pin--traditional:hover .om-pin-stars span:nth-child(2),
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(2),
  .om-badge-pin--traditional:hover .om-pin-stars span:nth-child(2),
  .om-badge-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(2) {
    animation-delay: 0.07s;
  }

  .om-pin--traditional:hover .om-pin-stars span:nth-child(3),
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(3),
  .om-badge-pin--traditional:hover .om-pin-stars span:nth-child(3),
  .om-badge-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(3) {
    animation-delay: 0.14s;
  }

  .om-pin--traditional:hover .om-pin-stars span:nth-child(4),
  .om-pin--traditional[data-hovered='true'] .om-pin-stars span:nth-child(4) {
    animation-delay: 0.21s;
  }

  .om-pin--traditional:hover,
  .om-pin--traditional[data-hovered='true'] {
    transform: translateY(-10px) scale(1.12);
    box-shadow:
      0 0 0 3px #FDE047,
      0 0 24px rgba(250, 204, 21, 0.95),
      0 14px 28px -6px rgba(25, 31, 40, 0.28) !important;
  }

  .om-pin--traditional:hover::before,
  .om-pin--traditional[data-hovered='true']::before {
    animation: om-star-twinkle 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }






  .om-pin[data-selected='true']::after,
  .om-pin[data-detail='true']::after {
    background: ${selectedMarkerLight.background} !important;
    border-color: ${selectedMarkerLight.border} !important;
  }

  [data-theme='dark'] .om-pin[data-selected='true']::after,
  [data-theme='dark'] .om-pin[data-detail='true']::after {
    background: ${selectedMarkerDark.background} !important;
    border-color: ${selectedMarkerDark.border} !important;
  }

  .om-pin[data-selected='true'] .om-pin-icon-box,
  .om-pin[data-detail='true'] .om-pin-icon-box {
    background: #ffffff !important;
    color: #191F28 !important;
  }








  .om-badge-pin {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: #ffffff;
    border: 1.5px solid rgba(25, 31, 40, 0.1);
    box-shadow: 0 2px 8px rgba(25, 31, 40, 0.16);
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    user-select: none;
  }

  .om-badge-pin::before {
    content: '';
    position: absolute;
    inset: 3px;
    border: 1px dashed rgba(25, 31, 40, 0.18);
    border-radius: 6px;
    pointer-events: none;
  }

  .om-badge-icon-inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .om-badge-pin:hover,
  .om-badge-pin[data-hovered='true'] {
    transform: translateY(-4px) scale(1.18);
    box-shadow: 0 6px 18px rgba(25, 31, 40, 0.24);
    z-index: 100 !important;
  }

  .om-badge-pin:active {
    transform: scale(0.88);
    transition: transform 0.08s ease;
  }

  .om-badge-pin--traditional {
    border: 2px solid #EAB308 !important;
    box-shadow: 0 2px 10px rgba(234, 179, 8, 0.35) !important;
  }

  [data-theme='dark'] .om-badge-pin--traditional::before {
    border-color: rgba(250, 204, 21, 0.4);
  }

  [data-theme='dark'] .om-badge-pin--traditional {
    background: #191F28 !important;
    border: 2px solid #FACC15 !important;
    box-shadow: 0 2px 12px rgba(250, 204, 21, 0.5) !important;
  }

  .om-badge-pin[data-selected='true'],
  .om-badge-pin[data-detail='true'] {
    transform: none;
    background: ${selectedMarkerLight.background} !important;
    border-color: ${selectedMarkerLight.border} !important;
    box-shadow: 0 3px 10px rgba(25, 31, 40, 0.24);
    z-index: 40 !important;
    opacity: 1 !important;
    animation: none !important;
  }

  [data-theme='dark'] .om-badge-pin[data-selected='true'],
  [data-theme='dark'] .om-badge-pin[data-detail='true'] {
    background: ${selectedMarkerDark.background} !important;
    border-color: ${selectedMarkerDark.border} !important;
  }

  .om-badge-pin[data-selected='true']::before,
  .om-badge-pin[data-detail='true']::before {
    border-color: rgba(255, 255, 255, 0.3);
  }

  .om-badge-pin[data-selected='true'] .om-badge-icon-inner,
  .om-badge-pin[data-detail='true'] .om-badge-icon-inner {
    background: #ffffff !important;
    border-color: #ffffff !important;
  }


  .om-hanok-mark {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${palette.juhong[500]};
    border: 1.5px solid #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    z-index: 10;
    pointer-events: none;
    box-sizing: border-box;
  }

  .om-pin:focus-visible,
  .om-badge-pin:focus-visible,
  .om-region-overlay:focus-visible {
    outline: 3px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
    z-index: 45 !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .om-pin,
    .om-badge-pin,
    .om-region-overlay,
    .om-pin-hover-card,
    .om-pin--traditional,
    .om-badge-pin--traditional,
    .om-pin--traditional::before,
    .om-pin-stars span {
      transition: none !important;
      animation: none !important;
    }

    .om-pin-eq span {
      animation: none !important;
      height: 6px;
    }

    .om-pin[data-selected='true'],
    .om-pin[data-detail='true'],
    .om-badge-pin[data-selected='true'],
    .om-badge-pin[data-detail='true'] {
      animation: none !important;
      transform: none;
    }
  }
`;


function wrapForEntrance(el: HTMLElement, transformOrigin: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'inline-block';
  wrapper.style.transformOrigin = transformOrigin;
  wrapper.appendChild(el);
  return wrapper;
}


function burstIn(wrappers: HTMLDivElement[]): void {
  if (wrappers.length === 0) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(wrappers, { scale: 1, opacity: 1 });
    return;
  }
  gsap.fromTo(
    wrappers,
    { scale: 0.4, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: 'back.out(1.6)',
      stagger: { amount: Math.min(0.35, wrappers.length * 0.012), from: 'center' },
      overwrite: true,
    },
  );
}

type OverlayRecord = { overlay: any; el: HTMLElement; map: any; markerKey: string };

const OVERLAY_BUDGET_DESKTOP = 120;
const OVERLAY_BUDGET_MOBILE = 80;
const OVERLAY_HARD_CAP = 200;
const CULL_OVERSCAN = 0.30;

function cullToViewport(items: ReturnType<typeof selectInfoMarkerItems>, map: any): ReturnType<typeof selectInfoMarkerItems> {
  const bounds = map.getBounds?.();
  if (!bounds) return items;
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const dLat = (ne.getLat() - sw.getLat()) * CULL_OVERSCAN;
  const dLng = (ne.getLng() - sw.getLng()) * CULL_OVERSCAN;
  const minLat = sw.getLat() - dLat;
  const maxLat = ne.getLat() + dLat;
  const minLng = sw.getLng() - dLng;
  const maxLng = ne.getLng() + dLng;
  return items.filter(
    (item) => item.lat >= minLat && item.lat <= maxLat && item.lng >= minLng && item.lng <= maxLng,
  );
}

function applyBudget(items: ReturnType<typeof selectInfoMarkerItems>, map: any): ReturnType<typeof selectInfoMarkerItems> {
  const isMobile = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches;
  const cap = Math.min(isMobile ? OVERLAY_BUDGET_MOBILE : OVERLAY_BUDGET_DESKTOP, OVERLAY_HARD_CAP);
  if (items.length <= cap) return items;
  const center = map.getCenter?.();
  if (!center) return items.slice(0, cap);
  const cLat = center.getLat();
  const cLng = center.getLng();
  return items
    .map((item) => ({ item, d: (item.lat - cLat) ** 2 + (item.lng - cLng) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, cap)
    .map(({ item }) => item);
}

export default function PlaceMarkers() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const viewportItems = useMapStore((s) => s.viewportItems);
  const viewportRenderMode = useMapStore((s) => s.viewportRenderMode);
  const infoCategory = useMapStore((s) => s.infoCategory);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const detailId = useMapStore((s) => s.detailId);
  const userLocation = useMapStore((s) => s.userLocation);
  const searchCenter = useMapStore((s) => s.searchCenter);
  const committedLat = useMapStore((s) => s.committedViewport.center.lat);
  const committedLng = useMapStore((s) => s.committedViewport.center.lng);
  const committedLevel = useMapStore((s) => s.committedViewport.level);

  const overlayMapRef = useRef<Map<string, OverlayRecord>>(new Map());
  const prevHoveredIdRef = useRef<string | null>(null);
  const prevSelectedIdRef = useRef<string | null>(null);
  const prevDetailIdRef = useRef<string | null>(null);
  const prevRenderModeRef = useRef<string | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const activeAnimsRef = useRef<Animation[]>([]);
  const markerEntranceStateRef = useRef<MarkerEntranceState>({
    hasRendered: false,
    category: infoCategory,
    pendingCategory: false,
  });

  useEffect(() => {
    // Phase 3: detect renderMode boundary and zoom direction before touching overlays
    const prevRenderMode = prevRenderModeRef.current;
    const modeChanged = prevRenderMode !== null && prevRenderMode !== viewportRenderMode;
    const prevLevel = prevLevelRef.current;
    // Kakao: lower level = zoomed in, higher level = zoomed out
    const zoomDir: ZoomDir =
      prevLevel === null ? 'none'
      : committedLevel < prevLevel ? 'in'
      : committedLevel > prevLevel ? 'out'
      : 'none';
    prevRenderModeRef.current = viewportRenderMode ?? prevRenderMode;
    prevLevelRef.current = committedLevel;

    const presentation = getInfoPlaceMarkerPresentation(viewportRenderMode);
    const allActiveItems = presentation === 'full'
      ? selectInfoMarkerItems(viewportRenderMode, viewportItems)
      : [];
    if (!map || mode !== 'info' || allActiveItems.length === 0 || !window.kakao?.maps) {
      // On mode boundary with no new items, retire gracefully
      if (modeChanged && overlayMapRef.current.size > 0) {
        retireOverlays(Array.from(overlayMapRef.current.values()));
      } else {
        overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
      }
      overlayMapRef.current.clear();
      return;
    }

    // On renderMode boundary: cancel stale animations, then retire current overlays
    if (modeChanged) {
      cancelActiveAnimations(activeAnimsRef.current);
      if (overlayMapRef.current.size > 0) {
        const outAnims = retireOverlays(Array.from(overlayMapRef.current.values()));
        activeAnimsRef.current.push(...outAnims);
        overlayMapRef.current.clear();
      }
    }

    // Phase 1: cull to viewport + overscan, then enforce overlay budget
    const culled = cullToViewport(allActiveItems, map);
    const degradedPath = allActiveItems.length > culled.length;
    const activeItems = applyBudget(culled, map);

    const entranceDecision = advanceMarkerEntranceState(markerEntranceStateRef.current, {
      category: infoCategory,
      markerCount: activeItems.length,
      reducedMotion: Boolean(
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      ),
    });
    markerEntranceStateRef.current = entranceDecision.state;
    const shouldAnimate = entranceDecision.animate;
    const targetItems = activeItems;
    const targetIds = new Set(targetItems.map((item) => item.id));
    overlayMapRef.current.forEach((record, id) => {
      if (record.map !== map || !targetIds.has(id)) {
        record.overlay.setMap(null);
        overlayMapRef.current.delete(id);
      }
    });
    const entranceWrappers: HTMLDivElement[] = [];

    targetItems.forEach((item) => {
      const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.spot;





      const estimate = calculateTravelEstimate(
        { lat: item.lat, lng: item.lng },
        userLocation,
        searchCenter,
      );
      const metaText = estimate.fullLabel;
      const distInfo = estimate.travelTimeStr
        ? `${estimate.distanceStr} · ${estimate.travelTimeStr}`
        : estimate.distanceStr;

      const placeIsHanok = item.isTraditional === true || isHanok(item);

      const catLabel = item.category === 'stay'
        ? (placeIsHanok ? '한옥 숙소' : '주변 숙소')
        : item.category === 'cafe'
          ? (placeIsHanok ? '한옥 카페' : '카페')
          : item.category === 'food'
            ? (placeIsHanok ? '전통 맛집' : '음식점')
            : item.category === 'spot'
              ? '고택'
              : item.category === 'culture'
                ? '문화유산'
                : item.category === 'experience'
                  ? '전통 체험'
                  : item.category === 'festival'
                    ? '축제'
                    : '전통 시장';

      const markerKey = `${item.category}|${item.name}|${item.lat}|${item.lng}|${item.image}|${item.isTraditional}`;
      const existing = overlayMapRef.current.get(item.id);
      if (existing?.markerKey === markerKey) {
        existing.el.setAttribute('aria-label', `${item.name}, ${catLabel}${metaText ? `, ${metaText}` : ''}. 상세 정보 열기`);
        const hoverDist = existing.el.querySelector('.om-pin-hover-dist');
        if (hoverDist) hoverDist.textContent = distInfo;
        const pinDist = existing.el.querySelector('.om-pin-dist');
        if (pinDist) pinDist.textContent = distInfo;
        return;
      }
      if (existing) {
        existing.overlay.setMap(null);
        overlayMapRef.current.delete(item.id);
      }
      const el = document.createElement('div');






      const buildHoverCard = () => {
        if (el.querySelector('.om-pin-hover-card')) return;

        const card = document.createElement('div');
        card.className = 'om-pin-hover-card';
        card.innerHTML = `
          ${imgSrc ? `<img src="${imgSrc}" alt="" class="om-pin-hover-thumb" />` : ''}
          <h5 class="om-pin-hover-title">${escapeHtml(item.name)}</h5>
          <div class="om-pin-hover-meta">
            <span class="om-pin-hover-cat" style="color: ${catStyle.main}; font-weight: 700;">${escapeHtml(catLabel)}</span>
            ${distInfo ? `<span class="om-pin-hover-sep">·</span><span class="om-pin-hover-dist">${escapeHtml(distInfo)}</span>` : ''}
          </div>
        `;
        el.appendChild(card);
      };

      const imgSrc = safeImageUrl(item.image);

      el.className = 'om-pin';
      el.style.position = 'relative';
      el.innerHTML = `
        <span class="om-pin-icon-box" style="background: ${catStyle.lightBg}; border: 1px solid ${catStyle.lightBorder}; color: ${catStyle.main};">${renderCategoryIconSvg(item.category, 16)}</span>
        <span class="om-pin-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        ${placeIsHanok ? '<span class="om-pin-hanok-tag">한옥</span>' : ''}
        ${distInfo ? `<span class="om-pin-dist">${escapeHtml(distInfo)}</span>` : ''}
      `;

      el.dataset.category = item.category;
      // Set initial selection state so the O(1) patch effect doesn't need to run on creation
      el.dataset.selected = String(item.id === selectedId || item.id === detailId);
      el.dataset.detail = String(item.id === detailId);
      el.dataset.hovered = String(item.id === hoveredId);





      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute(
        'aria-label',
        `${item.name}, ${catLabel}${metaText ? `, ${metaText}` : ''}. 상세 정보 열기`,
      );


      const isVisited = useStampStore.getState().isPlaceVisited(item.id);
      if (isVisited) {
        const badge = document.createElement('span');
        badge.className = 'om-pin-stamp-badge';
        badge.setAttribute('title', '수결첩에 기록된 한옥');
        badge.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        el.appendChild(badge);
      }

      const open = () => {
        const store = useMapStore.getState();
        store.setSelectedId(item.id);
        store.setDetailId(item.id);
        if (store.map) {
          focusMapOnPlace(store.map, item.lat, item.lng, store.panelOpen);
        }
        store.setSheetSnap('full');
        if (!store.isWarmthWriteOpen) {
          toast('이 장소에서의 기억, 온기로 남겨보세요 🔥', { duration: 2500 });
        }
      };

      el.addEventListener('click', () => {
        if (
          window.matchMedia?.('(hover: none)').matches
          && useMapStore.getState().hoveredId !== item.id
        ) {
          buildHoverCard();
          useMapStore.getState().setHoveredId(item.id);
          return;
        }
        open();
      });
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

      const handleMouseEnter = () => {
        if (window.matchMedia?.('(hover: none)').matches) return;
        buildHoverCard();
        overlay.setZIndex(100);
        const store = useMapStore.getState();
        if (store.hoveredId !== item.id) store.setHoveredId(item.id);
      };
      const handleMouseLeave = () => {
        const store = useMapStore.getState();
        const isDetail = item.id === store.detailId;
        const isSelected = item.id === store.selectedId;
        overlay.setZIndex(isDetail ? 35 : isSelected ? 30 : 1);
        if (store.hoveredId === item.id) {
          store.setHoveredId(null);
        }
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('focus', handleMouseEnter);
      el.addEventListener('blur', handleMouseLeave);

      const wrapper = wrapForEntrance(el, 'center bottom');
      entranceWrappers.push(wrapper);

      const initZIndex = item.id === hoveredId ? 100 : item.id === detailId ? 35 : item.id === selectedId ? 30 : 1;
      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(item.lat, item.lng),
        content: wrapper,
        yAnchor: 1.0,
        zIndex: initZIndex,
      });
      overlay.setMap(map);
      overlayMapRef.current.set(item.id, { overlay, el, map, markerKey });
    });

    if (modeChanged && canCrossfade()) {
      // Mode boundary: WAAPI scale+fade-in, no GSAP burst; track for cancellation
      const inAnims = entranceWrappers
        .map((w) => fadeInEl(w, zoomDir, degradedPath))
        .filter((a): a is Animation => a !== null);
      activeAnimsRef.current.push(...inAnims);
    } else if (shouldAnimate) {
      // First entry or explicit category change: GSAP burst, capped to center 50
      burstIn(entranceWrappers.slice(0, 50));
      if (entranceWrappers.length > 50) {
        gsap.set(entranceWrappers.slice(50), { scale: 1, opacity: 1 });
      }
    }

  }, [
    map,
    mode,
    viewportItems,
    viewportRenderMode,
    infoCategory,
    userLocation,
    searchCenter,
    committedLat,
    committedLng,
    committedLevel,
    selectedId,
    hoveredId,
    detailId,
  ]);

  useEffect(() => () => {
    cancelActiveAnimations(activeAnimsRef.current);
    overlayMapRef.current.forEach((record) => record.overlay.setMap(null));
    overlayMapRef.current.clear();
  }, []);



  // O(1) patch: only touch the 2-6 overlays whose state actually changed
  useEffect(() => {
    const overlayMap = overlayMapRef.current;
    if (overlayMap.size === 0) return;

    const affected = new Set<string>();
    if (prevHoveredIdRef.current) affected.add(prevHoveredIdRef.current);
    if (hoveredId) affected.add(hoveredId);
    if (prevSelectedIdRef.current) affected.add(prevSelectedIdRef.current);
    if (selectedId) affected.add(selectedId);
    if (prevDetailIdRef.current) affected.add(prevDetailIdRef.current);
    if (detailId) affected.add(detailId);

    affected.forEach((id) => {
      const rec = overlayMap.get(id);
      if (!rec) return;
      const isDetail = id === detailId;
      const isSelected = id === selectedId || isDetail;
      const isHovered = id === hoveredId;
      rec.el.dataset.selected = String(isSelected);
      rec.el.dataset.detail = String(isDetail);
      rec.el.dataset.hovered = String(isHovered);
      rec.overlay.setZIndex(isHovered ? 100 : isDetail ? 35 : isSelected ? 30 : 1);
    });

    prevHoveredIdRef.current = hoveredId;
    prevSelectedIdRef.current = selectedId;
    prevDetailIdRef.current = detailId;
  }, [selectedId, hoveredId, detailId]);

  return <Global styles={styles} />;
}
