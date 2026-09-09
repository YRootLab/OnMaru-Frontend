'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Landmark, Home, Utensils, Coffee, ShoppingBag, Flame, Leaf, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { lightPalette, darkPalette, meok, surface } from '@/design-system/tokens';
import { useMapStore } from '@/map/hooks/useMapStore';
import { toggleHelpful } from '@/map/warmth/warmthRepo';
import { formatRelativeTime } from '@/map/utils/formatters';
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
  background: ${surface.light.surface};
  border: none;
  transition: all 0.18s ease;

  &:hover {
    background: ${surface.light.base};
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${surface.dark.surface};

    &:hover {
      background: ${surface.dark.card};
    }
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
  background: ${surface.light.card};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[900]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: ${surface.dark.app};
    color: ${meok[100]};
  }
`;

const PlaceHeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PlaceTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`;

const PlaceName = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const CrowdMoodBadge = styled.span<{ $crowd?: '북적' | '한적' }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  background: ${({ $crowd }) =>
    $crowd === '북적' ? 'rgba(232, 90, 24, 0.1)' : 'rgba(36, 152, 120, 0.1)'};
  color: ${({ $crowd }) =>
    $crowd === '북적' ? lightPalette.juhong[700] : lightPalette.cheongrok[700]};

  [data-theme='dark'] & {
    background: ${({ $crowd }) =>
      $crowd === '북적' ? 'rgba(232, 90, 24, 0.2)' : 'rgba(36, 152, 120, 0.2)'};
    color: ${({ $crowd }) =>
      $crowd === '북적' ? darkPalette.juhong[200] : darkPalette.cheongrok[200]};
  }
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

  [data-theme='dark'] & {
    color: ${meok[200]};
  }
`;

const TextToggleBtn = styled.button`
  margin-top: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: ${meok[700]};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    color: ${meok[900]};
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
  border: none;
  background: ${({ $active }) =>
    $active ? lightPalette.juhong[50] : 'rgba(78, 89, 104, 0.07)'};
  color: ${({ $active }) =>
    $active ? lightPalette.juhong[700] : meok[700]};
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[100] : 'rgba(78, 89, 104, 0.12)'};
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? 'rgba(232, 90, 24, 0.2)' : 'rgba(255, 255, 255, 0.06)'};
    color: ${({ $active }) =>
      $active ? darkPalette.juhong[200] : meok[400]};
  }
`;

/* ── 5. 관련 장소 미니 카드 ── */
const RelatedPlaceBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  background: ${surface.light.card};
  border-radius: 14px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${surface.light.base};
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: ${surface.dark.app};

    &:hover {
      background: ${surface.dark.surface};
    }
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
  background: ${meok[200]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[700]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: #2c2822;
    color: ${meok[400]};
  }
`;

const RelatedInfo = styled.div`
  min-width: 0;
`;

const RelatedName = styled.h5`
  margin: 0;
  font-size: 13px;
  font-weight: 500;
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
    return <Home size={18} strokeWidth={2} />;
  }
  if (type.includes('음식') || type.includes('국밥') || type.includes('식당')) {
    return <Utensils size={18} strokeWidth={2} />;
  }
  if (type.includes('카페') || type.includes('찻집')) {
    return <Coffee size={18} strokeWidth={2} />;
  }
  if (type.includes('시장') || type.includes('쇼핑')) {
    return <ShoppingBag size={18} strokeWidth={2} />;
  }
  return <Landmark size={18} strokeWidth={2} />;
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
    const next = toggleHelpful(review.id);
    setHelpful(next);
    setHelpfulCount((cnt) => (next ? cnt + 1 : Math.max(0, cnt - 1)));
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
          <PlaceTitleRow>
            <PlaceName>{review.placeName}</PlaceName>
            {review.crowdMood && (
              <CrowdMoodBadge $crowd={review.crowdMood}>
                {review.crowdMood === '북적' ? (
                  <>
                    <Flame size={12} strokeWidth={2} />
                    <span>북적이는 활기</span>
                  </>
                ) : (
                  <>
                    <Leaf size={12} strokeWidth={2} />
                    <span>고즈넉한 쉼</span>
                  </>
                )}
              </CrowdMoodBadge>
            )}
          </PlaceTitleRow>
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
              >
                {isExpanded ? (
                  <>
                    <span>접기</span>
                    <ChevronUp size={13} strokeWidth={2} />
                  </>
                ) : (
                  <>
                    <span>더보기</span>
                    <ChevronDown size={13} strokeWidth={2} />
                  </>
                )}
              </TextToggleBtn>
            )}
          </>
        )}
      </ReviewBody>

      {/* 4. 하단 메타 & 따뜻해요 */}
      <FooterMeta>
        <MetaDate>
          {formatRelativeTime(review.createdAt)}
        </MetaDate>
        <HelpfulButton
          type="button"
          $active={helpful}
          onClick={handleHelpfulToggle}
          aria-label="이 온기에 공감하시나요? (따뜻해요)"
          title="따뜻해요 공감 남기기"
        >
          <Flame size={14} strokeWidth={2} color={helpful ? lightPalette.juhong[500] : undefined} />
          <span>따뜻해요 {helpfulCount > 0 ? helpfulCount : ''}</span>
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
        <ChevronRight size={16} strokeWidth={2} color={lightPalette.juhong[400]} />
      </RelatedPlaceBox>
    </CardWrapper>
  );
}
