'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Flame, ChevronLeft, ChevronRight, MessageCircle, Landmark, Home, Utensils, Coffee, ShoppingBag } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore, DEFAULT_CENTER } from '@/features/map/hooks/useMapStore';
import { countByPlace, toReview } from '@/features/map/warmth/warmthRepo';
import { filterByPeriod } from '@/features/map/warmth/heatScale';
import { selectTopHeatSpot } from '@/features/map/warmth/heatPresentation';
import { useVisitReviewFeed } from '@/features/visit-review/presentation/useVisitReviewFeed';
import { useVisitReviewRegions } from '@/features/visit-review/presentation/useVisitReviewRegions';
import DateScrubber from './DateScrubber';
import WarmthCard from './WarmthCard';
import {
  FeedContainer,
  StickyTop,
  SectionHeader,
  SectionTitleGroup,
  SectionTitle,
  RegionCarouselWrapper,
  RegionScroller,
  RegionChip,
  RegionArrowBtn,
  FeaturedPlaceArea,
  ScrubberSection,
  FeaturedCard,
  FeaturedLeft,
  FeaturedIconBox,
  FeaturedInfo,
  FeaturedRank,
  FeaturedName,
  FeaturedMeta,
  MoreBtn,
  ReviewSectionHeader,
  ReviewSectionTitle,
  SortWrapper,
  SortSelect,
  SortChevron,
  FeedScroll,
  EmptyState,
  PaginationWrapper,
  PageNavBtn,
  PageNumberGroup,
  PageNumberBtn,
  PageIndicator,
} from './WarmthFeed.styles';



function renderPlaceIcon(type: string) {
  if (type.includes('스테이') || type.includes('숙소') || type.includes('고택')) {
    return <Home size={20} strokeWidth={2} />;
  }
  if (type.includes('음식') || type.includes('식당')) {
    return <Utensils size={20} strokeWidth={2} />;
  }
  if (type.includes('카페') || type.includes('다원')) {
    return <Coffee size={20} strokeWidth={2} />;
  }
  if (type.includes('시장')) {
    return <ShoppingBag size={20} strokeWidth={2} />;
  }
  return <Landmark size={20} strokeWidth={2} />;
}

