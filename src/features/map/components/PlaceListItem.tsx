'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import {
  Landmark,
  Home,
  Utensils,
  Coffee,
  ShoppingBag,
  Sparkles,
  BookOpen,
  Calendar,
  Headphones,
  Store,
} from 'lucide-react';
import { lightPalette, meok, fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { matchSorimaruStory } from '@/features/sorimaru-audio/hooks/useSorimaruPlaceStory';
import { calculateTravelEstimate } from '@/features/map/utils/geo';
import { CATEGORY_STYLES } from './PlaceMarkers';
import type { Item, PlaceCategory } from '@/features/map/types';
import SavePlaceButton from '@/features/saved-resources/components/SavePlaceButton';

interface PlaceListItemProps {
  item: Item;
  index: number;

  pageIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (item: Item) => void;
  onHover: (id: string | null) => void;
}

const ItemContainer = styled(motion.li)`
  position: relative;
  padding: 8px 14px;
  box-sizing: border-box;
  width: 100%;
  border-radius: 14px;
  transition: background-color 0.15s ease;

  [data-theme='dark'] & {
    &:hover {
      background: rgba(255, 255, 255, 0.04);
    }
  }
`;

const ItemButton = styled.button<{ $isSelected: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  box-sizing: border-box;
  padding: 0;

  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    img {
      transform: scale(1.3);
    }
    h4 {
      color: ${lightPalette.cheongrok[700]};
    }
  }

  [data-theme='dark'] & {
    &:hover h4 {
      color: #2dd4bf;
    }
  }

  &:active {
    transform: scale(0.99);
  }

  &:focus-visible {
    outline: 2px solid ${meok[500]};
    outline-offset: 2px;
  }
`;

const SaveButtonSlot = styled.div`
  position: absolute;
  top: 9px;
  right: 14px;
  z-index: 3;
`;

const ThumbnailBox = styled.div<{ $isSelected?: boolean; $src?: string | null }>`
  position: relative;
  width: 88px;
  height: 88px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  border-radius: 11.2px;
  overflow: hidden;
  ${({ $src }) =>
    $src
      ? `background-image: url("${$src}"); background-size: cover; background-position: center;`
      : `background: ${meok[200]};`}
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ $isSelected }) =>
    $isSelected ? `0 0 0 2px ${lightPalette.cheongrok[500]}` : 'none'};
  transition: box-shadow 0.2s ease;

  img {
    transform: scale(1.14);
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: transform;
  }

  @media (max-width: 1023px) {
    width: 80px;
    height: 80px;
    border-radius: 10.2px;
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
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 2px 36px 2px 0;
`;

const Row1 = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Title = styled.h4<{ $isSelected?: boolean }>`
  margin: 0;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.025em;
  transition: color 0.15s ease;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  white-space: nowrap;
`;

const CategoryTag = styled.span<{ $category: PlaceCategory }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: ${fontSize.micro};
  font-weight: 600;
  line-height: 1.4;
  color: ${({ $category }) =>
    $category === 'spot'
      ? meok[700]
      : CATEGORY_STYLES[$category]?.main || meok[700]};
  background: ${({ $category }) =>
    $category === 'spot'
      ? 'rgba(78, 89, 104, 0.08)'
      : CATEGORY_STYLES[$category]?.lightBg || 'rgba(78, 89, 104, 0.08)'};
  flex-shrink: 0;
  letter-spacing: -0.01em;
`;

const TraditionalBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3.5px;
  padding: 2px 7.5px;
  border-radius: 6px;
  font-size: ${fontSize.micro};
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #854d0e;
  background: #fef08a;
  border: 1px solid #facc15;
  box-shadow: 0 1px 4px rgba(245, 158, 11, 0.2);
  white-space: nowrap;
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: #fef08a;
    background: rgba(234, 179, 8, 0.28);
    border: 1px solid #facc15;
    box-shadow: 0 0 10px rgba(250, 204, 21, 0.45);
  }
`;

const SorimaruBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6.5px;
  border-radius: 6px;
  font-size: ${fontSize.micro};
  font-weight: 700;
  line-height: 1.4;
  color: ${lightPalette.jangmi[700]};
  background: ${lightPalette.jangmi[50]};
  white-space: nowrap;
  flex-shrink: 0;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const DistanceHighlight = styled.span`
  font-weight: 700;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[700]};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${meok[200]};
  }
`;

const TravelTimeText = styled.span`
  font-weight: 500;
  color: ${meok[500]};
  font-size: ${fontSize.xs};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const DotDivider = styled.span`
  color: ${meok[400]};
  font-size: ${fontSize.micro};
  padding: 0 1px;
`;

