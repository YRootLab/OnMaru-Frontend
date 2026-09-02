'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  Landmark,
  Home,
  Utensils,
  Coffee,
  Store,
  ThumbsUp,
  ChevronRight,
} from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import type { WarmthReview } from '@/map/types';
import MoodSelector from './MoodSelector';
import TagGroup from './TagGroup';

interface WarmthCardProps {
  review: WarmthReview;
  onHover?: (placeId: string | null) => void;
}

const CardWrapper = styled.article`
  padding: 16px;
  margin: 4px 0 10px;
  border-radius: 20px;
  background: rgba(232, 90, 24, 0.03);

  transition: all 0.18s ease;

  &:hover {
    background: rgba(232, 90, 24, 0.055);
    border-color: rgba(232, 90, 24, 0.16);

  }
`;

/* ── 1. 장소 헤더 ── */
const PlaceHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

const CategoryIconBox = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: ${lightPalette.juhong[50]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.juhong[500]};
  flex-shrink: 0;
`;

const PlaceHeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlaceName = styled.h4`
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PlaceMeta = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${meok[500]};
`;

/* ── 2. 감정 표시 ── */
const MoodSection = styled.div`
  margin: 12px 0 12px;
`;

/* ── 3. 단일 통합 후기 본문 및 태그 ── */
const ReviewBody = styled.div`
  margin-bottom: 12px;
`;

const TagSection = styled.div`
  margin-bottom: 8px;
`;

const ReviewText = styled.p<{ $expanded: boolean }>`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: ${meok[900]};
  word-break: keep-all;
  white-space: pre-line;

  ${({ $expanded }) =>
    !$expanded &&
    `
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `}
`;

const TextToggleBtn = styled.button`
  margin-top: 6px;
  padding: 0;

  background: transparent;
  color: ${lightPalette.juhong[500]};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: ${lightPalette.juhong[700]};
  }
`;

/* ── 4. 하단 메타 & 도움돼요 ── */
const FooterMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 4px;
`;

const MetaDate = styled.span`
  font-size: 12px;
  color: ${meok[500]};
`;

const HelpfulButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  border-radius: 9999px;

  background: ${({ $active }) =>
    $active ? lightPalette.juhong[100] : lightPalette.juhong[50]};
  color: ${lightPalette.juhong[700]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${lightPalette.juhong[100]};
  }

  &:active {
    transform: scale(0.96);
  }
`;

/* ── 5. 관련 장소 미니 카드 ── */
const RelatedPlaceBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  background: #ffffff;
  border-radius: 14px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #fffcf9;
    transform: translateY(-1px);

  }
`;

const RelatedLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const RelatedThumb = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${lightPalette.juhong[50]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.juhong[500]};
  flex-shrink: 0;
`;

const RelatedInfo = styled.div`
  min-width: 0;
`;

const RelatedName = styled.h5`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RelatedMeta = styled.span`
  font-size: 11.5px;
  color: ${meok[500]};
`;

function renderCategoryIcon(type: string) {
  if (type.includes('숙소') || type.includes('스테이') || type.includes('고택')) {
    return <Home size={18} />;
  }
  if (type.includes('음식') || type.includes('국밥') || type.includes('식당')) {
    return <Utensils size={18} />;
  }
  if (type.includes('카페') || type.includes('찻집')) {
    return <Coffee size={18} />;
  }
  if (type.includes('시장') || type.includes('쇼핑')) {
    return <Store size={18} />;
  }
  return <Landmark size={18} />;
}

