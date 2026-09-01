'use client';

import { useMemo } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { ChevronDown, Map, RefreshCw, AlertCircle } from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '../hooks/useMapStore';
import { PlaceListItem } from './PlaceListItem';
import type { Item, PlaceCategory } from '../types';

const CATEGORY_NAMES: Record<string, string> = {
  spot: '한옥명소',
  stay: '한옥숙박',
  food: '전통음식점',
  cafe: '카페·찻집',
  market: '전통시장·쇼핑',
};

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 8px;
  background: #ffffff;
`;

const CountLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${meok[700]};
`;

const SortDropdownWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SortSelect = styled.select`
  appearance: none;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  color: ${meok[700]};
  padding: 2px 18px 2px 4px;
  cursor: pointer;
  outline: none;

  &:hover {
    color: ${meok[900]};
  }

  &:focus-visible {
    outline: 2px solid ${lightPalette.cheongrok[500]};
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
`;

/* ── 스켈레톤 로딩 ── */
const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const SkeletonItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(78, 89, 104, 0.08);
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const SkeletonThumb = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 10px;
  background: rgba(78, 89, 104, 0.08);
  flex-shrink: 0;
`;

const SkeletonContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
`;

const SkeletonBar = styled.div<{ $w: string; $h: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: 4px;
  background: rgba(78, 89, 104, 0.08);
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
  color: ${meok[500]};
  line-height: 1.45;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.08);
  color: ${meok[900]};
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
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
  const loading = useMapStore((s) => s.loading);
  const error = useMapStore((s) => s.error);
  const category = useMapStore((s) => s.category);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const sortOrder = useMapStore((s) => s.sortOrder);
  const setSortOrder = useMapStore((s) => s.setSortOrder);
  const setDetailId = useMapStore((s) => s.setDetailId);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setHoveredId = useMapStore((s) => s.setHoveredId);
  const reload = useMapStore((s) => s.reload);

  // 정렬 처리
  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortOrder === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return list.sort((a, b) => (a.dist ?? 1e9) - (b.dist ?? 1e9));
  }, [items, sortOrder]);

  const categoryLabel = category ? CATEGORY_NAMES[category] || '한옥명소' : '한옥명소';

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

  return (
    <div>
      <StickyHeader>
        <CountLabel aria-live="polite">
          {categoryLabel} {sortedItems.length}곳
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
          <SortChevron size={14} />
        </SortDropdownWrapper>
      </StickyHeader>

      {loading && items.length === 0 ? (
        <SkeletonWrapper aria-busy="true" aria-label="장소 목록을 불러오는 중입니다">
          {[1, 2, 3, 4, 5].map((key) => (
            <SkeletonItem key={key}>
              <SkeletonThumb />
              <SkeletonContent>
                <SkeletonBar $w="65%" $h="16px" />
                <SkeletonBar $w="45%" $h="13px" />
                <SkeletonBar $w="30%" $h="12px" />
              </SkeletonContent>
            </SkeletonItem>
          ))}
        </SkeletonWrapper>
      ) : error ? (
        <EmptyStateBox role="alert">
          <EmptyIconBox>
            <AlertCircle size={24} />
          </EmptyIconBox>
          <EmptyTitle>정보를 불러오지 못했습니다</EmptyTitle>
          <EmptyDesc>{error}</EmptyDesc>
          <ActionButton type="button" onClick={reload}>
            <RefreshCw size={14} />
            <span>다시 시도</span>
          </ActionButton>
        </EmptyStateBox>
      ) : sortedItems.length === 0 ? (
        <EmptyStateBox>
          <EmptyIconBox>
            <Map size={24} />
          </EmptyIconBox>
          <EmptyTitle>이 지역에 {categoryLabel}이 없습니다</EmptyTitle>
          <EmptyDesc>
            지도를 옮기거나 다른 카테고리를 선택해보세요
          </EmptyDesc>
          <ActionButton type="button" onClick={handleZoomOut}>
            <Map size={14} />
            <span>지도 넓게 보기</span>
          </ActionButton>
        </EmptyStateBox>
      ) : (
        <ListContainer role="list">
          {sortedItems.map((item, index) => (
            <PlaceListItem
              key={item.id}
              item={item}
              index={index}
              isSelected={item.id === selectedId}
              isHovered={item.id === hoveredId}
              onSelect={handleSelect}
              onHover={setHoveredId}
            />
          ))}
        </ListContainer>
      )}
    </div>
  );
}