const DistrictText = styled.span`
  font-weight: 500;
  color: ${meok[500]};
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;


const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  spot: '고택',
  experience: '전통 체험',
  culture: '문화유산',
  festival: '축제',
  stay: '한옥 숙소',
  food: '전통 맛집',
  cafe: '한옥 카페',
  market: '전통 시장',
};


function renderCategoryIcon(category: PlaceCategory) {
  switch (category) {
    case 'spot':
      return <Landmark size={24} strokeWidth={2} />;
    case 'experience':
      return <Sparkles size={24} strokeWidth={2} />;
    case 'culture':
      return <BookOpen size={24} strokeWidth={2} />;
    case 'festival':
      return <Calendar size={24} strokeWidth={2} />;
    case 'stay':
      return <Home size={24} strokeWidth={2} />;
    case 'food':
      return <Utensils size={24} strokeWidth={2} />;
    case 'cafe':
      return <Coffee size={24} strokeWidth={2} />;
    case 'market':
      return <ShoppingBag size={24} strokeWidth={2} />;
    default:
      return <Landmark size={24} strokeWidth={2} />;
  }
}


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
  pageIndex,
  isSelected,
  onSelect,
  onHover,
}: PlaceListItemProps) {
  const itemRef = useRef<HTMLLIElement>(null);


  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  const userLocation = useMapStore((s) => s.userLocation);
  const center = useMapStore((s) => s.center);
  const availableStories = useSorimaruAudioStore((s) => s.availableStories);

  const travelEstimate = useMemo(() => {
    return calculateTravelEstimate(item, userLocation, center);
  }, [item, userLocation, center]);

  const hasSorimaru = useMemo(() => {
    return Boolean(matchSorimaruStory(item, availableStories));
  }, [item, availableStories]);

  const isRealTraditional = useMemo(() => {
    if (item.isTraditional !== undefined) return item.isTraditional;
    return /(한옥|고택|종택|향교|서원|사당|궁궐|성곽|누각|정자|기와|초가|전통|다원|다도|명옥헌|임청각|명재|선교장|운현궁|낙선재|대청|마루|온돌|당\b|재\b|헌\b|루\b|정\b|각\b|원\b)/i.test(
      item.name,
    );
  }, [item.isTraditional, item.name]);

  const cleanCatLabel = useMemo(() => {
    if (item.category === 'stay') return isRealTraditional ? '한옥 숙소' : '주변 숙소';
    if (item.category === 'cafe') return isRealTraditional ? '한옥 카페' : '일반 카페';
    if (item.category === 'food') return isRealTraditional ? '전통 맛집' : '일반 음식점';
    if (item.category === 'spot') return '고택';
    if (item.category === 'market') return '전통 시장';
    if (item.category === 'culture') return '문화유산';
    if (item.category === 'experience') return '전통 체험';
    if (item.category === 'festival') return '축제';
    return CATEGORY_LABELS[item.category] || '한옥 명소';
  }, [item.category, isRealTraditional]);



  const showTraditionalBadge = useMemo(() => {
    if (!isRealTraditional) return false;
    return item.category === 'spot' || item.category === 'culture';
  }, [isRealTraditional, item.category]);

  const district = getDistrictFromAddr(item.addr);

  return (
    <ItemContainer
      ref={itemRef}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: pageIndex * 0.035, ease: [0.16, 1, 0.3, 1] }}
    >
      <ItemButton
        type="button"
        $isSelected={isSelected}
        onClick={() => onSelect(item)}
        onMouseEnter={() => onHover(item.id)}
        onMouseLeave={() => onHover(null)}
        aria-current={isSelected ? 'true' : undefined}
        aria-expanded={isSelected}
      >
        <ThumbnailBox $isSelected={isSelected} $src={item.image}>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="88px"
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
            <Title $isSelected={isSelected} title={item.name}>{item.name}</Title>
          </Row1>

          <BadgeRow>
            <CategoryTag $category={item.category}>{cleanCatLabel}</CategoryTag>
            {showTraditionalBadge && (
              <TraditionalBadge title="정통 한옥 및 전통 문화재 인증 명소">
                <Store size={10.5} />
                <span>정통 한옥</span>
              </TraditionalBadge>
            )}
            {hasSorimaru && (
              <SorimaruBadge title="소리마루 오디오 해설 지원 장소">
                <Headphones size={10.5} />
                <span>오디오 해설</span>
              </SorimaruBadge>
            )}
          </BadgeRow>

          <MetaRow>
            {travelEstimate.distanceStr && (
              <DistanceHighlight>{travelEstimate.distanceStr}</DistanceHighlight>
            )}
            {travelEstimate.travelTimeStr && (
              <TravelTimeText>({travelEstimate.travelTimeStr})</TravelTimeText>
            )}
            {district && (
              <>
                <DotDivider>·</DotDivider>
                <DistrictText>{district}</DistrictText>
              </>
            )}
          </MetaRow>
        </Content>
      </ItemButton>

      <SaveButtonSlot>
        <SavePlaceButton
          placeId={item.id}
          placeName={item.name}
          initialSaved={item.savedByMe}
          compact
        />
      </SaveButtonSlot>
    </ItemContainer>
  );
}

export const PlaceListItem = memo(PlaceListItemComponent);
