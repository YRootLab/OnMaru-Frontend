'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Map,
  RotateCcw,
  AlertCircle,
  Sparkles,
  List,
  Bookmark,
} from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import { useBookmarkStore } from '@/map/hooks/useBookmarkStore';
import { distanceInMeters } from '@/map/utils/geo';
import { PlaceListItem } from './PlaceListItem';
import LiveNoticeBanner from './feed/LiveNoticeBanner';
import FestivalExhibitionCarousel from './feed/FestivalExhibitionCarousel';
import OdiiSpotlightBanner from './feed/OdiiSpotlightBanner';
import SmartAroundFeed from './feed/SmartAroundFeed';
import type { Item, PlaceCategory } from '@/map/types';

const ITEMS_PER_PAGE = 10;

const CATEGORY_NAMES: Record<string, string> = {
  bookmark: '마음에 담은 곳',
  spot: '고택·명소',
  experience: '한복·전통체험',
  culture: '문화재·서원',
  festival: '야행·축제',
  stay: '한옥숙소',
  food: '향토음식',
  cafe: '한옥카페·디저트',
  market: '전통시장',
};

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  background: #ffffff;
`;

const FeedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  /* LiveNoticeBanner의 margin-bottom(12px)과 합쳐 아래 섹션들 사이 간격(32px)과
     동일한 리듬을 만든다 — 배너 바로 아래 "진행 중인 축제·기획전"만 유독
     붙어 보이지 않도록. */
  margin-top: 20px;
  margin-bottom: 40px;
`;

const CountLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15.5px;
  font-weight: 700;
  color: ${meok[900]};
  letter-spacing: -0.02em;
`;

const SortDropdownWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SortSelect = styled.select`
  appearance: none;
  background: transparent;

  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  color: ${meok[500]};
  padding: 2px 18px 2px 4px;
  cursor: pointer;
  outline: none;

  &:hover {
    color: ${meok[700]};
  }

  &:focus-visible {
    outline: 2px solid ${meok[500]};
    border-radius: 4px;
  }
`;

const SortChevron = styled(ChevronDown)`
  position: absolute;
  right: 0;
  pointer-events: none;
  color: ${meok[500]};
`;

const ListContainer = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
`;

/* ── 페이지네이션 스타일 ── */
const PaginationWrapper = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px 16px 28px;
`;

const PageNavBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 34px;
  padding: 0 10px;
  border-radius: 10px;
  border: none;
  background: rgba(78, 89, 104, 0.06);
  color: ${meok[500]};
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(78, 89, 104, 0.12);
    color: ${meok[900]};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const PageNumberGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 4px;
`;

const PageNumberBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  border-radius: 10px;
  border: none;
  background: ${({ $active }) => ($active ? meok[900] : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ $active }) =>
      $active ? '#000000' : 'rgba(78, 89, 104, 0.08)'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

/* ── 스켈레톤 로딩 (AGENTS.md 규칙: 정확한 크기 예약 & 중립 그레이 쉬머) ── */
const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding-bottom: 24px;
`;

const SkeletonItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 14px;
  box-sizing: border-box;
  width: 100%;
`;

