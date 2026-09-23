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
import { lightPalette, meok, surface, fontSize, ringShadow } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useBookmarkStore } from '@/features/map/hooks/useBookmarkStore';
import { distanceInMeters } from '@/features/map/utils/geo';
import { PlaceListItem } from './PlaceListItem';
import LiveNoticeBanner from './feed/LiveNoticeBanner';
import FestivalExhibitionCarousel from './feed/FestivalExhibitionCarousel';
import SorimaruSpotlightBanner from './feed/SorimaruSpotlightBanner';
import SmartAroundFeed from './feed/SmartAroundFeed';
import type { Item, PlaceCategory } from '@/features/map/types';

const ITEMS_PER_PAGE = 10;

const CATEGORY_NAMES: Record<string, string> = {
  bookmark: '저장한 장소',
  spot: '고택',
  experience: '전통 체험',
  culture: '문화유산',
  festival: '축제',
  stay: '한옥 숙소',
  food: '전통 맛집',
  cafe: '한옥 카페',
  market: '전통 시장',
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

  [data-theme='dark'] & {
    background: ${surface.dark.card};
  }
`;

const FeedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-top: 20px;
  margin-bottom: 40px;
`;

const CountLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const SortDropdownWrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  box-shadow: ${ringShadow.light.button};
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.07);
    box-shadow: ${ringShadow.light.buttonHover};
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    border: none;
    box-shadow: ${ringShadow.dark.button};

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      box-shadow: ${ringShadow.dark.buttonHover};
    }
  }
`;

const SortSelect = styled.select`
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: transparent;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;

  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[700]};
  padding: 4px 24px 4px 10px;
  cursor: pointer;

  [data-theme='dark'] & {
    color: ${meok[200]};
    background-color: transparent;

    option {
      background-color: #25221d;
      color: #ffffff;
    }
  }

  option {
    background-color: #ffffff;
    color: ${meok[900]};
  }
`;

const SortChevron = styled(ChevronDown)`
  position: absolute;
  right: 7px;
  pointer-events: none;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ListContainer = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
`;


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
  font-size: ${fontSize.xs};
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

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    color: ${meok[400]};

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
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
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ $active }) =>
      $active ? '#000000' : 'rgba(78, 89, 104, 0.08)'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
    color: ${({ $active }) => ($active ? meok[900] : meok[400])};

    &:hover:not(:disabled) {
      background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.08)')};
      color: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
    }
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
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
`;

const EmptyDesc = styled.p`
  margin: 0 0 18px;
  font-size: ${fontSize.xs};
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
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(74, 111, 160, 0.1);
    color: ${lightPalette.kobalt[700]};
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


  const sortedItems = useMemo(() => {
    let list = [...items];
    if (category && category !== 'all') {
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
      } else {
        list = list.filter((item) => item.category === category);
      }
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



  const resetKey = `${category ?? ''}|${currentAddress ?? ''}|${sortOrder}|${items.length}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setCurrentPage(1);
  }



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


  const festivalItems = useMemo(() => {
    return items.filter((item) => item.category === 'festival');
  }, [items]);


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


  const handleSelect = (item: Item) => {
    setSelectedId(item.id);
    setDetailId(item.id);
    if (map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
    }
    useMapStore.getState().setSheetSnap('full');
  };


  const handleZoomOut = () => {
    if (!map) return;
    const currentLevel = map.getLevel();
    map.setLevel(Math.min(10, currentLevel + 2), { animate: true });
  };

  const isAllCategory = !category || category === 'all';

  return (
    <div>
      <div ref={listTopRef} />

      {}
      <LiveNoticeBanner />

      {}
      {isAllCategory && (
        <FeedWrapper>
          {}
          <FestivalExhibitionCarousel festivals={festivalItems} />

          {}
          <SorimaruSpotlightBanner />

          {}
          <SmartAroundFeed items={sortedItems} />
        </FeedWrapper>
      )}

      {}
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

      {}
      {loading && items.length === 0 ? (
        <SkeletonWrapper aria-busy="true" aria-label="장소 목록을 불러오는 중이에요">
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
          <EmptyTitle>정보를 가져오지 못했어요</EmptyTitle>
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
              ? '아직 저장한 장소가 없어요'
              : '주변에 등록된 한옥이 없어요'}
          </EmptyTitle>
          <EmptyDesc>
            {category === 'bookmark'
              ? '마음에 드는 장소의 하트를 눌러\n나만의 여행 지도를 만들어보세요.'
              : category
                ? `근처에 '${CATEGORY_NAMES[category] || category}' 장소가 없어요.`
                : '지도를 축소하거나 다른 지역을 둘러보세요.'}
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
                <span>검색 반경 넓히기</span>
              </ActionButton>
            )}
            <ActionButton
              type="button"
              onClick={() => useMapStore.getState().setPopularPanelOpen(true)}
              style={{ width: '100%', justifyContent: 'center', background: 'rgba(232, 90, 24, 0.08)', color: lightPalette.juhong[500] }}
            >
              <Sparkles size={14} strokeWidth={2} />
              <span>인기 한옥 둘러보기</span>
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
                pageIndex={idx}
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
