'use client';

import { useEffect, useMemo } from 'react';
import { Global, css } from '@emotion/react';
import { meok, lightPalette, darkPalette, surface } from '@/design-system/tokens';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import { useMapStore } from '@/map/hooks/useMapStore';
import { paintOverlays, type OverlaySpec } from '@/map/hooks/overlay';
import { escapeHtml } from '@/map/utils/formatters';
import { getCuratedPlace } from '@/map/data/curatedPlaces';
import type { Item, Warmth } from '@/map/types';

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
  quote: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 7h4v4a4 4 0 0 1-4 4v-2a2 2 0 0 0 2-2H7V7Zm7 0h4v4a4 4 0 0 1-4 4v-2a2 2 0 0 0 2-2h-2V7Z"/></svg>`,
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

  /* ------------------------------------------------------------
   * 전국 뷰의 쪽지 핀
   *
   * 지도에서 채도 있는 색은 히트맵 하나뿐이다 — 색은 경고라는 규칙을 지켜야 하고,
   * 한줄평은 데이터가 아니라 사람의 말이라 조용한 편이 맞다. 그래서 먹빛과 흰 종이만 쓴다.
   * ------------------------------------------------------------ */
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
    font-size: 11.5px;
    font-weight: 600;
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
    font-size: 10px;
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

  /* 네모난 말풍선 카드 내부 좌우 화살표 레이아웃: <, > 버튼을 카드 양끝단으로 배치 */
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
    padding: 0 8px;
    font-size: 12.5px;
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
    font-size: 10px;
    color: ${meok[500]};
  }

  .om-note-hint-btn {
    border: none;
    background: transparent;
    padding: 2px 6px;
    font-size: 10px;
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
    // 1. 온기 모드가 아니거나 지도가 없으면 표시하지 않음
    if (!map || mode !== 'warmth') return;

    /*
      2. 줌에 따라 '형태'를 바꾼다 (Semantic Zooming)

      예전에는 광역 뷰(level >= 8)에서 한줄평을 통째로 숨겼다. 그런데 지도 기본값이
      level 11(전국)이라, 처음 지도를 연 사람은 한줄평이 있다는 사실조차 알 수 없었다.

      숨기는 대신 작게 만든다 — 전국에서는 어디에 이야기가 쌓였는지 알려주는 쪽지 핀,
      동네로 들어오면 문장이 보이는 카드. 여백은 카드를 접어서 지키고, 존재는 남긴다.
    */
    const compact = level >= 8;

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

    // 4. 같은 공간 / 인접 거리(화면상 카드 크기 기준)의 후기들을 하나의 클러스터로 병합
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

        // 카드가 겹치지 않도록 카드 폭(264px) 및 높이(100px) 범위 내 근접 스팟은 1개 카드로 합쳐 슬라이드 제공
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

    /*
      5. 화면당 개수 및 충돌 박스 디클러터링 (앞뒤 카드 겹침 원천 차단)
    */
    const placedBoxes: { x: number; y: number }[] = [];
    const nonCollidingClusters: NoteCluster[] = [];

    // 이야기 개수가 많은 대표 권역을 우선 배치
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
        // 충돌하는 경우 가장 가까운 배치된 카드에 후기들을 병합하여 이야기 누락 없이 슬라이드로 감상
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

    // 6. 오버레이 스펙 생성
    const specs: OverlaySpec[] = finalClusters.map((cluster) => {
      let currentIndex = 0;
      const notes = cluster.notes;

      const el = document.createElement('div');
      el.className = 'om-warmth-note-wrap';

      /*
        전국 뷰에서는 쪽지 핀 하나로 줄인다.
        문장은 읽을 수 없는 크기이므로 아예 싣지 않고, 장소와 쌓인 이야기 수만 말한다.
        누르면 그 마을로 들어가면서 카드로 펴진다.
      */
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

        // 1. 지도 이동
        if (store.map && window.kakao?.maps) {
          store.map.panTo(new window.kakao.maps.LatLng(currentNote.lat, currentNote.lng));
        }

        // 2. 일치하는 장소가 items에 있는지 확인 (ID 또는 장소명 기준)
        const matched = store.items.find(
          (it) =>
            it.id === currentNote.placeId ||
            it.name.includes(currentNote.placeName) ||
            currentNote.placeName.includes(it.name),
        );

        const targetId = matched?.id || currentNote.placeId;

        // 3. 만약 items에 해당 장소가 없다면 큐레이션된 정보로 Item을 생성하여 등록
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

        // 4. selectedId 및 detailId 설정 (데스크톱 DetailAside 및 모바일 BottomSheet 즉시 오픈)
        store.setSelectedId(targetId);
        store.setDetailId(targetId);
        store.setSheetSnap('full');

        // 5. 데스크톱 패널 닫혀있으면 오픈
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
        // 불필요한 따옴표 제거 (" " 굳이 필요 없음)
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

        // 상세보기 버튼 클릭 시 상세 정보 열기
        const hintBtn = el.querySelector('.om-note-hint-btn');
        hintBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          openDetailForCurrentNote();
        });
      };

      renderCardContent();

      // 카드 클릭 시 해당 후기의 장소 선택 및 상세 패널 오픈
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
