'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  ChevronRight,
  MessageSquare,
  Landmark,
  Home,
  Utensils,
  Coffee,
  ShoppingBag,
} from 'lucide-react';
import { meok } from '@/design-system/tokens';
import { useMapStore } from '../../hooks/useMapStore';
import type { WarmthReview, RankedPlace } from '../../types';
import rawReviews from '../../mock/warmthReviews.mock.json';
import WarmthCard from './WarmthCard';
import {
  FeedContainer,
  StickyTop,
  SectionHeader,
  SectionTitleGroup,
  SectionTitle,
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
} from './WarmthFeed.styles';

const REGIONS = [
  { id: 'all', label: '전국' },
  { id: '전주', label: '전주' },
  { id: '안동', label: '안동' },
  { id: '경주', label: '경주' },
  { id: '서울', label: '서울' },
  { id: '담양', label: '담양' },
  { id: '강릉', label: '강릉' },
  { id: '제주', label: '제주' },
];

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

  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'helpful'>('recent');
  const [apiTopPlace, setApiTopPlace] = useState<RankedPlace | null>(null);

  const reviews = rawReviews as WarmthReview[];

  useEffect(() => {
    let active = true;
    fetch(`/api/popular-places?region=${encodeURIComponent(selectedRegion)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.topPlace) {
          setApiTopPlace(data.topPlace);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [selectedRegion]);

  const topPlace = useMemo(() => {
    if (apiTopPlace) return apiTopPlace;
    const candidates =
      selectedRegion === 'all'
        ? reviews
        : reviews.filter((r) => r.placeRegion.includes(selectedRegion));

    if (candidates.length === 0) return null;

    const highest = [...candidates].sort((a, b) => b.helpfulCount - a.helpfulCount)[0];
    return {
      placeId: highest.placeId,
      placeName: highest.placeName,
      placeType: highest.placeType,
      placeRegion: highest.placeRegion,
      helpfulCount: highest.helpfulCount,
      congestionLevel: '보통',
      image: null,
    };
  }, [apiTopPlace, reviews, selectedRegion]);

  const filteredReviews = useMemo(() => {
    let list =
      selectedRegion === 'all'
        ? reviews
        : reviews.filter((r) => r.placeRegion.includes(selectedRegion));

    if (sortOrder === 'helpful') {
      list = [...list].sort((a, b) => b.helpfulCount - a.helpfulCount);
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return list;
  }, [reviews, selectedRegion, sortOrder]);

  const handlePlaceClick = (placeId: string, placeName: string) => {
    const matched = items.find((i) => i.id === placeId || i.name.includes(placeName));

    if (matched) {
      setSelectedId(matched.id);
      setDetailId(matched.id);
      if (map && window.kakao?.maps?.LatLng) {
        map.panTo(new window.kakao.maps.LatLng(matched.lat, matched.lng));
      }
    } else {
      setDetailId(placeId);
    }
    setSheetSnap('half');
  };

  return (
    <FeedContainer>
      <StickyTop>
        <SectionHeader>
          <SectionTitleGroup>
            <Flame size={18} color="#FF6B00" />
            <SectionTitle>실시간 인기 장소</SectionTitle>
          </SectionTitleGroup>
        </SectionHeader>

        <RegionScroller>
          {REGIONS.map((r) => (
            <RegionChip
              key={r.id}
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
            onClick={() => handlePlaceClick(topPlace.placeId, topPlace.placeName)}
            title="장소 상세 보기"
          >
            <FeaturedLeft>
              <FeaturedIconBox>{renderPlaceIcon(topPlace.placeType)}</FeaturedIconBox>
              <FeaturedInfo>
                <FeaturedRank>🔥 1위 대표 명소</FeaturedRank>
                <FeaturedName>{topPlace.placeName}</FeaturedName>
                <FeaturedMeta>
                  {topPlace.placeRegion} · {topPlace.placeType}
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

      <ReviewSectionHeader>
        <ReviewSectionTitle>
          <MessageSquare size={16} color={meok[700]} />
          <span>이번 주 인기있는 한줄평</span>
        </ReviewSectionTitle>

        <SortWrapper>
          <SortSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'helpful')}
            aria-label="리뷰 정렬 방식"
          >
            <option value="recent">최신순</option>
            <option value="helpful">인기순</option>
          </SortSelect>
          <SortChevron size={13} />
        </SortWrapper>
      </ReviewSectionHeader>

      <FeedScroll>
        {filteredReviews.length === 0 ? (
          <EmptyState>
            해당 지역에 등록된 후기가 아직 없습니다.
            <br />첫 번째 방문 후기를 남겨보세요!
          </EmptyState>
        ) : (
          filteredReviews.map((review) => (
            <WarmthCard
              key={review.id}
              review={review}
              onHover={(id) => setHoveredId(id)}
            />
          ))
        )}
      </FeedScroll>
    </FeedContainer>
  );
}