export default function WarmthFeed() {
  const map = useMapStore((s) => s.map);
  const items = useMapStore((s) => s.items);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setDetailId = useMapStore((s) => s.setDetailId);
  const setPopularPanelOpen = useMapStore((s) => s.setPopularPanelOpen);
  const setHoveredId = useMapStore((s) => s.setHoveredId);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);
  const setWarmths = useMapStore((s) => s.setWarmths);
  const heatSpots = useMapStore((s) => s.heatSpots);
  const category = useMapStore((s) => s.category);







  const storedWarmths = useMapStore((s) => s.warmths);
  const period = useMapStore((s) => s.warmthPeriod);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const serverRegions = useVisitReviewRegions();
  const { data: serverWarmths } = useVisitReviewFeed(
    selectedRegion === 'all' ? undefined : selectedRegion,
  );
  const regionOptions = useMemo(
    () => [
      { id: 'all', label: '전국' },
      ...serverRegions.map((item) => ({
        id: item.region.regionCode,
        label: item.region.name,
      })),
    ],
    [serverRegions],
  );
  const selectedRegionLabel = regionOptions.find((item) => item.id === selectedRegion)?.label ?? '선택 지역';
  const allWarmths = serverWarmths ?? storedWarmths;
  const warmths = useMemo(() => filterByPeriod(allWarmths, period), [allWarmths, period]);
  const [sortOrder, setSortOrder] = useState<'recent' | 'place'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const feedTopRef = useRef<HTMLDivElement>(null);
  const regionScrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    if (serverWarmths !== null) setWarmths(serverWarmths);
  }, [serverWarmths, setWarmths]);

  const checkScrollArrows = () => {
    const el = regionScrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  };

  useEffect(() => {
    checkScrollArrows();
    const el = regionScrollerRef.current;
    if (!el) return;
    const handleResize = () => checkScrollArrows();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRegionScroll = (direction: 'left' | 'right') => {
    const el = regionScrollerRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -200 : 200;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScrollArrows, 320);
  };

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(regionId);
    if (regionId === 'all' && map && window.kakao?.maps?.LatLng) {
      map.panTo(new window.kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng));
      map.setLevel?.(11);
    }
  };

  const reviews = useMemo(() => warmths.map(toReview), [warmths]);


  const topPlace = useMemo(() => {
    const spot = selectTopHeatSpot(heatSpots);
    if (!spot) return null;
    return {
      placeId: spot.placeId,
      placeName: spot.name,
      visitorCount: spot.visitorCount,
      region: spot.district,
      lat: spot.lat,
      lng: spot.lng,
    };
  }, [heatSpots]);

  const filteredReviews = useMemo(() => {
    let list = reviews;


    if (category === 'busy') {
      list = list.filter((r) => r.crowdMood === '북적' || r.mood >= 4);
    } else if (category === 'quiet') {
      list = list.filter((r) => r.crowdMood === '한적' || r.mood <= 2);
    } else if (category === 'today') {
      const ONE_DAY = 86_400_000;
      const now = Date.now();
      list = list.filter((r) => now - Date.parse(r.createdAt) < ONE_DAY);
    } else if (category === 'mine') {
      list = list.filter((r) => r.mine === true);
    }

    if (sortOrder === 'place') {
      const counts = countByPlace(warmths);
      return [...list].sort((a, b) => {
        const ca = counts.get(a.placeId)?.count ?? 0;
        const cb = counts.get(b.placeId)?.count ?? 0;
        if (cb !== ca) return cb - ca;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
    }

    return [...list].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [reviews, warmths, selectedRegion, sortOrder, category]);

  const REVIEWS_PER_PAGE = 6;


  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRegion, sortOrder, category]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedReviews = useMemo(() => {
    const start = (validPage - 1) * REVIEWS_PER_PAGE;
    return filteredReviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [filteredReviews, validPage]);

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
    if (feedTopRef.current) {
      feedTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePlaceClick = (placeId: string, placeName: string, lat?: number, lng?: number) => {
    const matched = items.find(
      (i) => i.id === placeId || i.name.includes(placeName) || placeName.includes(i.name),
    );

    if (matched) {
      setSelectedId(matched.id);
      setDetailId(matched.id);
      if (map && window.kakao?.maps?.LatLng) {
        map.panTo(new window.kakao.maps.LatLng(matched.lat, matched.lng));
      }
    } else if (lat !== undefined && lng !== undefined && map && window.kakao?.maps?.LatLng) {
      setSelectedId(placeId);
      map.panTo(new window.kakao.maps.LatLng(lat, lng));
    }

    setSheetSnap('half');
  };

  return (
    <FeedContainer>
      <StickyTop>
        <SectionHeader>
          <SectionTitleGroup>
            <Flame size={18} strokeWidth={2} color="#FF6B00" />
            <SectionTitle>실시간 방문객 집중 명소</SectionTitle>
          </SectionTitleGroup>
        </SectionHeader>

        {}
        <RegionCarouselWrapper>
          {canScrollLeft && (
            <RegionArrowBtn
              type="button"
              $direction="left"
              onClick={() => handleRegionScroll('left')}
              aria-label="이전 지역 보기"
              title="이전 지역 보기"
            >
              <ChevronLeft size={17} strokeWidth={2} />
            </RegionArrowBtn>
          )}

          <RegionScroller
            ref={regionScrollerRef}
            onScroll={checkScrollArrows}
            role="tablist"
            aria-label="지역별 필터"
          >
            {regionOptions.map((reg) => {
              const active = selectedRegion === reg.id;
              return (
                <RegionChip
                  key={reg.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  $active={active}
                  onClick={() => handleRegionClick(reg.id)}
                >
                  {reg.label}
                </RegionChip>
              );
            })}
          </RegionScroller>

          {canScrollRight && (
            <RegionArrowBtn
              type="button"
              $direction="right"
              onClick={() => handleRegionScroll('right')}
              aria-label="다음 지역 보기"
              title="다음 지역 보기"
            >
              <ChevronRight size={17} strokeWidth={2} />
            </RegionArrowBtn>
          )}
        </RegionCarouselWrapper>
      </StickyTop>

      {topPlace && (
        <FeaturedPlaceArea>
          <FeaturedCard>
            <FeaturedLeft
              type="button"
              onClick={() =>
                handlePlaceClick(topPlace.placeId, topPlace.placeName, topPlace.lat, topPlace.lng)
              }
              title="장소 상세 보기"
            >
              <FeaturedIconBox>{renderPlaceIcon(topPlace.placeName)}</FeaturedIconBox>
              <FeaturedInfo>
                <FeaturedRank>
                  <Flame size={12} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  <span>지금 가장 많은 분이 찾은 곳</span>
                </FeaturedRank>
                <FeaturedName>{topPlace.placeName}</FeaturedName>
                <FeaturedMeta>
                  {[topPlace.region, `방문 ${topPlace.visitorCount.toLocaleString()}명`].filter(Boolean).join(' · ')}
                </FeaturedMeta>
              </FeaturedInfo>
            </FeaturedLeft>

            <MoreBtn
              type="button"
              onClick={() => {
                setPopularPanelOpen(true);
                setSheetSnap('half');
              }}
              title="인기 장소 순위 보기"
            >
              <span>더보기</span>
              <ChevronRight size={13} strokeWidth={2} />
            </MoreBtn>
          </FeaturedCard>
        </FeaturedPlaceArea>
      )}

      {}
      <ScrubberSection>
        <DateScrubber embedded />
      </ScrubberSection>


      <ReviewSectionHeader>
        <ReviewSectionTitle>
          <MessageCircle size={16} strokeWidth={2} color={meok[700]} />
          <span>다녀간 분들의 온기 이야기</span>
        </ReviewSectionTitle>

        <SortWrapper>
          <SortSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'place')}
            aria-label="온기 정렬 방식"
          >
            <option value="recent">최신순</option>
            <option value="place">이야기 많은 곳</option>
          </SortSelect>
          <SortChevron size={14} strokeWidth={2} />
        </SortWrapper>
      </ReviewSectionHeader>

      <FeedScroll>
        <div ref={feedTopRef} />
        {filteredReviews.length === 0 ? (
          <EmptyState>
            {category === 'mine'
              ? '아직 남긴 온기가 없어요.'
              : selectedRegion === 'all'
                ? '조건에 맞는 이야기가 아직 없어요.'
                : `${selectedRegionLabel}에 남겨진 온기가 아직 없어요.`}
            <br />
            첫 번째 이야기를 남겨보세요.
          </EmptyState>
        ) : (
          <>
            {paginatedReviews.map((review) => (
              <WarmthCard
                key={review.id}
                review={review}
                onHover={(id) => setHoveredId(id)}
              />
            ))}

            {totalPages > 1 && (
              <PaginationWrapper role="navigation" aria-label="온기 피드 페이지네이션">
                <PageNavBtn
                  type="button"
                  onClick={() => handlePageChange(validPage - 1)}
                  disabled={validPage <= 1}
                  aria-label="이전 페이지로 이동"
                >
                  <ChevronLeft size={15} strokeWidth={2} />
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
                  <ChevronRight size={15} strokeWidth={2} />
                </PageNavBtn>
              </PaginationWrapper>
            )}
          </>
        )}
      </FeedScroll>
    </FeedContainer>
  );
}
