'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Flame, ChevronLeft, ChevronRight, MessageCircle, Landmark, Home, Utensils, Coffee, ShoppingBag } from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore, DEFAULT_CENTER } from '@/features/map/hooks/useMapStore';
import { countByPlace, regionOf, toReview } from '@/features/map/warmth/warmthRepo';
import { filterByPeriod } from '@/features/map/warmth/heatScale';
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


/** 사용자가 요청한 14대 광역 권역 필터 옵션 */
export const REGION_OPTIONS = [
  { id: 'all', label: '전국' },
  { id: '서울', label: '서울' },
  { id: '부산', label: '부산' },
  { id: '대구', label: '대구' },
  { id: '인천', label: '인천' },
  { id: '대전', label: '대전' },
  { id: '세종', label: '세종' },
  { id: '경기', label: '경기' },
  { id: '강원', label: '강원' },
  { id: '충북', label: '충북' },
  { id: '충남', label: '충남' },
  { id: '전북', label: '전북' },
  { id: '제주', label: '제주' },
  { id: '전남광주통합특별시', label: '전남광주통합특별시' },
] as const;

export const REGION_CENTERS: Record<string, { lat: number; lng: number; level?: number }> = {
  all: { lat: 36.3, lng: 127.8, level: 11 },
  서울: { lat: 37.5826, lng: 126.9832, level: 6 },
  부산: { lat: 35.1796, lng: 129.0756, level: 6 },
  대구: { lat: 35.8714, lng: 128.6014, level: 6 },
  인천: { lat: 37.4563, lng: 126.7052, level: 6 },
  대전: { lat: 36.3504, lng: 127.3845, level: 6 },
  세종: { lat: 36.4800, lng: 127.2890, level: 6 },
  경기: { lat: 37.2636, lng: 127.0286, level: 7 },
  강원: { lat: 37.7830, lng: 128.8820, level: 7 },
  충북: { lat: 36.6424, lng: 127.4890, level: 7 },
  충남: { lat: 36.7360, lng: 126.9350, level: 7 },
  전북: { lat: 35.8156, lng: 127.1500, level: 6 },
  제주: { lat: 33.3860, lng: 126.8020, level: 7 },
  전남광주통합특별시: { lat: 35.1595, lng: 126.8526, level: 7 },
};

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
  const category = useMapStore((s) => s.category);

  /*
    피드는 지도와 같은 온기를 본다.
    예전에는 지도가 seed(44건), 피드가 mock JSON(12건)을 따로 읽어서 같은 화면의
    좌우가 서로 다른 장소를 말했다 — 지도엔 북촌 말풍선이 떠 있는데 피드에서
    '서울'을 누르면 "기록이 없습니다"가 나왔다. 소스를 하나로 합친다.
  */
  const allWarmths = useMapStore((s) => s.warmths);
  const period = useMapStore((s) => s.warmthPeriod);

  /* 지도 범례에서 고른 기간 창을 피드도 그대로 따른다. */
  const warmths = useMemo(() => filterByPeriod(allWarmths, period), [allWarmths, period]);

  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'place'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const feedTopRef = useRef<HTMLDivElement>(null);
  const regionScrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
    const center = REGION_CENTERS[regionId];
    if (center && map && window.kakao?.maps?.LatLng) {
      map.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
      if (center.level && map.setLevel) {
        map.setLevel(center.level);
      }
    }
  };

  const reviews = useMemo(() => warmths.map(toReview), [warmths]);

  /** 온기가 가장 많이 쌓인 장소. 실제 집계라 근거를 그대로 화면에 적을 수 있다. */
  const topPlace = useMemo(() => {
    const scoped =
      selectedRegion === 'all'
        ? warmths
        : warmths.filter((w) => regionOf(w.lat, w.lng) === selectedRegion);

    const ranked = Array.from(countByPlace(scoped).entries()).sort(
      (a, b) => b[1].count - a[1].count,
    )[0];

    if (ranked) {
      const [placeId, info] = ranked;
      return {
        placeId,
        placeName: info.name,
        count: info.count,
        region: regionOf(info.lat, info.lng),
        lat: info.lat,
        lng: info.lng,
      };
    }

    // 해당 지역에 온기가 아직 없는 경우 해당 권역의 대표 한옥/장소를 1위로 추천
    if (selectedRegion !== 'all') {
      const localItem = items.find((it) => regionOf(it.lat, it.lng) === selectedRegion);
      if (localItem) {
        return {
          placeId: localItem.id,
          placeName: localItem.name,
          count: 1,
          region: selectedRegion,
          lat: localItem.lat,
          lng: localItem.lng,
        };
      }
    }

    return null;
  }, [warmths, selectedRegion, items]);

  const filteredReviews = useMemo(() => {
    let list =
      selectedRegion === 'all'
        ? reviews
        : reviews.filter((r) => r.placeRegion === selectedRegion);

    // 상단 분위기 카테고리 칩 필터 연동 (정취 분위기 또는 평점 기준)
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

  // 지역, 정렬, 카테고리 변경 시 1페이지로 리셋
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

        {/* 14대 광역 지역 선택 캐러셀 (좌우 화살표 포함) */}
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
            {REGION_OPTIONS.map((reg) => {
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
                  <span>실시간 방문 집중 1위</span>
                </FeaturedRank>
                <FeaturedName>{topPlace.placeName}</FeaturedName>
                <FeaturedMeta>
                  {[topPlace.region, `온기 ${topPlace.count}개`].filter(Boolean).join(' · ')}
                </FeaturedMeta>
              </FeaturedInfo>
            </FeaturedLeft>

            <MoreBtn
              type="button"
              onClick={() => {
                setPopularPanelOpen(true);
                setSheetSnap('half');
              }}
              title="1위~10위 인기 장소 전체 순위 보기"
            >
              <span>더보기</span>
              <ChevronRight size={13} strokeWidth={2} />
            </MoreBtn>
          </FeaturedCard>
        </FeaturedPlaceArea>
      )}

      {/* 날씨/날짜별 혼잡도 스크러버 (차트) */}
      <ScrubberSection>
        <DateScrubber embedded />
      </ScrubberSection>


      <ReviewSectionHeader>
        <ReviewSectionTitle>
          <MessageCircle size={16} strokeWidth={2} color={meok[700]} />
          <span>여행자들이 남긴 온기 이야기</span>
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
              ? '아직 내가 남긴 온기가 없습니다.'
              : selectedRegion === 'all'
                ? '선택하신 조건에 해당하는 온기가 아직 없습니다.'
                : `${selectedRegion}에 남겨진 온기가 아직 없습니다.`}
            <br />
            이곳에 첫 번째 따뜻한 온기를 불어넣어 보세요.
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
