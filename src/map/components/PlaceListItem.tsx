'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import styled from '@emotion/styled';
import {
  IoStorefrontOutline,
  IoHomeOutline,
  IoRestaurantOutline,
  IoCafeOutline,
  IoBagHandleOutline,
  IoSparklesOutline,
  IoBookOutline,
  IoCalendarOutline,
  IoHeadsetOutline,
  IoBookmark,
  IoBookmarkOutline,
} from 'react-icons/io5';
import { lightPalette, meok } from '@/design-system/tokens';
import { useBookmarkStore } from '@/map/hooks/useBookmarkStore';
import { useMapStore } from '@/map/hooks/useMapStore';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { matchOdiiStory } from '@/features/odii-audio/hooks/useOdiiPlaceStory';
import { calculateTravelEstimate } from '@/map/utils/geo';
import { CATEGORY_STYLES } from './PlaceMarkers';
import type { Item, PlaceCategory } from '@/map/types';

interface PlaceListItemProps {
  item: Item;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (item: Item) => void;
  onHover: (id: string | null) => void;
}

const ItemContainer = styled.li`
  position: relative;
  padding: 3px 8px;
`;

const ItemButton = styled.button<{ $isSelected: boolean }>`
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;

  border-radius: 16px;
  border: 1px solid
    ${({ $isSelected }) =>
      $isSelected ? 'rgba(0, 184, 130, 0.3)' : 'transparent'};
  background: ${({ $isSelected }) =>
    $isSelected ? 'rgba(25, 31, 40, 0.04)' : 'transparent'};
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $isSelected }) =>
      $isSelected ? 'rgba(25, 31, 40, 0.06)' : 'rgba(25, 31, 40, 0.03)'};
  }

  &:active {
    transform: scale(0.985);
  }

  &:focus-visible {
    border-color: ${meok[500]};
  }
`;

const BookmarkQuickBtn = styled.button<{ $active: boolean }>`
  position: absolute;
  top: 13px;
  right: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: ${({ $active }) => ($active ? 'rgba(232, 90, 24, 0.12)' : 'rgba(25, 31, 40, 0.04)')};
  color: ${({ $active }) => ($active ? lightPalette.juhong[500] : meok[400])};
  cursor: pointer;
  z-index: 3;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'rgba(232, 90, 24, 0.2)' : 'rgba(25, 31, 40, 0.08)')};
    color: ${({ $active }) => ($active ? lightPalette.juhong[700] : meok[700])};
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const ThumbnailBox = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
  background: ${meok[200]};
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;

  @media (max-width: 1023px) {
    width: 64px;
    height: 64px;
  }
`;

const FallbackIconWrapper = styled.div`
  color: ${meok[400]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  flex: 1;
  min-width: 0;
  padding-right: 28px;
`;

const Row1 = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Title = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.02em;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  flex-wrap: wrap;
  margin-top: 1px;
`;

const CategoryTag = styled.span<{ $category: PlaceCategory }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: ${({ $category }) =>
    $category === 'spot'
      ? meok[700]
      : CATEGORY_STYLES[$category]?.main || meok[700]};
  background: ${({ $category }) =>
    $category === 'spot'
      ? 'rgba(78, 89, 104, 0.07)'
      : CATEGORY_STYLES[$category]?.lightBg || 'rgba(78, 89, 104, 0.07)'};
  border: 1px solid
    ${({ $category }) =>
      $category === 'spot'
        ? 'rgba(78, 89, 104, 0.1)'
        : 'transparent'};
  flex-shrink: 0;
`;

const TraditionalBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 600;
  color: ${lightPalette.cheongrok[700]};
  background: rgba(0, 184, 130, 0.1);
  border: 1px solid rgba(0, 184, 130, 0.2);
  white-space: nowrap;
`;

const Badge = styled.span`
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 400;
  color: ${meok[500]};
  background: rgba(78, 89, 104, 0.05);
  border: 1px solid rgba(78, 89, 104, 0.08);
  white-space: nowrap;
`;

const OdiiBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 700;
  color: #ffffff;
  background: ${lightPalette.jangmi[500]};
  white-space: nowrap;
`;

const DistanceRow = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: ${meok[700]};
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
`;

const DistrictRow = styled.div`
  font-size: 12px;
  font-weight: 400;
  color: ${meok[500]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 카테고리별 한글 명칭 */
const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  spot: '고택·명소',
  experience: '한복·전통체험',
  culture: '문화재·서원',
  festival: '야행·축제',
  stay: '한옥숙소',
  food: '향토음식',
  cafe: '한옥카페·디저트',
  market: '전통시장',
};

/** 카테고리별 SVG 폴백 아이콘 렌더링 */
function renderCategoryIcon(category: PlaceCategory) {
  switch (category) {
    case 'spot':
      return <IoStorefrontOutline size={24} />;
    case 'experience':
      return <IoSparklesOutline size={24} />;
    case 'culture':
      return <IoBookOutline size={24} />;
    case 'festival':
      return <IoCalendarOutline size={24} />;
    case 'stay':
      return <IoHomeOutline size={24} />;
    case 'food':
      return <IoRestaurantOutline size={24} />;
    case 'cafe':
      return <IoCafeOutline size={24} />;
    case 'market':
      return <IoBagHandleOutline size={24} />;
    default:
      return <IoStorefrontOutline size={24} />;
  }
}

