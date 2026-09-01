'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import {
  Flame,
  ChevronDown,
  PenSquare,
  ChevronRight,
  MessageSquare,
  Landmark,
  Home,
  Utensils,
  Coffee,
  ShoppingBag,
} from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '../../hooks/useMapStore';
import type { WarmthReview } from '../../types';
import rawReviews from '../../mock/warmthReviews.mock.json';
import WarmthCard from './WarmthCard';

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

const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
`;

/* ── 1. 상단 실시간 인기 장소 헤더 (Sticky) ── */
const StickyTop = styled.div`
  position: sticky;
  top: 0;
  z-index: 5;
  background: #ffffff;
  padding: 12px 16px 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SectionTitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  letter-spacing: -0.02em;
`;

/* ── 가로 스크롤 지역 칩 ── */
const RegionScroller = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const RegionChip = styled.button<{ $active: boolean }>`
  flex: none;
  padding: 6px 13px;
  border: none;
  border-radius: 9999px;
  background: ${({ $active }) =>
    $active ? meok[900] : 'rgba(78, 89, 104, 0.07)'};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? meok[900] : 'rgba(78, 89, 104, 0.12)'};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }

  &:active {
    transform: scale(0.96);
  }
`;

/* ── 2. Top 1 인기 장소 1개 하이라이트 카드 (더보기 클릭 시 우측 패널 노출) ── */
const FeaturedPlaceArea = styled.div`
  padding: 8px 16px 14px;
`;

const FeaturedCard = styled.div`
  padding: 14px 16px;
  background: #f7f1e6;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #f0eae0;
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.985);
  }
`;

const FeaturedLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const FeaturedIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.juhong[500]};
  flex-shrink: 0;
`;

const FeaturedInfo = styled.div`
  min-width: 0;
`;

const FeaturedRank = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${lightPalette.juhong[700]};
  display: block;
  margin-bottom: 2px;
`;

const FeaturedName = styled.h4`
  margin: 0 0 2px;
  font-size: 14.5px;
  font-weight: 700;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FeaturedMeta = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${meok[500]};
`;

const MoreBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border: none;
  border-radius: 9999px;
  background: #ffffff;
  color: ${meok[900]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    background: ${meok[900]};
    color: #ffffff;
  }
`;

/* ── 3. 이번 주 인기있는 한줄평 섹션 ── */
const ReviewSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
`;

const ReviewSectionTitle = styled.h4`
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: ${meok[900]};
  display: flex;
  align-items: center;
  gap: 5px;
`;

const SortWrapper = styled.div`
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
  padding: 2px 16px 2px 4px;
  cursor: pointer;
  outline: none;

  &:hover {
    color: ${meok[900]};
  }
`;

const SortChevron = styled(ChevronDown)`
  position: absolute;
  right: 0;
  pointer-events: none;
  color: ${meok[500]};
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px 8px 24px;
`;

/* ── 빈 상태 ── */
const EmptyBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 20px;
  text-align: center;
`;

const EmptyDesc = styled.p`
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${meok[500]};
`;

const WriteActionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 9999px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(232, 90, 24, 0.25);
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.juhong[700]};
  }

  &:active {
    transform: scale(0.97);
  }
