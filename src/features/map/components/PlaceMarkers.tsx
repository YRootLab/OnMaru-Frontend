'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { gsap } from 'gsap';
import { logger } from '@/lib/log';
import { meok, lightPalette , fontSize } from '@/design-system/tokens';
import { escapeHtml, safeImageUrl } from '@/features/map/utils/formatters';
import { mapIconSvg, type MapIconName } from '@/features/map/utils/mapIconSvg';
import { calculateTravelEstimate, isTraditionalPlace, shortRegionName } from '@/features/map/utils/geo';
import { useMapStore } from '../hooks/useMapStore';
import { useStampStore } from '@/features/stamp/hooks/useStampStore';
import type { Item, PlaceCategory } from '../types';

const log = logger('map');


const LABEL_MAX_LEVEL = 5;
const PIN_MAX_LEVEL = 6;









const LABEL_PIN_LIMIT = 60;
const BADGE_PIN_LIMIT = 40;


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
    iconSvg: string;
  }
> = {

  spot: {
    main: '#2F68FF',
    lightBg: 'rgba(47, 104, 255, 0.12)',
    lightBorder: 'rgba(47, 104, 255, 0.28)',
    border: '#2F68FF',
    iconSvg: renderCategoryIconSvg('spot', 14),
  },

  culture: {
    main: '#1748CF',
    lightBg: 'rgba(23, 72, 207, 0.12)',
    lightBorder: 'rgba(23, 72, 207, 0.28)',
    border: '#1748CF',
    iconSvg: renderCategoryIconSvg('culture', 14),
  },

  stay: {
    main: '#FF5414',
    lightBg: 'rgba(255, 84, 20, 0.12)',
    lightBorder: 'rgba(255, 84, 20, 0.28)',
    border: '#FF5414',
    iconSvg: renderCategoryIconSvg('stay', 14),
  },

  food: {
    main: '#D93600',
    lightBg: 'rgba(217, 54, 0, 0.12)',
    lightBorder: 'rgba(217, 54, 0, 0.28)',
    border: '#D93600',
    iconSvg: renderCategoryIconSvg('food', 14),
  },

  cafe: {
    main: '#00B882',
    lightBg: 'rgba(0, 184, 130, 0.12)',
    lightBorder: 'rgba(0, 184, 130, 0.28)',
    border: '#00B882',
    iconSvg: renderCategoryIconSvg('cafe', 14),
  },

  experience: {
    main: '#FF2A6D',
    lightBg: 'rgba(255, 42, 109, 0.12)',
    lightBorder: 'rgba(255, 42, 109, 0.28)',
    border: '#FF2A6D',
    iconSvg: renderCategoryIconSvg('experience', 14),
  },

  festival: {
    main: '#673AB7',
    lightBg: 'rgba(103, 58, 183, 0.12)',
    lightBorder: 'rgba(103, 58, 183, 0.28)',
    border: '#673AB7',
    iconSvg: renderCategoryIconSvg('festival', 14),
  },

  market: {
    main: '#00825B',
    lightBg: 'rgba(0, 130, 91, 0.12)',
    lightBorder: 'rgba(0, 130, 91, 0.28)',
    border: '#00825B',
    iconSvg: renderCategoryIconSvg('market', 14),
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




  @keyframes om-click-bounce {
    0%   { transform: translateY(-2px) scale(1); }
    25%  { transform: translateY(-14px) scale(1.18); }
    55%  { transform: translateY(-1px) scale(0.96); }
    75%  { transform: translateY(-8px) scale(1.08); }
    100% { transform: translateY(-6px) scale(1.15); }
  }






  .om-pin {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 3px 12px 3px 4.5px;
    border-radius: 14px;
    background: #ffffff;
    border: 1.5px solid rgba(25, 31, 40, 0.12);
    box-shadow: 0 4px 16px -2px rgba(25, 31, 40, 0.22), 0 1px 4px rgba(25, 31, 40, 0.1);
    font-size: ${fontSize.xs};
    font-weight: 700;
    line-height: 1;
    color: ${meok[900]};
    white-space: nowrap;
    cursor: pointer;
    transform: translateY(-2px);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background 0.15s ease, color 0.15s ease;
    user-select: none;
  }

  .om-pin:hover,
  .om-pin[data-hovered='true'] {
    transform: translateY(-10px) scale(1.12);
    box-shadow: 0 12px 28px -2px rgba(25, 31, 40, 0.32);
    z-index: 100 !important;
    animation: none !important;
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
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
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
    transform: translate(-50%, 6px) scale(0.9);
    width: max-content;
    min-width: 220px;
    max-width: 275px;
    padding: 10px 12px;
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 12px 32px -4px rgba(25, 31, 40, 0.22), 0 1px 4px rgba(25, 31, 40, 0.08);
    pointer-events: none;
    opacity: 0;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
    transform: translate(-50%, 0) scale(1);
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


  @keyframes om-ripple-expand {
    0% {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0.85;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.8);
      opacity: 0;
    }
  }

  .om-pin-ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    pointer-events: none;
    border: 2px solid #d4af37;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, rgba(212, 175, 55, 0) 75%);
    animation: om-ripple-expand 0.55s cubic-bezier(0.12, 0.8, 0.32, 1) forwards;
    z-index: 10;
  }


  @keyframes om-glow-ring {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7), 0 8px 24px -2px rgba(25, 31, 40, 0.45);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(212, 175, 55, 0), 0 10px 28px -2px rgba(25, 31, 40, 0.55);
    }
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
    color: #ffffff !important;
    background: #191F28 !important;
    border-color: #d4af37 !important;
    box-shadow: 0 8px 26px -2px rgba(25, 31, 40, 0.45);
    animation: om-click-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, om-glow-ring 2.4s ease-in-out infinite !important;
    z-index: 40 !important;
    opacity: 1 !important;
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
    background: #191F28 !important;
    border-color: #191F28 !important;
  }

  .om-pin[data-selected='true'] .om-pin-icon-box,
  .om-pin[data-detail='true'] .om-pin-icon-box {
    background: #ffffff !important;
    color: #191F28 !important;
  }

  .om-pin[data-dimmed='true'],
  .om-badge-pin[data-dimmed='true'] {
    opacity: 0.35;
    filter: grayscale(30%);
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
    transform: translateY(-4px) scale(1.25);
    background: #191F28 !important;
    box-shadow: 0 6px 20px rgba(25, 31, 40, 0.45);
    z-index: 40 !important;
    opacity: 1 !important;
    animation: om-click-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
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


  .om-cluster-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px 5px 8px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(12px);
    border: none;
    box-shadow: 0 6px 18px -2px rgba(25, 31, 40, 0.16), 0 1px 4px rgba(25, 31, 40, 0.08);
    cursor: pointer;
    transform: translate(-50%, -50%);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    user-select: none;
    white-space: nowrap;
  }

  .om-cluster-pill:hover {
    transform: translate(-50%, -54%) scale(1.12);
    box-shadow: 0 10px 24px -3px rgba(25, 31, 40, 0.22);
    z-index: 40 !important;
  }

  .om-cluster-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${lightPalette.kobalt[50]};
    color: ${lightPalette.kobalt[700]};
    flex-shrink: 0;
  }

  .om-cluster-region-name {
    font-size: ${fontSize.xs};
    font-weight: 700;
    color: ${meok[900]};
    letter-spacing: -0.2px;
  }

  .om-cluster-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 9999px;
    background: ${lightPalette.kobalt[500]};
    color: #ffffff;
    font-size: ${fontSize.xs};
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }







  .om-pin:focus-visible,
  .om-badge-pin:focus-visible,
  .om-cluster-pill:focus-visible {
    outline: 3px solid ${lightPalette.juhong[500]};
    outline-offset: 3px;
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.9);
    z-index: 45 !important;
  }







  @media (prefers-reduced-motion: reduce) {
    .om-pin,
    .om-badge-pin,
    .om-cluster-pill,
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


function extractClusterRegionName(clusterItems: Item[]): string {
  const counts: Record<string, number> = {};

  for (const item of clusterItems) {
    if (!item.addr) continue;


    const name = shortRegionName(item.addr);
    if (name.length >= 2) counts[name] = (counts[name] || 0) + 1;
  }

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '한옥명소';
}

interface ClusterGroup {
  lat: number;
  lng: number;
  items: Item[];
}







function clusterNearbyItems(items: Item[], level: number): ClusterGroup[] {
  const cellSize =
    level >= 11 ? 0.85 :
    level >= 10 ? 0.45 :
    level >= 9 ? 0.22 :
    level >= 8 ? 0.08 :
    level >= 7 ? 0.04 :
    0.02;
  const grid = new Map<string, Item[]>();

  for (const item of items) {
    const cellX = Math.round(item.lng / cellSize);
    const cellY = Math.round(item.lat / cellSize);
    const key = `${cellX}_${cellY}`;

    const cellItems = grid.get(key) || [];
    cellItems.push(item);
    grid.set(key, cellItems);
  }

  const clusters: ClusterGroup[] = [];
  grid.forEach((cellItems) => {
    let sumLat = 0;
    let sumLng = 0;
    for (const item of cellItems) {
      sumLat += item.lat;
      sumLng += item.lng;
    }
    clusters.push({
      lat: sumLat / cellItems.length,
      lng: sumLng / cellItems.length,
      items: cellItems,
    });
  });

  return clusters;
}










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

type OverlayRecord = { overlay: any; el: HTMLElement };

export default function PlaceMarkers() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const items = useMapStore((s) => s.items);
  const category = useMapStore((s) => s.category);
  const level = useMapStore((s) => s.level);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const detailId = useMapStore((s) => s.detailId);
  const userLocation = useMapStore((s) => s.userLocation);
  const searchCenter = useMapStore((s) => s.searchCenter);


  const overlayMapRef = useRef<Map<string, OverlayRecord>>(new Map());


  useEffect(() => {
    if (!map || mode !== 'info' || items.length === 0 || !window.kakao?.maps) {

      overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
      overlayMapRef.current.clear();
      return;
    }


    overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
    overlayMapRef.current.clear();

    const activeItems =
      category && category !== 'all' && category !== 'bookmark'
        ? items.filter((it) => it.category === category)
        : items;

    if (activeItems.length === 0) return;

    const isCluster = level > PIN_MAX_LEVEL;

    if (isCluster) {
      const clusters = clusterNearbyItems(activeItems, level);
      const entranceWrappers: HTMLDivElement[] = [];

      clusters.forEach((cluster, idx) => {
        const count = cluster.items.length;
        const regionName = extractClusterRegionName(cluster.items);
        const topItem = cluster.items[0];
        const catStyle = CATEGORY_STYLES[topItem.category] || CATEGORY_STYLES.spot;
        const isSingle = count === 1;

        const el = document.createElement('div');
        el.className = 'om-cluster-pill';

        el.innerHTML = `
          <span class="om-cluster-icon-box" style="background: ${catStyle.lightBg}; color: ${catStyle.main}; border: 1px solid ${catStyle.lightBorder};">
            ${catStyle.iconSvg}
          </span>
          <span class="om-cluster-region-name">${escapeHtml(isSingle ? topItem.name : regionName)}</span>
          ${!isSingle ? `<span class="om-cluster-count-badge" style="background: ${catStyle.main}">${count}</span>` : ''}
        `;

        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', isSingle ? `${topItem.name}. 상세 보기` : `${regionName} 지역 ${count}곳. 확대해서 보기`);

        const handleClick = () => {
          if (isSingle) {
            const store = useMapStore.getState();
            store.setSelectedId(topItem.id);
            store.setDetailId(topItem.id);
            store.map?.panTo(new window.kakao.maps.LatLng(topItem.lat, topItem.lng));
            store.setSheetSnap('full');
          } else {
            const currentLevel = map.getLevel();
            const targetLevel = Math.max(1, currentLevel - 2);
            map.setLevel(targetLevel, { animate: true });
            map.panTo(new window.kakao.maps.LatLng(cluster.lat, cluster.lng));
          }
        };

        el.addEventListener('click', handleClick);
        el.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClick();
          }
        });

        const wrapper = wrapForEntrance(el, 'center center');
        entranceWrappers.push(wrapper);

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(cluster.lat, cluster.lng),
          content: wrapper,
          yAnchor: 0.5,
          zIndex: 10,
        });
        overlay.setMap(map);
        overlayMapRef.current.set(`cluster_${idx}`, { overlay, el });
      });

      burstIn(entranceWrappers);

      return () => {
        overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
        overlayMapRef.current.clear();
      };
    }









    const withLabel = level <= LABEL_MAX_LEVEL;
    const maxPins = withLabel ? LABEL_PIN_LIMIT : BADGE_PIN_LIMIT;










    const bounds = map.getBounds?.();
    const visibleItems =
      bounds && window.kakao?.maps
        ? activeItems.filter((it) =>
            bounds.contain(new window.kakao.maps.LatLng(it.lat, it.lng)),
          )
        : activeItems;

    const targetItems = (visibleItems.length > 0 ? visibleItems : activeItems).slice(0, maxPins);
    const entranceWrappers: HTMLDivElement[] = [];

    targetItems.forEach((item) => {
      const el = document.createElement('div');
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

      const isTraditional = item.isTraditional ?? isTraditionalPlace(item.name);

      const catLabel = isTraditional
        ? item.category === 'stay'
          ? '정통 한옥숙소'
          : item.category === 'cafe'
            ? '전통 찻집·한옥카페'
            : item.category === 'food'
              ? '향토·전통음식'
              : item.category === 'spot'
                ? '고택·명소'
                : '전통 문화'
        : item.category === 'stay'
          ? '주변 연계숙소'
          : item.category === 'cafe'
            ? '주변 일반카페'
            : item.category === 'food'
              ? '주변 일반음식점'
              : '관광명소';






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

      if (withLabel) {
        el.className = `om-pin${isTraditional ? ' om-pin--traditional' : ''}`;
        el.style.position = 'relative';
        const tradLabel = item.name.includes('한옥') || item.name.includes('고택') || item.category === 'stay' ? '한옥' : '전통';
        el.innerHTML = `
          <span class="om-pin-icon-box" style="background: ${catStyle.lightBg}; border: 1px solid ${catStyle.lightBorder}; color: ${catStyle.main};">${catStyle.iconSvg}</span>
          ${isTraditional ? `<span class="om-pin-trad-chip">${tradLabel}</span>` : ''}
          <span>${escapeHtml(item.name)}</span>
        `;
        if (isTraditional) {





          const stars = document.createElement('span');
          stars.className = 'om-pin-stars';
          const starSvg = mapIconSvg('star', 11);
          stars.innerHTML = `
            <span style="top:-16px;left:14px;color:#EAB308;display:inline-flex;">${starSvg}</span>
            <span style="top:-9px;left:-6px;color:#EAB308;display:inline-flex;">${starSvg}</span>
            <span style="bottom:-13px;right:2px;color:#EAB308;display:inline-flex;">${starSvg}</span>
            <span style="bottom:-7px;right:18px;color:#EAB308;display:inline-flex;">${starSvg}</span>
          `;
          el.appendChild(stars);
        }
      } else {
        el.className = `om-badge-pin${isTraditional ? ' om-badge-pin--traditional' : ''}`;
        el.innerHTML = `
          <span class="om-badge-icon-inner" style="background: #ffffff; color: ${catStyle.main};">
            ${renderCategoryIconSvg(item.category, 16)}
          </span>
        `;
      }

      el.dataset.category = item.category;





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

        const ripple = document.createElement('span');
        ripple.className = 'om-pin-ripple';
        el.appendChild(ripple);
        setTimeout(() => {
          if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
        }, 580);

        const store = useMapStore.getState();
        store.setSelectedId(item.id);
        store.setDetailId(item.id);
        store.map?.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
        store.setSheetSnap('full');
      };

      el.addEventListener('click', open);
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      });

      const handleMouseEnter = () => {
        buildHoverCard();
        overlay.setZIndex(100);
        useMapStore.getState().setHoveredId(item.id);
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

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(item.lat, item.lng),
        content: wrapper,
        yAnchor: 1.0,
        zIndex: 1,
      });
      overlay.setMap(map);
      overlayMapRef.current.set(item.id, { overlay, el });
    });

    burstIn(entranceWrappers);

    return () => {
      overlayMapRef.current.forEach((val: OverlayRecord) => val.overlay.setMap(null));
      overlayMapRef.current.clear();
    };





  }, [map, mode, items, category, level, userLocation, searchCenter]);


  useEffect(() => {
    if (overlayMapRef.current.size === 0) return;

    overlayMapRef.current.forEach((val: OverlayRecord, id: string) => {
      const isDetail = id === detailId;
      const isSelected = id === selectedId || isDetail;
      const isHovered = id === hoveredId;
      const isDimmed = Boolean(detailId && !isDetail);

      val.el.dataset.selected = String(isSelected);
      val.el.dataset.detail = String(isDetail);
      val.el.dataset.hovered = String(isHovered);
      val.el.dataset.dimmed = String(isDimmed);

      const zIndex = isHovered ? 100 : isDetail ? 35 : isSelected ? 30 : 1;
      val.overlay.setZIndex(zIndex);
    });
  }, [selectedId, hoveredId, detailId]);

  return <Global styles={styles} />;
}
