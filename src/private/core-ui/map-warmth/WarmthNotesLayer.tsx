'use client';

import { useEffect, useMemo } from 'react';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, darkPalette, surface , fontSize } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { paintOverlays, type OverlaySpec } from '@/features/map/hooks/overlay';
import { escapeHtml } from '@/features/map/utils/formatters';
import { mapIconSvg } from '@/features/map/utils/mapIconSvg';
import { getCuratedPlace } from '@/features/map/data/curatedPlaces';
import type { Item, Warmth } from '@/features/map/types';









const GOTHIC_FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

const ICONS = {
  mapPin: mapIconSvg('mapPin', 11),
  flame: mapIconSvg('flame', 10),
  wind: mapIconSvg('leaf', 10),
  quote: mapIconSvg('messageCircle', 11),
  chevronLeft: mapIconSvg('chevronLeft', 12),
  chevronRight: mapIconSvg('chevronRight', 12),
};

function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}일 전`;
    return '얼마 전';
  } catch {
    return '최근';
  }
}

const styles = css`



  @keyframes om-note-appear {
    0% {
      opacity: 0;
      transform: translate(-50%, -100%) translateY(8px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -100%) translateY(0) scale(1);
    }
  }

  .om-warmth-note-wrap {
    position: relative;
    transform: translate(-50%, -100%);
    cursor: pointer;
    user-select: none;
    pointer-events: auto;
    z-index: 22;
    animation: om-note-appear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0.1s ease;
  }

  .om-warmth-note-wrap:hover {
    transform: translate(-50%, -100%) translateY(-5px) scale(1.03);
    z-index: 85 !important;
  }







  .om-warmth-note-wrap.is-compact {
    transform: translate(-50%, -50%);
    animation: none;
  }

  .om-warmth-note-wrap.is-compact:hover {
    transform: translate(-50%, -50%) scale(1.06);
  }

  .om-note-pin {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 9px;
    border-radius: 9999px;
    background: ${surface.light.card};
    box-shadow: 0 4px 14px -2px rgba(25, 31, 40, 0.22);
    font-family: ${GOTHIC_FONT};
    white-space: nowrap;
  }

  [data-theme='dark'] .om-note-pin {
    background: ${surface.dark.surface};
    box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.6);
  }

  .om-note-pin-mark {
    display: inline-flex;
    color: ${meok[400]};
  }

  .om-note-pin-place {
    font-size: ${fontSize.xs};
    font-weight: 500;
    color: ${meok[900]};
  }

  [data-theme='dark'] .om-note-pin-place {
    color: ${meok[100]};
  }

  .om-note-pin-count {
    min-width: 15px;
    padding: 0 4px;
    border-radius: 9999px;
    background: ${meok[900]};
    color: #ffffff;
    font-size: ${fontSize.micro};
    font-weight: 700;
    line-height: 15px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  [data-theme='dark'] .om-note-pin-count {
    background: ${meok[100]};
    color: ${meok[900]};
  }

  .om-warmth-note-card {
    position: relative;
    width: 264px;
    padding: 11px 14px 10px 14px;
    border-radius: 14px;
    border: none;
    font-family: ${GOTHIC_FONT};
    transition: all 0.2s ease;
  }


  [data-theme='light'] .om-warmth-note-card,
  :root:not([data-theme='dark']) .om-warmth-note-card {
    background: ${surface.light.card};
    box-shadow: 0 10px 26px -4px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04);
  }


  [data-theme='dark'] .om-warmth-note-card {
    background: ${surface.dark.surface};
    box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.75), 0 2px 6px rgba(0, 0, 0, 0.4);
  }


  .om-warmth-note-card::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: ${surface.light.card};
  }

  [data-theme='dark'] .om-warmth-note-card::after {
    border-top-color: ${surface.dark.surface};
  }


  .om-note-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 5px;
  }

  .om-note-place {
    font-size: ${fontSize.xs};
    font-weight: 700;
    color: ${meok[900]};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-flex;
    align-items: center;
    gap: 3.5px;
    flex: 1;
  }

  [data-theme='dark'] .om-note-place {
    color: ${meok[200]};
  }

  .om-note-head-right {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    flex: none;
  }


  .om-note-content-row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 5px -8px 7px -8px;
    min-height: 38px;
  }

  .om-inner-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 36px;
    border: none;
    background: transparent;
    color: ${meok[400]};
    cursor: pointer;
    border-radius: 6px;
    padding: 0;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .om-inner-nav-btn:hover {
    background: rgba(25, 31, 40, 0.06);
    color: ${lightPalette.juhong[500]};
  }

  .om-inner-nav-btn.om-btn-prev {
    margin-left: 2px;
  }

  .om-inner-nav-btn.om-btn-next {
    margin-right: 2px;
  }

  [data-theme='dark'] .om-inner-nav-btn {
    color: ${meok[400]};
  }

  [data-theme='dark'] .om-inner-nav-btn:hover {
    background: ${meok[700]};
    color: ${darkPalette.juhong[400]};
  }

  .om-note-page-indicator {
    font-size: ${fontSize.micro};
    font-weight: 700;
    color: ${meok[500]};
    font-variant-numeric: tabular-nums;
  }

  .om-note-badge {
    display: inline-flex;
    align-items: center;
    gap: 2.5px;
    padding: 1.5px 5.5px;
    border-radius: 9999px;
    font-size: ${fontSize.micro};
    font-weight: 700;
    white-space: nowrap;
  }

  .om-note-badge.mood-busy {
    background: ${lightPalette.juhong[50]};
    color: ${lightPalette.juhong[700]};
  }

  [data-theme='dark'] .om-note-badge.mood-busy {
    background: ${darkPalette.juhong[900]};
    color: ${darkPalette.juhong[100]};
  }

  .om-note-badge.mood-quiet {
    background: ${lightPalette.cheongrok[50]};
    color: ${lightPalette.cheongrok[700]};
  }

  [data-theme='dark'] .om-note-badge.mood-quiet {
    background: ${darkPalette.cheongrok[900]};
    color: ${darkPalette.cheongrok[100]};
  }


  .om-note-body {
    flex: 1;
    padding: 0 8px;
    font-size: ${fontSize.xs};
    line-height: 1.45;
    font-weight: 500;
    color: ${meok[900]};
    word-break: keep-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    letter-spacing: -0.2px;
    min-height: 34px;
    text-align: center;
  }

  [data-theme='dark'] .om-note-body {
    color: ${meok[100]};
  }

  .om-note-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    font-size: ${fontSize.micro};
    color: ${meok[500]};
  }

  .om-note-hint-btn {
    border: none;
    background: transparent;
    padding: 2px 6px;
    font-size: ${fontSize.micro};
    font-weight: 700;
    color: ${lightPalette.juhong[500]};
    cursor: pointer;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    transition: all 0.15s ease;
  }

  .om-note-hint-btn:hover {
    background: ${lightPalette.juhong[50]};
    color: ${lightPalette.juhong[700]};
  }

  [data-theme='dark'] .om-note-hint-btn {
    color: ${darkPalette.juhong[400]};
  }

  [data-theme='dark'] .om-note-hint-btn:hover {
    background: ${darkPalette.juhong[900]};
  }
