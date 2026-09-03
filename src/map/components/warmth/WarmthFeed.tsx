'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Landmark,
  Home,
  Utensils,
  Coffee,
  ShoppingBag,
} from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import { countByPlace, regionOf, toReview } from '@/map/warmth/warmthRepo';
import { filterByPeriod, PERIOD_OPTIONS, type WarmthPeriod } from '@/map/warmth/heatScale';
import WarmthCard from './WarmthCard';
import {
  FeedContainer,
  StickyTop,
  SectionHeader,
  SectionTitleGroup,
  SectionTitle,
  PeriodFilterRow,
  PeriodTabBtn,
  RegionScroller,
  RegionChip,
  FeaturedPlaceArea,
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

/**
 * 지역 칩.
 *
 * 예전에는 8개를 고정으로 박아뒀는데 피드 데이터가 전주·안동·경주뿐이라
 * 나머지 다섯은 누르면 무조건 "기록이 없습니다"였다. 지금은 실제로 온기가
 * 있는 지역만 세워서, 눌러서 비는 칩이 생기지 않는다.
 */
function buildRegions(warmths: { lat: number; lng: number }[]) {
  const seen = new Map<string, number>();

  for (const w of warmths) {
    const name = regionOf(w.lat, w.lng);
    if (name) seen.set(name, (seen.get(name) ?? 0) + 1);
  }

  const ranked = Array.from(seen.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => ({ id: name, label: name }));

  return [{ id: 'all', label: '전국' }, ...ranked];
}

function renderPlaceIcon(type: string) {
  if (type.includes('스테이') || type.includes('숙소') || type.includes('고택')) {
    return <Home size={20} />;
  }
  if (type.includes('음식') || type.includes('식당')) {
    return <Utensils size={20} />;
  }
  if (type.includes('카페') || type.includes('다원')) {
    return <Coffee size={20} />;
  }
  if (type.includes('시장')) {
    return <ShoppingBag size={20} />;
  }
  return <Landmark size={20} />;
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
  const setWarmthPeriod = useMapStore((s) => s.setWarmthPeriod);

  /* 지도 범례에서 고른 기간 창을 피드도 그대로 따른다. */
  const warmths = useMemo(() => filterByPeriod(allWarmths, period), [allWarmths, period]);

  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'place'>('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const feedTopRef = useRef<HTMLDivElement>(null);

  const regions = useMemo(() => buildRegions(warmths), [warmths]);

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

    if (!ranked) return null;

    const [placeId, info] = ranked;
    return {
      placeId,
      placeName: info.name,
      count: info.count,
      region: regionOf(info.lat, info.lng),
      lat: info.lat,
      lng: info.lng,
    };
  }, [warmths, selectedRegion]);

  const filteredReviews = useMemo(() => {
    let list =
      selectedRegion === 'all'
        ? reviews
        : reviews.filter((r) => r.placeRegion === selectedRegion);

    // 상단 분위기 카테고리 칩 필터 연동
    if (category === 'busy') {
      list = list.filter((r) => r.mood >= 4);
    } else if (category === 'quiet') {
      list = list.filter((r) => r.mood <= 2);
    } else if (category === 'today') {
      const ONE_DAY = 86_400_000;
      list = list.filter((r) => Date.now() - Date.parse(r.createdAt) < ONE_DAY);
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
            <Flame size={18} color="#FF6B00" />
            <SectionTitle>지금 핫한 한옥</SectionTitle>
          </SectionTitleGroup>
        </SectionHeader>

        <RegionScroller role="group" aria-label="지역 필터">
          {regions.map((r) => (
            <RegionChip
              key={r.id}
              type="button"
              aria-pressed={selectedRegion === r.id}
              $active={selectedRegion === r.id}
              onClick={() => setSelectedRegion(r.id)}
            >
              {r.label}
            </RegionChip>
          ))}
        </RegionScroller>
      </StickyTop>

      {topPlace && (
        <FeaturedPlaceArea>
          <FeaturedCard
            type="button"
            onClick={() =>
              handlePlaceClick(topPlace.placeId, topPlace.placeName, topPlace.lat, topPlace.lng)
            }
            title="장소 상세 보기"
          >
            <FeaturedLeft>
              <FeaturedIconBox>{renderPlaceIcon(topPlace.placeName)}</FeaturedIconBox>
              <FeaturedInfo>
                <FeaturedRank>
                  <Flame size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  <span>지금 가장 핫한 곳</span>
                </FeaturedRank>
                <FeaturedName>{topPlace.placeName}</FeaturedName>
                <FeaturedMeta>
                  {[topPlace.region, `온기 ${topPlace.count}개`].filter(Boolean).join(' · ')}
                </FeaturedMeta>
              </FeaturedInfo>
            </FeaturedLeft>

            <MoreBtn
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPopularPanelOpen(true);
              }}
              title="1위~10위 인기 장소 전체 순위 보기"
            >
              <span>더보기</span>
              <ChevronRight size={13} />
            </MoreBtn>
          </FeaturedCard>
        </FeaturedPlaceArea>
      )}

      {/* 기간 필터 탭 (최근 3일, 1주, 1달, 전체) */}
      <PeriodFilterRow role="group" aria-label="온기 기간 필터">
        {PERIOD_OPTIONS.map((opt) => (
          <PeriodTabBtn
            key={opt.id}
            type="button"
            aria-pressed={period === opt.id}
            $active={period === opt.id}
            onClick={() => setWarmthPeriod(opt.id as WarmthPeriod)}
          >
            {opt.label}
          </PeriodTabBtn>
        ))}
      </PeriodFilterRow>

      <ReviewSectionHeader>
        <ReviewSectionTitle>
          <MessageSquare size={16} color={meok[700]} />
          <span>이곳에 머문 이들의 온기 이야기</span>
          {totalPages > 1 && (
            <PageIndicator>({validPage}/{totalPages}p)</PageIndicator>
          )}
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
          <SortChevron size={13} />
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
                  <ChevronLeft size={15} />
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
                  <ChevronRight size={15} />
                </PageNavBtn>
              </PaginationWrapper>
            )}
          </>
        )}
      </FeedScroll>
    </FeedContainer>
  );
}