/** 주소에서 시/구 추출 */
function getDistrictFromAddr(addr?: string): string {
  if (!addr) return '';
  const parts = addr.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1]}`.replace(/특별자치도|특별자치시|광역시|도/g, '');
  }
  return addr;
}

function PlaceListItemComponent({
  item,
  index,
  isSelected,
  onSelect,
  onHover,
}: PlaceListItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);

  // 지도 마커 클릭 등으로 선택되었을 때 리스트 항목 자동 스크롤
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const userLocation = useMapStore((s) => s.userLocation);
  const center = useMapStore((s) => s.center);
  const availableStories = useOdiiAudioStore((s) => s.availableStories);
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(item.id));
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);

  const travelEstimate = useMemo(() => {
    return calculateTravelEstimate(item, userLocation, center);
  }, [item, userLocation, center]);

  const hasOdii = useMemo(() => {
    return Boolean(matchOdiiStory(item, availableStories));
  }, [item, availableStories]);

  const isRealTraditional = useMemo(() => {
    if (item.isTraditional !== undefined) return item.isTraditional;
    return /(한옥|고택|종택|향교|서원|사당|궁궐|성곽|누각|정자|기와|초가|전통|다원|다도|명옥헌|임청각|명재|선교장|운현궁|낙선재|대청|마루|온돌|당\b|재\b|헌\b|루\b|정\b|각\b|원\b)/i.test(
      item.name,
    );
  }, [item.isTraditional, item.name]);

  const catLabel = useMemo(() => {
    if (item.category === 'stay') return isRealTraditional ? '정통 한옥숙소' : '주변 연계숙소';
    if (item.category === 'cafe') return isRealTraditional ? '전통 찻집·한옥카페' : '주변 일반카페';
    if (item.category === 'food') return isRealTraditional ? '향토·전통음식' : '주변 일반음식';
    if (item.category === 'spot') return isRealTraditional ? '고택·전통명소' : '관광명소';
    return CATEGORY_LABELS[item.category] || '한옥명소';
  }, [item.category, isRealTraditional]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark({
      id: item.id,
      name: item.name,
      category: item.category,
      addr: item.addr || undefined,
      image: item.image || undefined,
      lat: item.lat,
      lng: item.lng,
    });
  };

  const district = getDistrictFromAddr(item.addr);
  const distText = travelEstimate.fullLabel;

  return (
    <ItemContainer ref={itemRef}>
      <ItemButton
        type="button"
        $isSelected={isSelected}
        onClick={() => onSelect(item)}
        onMouseEnter={() => onHover(item.id)}
        onMouseLeave={() => onHover(null)}
        aria-current={isSelected ? 'true' : undefined}
        aria-expanded={isSelected}
      >
        <ThumbnailBox>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="72px"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          ) : (
            <FallbackIconWrapper>
              {renderCategoryIcon(item.category)}
            </FallbackIconWrapper>
          )}
        </ThumbnailBox>

        <Content>
          <Row1>
            <Title title={item.name}>{item.name}</Title>
          </Row1>

          {/* 1. 주변 연계 & 주변 일반음식 (또는 정통 한옥) 뱃지 행 */}
          <BadgeRow>
            {isRealTraditional ? (
              <TraditionalBadge title="정통 한옥 및 전통 문화재 인증 명소">
                <IoStorefrontOutline size={11} />
                <span>정통 한옥</span>
              </TraditionalBadge>
            ) : (
              <Badge>주변 연계</Badge>
            )}
            <CategoryTag $category={item.category}>{catLabel}</CategoryTag>
            {hasOdii && (
              <OdiiBadge title="한국관광공사 공식 오디 오디오 도슨트 해설 지원 장소">
                <IoHeadsetOutline size={11} />
                <span>오디 해설</span>
              </OdiiBadge>
            )}
            {item.tel && <Badge>안내 가능</Badge>}
          </BadgeRow>

          {/* 2. 내 위치에서 거리 및 소요 시간 행 */}
          {distText && <DistanceRow>{distText}</DistanceRow>}

          {/* 3. 행정구역/지역명 행 (예: 대전 중구) */}
          {district && <DistrictRow>{district}</DistrictRow>}
        </Content>
      </ItemButton>

      <BookmarkQuickBtn
        type="button"
        $active={isBookmarked}
        onClick={handleBookmarkClick}
        title={isBookmarked ? '저장 해제' : '마음에 담기'}
        aria-label={isBookmarked ? `${item.name} 마음에 담기 취소` : `${item.name} 마음에 담기`}
      >
        {isBookmarked ? <IoBookmark size={14} /> : <IoBookmarkOutline size={14} />}
      </BookmarkQuickBtn>
    </ItemContainer>
  );
}

export const PlaceListItem = memo(PlaceListItemComponent);