`;

function renderPlaceIcon(type: string) {
  if (type.includes('숙소') || type.includes('스테이') || type.includes('고택')) {
    return <Home size={20} />;
  }
  if (type.includes('음식') || type.includes('식당')) {
    return <Utensils size={20} />;
  }
  if (type.includes('카페') || type.includes('찻집')) {
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
  const [apiTopPlace, setApiTopPlace] = useState<{
    placeId: string;
    placeName: string;
    placeType: string;
    placeRegion: string;
    helpfulCount: number;
    congestionLevel: string;
    lat?: number;
    lng?: number;
  } | null>(null);

  const reviews = rawReviews as WarmthReview[];

  // 한국관광공사 인기/혼잡도 API 실시간 호출
  useEffect(() => {
    let active = true;
    fetch(`/api/popular-places?region=${encodeURIComponent(selectedRegion)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.topPlace) {
          setApiTopPlace(data.topPlace);
        }
      })
      .catch(() => {
        // 실패 시 mock 폴백 유지
      });

    return () => {
      active = false;
    };
  }, [selectedRegion]);

  // 지역별 및 정렬 필터링
  const filteredReviews = useMemo(() => {
    let list = [...reviews];

    if (selectedRegion !== 'all') {
      list = list.filter((r) =>
        r.placeRegion.includes(selectedRegion) || r.placeName.includes(selectedRegion),
      );
    }

    if (sortOrder === 'helpful') {
      return list.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }
    return list;
  }, [reviews, selectedRegion, sortOrder]);

  // 선택된 지역의 1위 인기 대표 장소 (API 데이터 우선, 없으면 리뷰 1위)
  const topPlace = useMemo(() => {
    if (apiTopPlace) return apiTopPlace;
    if (filteredReviews.length === 0) return null;
    return [...filteredReviews].sort((a, b) => b.helpfulCount - a.helpfulCount)[0];
  }, [apiTopPlace, filteredReviews]);

  // 장소 클릭 시 지도 이동 및 상세 패널 열기
  const handleOpenDetail = (placeId: string, placeName: string) => {
    const matched = items.find(
      (i) => i.id === placeId || i.name.includes(placeName.split(' ')[0]),
    );
    const targetId = matched?.id || placeId;

    setSelectedId(targetId);
    setDetailId(targetId);
    setSheetSnap('full');

    if (matched && map && window.kakao?.maps) {
      map.panTo(new window.kakao.maps.LatLng(matched.lat, matched.lng));
    }
  };

  // '더보기 >' 클릭 시 우측에 인기 장소 랭킹 전체 목록 패널 열기
  const handleOpenPopularList = () => {
    setPopularPanelOpen(true);
    setSheetSnap('full');
  };

  return (
    <FeedContainer>
      {/* 1. 상단 Sticky 헤더: '실시간 인기 장소' + 가로 스크롤 지역 칩 */}
      <StickyTop>
        <SectionHeader>
          <SectionTitleGroup>
            <Flame size={18} color={lightPalette.juhong[500]} fill={lightPalette.juhong[500]} />
            <SectionTitle>실시간 인기 장소</SectionTitle>
          </SectionTitleGroup>
        </SectionHeader>

        {/* 가로 스크롤 지역 칩 */}
        <RegionScroller role="tablist" aria-label="지역별 인기 장소 필터">
          {REGIONS.map((reg) => (
            <RegionChip
              key={reg.id}
              type="button"
              role="tab"
              aria-selected={selectedRegion === reg.id}
              $active={selectedRegion === reg.id}
              onClick={() => setSelectedRegion(reg.id)}
            >
              {reg.label}
            </RegionChip>
          ))}
        </RegionScroller>
      </StickyTop>

      {/* 2. 인기 장소 1개 하이라이트 카드 (더보기 누르면 오른쪽 패널에 인기 목록 노출) */}
      {topPlace && (
        <FeaturedPlaceArea>
          <FeaturedCard
            onClick={() => handleOpenDetail(topPlace.placeId, topPlace.placeName)}
            role="button"
            aria-label={`${topPlace.placeName} 상세 정보 보기`}
          >
            <FeaturedLeft>
              <FeaturedIconBox>{renderPlaceIcon(topPlace.placeType)}</FeaturedIconBox>
              <FeaturedInfo>
                <FeaturedRank>🏆 이번 주 1위 명소</FeaturedRank>
                <FeaturedName>{topPlace.placeName}</FeaturedName>
                <FeaturedMeta>
                  {topPlace.placeRegion} · 온기 {topPlace.helpfulCount}개
                </FeaturedMeta>
              </FeaturedInfo>
            </FeaturedLeft>
            <MoreBtn
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPopularList();
              }}
              aria-label="오른쪽 패널에서 인기 장소 전체 목록 보기"
            >
              <span>더보기</span>
              <ChevronRight size={14} />
            </MoreBtn>
          </FeaturedCard>
        </FeaturedPlaceArea>
      )}

      {/* 3. 이번 주 인기있는 한줄평 섹션 */}
      <ReviewSectionHeader>
        <ReviewSectionTitle>
          <MessageSquare size={16} color={lightPalette.cheongrok[700]} />
          <span>이번 주 인기있는 한줄평</span>
        </ReviewSectionTitle>

        <SortWrapper>
          <SortSelect
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'helpful')}
            aria-label="한줄평 정렬"
          >
            <option value="recent">최신순</option>
            <option value="helpful">도움순</option>
          </SortSelect>
          <SortChevron size={14} />
        </SortWrapper>
      </ReviewSectionHeader>

      {/* 4. 후기 목록 / 빈 상태 */}
      {filteredReviews.length === 0 ? (
        <EmptyBox>
          <EmptyDesc>이 지역 온기 글이 아직 없어요.</EmptyDesc>
          <WriteActionBtn type="button" onClick={() => alert('온기 작성 기능이 곧 오픈됩니다!')}>
            <PenSquare size={14} />
            <span>첫 온기 남기기</span>
          </WriteActionBtn>
        </EmptyBox>
      ) : (
        <ReviewList>
          {filteredReviews.map((review) => (
            <WarmthCard key={review.id} review={review} onHover={setHoveredId} />
          ))}
        </ReviewList>
      )}
    </FeedContainer>
  );
}
