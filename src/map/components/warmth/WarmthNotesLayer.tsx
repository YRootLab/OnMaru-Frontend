'use client';

import { useEffect, useMemo } from 'react';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, darkPalette, surface } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/map/hooks/useMapStore';
import { paintOverlays, type OverlaySpec } from '@/map/hooks/overlay';
import { escapeHtml } from '@/map/utils/formatters';
import type { Warmth } from '@/map/types';

/**
 * 온기 모드 전용: 지도 위 실시간 한 줄 방명록 레이어 (슬라이드 페이징 지원)
 *
 * 같은 장소나 인접한 공간에 여러 한 줄 평이 있을 경우,
 * 겹치지 않고 하나의 단아한 화이트 카드 안에서 [이전/다음] 버튼을 눌러
 * 차례대로 넘겨볼 수 있도록 스마트 클러스터링과 페이징을 제공합니다.
 */

const GOTHIC_FONT = "'Pretendard', 'SpoqaHanSansNeo', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif";

const ICONS = {
  mapPin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  flame: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  wind: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7A2.5 2.5 0 1 1 20 12H2"/><path d="M15.5 16.5A2.5 2.5 0 1 0 18 19H2"/><path d="M12.5 3.5A2.5 2.5 0 1 1 15 6H2"/></svg>`,
  chevronLeft: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
  chevronRight: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
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
  /* ------------------------------------------------------------
   * 페이징 지원 순백색 온기 쪽지 카드
   * ------------------------------------------------------------ */
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

  .om-warmth-note-card {
    position: relative;
    width: 242px;
    padding: 10px 12px 10px 12px;
    border-radius: 14px;
    border: none;
    font-family: ${GOTHIC_FONT};
    transition: all 0.2s ease;
  }

  /* 라이트 모드 (무조건 깨끗한 흰색 배경, 노보더) */
  [data-theme='light'] .om-warmth-note-card,
  :root:not([data-theme='dark']) .om-warmth-note-card {
    background: ${surface.light.card};
    box-shadow: 0 10px 26px -4px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  /* 다크 모드 */
  [data-theme='dark'] .om-warmth-note-card {
    background: ${surface.dark.surface};
    box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.75), 0 2px 6px rgba(0, 0, 0, 0.4);
  }

  /* 하단 말풍선 꼬리 화살표 */
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

  /* 헤더: 장소명 + 페이징 네비게이터 */
  .om-note-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 5px;
  }

  .om-note-place {
    font-size: 11.5px;
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

  /* 네모난 말풍선 카드 내부 좌우 화살표 레이아웃 */
  .om-note-content-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 4px 0 6px 0;
  }

  .om-inner-nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 32px;
    border: none;
    background: transparent;
    color: ${meok[500]};
    cursor: pointer;
    border-radius: 6px;
    padding: 0;
    flex: none;
    transition: all 0.15s ease;
  }

  .om-inner-nav-btn:hover {
    background: ${meok[200]};
    color: ${lightPalette.juhong[500]};
  }

  [data-theme='dark'] .om-inner-nav-btn {
    color: ${meok[400]};
  }

  [data-theme='dark'] .om-inner-nav-btn:hover {
    background: ${meok[700]};
    color: ${darkPalette.juhong[400]};
  }

  .om-note-page-indicator {
    font-size: 10px;
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
    font-size: 9.5px;
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

  /* 본문: 한 줄 평 */
  .om-note-body {
    flex: 1;
    font-size: 12px;
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
  }

  [data-theme='dark'] .om-note-body {
    color: ${meok[100]};
  }

  .om-note-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 10px;
    color: ${meok[500]};
  }

  .om-note-hint {
    font-size: 9.5px;
    color: ${lightPalette.juhong[500]};
    font-weight: 600;
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
    // 1. 온기 모드가 아니거나 지도가 없으면 표시하지 않음
    if (!map || mode !== 'warmth') return;

    // 2. [원칙 1: 줌 레벨 분리 (Semantic Zooming)]
    // 광역 뷰(level >= 8, 시·도 전국 조망)에서는 지도 여백을 위해 한줄평을 완전히 숨깁니다.
    // 마을/동네 단위(level <= 7)로 지도를 확대했을 때 비로소 한옥들의 한줄평 카드가 나타납니다.
    if (level >= 8) return;

    const bounds = map.getBounds?.();
    const projection = map.getProjection?.();

    // 3. 한줄평이 있는 유효한 온기 데이터 필터링
    const validWarmths = warmths.filter((w) => w.text && w.text.trim().length > 0);
    if (validWarmths.length === 0) return;

    // 현재 뷰포트 내 장소 필터링
    let inBoundsList = validWarmths;
    if (bounds && window.kakao?.maps) {
      inBoundsList = validWarmths.filter((w) =>
        bounds.contain(new window.kakao.maps.LatLng(w.lat, w.lng)),
      );
    }

    if (inBoundsList.length === 0) return;

    // 4. 같은 공간 / 인접 거리(화면상 100px 이내)의 후기들을 하나의 클러스터로 병합
    const getScreenDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      if (!projection) return 9999;
      const p1 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat1, lng1));
      const p2 = projection.pointFromCoords(new window.kakao.maps.LatLng(lat2, lng2));
      return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    };

    const clusters: NoteCluster[] = [];
    const used = new Set<string>();
    const clusterDistPx = level <= 4 ? 40 : level <= 6 ? 75 : 105;

    inBoundsList.forEach((w) => {
      if (used.has(w.id)) return;

      const group: Warmth[] = [w];
      used.add(w.id);

      inBoundsList.forEach((other) => {
        if (used.has(other.id)) return;

        // 같은 장소이거나, 화면상 인접한 거리(clusterDistPx 이내)에 있으면 묶음
        const isSamePlace = other.placeId === w.placeId;
        const distPx = getScreenDistance(w.lat, w.lng, other.lat, other.lng);

        if (isSamePlace || distPx < clusterDistPx) {
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

    // 5. [원칙 4: 화면당 최대 개수 5개로 엄격 제한 & 여백의 미 복원]
    const maxClusters = 5;
    const finalClusters = clusters.slice(0, maxClusters);

    // 6. 오버레이 스펙 생성
    const specs: OverlaySpec[] = finalClusters.map((cluster) => {
      let currentIndex = 0;
      const notes = cluster.notes;

      const el = document.createElement('div');
      el.className = 'om-warmth-note-wrap';

      const renderCardContent = () => {
        const note = notes[currentIndex];
        const isBusy = note.mood === '북적';
        const badgeClass = isBusy ? 'mood-busy' : 'mood-quiet';
        const badgeText = isBusy ? '따스한 정' : '고즈넉함';
        const badgeIcon = isBusy ? ICONS.flame : ICONS.wind;
        const timeAgo = formatTimeAgo(note.createdAt);

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
                "${escapeHtml(note.text)}"
              </div>
              ${nextBtnHtml}
            </div>

            <div class="om-note-foot">
              <span>${timeAgo}</span>
              ${notes.length > 1 ? `<span class="om-note-page-indicator">${currentIndex + 1} / ${notes.length}</span>` : ''}
              <span class="om-note-hint">상세보기</span>
            </div>
          </div>
        `;

        // 이전/다음 버튼 이벤트 바인딩
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
      };

      renderCardContent();

      // 카드 클릭 시 해당 후기의 장소 선택 및 상세 패널 오픈
      el.addEventListener('click', () => {
        const currentNote = notes[currentIndex];
        const m = useMapStore.getState().map;
        if (m) {
          m.panTo(new window.kakao.maps.LatLng(currentNote.lat, currentNote.lng));
        }
        useMapStore.getState().setSelectedId(currentNote.placeId);
        useMapStore.getState().setSheetSnap('half');
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