export default function WarmthCard({ review, onHover }: WarmthCardProps) {
  const map = useMapStore((s) => s.map);
  const items = useMapStore((s) => s.items);
  const setSelectedId = useMapStore((s) => s.setSelectedId);
  const setDetailId = useMapStore((s) => s.setDetailId);
  const setSheetSnap = useMapStore((s) => s.setSheetSnap);

  const [isExpanded, setIsExpanded] = useState(false);
  const [helpful, setHelpful] = useState(review.isHelpful || false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);

  // 태그 통합
  const allTags = Array.from(
    new Set([...(review.goodTags || []), ...(review.badTags || [])]),
  );

  // 본문 텍스트 통합
  const fullText = [review.goodText, review.badText].filter(Boolean).join('\n\n');

  // 일치하는 장소 검색
  const matchedItem = items.find(
    (i) => i.id === review.placeId || i.name.includes(review.placeName.split(' ')[0]),
  );

  const handleCardClick = () => {
    if (matchedItem && map && window.kakao?.maps) {
      setSelectedId(matchedItem.id);
      map.panTo(new window.kakao.maps.LatLng(matchedItem.lat, matchedItem.lng));
    }
  };

  const handleGoToDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (matchedItem) {
      setSelectedId(matchedItem.id);
      setDetailId(matchedItem.id);
      setSheetSnap('full');
      if (map && window.kakao?.maps) {
        map.panTo(new window.kakao.maps.LatLng(matchedItem.lat, matchedItem.lng));
      }
    } else {
      setSelectedId(review.placeId);
      setDetailId(review.placeId);
      setSheetSnap('full');
    }
  };

  const handleHelpfulToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpful((prev) => {
      const next = !prev;
      setHelpfulCount((cnt) => (next ? cnt + 1 : cnt - 1));
      return next;
    });
  };

  const metaText = [
    review.placeRegion,
    `${review.season} 방문`,
    review.visitCount ? `${review.visitCount}번째` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <CardWrapper
      onClick={handleCardClick}
      onMouseEnter={() => onHover?.(matchedItem?.id || review.placeId)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* 1. 장소 헤더 */}
      <PlaceHeader>
        <CategoryIconBox>{renderCategoryIcon(review.placeType)}</CategoryIconBox>
        <PlaceHeaderInfo>
          <PlaceName>{review.placeName}</PlaceName>
          <PlaceMeta>{metaText}</PlaceMeta>
        </PlaceHeaderInfo>
      </PlaceHeader>

      {/* 2. 감정 표시 */}
      <MoodSection>
        <MoodSelector value={review.mood} readonly />
      </MoodSection>

      {/* 3. 통합된 키워드 태그 및 후기 본문 */}
      <ReviewBody>
        {allTags.length > 0 && (
          <TagSection>
            <TagGroup tags={allTags} />
          </TagSection>
        )}
        {fullText && (
          <>
            <ReviewText $expanded={isExpanded}>{fullText}</ReviewText>
            {fullText.length > 90 && (
              <TextToggleBtn
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((prev) => !prev);
                }}
              >
                {isExpanded ? '접기 ▲' : '더보기 ▼'}
              </TextToggleBtn>
            )}
          </>
        )}
      </ReviewBody>

      {/* 4. 하단 메타 & 도움돼요 */}
      <FooterMeta>
        <MetaDate>
          {review.createdAt} · 도움돼요 {helpfulCount}
        </MetaDate>
        <HelpfulButton
          type="button"
          $active={helpful}
          onClick={handleHelpfulToggle}
          aria-label="이 후기가 도움이 되었나요?"
        >
          <ThumbsUp size={13} fill={helpful ? lightPalette.juhong[500] : 'none'} />
          <span>도움돼요</span>
        </HelpfulButton>
      </FooterMeta>

      {/* 5. 관련 장소 미니 카드 */}
      <RelatedPlaceBox onClick={handleGoToDetail} role="button" aria-label="장소 상세 정보 보기">
        <RelatedLeft>
          <RelatedThumb>{renderCategoryIcon(review.placeType)}</RelatedThumb>
          <RelatedInfo>
            <RelatedName>{review.placeName}</RelatedName>
            <RelatedMeta>{review.placeType}</RelatedMeta>
          </RelatedInfo>
        </RelatedLeft>
        <ChevronRight size={16} color={lightPalette.juhong[400]} />
      </RelatedPlaceBox>
    </CardWrapper>
  );
}
