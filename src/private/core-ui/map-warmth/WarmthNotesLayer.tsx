'use client';

import { useEffect, useRef } from 'react';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, darkPalette, surface, typographyRole } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { escapeHtml } from '@/features/map/utils/formatters';
import { mapIconSvg } from '@/features/map/utils/mapIconSvg';
import { getCuratedPlace } from '@/features/map/data/curatedPlaces';
import type { Item, Warmth } from '@/features/map/types';









const GOTHIC_FONT = "'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

const ICONS = {
  mapPin: mapIconSvg('mapPin', 14),
  flame: mapIconSvg('flame', 11),
  wind: mapIconSvg('leaf', 11),
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
    font-size: ${typographyRole.label.fontSize};
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
    font-size: ${typographyRole.caption.fontSize};
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
    width: 284px;
    padding: 12px 14px 11px 14px;
    border-radius: 14px;
    border: none;
    font-family: ${GOTHIC_FONT};
    transition: all 0.2s ease;
    box-sizing: border-box;
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
    gap: 8px;
    margin-bottom: 6px;
  }

  .om-note-place {
    font-size: 13px;
    font-weight: 700;
    color: ${meok[900]};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .om-note-place-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: ${lightPalette.hwanggeum[600]};
  }

  [data-theme='dark'] .om-note-place {
    color: ${meok[200]};
  }

  [data-theme='dark'] .om-note-place-icon {
    color: ${darkPalette.hwanggeum[400]};
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
    align-items: stretch;
    justify-content: space-between;
    margin: 4px -4px 6px -4px;
    min-height: 42px;
  }

  .om-inner-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 20px;
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
    color: ${lightPalette.hwanggeum[500]};
  }

  .om-inner-nav-btn.om-btn-prev {
    margin-left: 0;
  }

  .om-inner-nav-btn.om-btn-next {
    margin-right: 0;
  }

  [data-theme='dark'] .om-inner-nav-btn {
    color: ${meok[400]};
  }

  [data-theme='dark'] .om-inner-nav-btn:hover {
    background: ${meok[700]};
    color: ${darkPalette.hwanggeum[400]};
  }

  .om-note-page-indicator {
    font-size: ${typographyRole.caption.fontSize};
    font-weight: 600;
    color: ${meok[500]};
    font-variant-numeric: tabular-nums;
  }

  .om-note-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    letter-spacing: -0.2px;
  }

  .om-note-badge.mood-busy {
    background: ${lightPalette.hwanggeum[50]};
    color: ${lightPalette.hwanggeum[700]};
  }

  [data-theme='dark'] .om-note-badge.mood-busy {
    background: ${darkPalette.hwanggeum[900]};
    color: ${darkPalette.hwanggeum[100]};
  }

  .om-note-badge.mood-quiet {
    background: var(--color-action-secondary-bg);
    color: var(--color-action-secondary);
  }

  .om-note-body {
    flex: 1;
    padding: 0 4px;
    font-size: 12.5px;
    line-height: 1.5;
    font-weight: 400;
    color: ${meok[800]};
    word-break: break-all;
    overflow-wrap: anywhere;
    white-space: normal;
    display: -webkit-box !important;
    -webkit-line-clamp: 3 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    text-overflow: ellipsis;
    letter-spacing: -0.2px;
    text-align: left;
  }

  [data-theme='dark'] .om-note-body {
    color: ${meok[100]};
  }

  .om-note-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    font-size: ${typographyRole.caption.fontSize};
    color: ${meok[500]};
  }

  .om-note-hint-btn {
    border: none;
    background: transparent;
    padding: 2px 6px;
    font-size: ${typographyRole.caption.fontSize};
    font-weight: 700;
    color: ${lightPalette.hwanggeum[500]};
    cursor: pointer;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    transition: all 0.15s ease;
  }

  .om-note-hint-btn:hover {
    background: ${lightPalette.hwanggeum[50]};
    color: ${lightPalette.hwanggeum[700]};
  }

  [data-theme='dark'] .om-note-hint-btn {
    color: ${darkPalette.hwanggeum[400]};
  }

  [data-theme='dark'] .om-note-hint-btn:hover {
    background: ${darkPalette.hwanggeum[900]};
  }
