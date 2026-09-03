'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import styled from '@emotion/styled';
import {
  Landmark,
  Home,
  Utensils,
  Coffee,
  Store,
  Sparkles,
  BookOpen,
  Moon,
  Headphones,
  Bookmark,
} from 'lucide-react';
import { lightPalette, meok } from '@/design-system/tokens';
import { useBookmarkStore } from '@/map/hooks/useBookmarkStore';
import { useOdiiAudioStore } from '@/features/odii-audio/store/useOdiiAudioStore';
import { matchOdiiStory } from '@/features/odii-audio/hooks/useOdiiPlaceStory';
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
  background: ${({ $isSelected }) =>
    $isSelected ? 'rgba(40, 110, 95, 0.08)' : 'transparent'};
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $isSelected }) =>
      $isSelected ? 'rgba(40, 110, 95, 0.1)' : 'rgba(25, 31, 40, 0.04)'};
  }

  &:active {
    transform: scale(0.985);
  }

  &:focus-visible {
    background: rgba(40, 110, 95, 0.08);
  }
`;

const BookmarkQuickBtn = styled.button<{ $active: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
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
  background: #f0eae0;
  display: flex;
  align-items: center;
  justify-content: center;

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
  justify-content: space-between;
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
  font-weight: 600;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
`;

const IndexNumber = styled.span`
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${meok[400]};
  font-variant-numeric: tabular-nums;
`;

const Row2 = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${meok[500]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 3px;
`;

const CategoryTag = styled.span<{ $category: PlaceCategory }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1.5px 6px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $category }) => CATEGORY_STYLES[$category]?.main || '#1E7A68'};
  background: ${({ $category }) => CATEGORY_STYLES[$category]?.lightBg || '#E6F5F0'};
  flex-shrink: 0;
`;

const DistrictText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Row3 = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${lightPalette.cheongrok[700]};
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
`;

const TraditionalBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 700;
  color: ${lightPalette.cheongrok[700]};
  background: rgba(40, 110, 95, 0.12);
  white-space: nowrap;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  overflow: hidden;
`;

const Badge = styled.span`
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 500;
  color: ${meok[700]};
  background: rgba(78, 89, 104, 0.07);
  white-space: nowrap;
`;

const OdiiBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 800;
  color: #ffffff;
  background: ${lightPalette.jangmi[500]};

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
      return <Landmark size={24} />;
    case 'experience':
      return <Sparkles size={24} />;
    case 'culture':
      return <BookOpen size={24} />;
    case 'festival':
      return <Moon size={24} />;
    case 'stay':
      return <Home size={24} />;
    case 'food':
      return <Utensils size={24} />;
    case 'cafe':
      return <Coffee size={24} />;
    case 'market':
      return <Store size={24} />;
    default:
      return <Landmark size={24} />;
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

/** 거리 및 소요 시간 계산 (1000m 미만 "내 위치에서 320m · 도보 5분", 이상 "내 위치에서 2.4km · 차량 5분") */
function formatDistance(dist?: number | null): string {
  if (dist === null || dist === undefined || !Number.isFinite(dist)) return '';
  const distStr = dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
  if (dist < 1200) {
    const walkMinutes = Math.max(1, Math.round(dist / 67));
    return `내 위치에서 ${distStr} · 도보 ${walkMinutes}분`;
  }
  const driveMinutes = Math.max(2, Math.round(dist / 500));
  return `내 위치에서 ${distStr} · 차량 ${driveMinutes}분`;
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

  const availableStories = useOdiiAudioStore((s) => s.availableStories);
  const isBookmarked = useBookmarkStore((s) => s.isBookmarked(item.id));
  const toggleBookmark = useBookmarkStore((s) => s.toggleBookmark);

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
  const distText = formatDistance(item.dist);

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
            <IndexNumber>{index + 1}</IndexNumber>
          </Row1>

          <Row2 title={`${catLabel} · ${district}`}>
            <CategoryTag $category={item.category}>{catLabel}</CategoryTag>
            {district && <DistrictText>{district}</DistrictText>}
          </Row2>

          {distText && <Row3>{distText}</Row3>}

          <BadgeRow>
            {isRealTraditional ? (
              <TraditionalBadge title="정통 한옥 및 전통 문화재 인증 명소">
                <Landmark size={10} />
                <span>정통 한옥</span>
              </TraditionalBadge>
            ) : (
              <Badge>주변 연계</Badge>
            )}
            {hasOdii && (
              <OdiiBadge title="한국관광공사 공식 오디 오디오 도슨트 해설 지원 장소">
                <Headphones size={10} />
                <span>오디 해설</span>
              </OdiiBadge>
            )}
            {item.tel && <Badge>안내 가능</Badge>}
          </BadgeRow>
        </Content>

        <BookmarkQuickBtn
          type="button"
          $active={isBookmarked}
          onClick={handleBookmarkClick}
          title={isBookmarked ? '저장 해제' : '마음에 담기'}
          aria-label={isBookmarked ? `${item.name} 마음에 담기 취소` : `${item.name} 마음에 담기`}
        >
          <Bookmark size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
        </BookmarkQuickBtn>
      </ItemButton>
    </ItemContainer>
  );
}

export const PlaceListItem = memo(PlaceListItemComponent);

