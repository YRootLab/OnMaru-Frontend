'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { isOnmaruApiError } from '@/lib/api/errors';
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, ChevronLeftIcon, ListIcon, RotateCcwIcon } from '@hugeicons/core-free-icons'
import { meok, surface, fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { listInfoPlaces } from '@/features/map/services/infoMap.service';
import { mapInfoPlaceToItem } from '@/features/map/services/infoMarker.service';
import { PlaceListItem } from './PlaceListItem';
import { OniSearchEmpty } from '@/shared/components/OniSearchEmpty';
import { MAP_INFO_CATEGORY_LABELS as CATEGORY_LABELS } from '@/features/map/types';
import type { Item } from '@/features/map/types';
import InfoMapEditorialFeed from './InfoMapEditorialFeed';

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

const InlineError = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 14px 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f5f5f4;
  color: ${meok[700]};
  font-size: ${fontSize.xs};

  & > span {
    flex: 1;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    color: ${meok[200]};
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
`;
const SkeletonThumb = styled.div`
  width: 88px;
  height: 88px;
  border-radius: 11px;
  background: linear-gradient(90deg, #f2f2f0 25%, #e6e6e3 50%, #f2f2f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
  flex-shrink: 0;

  @media (max-width: 1023px) {
    width: 80px;
    height: 80px;
  }
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
  const setInfoCategory = useMapStore((s) => s.setInfoCategory);
  const setInfoRegionCode = useMapStore((s) => s.setInfoRegionCode);
  const retryInfoList = useMapStore((s) => s.retryInfoList);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMoreRef = useRef(false);
  const nextPageControllerRef = useRef<AbortController | null>(null);
  const cursorRecoveryScopeRef = useRef<string>('');

  useEffect(() => {
    cursorRecoveryScopeRef.current = '';
  }, [infoCategory, infoRegionCode]);

  const handleRetry = () => {
    cursorRecoveryScopeRef.current = '';
    retryInfoList();
  };

  // Callback ref: sets up the IntersectionObserver when the sentinel element mounts,
  // so it works even when the sentinel first renders after listItems arrive.
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) {
      nextPageControllerRef.current?.abort();
      nextPageControllerRef.current = null;
      loadingMoreRef.current = false;
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        if (loadingMoreRef.current) return;
        const { listNextCursor: cursor, isListLoading: loading } = useMapStore.getState();
        if (!cursor || loading) return;

        loadingMoreRef.current = true;
        nextPageControllerRef.current?.abort();
        const ctrl = new AbortController();
        nextPageControllerRef.current = ctrl;
        const store = useMapStore.getState();
        const requestCategory = store.infoCategory;
        const requestRegionCode = store.infoRegionCode;
        const requestSnapshotId = store.listSnapshotId;
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
            if (s.listSnapshotId !== requestSnapshotId || page.snapshot.id !== requestSnapshotId) return;
            if (page.nextCursor === cursor) return; // guard: cursor not advancing
            s.appendListItems(page.items, page.nextCursor);
          })
          .catch((err: unknown) => {
            if (ctrl.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
            if (isOnmaruApiError(err) && err.code === 'SNAPSHOT_EXPIRED') {
              const recoveryScope = `${requestCategory}__${requestRegionCode ?? ''}`;
              if (cursorRecoveryScopeRef.current === recoveryScope) {
                store.setListError('목록 기준이 만료됐어요. 다시 시도해 주세요');
                return;
              }
              cursorRecoveryScopeRef.current = recoveryScope;
              store.setIsListLoading(false);
              loadingMoreRef.current = false;
              store.setListItems([], 0, null, null);
              store.retryInfoList();
              return;
            }
            store.setListError('추가 목록을 불러오지 못했어요');
          })
          .finally(() => {
            if (nextPageControllerRef.current === ctrl) {
              nextPageControllerRef.current = null;
              store.setIsListLoading(false);
              loadingMoreRef.current = false;
            }
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
  const editorialItems = useMemo(() => listItems.map(mapInfoPlaceToItem), [listItems]);

  return (
    <div>
      {infoRegionCode && (
        <Breadcrumb>
          <BreadcrumbBtn
            type="button"
            onClick={() => setInfoRegionCode(null)}
            aria-label="전국 목록으로 돌아가기"
          >
            <HugeiconsIcon icon={ChevronLeftIcon} size={13} strokeWidth={2} />
            전국
          </BreadcrumbBtn>
          <span>·</span>
          <span style={{ color: meok[700] }}>{infoRegionName ?? '이 지역'}</span>
        </Breadcrumb>
      )}

      <StickyHeader>
        <CountLabel aria-live="polite">
          <HugeiconsIcon icon={ListIcon} size={15} color={meok[700]} strokeWidth={2} />
          <span>{headerTitle}</span>
        </CountLabel>
      </StickyHeader>

      <InfoMapEditorialFeed
        category={infoCategory}
        regionCode={infoRegionCode}
        items={editorialItems}
        loading={isListLoading && listItems.length === 0}
        onShowAllFestivals={() => setInfoCategory('festival')}
        onSelectItem={handleSelect}
      />

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
      ) : listError && listItems.length === 0 ? (
        <OniSearchEmpty
          size="md"
          title="정보를 가져오지 못했어요"
          description={listError}
          action={
            <RetryBtn type="button" onClick={handleRetry}>
              <HugeiconsIcon icon={RotateCcwIcon} size={14} strokeWidth={2} />
              다시 시도
            </RetryBtn>
          }
        />
      ) : listItems.length === 0 ? (
        <OniSearchEmpty
          size="md"
          title="등록된 장소가 없어요"
          description={
            infoRegionName
              ? `${infoRegionName} 지역에는 이 카테고리의 장소가 아직 등록되지 않았어요.`
              : '선택하신 카테고리에 등록된 장소를 찾지 못했어요.'
          }
          action={
            infoRegionCode ? (
              <RetryBtn type="button" onClick={() => setInfoRegionCode(null)}>
                <span>전국 목록 보기</span>
              </RetryBtn>
            ) : undefined
          }
        />
      ) : (
        <>
          {listError && (
            <InlineError role="status">
              <HugeiconsIcon icon={AlertCircleIcon} size={15} strokeWidth={2} />
              <span>{listError}</span>
              <RetryBtn type="button" onClick={handleRetry} aria-label="다시 시도">
                <HugeiconsIcon icon={RotateCcwIcon} size={14} strokeWidth={2} />
                다시 시도
              </RetryBtn>
            </InlineError>
          )}
          <ListContainer role="list">
            {listItems.map((p, idx) => {
              const item = mapInfoPlaceToItem(p);
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