`;

interface NoteCluster {
  id: string;
  placeId: string;
  lat: number;
  lng: number;
  notes: Warmth[];
}

type WarmthOverlayRecord = {
  overlay: any;
  el: HTMLElement;
  clusterKey: string;
  notesCount: number;
};

export default function WarmthNotesLayer() {
  const map = useMapStore((s) => s.map);
  const mode = useMapStore((s) => s.mode);
  const warmths = useMapStore((s) => s.warmths);
  const level = useMapStore((s) => s.level);
  const center = useMapStore((s) => s.center);
  const { mode: colorMode } = useOnmaruTheme();
  const isDark = colorMode === 'dark';

  const overlayMapRef = useRef(new Map<string, WarmthOverlayRecord>());

  // 모드가 변경되거나 컴포넌트가 언마운트될 때 오버레이 정리
  useEffect(() => {
    if (mode !== 'warmth') {
      overlayMapRef.current.forEach((rec: WarmthOverlayRecord) => rec.overlay.setMap(null));
      overlayMapRef.current.clear();
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      overlayMapRef.current.forEach((rec: WarmthOverlayRecord) => rec.overlay.setMap(null));
      overlayMapRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!map || mode !== 'warmth' || !window.kakao?.maps) return;

    const compact = level >= 8;

    const validWarmths = warmths.filter((w) => w.text && w.text.trim().length > 0);
    if (validWarmths.length === 0) {
      overlayMapRef.current.forEach((rec: WarmthOverlayRecord) => rec.overlay.setMap(null));
      overlayMapRef.current.clear();
      return;
    }

    // 현재 지도 뷰포트 영역(bounds) 가져오기 (오버스캔 0.5 적용으로 화면 주변 말풍선도 유지)
    const bounds = map.getBounds?.();
    let inViewWarmths = validWarmths;
    if (bounds) {
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const dLat = (ne.getLat() - sw.getLat()) * 0.5;
      const dLng = (ne.getLng() - sw.getLng()) * 0.5;
      const minLat = sw.getLat() - dLat;
      const maxLat = ne.getLat() + dLat;
      const minLng = sw.getLng() - dLng;
      const maxLng = ne.getLng() + dLng;

      inViewWarmths = validWarmths.filter(
        (w) => w.lat >= minLat && w.lat <= maxLat && w.lng >= minLng && w.lng <= maxLng,
      );
    }

    // 장소(placeId 또는 좌표) 기준으로 1차 그룹화
    const placeMap = new Map<string, Warmth[]>();
    inViewWarmths.forEach((w) => {
      const key = w.placeId || `${w.lat.toFixed(4)}_${w.lng.toFixed(4)}`;
      const list = placeMap.get(key) || [];
      list.push(w);
      placeMap.set(key, list);
    });

    // 장소 단위 클러스터 목록 생성
    const rawClusters: NoteCluster[] = [];
    placeMap.forEach((notes, key) => {
      const first = notes[0];
      rawClusters.push({
        id: `note-place-${key}`,
        placeId: first.placeId,
        lat: first.lat,
        lng: first.lng,
        notes,
      });
    });

    // 줌 레벨에 따른 위경도 클러스터링 거리 임계값
    // level 4 이하(1km 이하 상세 줌)에서는 클러스터링을 최소화하여 각 장소의 말풍선이 온전히 보이도록 함
    const geoThreshold = compact ? 0.05 : level <= 4 ? 0.0008 : Math.max(0.002, (level - 2) * 0.002);

    const mergedClusters: NoteCluster[] = [];
    const visited = new Set<string>();

    // 후기가 많은 장소부터 우선권 부여
    const sortedRaw = [...rawClusters].sort((a, b) => b.notes.length - a.notes.length);

    sortedRaw.forEach((c) => {
      if (visited.has(c.id)) return;
      visited.add(c.id);

      const groupNotes = [...c.notes];

      sortedRaw.forEach((other) => {
        if (visited.has(other.id)) return;
        const dLat = Math.abs(c.lat - other.lat);
        const dLng = Math.abs(c.lng - other.lng);
        const dist = Math.hypot(dLat, dLng);

        if (dist < geoThreshold) {
          visited.add(other.id);
          other.notes.forEach((n) => {
            if (!groupNotes.some((ex) => ex.id === n.id)) {
              groupNotes.push(n);
            }
          });
        }
      });

      mergedClusters.push({
        id: c.id,
        placeId: c.placeId,
        lat: c.lat,
        lng: c.lng,
        notes: groupNotes,
      });
    });

    // 화면 내에 노출할 최대 개수 (확대 시 충분히 많이 보여주어 사라짐 방지)
    const maxClusters = compact ? 20 : level <= 4 ? 30 : 15;
    const finalClusters = mergedClusters.slice(0, maxClusters);

    const currentClusterKeys = new Set(finalClusters.map((c) => `${c.id}_${compact ? 'compact' : 'full'}`));

    // 화면 영역을 벗어났거나 제거된 클러스터 오버레이 정리
    overlayMapRef.current.forEach((rec: WarmthOverlayRecord, key: string) => {
      if (!currentClusterKeys.has(key)) {
        rec.overlay.setMap(null);
        overlayMapRef.current.delete(key);
      }
    });

    // 새 클러스터 오버레이 생성 또는 기존 오버레이 유지
    finalClusters.forEach((cluster) => {
      const clusterKey = `${cluster.id}_${compact ? 'compact' : 'full'}`;
      const existing = overlayMapRef.current.get(clusterKey);

      // 이미 생성되어 있고 후기 개수도 동일하다면 다시 그리지 않고 그대로 유지
      if (existing && existing.notesCount === cluster.notes.length) {
        return;
      }

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
          m.setLevel(4, { animate: true });
          m.panTo(new window.kakao.maps.LatLng(cluster.lat, cluster.lng));
        });

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(cluster.lat, cluster.lng),
          content: el,
          yAnchor: 1.1,
          zIndex: 24,
        });
        (el as any).__kakaoOverlay = overlay;
        overlay.setMap(map);

        if (existing) {
          existing.overlay.setMap(null);
        }
        overlayMapRef.current.set(clusterKey, {
          overlay,
          el,
          clusterKey,
          notesCount: notes.length,
        });
        return;
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
              <span class="om-note-place">
                <span class="om-note-place-icon">${ICONS.mapPin}</span>
                ${escapeHtml(note.placeName)}
              </span>
              <span class="om-note-badge ${badgeClass}">${badgeIcon} ${badgeText}</span>
            </div>

            <div class="om-note-content-row">
              ${prevBtnHtml}
              <div class="om-note-body" style="display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;word-break:break-all;overflow-wrap:anywhere;white-space:normal;line-height:1.5;">
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
      };

      el.addEventListener('mouseenter', () => {
        setZIndex(99999);
      });

      el.addEventListener('mouseleave', () => {
        setZIndex(25);
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(cluster.lat, cluster.lng),
        content: el,
        yAnchor: 1.25,
        zIndex: 25,
      });
      (el as any).__kakaoOverlay = overlay;
      overlay.setMap(map);

      if (existing) {
        existing.overlay.setMap(null);
      }
      overlayMapRef.current.set(clusterKey, {
        overlay,
        el,
        clusterKey,
        notesCount: notes.length,
      });
    });
  }, [map, mode, warmths, level, center.lat, center.lng, isDark]);

  if (mode !== 'warmth') return null;

  return <Global styles={styles} />;
}