const SkeletonThumb = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 11.2px;
  background: linear-gradient(90deg, #f2f2f0 25%, #e6e6e3 50%, #f2f2f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
  flex-shrink: 0;

  @media (max-width: 1023px) {
    width: 80px;
    height: 80px;
    border-radius: 10.2px;
  }
`;

const SkeletonContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 2px 36px 2px 0;
`;

const SkeletonBar = styled.div<{ $w: string; $h: string; $radius?: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: ${({ $radius }) => $radius || '4px'};
  background: linear-gradient(90deg, #f2f2f0 25%, #e6e6e3 50%, #f2f2f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
`;

/* ── 빈 상태 / 에러 상태 ── */
const EmptyStateBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
`;

const EmptyIconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(78, 89, 104, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[400]};
  margin-bottom: 14px;
`;

const EmptyTitle = styled.h4`
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: ${meok[900]};
`;

const EmptyDesc = styled.p`
  margin: 0 0 18px;
  font-size: 13px;
  font-weight: 400;
  color: ${meok[500]};
  line-height: 1.5;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;

  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.08);
  color: ${meok[700]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(40, 110, 95, 0.12);
    color: ${lightPalette.cheongrok[700]};
  }

  &:active {
    transform: scale(0.97);
  }
`;

export default function PlaceList() {
  const map = useMapStore((s) => s.map);
  const items = useMapStore((s) => s.items);
  const userLocation = useMapStore((s) => s.userLocation);
  const center = useMapStore((s) => s.center);
  const loading = useMapStore((s) => s.loading);
  const error = useMapStore((s) => s.error);
  const category = useMapStore((s) => s.category);
  const currentAddress = useMapStore((s) => s.currentAddress);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const sortOrder = useMapStore((s) => s.sortOrder);
  const setSortOrder = useMapStore((s) => s.setSortOrder);
  const setDetailId = useMapStore((s) => s.setDetailId);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setHoveredId = useMapStore((s) => s.setHoveredId);
  const reload = useMapStore((s) => s.reload);

  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const listTopRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 정렬 및 북마크 필터링 처리 (GPS 내 위치 또는 지도 중심 기준 정밀 정렬)
  const sortedItems = useMemo(() => {
    let list = [...items];
    if (category === 'bookmark') {
      const bookmarkedIdSet = new Set(bookmarks.map((b) => b.id));
      list = list.filter((item) => bookmarkedIdSet.has(item.id));
      const existingIds = new Set(list.map((item) => item.id));
      bookmarks.forEach((b) => {
        if (!existingIds.has(b.id)) {
          list.push({
            id: b.id,
            name: b.name,
            category: (b.category as PlaceCategory) || 'spot',
            lat: b.lat || 37.5665,
            lng: b.lng || 126.978,
            addr: b.addr || '',
            image: b.image || null,
            tel: null,
            dist: null,
          });
        }
      });
    }
    if (sortOrder === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }

    const basePoint = userLocation || center;
    return list.sort((a, b) => {
      const distA =
        a.lat && a.lng && basePoint
          ? distanceInMeters(basePoint, { lat: a.lat, lng: a.lng })
          : (a.dist ?? 1e9);
      const distB =
        b.lat && b.lng && basePoint
          ? distanceInMeters(basePoint, { lat: b.lat, lng: b.lng })
          : (b.dist ?? 1e9);
      return distA - distB;
    });
  }, [items, sortOrder, category, bookmarks, userLocation, center]);

  // 필터, 정렬, 지역 변경 시 1페이지로 리셋 — effect가 아니라 렌더 중 비교로
  // 처리해(React 공식 권장 패턴) 불필요한 커밋 사이클을 만들지 않는다.
  const resetKey = `${category ?? ''}|${currentAddress ?? ''}|${sortOrder}|${items.length}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setCurrentPage(1);
  }

  // 사용자가 명시적으로 카테고리를 변경할 때만 최상단으로 이동
  // (새로고침 시나 주소 지오코딩 완료 시 아래에서 위로 올라오는 스크롤 현상 방지)
  const isMountedRef = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    listTopRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [category]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, validPage]);

  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, validPage - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [validPage, totalPages]);

  const handlePageChange = (page: number) => {
    const target = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(target);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 축제/행사 아이템 필터링
  const festivalItems = useMemo(() => {
    return items.filter((item) => item.category === 'festival');
  }, [items]);

  // 정확한 헤더 타이틀 라벨 계산 (로딩 중 '0곳' 깜빡임 방지)
  const headerTitle = useMemo(() => {
    const regionName = currentAddress ? currentAddress.replace(/대한민국\s*/, '') || '전국' : '전체';
    if (loading && items.length === 0) {
      if (category) {
        const name = CATEGORY_NAMES[category] || '한옥명소';
        return `${name} 목록`;
      }
      return `${regionName} 명소 목록`;
    }
    if (category) {
      const name = CATEGORY_NAMES[category] || '한옥명소';
      return `${name} ${sortedItems.length}곳`;
    }
    return `${regionName} ${sortedItems.length}곳`;
  }, [category, currentAddress, sortedItems.length, loading, items.length]);

  // 장소 선택 핸들러: 스토어에 selectedId, detailId 지정 및 지도 이동
  const handleSelect = (item: Item) => {
    setSelectedId(item.id);
    setDetailId(item.id);
    if (map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
    }
    useMapStore.getState().setSheetSnap('full');
  };

  // 지도 넓게 보기 (줌아웃 2단계)
  const handleZoomOut = () => {
    if (!map) return;
    const currentLevel = map.getLevel();
    map.setLevel(Math.min(10, currentLevel + 2), { animate: true });
  };

  const isAllCategory = !category || category === 'all';

  return (
    <div>
      <div ref={listTopRef} />

      {/* 1. 실시간 공지/소식 롤링 띠배너 */}
      <LiveNoticeBanner />

      {/* 2. 전체 탭일 때 네이버 지도 스타일의 풍성한 스마트 큐레이션 피드 렌더링 */}
      {isAllCategory && (
        <FeedWrapper>
          {/* 진행 중인 지역 축제 & 기획전 캐러셀 */}
          <FestivalExhibitionCarousel festivals={festivalItems} />

          {/* 오디(Odii) 시네마틱 오디오 투어 스포트라이트 배너 */}
          <OdiiSpotlightBanner />

          {/* 네이버 스마트어라운드형 추천 포토 카드 피드 */}
          <SmartAroundFeed items={sortedItems} />
        </FeedWrapper>
      )}

      {/* 3. 장소 목록 헤더 */}
      <StickyHeader>
        <CountLabel aria-live="polite">
          <List size={15} color={meok[700]} strokeWidth={2} />
          <span>{headerTitle}</span>
        </CountLabel>

        <SortDropdownWrapper>
          <SortSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'dist' | 'name')}
            aria-label="장소 정렬 순서"
          >
            <option value="dist">거리순</option>
            <option value="name">이름순</option>
          </SortSelect>
          <SortChevron size={14} strokeWidth={2} />
        </SortDropdownWrapper>
      </StickyHeader>

      {/* 4. 장소 목록 컨텐츠 */}
      {loading && items.length === 0 ? (
        <SkeletonWrapper aria-busy="true" aria-label="장소 목록을 불러오는 중입니다">
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <SkeletonItem key={key}>
              <SkeletonThumb />
              <SkeletonContent>
                <SkeletonBar $w="64%" $h="19px" $radius="4px" />
                <div style={{ display: 'flex', gap: '5px' }}>
                  <SkeletonBar $w="50px" $h="20px" $radius="6px" />
                  <SkeletonBar $w="62px" $h="20px" $radius="6px" />
                </div>
                <SkeletonBar $w="48%" $h="15px" $radius="4px" />
              </SkeletonContent>
            </SkeletonItem>
          ))}
        </SkeletonWrapper>
      ) : error ? (
        <EmptyStateBox role="alert">
          <EmptyIconBox>
            <AlertCircle size={24} strokeWidth={2} />
          </EmptyIconBox>
          <EmptyTitle>정보를 불러오지 못했습니다</EmptyTitle>
          <EmptyDesc>{error}</EmptyDesc>
          <ActionButton type="button" onClick={reload}>
            <RotateCcw size={14} strokeWidth={2} />
            <span>다시 시도</span>
          </ActionButton>
        </EmptyStateBox>
      ) : sortedItems.length === 0 ? (
        <EmptyStateBox>
          <EmptyIconBox>
            {category === 'bookmark' ? (
              <Bookmark size={24} color={lightPalette.juhong[500]} fill="currentColor" strokeWidth={2} />
            ) : (
              <Map size={24} strokeWidth={2} />
            )}
          </EmptyIconBox>
          <EmptyTitle>
            {category === 'bookmark'
              ? '아직 마음에 담은 장소가 없습니다'
              : '현재 반경에 장소가 없습니다'}
          </EmptyTitle>
          <EmptyDesc>
            {category === 'bookmark'
              ? '마음에 드는 한옥 명소의 [마음에 담기]를 눌러\n나만의 여행 지도를 만들어보세요.'
              : category
                ? `선택하신 '${CATEGORY_NAMES[category] || category}' 장소가 가까운 반경에 없습니다.`
                : '지도 영역을 넓히거나 전국 인기 명소를 둘러보세요.'}
          </EmptyDesc>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '240px' }}>
            {category && (
              <ActionButton
                type="button"
                onClick={() => useMapStore.getState().setCategory(null)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Sparkles size={14} strokeWidth={2} />
                <span>전체 명소 둘러보기</span>
              </ActionButton>
            )}
            {category !== 'bookmark' && (
              <ActionButton
                type="button"
                onClick={handleZoomOut}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Map size={14} strokeWidth={2} />
                <span>지도 영역 2배 넓히기</span>
              </ActionButton>
            )}
            <ActionButton
              type="button"
              onClick={() => useMapStore.getState().setPopularPanelOpen(true)}
              style={{ width: '100%', justifyContent: 'center', background: 'rgba(232, 90, 24, 0.08)', color: lightPalette.juhong[500] }}
            >
              <Sparkles size={14} strokeWidth={2} />
              <span>전국 인기 명소 랭킹</span>
            </ActionButton>
          </div>
        </EmptyStateBox>
      ) : (
        <>
          <ListContainer role="list">
            {paginatedItems.map((item, idx) => (
              <PlaceListItem
                key={item.id}
                item={item}
                index={(validPage - 1) * ITEMS_PER_PAGE + idx}
                isSelected={item.id === selectedId}
                isHovered={item.id === hoveredId}
                onSelect={handleSelect}
                onHover={setHoveredId}
              />
            ))}
          </ListContainer>

          {totalPages > 1 && (
            <PaginationWrapper role="navigation" aria-label="장소 목록 페이지네이션">
              <PageNavBtn
                type="button"
                onClick={() => handlePageChange(validPage - 1)}
                disabled={validPage <= 1}
                aria-label="이전 페이지로 이동"
              >
                <ChevronLeft size={16} strokeWidth={2} />
                <span>이전</span>
              </PageNavBtn>

              <PageNumberGroup>
                {pageNumbers.map((p) => (
                  <PageNumberBtn
                    key={p}
                    type="button"
                    $active={p === validPage}
                    onClick={() => handlePageChange(p)}
                    aria-current={p === validPage ? 'page' : undefined}
                    aria-label={`${p} 페이지로 이동`}
                  >
                    {p}
                  </PageNumberBtn>
                ))}
              </PageNumberGroup>

              <PageNavBtn
                type="button"
                onClick={() => handlePageChange(validPage + 1)}
                disabled={validPage >= totalPages}
                aria-label="다음 페이지로 이동"
              >
                <span>다음</span>
                <ChevronRight size={16} strokeWidth={2} />
              </PageNavBtn>
            </PaginationWrapper>
          )}
        </>
      )}
    </div>
  );
}

