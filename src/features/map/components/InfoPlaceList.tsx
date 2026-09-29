'use client';

import { useCallback, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { AlertCircle, ChevronLeft, List, RotateCcw } from 'lucide-react';
import { meok, surface, fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { listInfoPlaces } from '@/features/map/services/infoMap.service';
import { PlaceListItem } from './PlaceListItem';
import { MAP_INFO_CATEGORY_LABELS as CATEGORY_LABELS } from '@/features/map/types';
import type { InfoPlaceItem, Item } from '@/features/map/types';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  background: #ffffff;
  [data-theme='dark'] & { background: ${surface.dark.card}; }
`;

const CountLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  letter-spacing: -0.02em;
  [data-theme='dark'] & { color: ${meok[100]}; }
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 14px 10px;
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

const BreadcrumbBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  color: ${meok[600]};
  cursor: pointer;
  &:hover { color: ${meok[900]}; }
  [data-theme='dark'] & { color: ${meok[400]}; }
`;

const ListContainer = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Sentinel = styled.div`
  height: 1px;
`;

const LoadingMore = styled.div`
  text-align: center;
  padding: 16px;
  font-size: ${fontSize.xs};
  color: ${meok[400]};
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
`;
const SkeletonThumb = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 11px;
  background: linear-gradient(90deg, #f2f2f0 25%, #e6e6e3 50%, #f2f2f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
  flex-shrink: 0;
`;
const SkeletonContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
`;
const SkeletonBar = styled.div<{ $w: string; $h: string }>`
  width: ${({ $w }) => $w};
  height: ${({ $h }) => $h};
  border-radius: 4px;
  background: linear-gradient(90deg, #f2f2f0 25%, #e6e6e3 50%, #f2f2f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
`;

const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
  gap: 8px;
  color: ${meok[500]};
  font-size: ${fontSize.sm};
`;

const RetryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.08);
  color: ${meok[700]};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  border: none;
  margin-top: 4px;
`;

function toItem(p: InfoPlaceItem): Item {
  return {
    id: p.placeId,
    name: p.name,
    category: (p.category?.toLowerCase() ?? 'spot') as Item['category'],
    lat: p.coordinates.lat,
    lng: p.coordinates.lng,
    addr: p.region?.name ?? '',
    image: p.thumbnailUrl,
    tel: null,
    dist: null,
    savedByMe: p.savedByMe,
  };
}

export default function InfoPlaceList() {
  const infoCategory = useMapStore((s) => s.infoCategory);
  const infoRegionCode = useMapStore((s) => s.infoRegionCode);
  const listItems = useMapStore((s) => s.listItems);
  const listTotalCount = useMapStore((s) => s.listTotalCount);
  const isListLoading = useMapStore((s) => s.isListLoading);
  const listError = useMapStore((s) => s.listError);
  const selectedId = useMapStore((s) => s.selectedId);
  const hoveredId = useMapStore((s) => s.hoveredId);
  const setDetailId = useMapStore((s) => s.setDetailId);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setHoveredId = useMapStore((s) => s.setHoveredId);
  const infoRegionName = useMapStore((s) => s.infoRegionName);
  const setInfoRegionCode = useMapStore((s) => s.setInfoRegionCode);
  const reload = useMapStore((s) => s.reload);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMoreRef = useRef(false);

  // Callback ref: sets up the IntersectionObserver when the sentinel element mounts,
  // so it works even when the sentinel first renders after listItems arrive.
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loadingMoreRef.current) return;
        const { listNextCursor: cursor, isListLoading: loading } = useMapStore.getState();
        if (!cursor || loading) return;

        loadingMoreRef.current = true;
        const ctrl = new AbortController();
        const store = useMapStore.getState();
        const requestCategory = store.infoCategory;
        const requestRegionCode = store.infoRegionCode;
        store.setIsListLoading(true);

        listInfoPlaces({
          category: requestCategory,
          regionCode: requestRegionCode,
          cursor,
          signal: ctrl.signal,
        })
          .then((page) => {
            const s = useMapStore.getState();
            if (s.infoCategory !== requestCategory || s.infoRegionCode !== requestRegionCode) return;
            if (page.nextCursor === cursor) return; // guard: cursor not advancing
            s.appendListItems(page.items, page.nextCursor);
          })
          .catch((err: unknown) => {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            store.setListError('추가 목록을 불러오지 못했어요');
          })
          .finally(() => {
            store.setIsListLoading(false);
            loadingMoreRef.current = false;
          });
      },
      { rootMargin: '120px' },
    );

    observerRef.current.observe(el);
  }, []);

  const handleSelect = (item: Item) => {
    setSelectedId(item.id);
    setDetailId(item.id);
    const { map } = useMapStore.getState();
    if (map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(item.lat, item.lng));
    }
    useMapStore.getState().setSheetSnap('full');
  };

  const categoryLabel = CATEGORY_LABELS[infoCategory] ?? '장소';
  const headerTitle = isListLoading && listItems.length === 0
    ? `${categoryLabel} 목록`
    : `${categoryLabel} ${listTotalCount.toLocaleString()}곳`;

  return (
    <div>
      {infoRegionCode && (
        <Breadcrumb>
          <BreadcrumbBtn
            type="button"
            onClick={() => setInfoRegionCode(null)}
            aria-label="전국 목록으로 돌아가기"
          >
            <ChevronLeft size={13} strokeWidth={2} />
            전국
          </BreadcrumbBtn>
          <span>·</span>
          <span style={{ color: meok[700] }}>{infoRegionName ?? '이 지역'}</span>
        </Breadcrumb>
      )}

      <StickyHeader>
        <CountLabel aria-live="polite">
          <List size={15} color={meok[700]} strokeWidth={2} />
          <span>{headerTitle}</span>
        </CountLabel>
      </StickyHeader>

      {isListLoading && listItems.length === 0 ? (
        <SkeletonWrapper aria-busy="true" aria-label="장소 목록을 불러오는 중이에요">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <SkeletonItem key={k}>
              <SkeletonThumb />
              <SkeletonContent>
                <SkeletonBar $w="64%" $h="19px" />
                <SkeletonBar $w="44%" $h="15px" />
                <SkeletonBar $w="52%" $h="15px" />
              </SkeletonContent>
            </SkeletonItem>
          ))}
        </SkeletonWrapper>
      ) : listError ? (
        <EmptyBox role="alert">
          <AlertCircle size={24} strokeWidth={2} />
          <span>정보를 가져오지 못했어요</span>
          <RetryBtn type="button" onClick={reload}>
            <RotateCcw size={14} strokeWidth={2} />
            다시 시도
          </RetryBtn>
        </EmptyBox>
      ) : listItems.length === 0 ? (
        <EmptyBox>
          <span>이 카테고리에 등록된 장소가 없어요</span>
        </EmptyBox>
      ) : (
        <>
          <ListContainer role="list">
            {listItems.map((p, idx) => {
              const item = toItem(p);
              return (
                <PlaceListItem
                  key={p.placeId}
                  item={item}
                  index={idx}
                  pageIndex={idx}
                  isSelected={item.id === selectedId}
                  isHovered={item.id === hoveredId}
                  onSelect={handleSelect}
                  onHover={setHoveredId}
                />
              );
            })}
          </ListContainer>

          <Sentinel ref={sentinelRef} />
          {isListLoading && listItems.length > 0 && (
            <LoadingMore>불러오는 중…</LoadingMore>
          )}
        </>
      )}
    </div>
  );
}