`;

interface NoteCluster {
  id: string;
  lat: number;
  lng: number;
  notes: Warmth[];
}

export default function WarmthNotesLayer() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const warmths = useMapStore((s) => s.warmths);
  const level = useMapStore((s) => s.level);
  const center = useMapStore((s) => s.center);
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  useEffect(() => {

    if (!map || mode !== 'warmth') return;










    const compact = level >= 8;

    const bounds = map.getBounds?.();
    const projection = map.getProjection?.();


    const validWarmths = warmths.filter((w) => w.text && w.text.trim().length > 0);
    if (validWarmths.length === 0) return;


    let inBoundsList = validWarmths;
    if (bounds && window.kakao?.maps) {
      inBoundsList = validWarmths.filter((w) =>
        bounds.contain(new window.kakao.maps.LatLng(w.lat, w.lng)),
      );
    }

    if (inBoundsList.length === 0) return;


    const getScreenDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      if (!projection) return 9999;
      const p1 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat1, lng1));
      const p2 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat2, lng2));
      return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    };

    const getScreenDelta = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      if (!projection) return { dx: 9999, dy: 9999 };
      const p1 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat1, lng1));
      const p2 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat2, lng2));
      return { dx: Math.abs(p2.x - p1.x), dy: Math.abs(p2.y - p1.y) };
    };

    const clusters: NoteCluster[] = [];
    const used = new Set<string>();

    inBoundsList.forEach((w) => {
      if (used.has(w.id)) return;

      const group: Warmth[] = [w];
      used.add(w.id);

      inBoundsList.forEach((other) => {
        if (used.has(other.id)) return;

        const isSamePlace = other.placeId === w.placeId;
        const delta = getScreenDelta(w.lat, w.lng, other.lat, other.lng);


        const cardCollision = compact
          ? Math.hypot(delta.dx, delta.dy) < 60
          : delta.dx < 230 && delta.dy < 95;

        if (isSamePlace || cardCollision) {
          group.push(other);
          used.add(other.id);
        }
      });

      clusters.push({
        id: `note-cluster-${w.placeId}-${w.id}`,
        lat: w.lat,
        lng: w.lng,
        notes: group,
      });
    });




    const placedBoxes: { x: number; y: number }[] = [];
    const nonCollidingClusters: NoteCluster[] = [];


    const sortedClusters = [...clusters].sort((a, b) => b.notes.length - a.notes.length);

    sortedClusters.forEach((cluster) => {
      if (!projection) {
        nonCollidingClusters.push(cluster);
        return;
      }
      const pt = projection.pointFromCoords(new window.kakao.maps.LatLng(cluster.lat, cluster.lng));
      if (!pt) return;

      const cardW = compact ? 80 : 250;
      const cardH = compact ? 30 : 95;

      const collides = placedBoxes.some((box) => {
        return Math.abs(box.x - pt.x) < cardW && Math.abs(box.y - pt.y) < cardH;
      });

      if (!collides) {
        placedBoxes.push(pt);
        nonCollidingClusters.push(cluster);
      } else {

        const nearest = nonCollidingClusters[0];
        if (nearest) {
          cluster.notes.forEach((n) => {
            if (!nearest.notes.some((existing) => existing.id === n.id)) {
              nearest.notes.push(n);
            }
          });
        }
      }
    });

    const maxClusters = compact ? 12 : 5;
    const finalClusters = nonCollidingClusters.slice(0, maxClusters);


    const specs: OverlaySpec[] = finalClusters.map((cluster) => {
      let currentIndex = 0;
      const notes = cluster.notes;

      const el = document.createElement('div');
      el.className = 'om-warmth-note-wrap';






      if (compact) {
        el.classList.add('is-compact');
        el.innerHTML = `
          <div class="om-note-pin">
            <span class="om-note-pin-mark">${ICONS.quote}</span>
            <span class="om-note-pin-place">${escapeHtml(notes[0].placeName)}</span>
            ${notes.length > 1 ? `<span class="om-note-pin-count">${notes.length}</span>` : ''}
          </div>
        `;

        el.addEventListener('click', () => {
          const m = useMapStore.getState().map;
          if (!m) return;
          m.setLevel(6, { animate: true });
          m.panTo(new window.kakao.maps.LatLng(cluster.lat, cluster.lng));
        });

        return { lat: cluster.lat, lng: cluster.lng, el, yAnchor: 1.1, zIndex: 24 };
      }

      const openDetailForCurrentNote = () => {
        const currentNote = notes[currentIndex];
        const store = useMapStore.getState();


        if (store.map && window.kakao?.maps) {
          store.map.panTo(new window.kakao.maps.LatLng(currentNote.lat, currentNote.lng));
        }


        const matched = store.items.find(
          (it) =>
            it.id === currentNote.placeId ||
            it.name.includes(currentNote.placeName) ||
            currentNote.placeName.includes(it.name),
        );

        const targetId = matched?.id || currentNote.placeId;


        if (!matched) {
          const curated = getCuratedPlace(currentNote.placeId, currentNote.placeName);
          const newItem: Item = {
            id: targetId,
            name: currentNote.placeName,
            category: (curated?.category as any) || 'spot',
            lat: currentNote.lat,
            lng: currentNote.lng,
            addr: curated?.addr1 || '전통 문화 명소',
            image: curated?.images?.[0] || null,
            tel: curated?.tel || null,
            dist: null,
            isTraditional: true,
          };
          store.setItems([...store.items, newItem]);
        }


        store.setSelectedId(targetId);
        store.setDetailId(targetId);
        store.setSheetSnap('full');


        if (!store.panelOpen) {
          store.setPanelOpen(true);
        }
      };

      const renderCardContent = () => {
        const note = notes[currentIndex];
        const isBusy = note.mood === '북적';
        const badgeClass = isBusy ? 'mood-busy' : 'mood-quiet';
        const badgeText = isBusy ? '따스한 정' : '고즈넉함';
        const badgeIcon = isBusy ? ICONS.flame : ICONS.wind;
        const timeAgo = formatTimeAgo(note.createdAt);

        const cleanText = note.text.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').trim();

        const prevBtnHtml =
          notes.length > 1
            ? `
              <button type="button" class="om-inner-nav-btn om-btn-prev" aria-label="이전 후기">
                ${ICONS.chevronLeft}
              </button>
            `
            : '';

        const nextBtnHtml =
          notes.length > 1
            ? `
              <button type="button" class="om-inner-nav-btn om-btn-next" aria-label="다음 후기">
                ${ICONS.chevronRight}
              </button>
            `
            : '';

        el.innerHTML = `
          <div class="om-warmth-note-card">
            <div class="om-note-head">
              <span class="om-note-place">${ICONS.mapPin} ${escapeHtml(note.placeName)}</span>
              <span class="om-note-badge ${badgeClass}">${badgeIcon} ${badgeText}</span>
            </div>

            <div class="om-note-content-row">
              ${prevBtnHtml}
              <div class="om-note-body">
                ${escapeHtml(cleanText)}
              </div>
              ${nextBtnHtml}
            </div>

            <div class="om-note-foot">
              <span>${timeAgo}</span>
              ${notes.length > 1 ? `<span class="om-note-page-indicator">${currentIndex + 1} / ${notes.length}</span>` : ''}
              <button type="button" class="om-note-hint-btn" aria-label="${escapeHtml(note.placeName)} 상세 정보 보기">
                상세보기
              </button>
            </div>
          </div>
        `;


        if (notes.length > 1) {
          const prevBtn = el.querySelector('.om-btn-prev');
          const nextBtn = el.querySelector('.om-btn-next');

          prevBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + notes.length) % notes.length;
            renderCardContent();
          });

          nextBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % notes.length;
            renderCardContent();
          });
        }


        const hintBtn = el.querySelector('.om-note-hint-btn');
        hintBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          openDetailForCurrentNote();
        });
      };

      renderCardContent();


      el.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.om-inner-nav-btn')) return;
        openDetailForCurrentNote();
      });

      const setZIndex = (z: number) => {
        const overlay = (el as any).__kakaoOverlay;
        if (overlay && typeof overlay.setZIndex === 'function') {
          overlay.setZIndex(z);
        }
        let parent: HTMLElement | null = el.parentElement;
        while (parent && parent !== document.body) {
          if (parent.style && (parent.style.position === 'absolute' || parent.style.zIndex)) {
            parent.style.zIndex = String(z);
            break;
          }
          parent = parent.parentElement;
        }
      };

      el.addEventListener('mouseenter', () => {
        setZIndex(99999);
      });

      el.addEventListener('mouseleave', () => {
        setZIndex(25);
      });

      return {
        lat: cluster.lat,
        lng: cluster.lng,
        el,
        yAnchor: 1.25,
        zIndex: 25,
      };
    });

    const cleanup = paintOverlays(map, specs);
    return () => {
      if (cleanup) cleanup();
    };
  }, [map, mode, warmths, level, center, isDark]);

  if (mode !== 'warmth') return null;

  return <Global styles={styles} />;
}
