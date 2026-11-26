'use client';

import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  Restaurant01Icon,
  PaintBrush01Icon,
  Store01Icon,
} from '@hugeicons/core-free-icons';
import { useTranslations } from 'next-intl';
import type { CulturalCollection, CulturalCollectionPath } from '@/features/map/domain/culturalCollection';
import type { Item, PlaceCategory } from '@/features/map/types';
import { CATEGORY_STYLES } from './PlaceMarkers';
import SavePlaceButton from '@/features/saved-resources/components/SavePlaceButton';
import { isHanok } from '@/features/map/utils/isHanok';

function placeCategoryLabel(place: Item): string {
  const hanok = isHanok(place);
  switch (place.category) {
    case 'stay': return hanok ? '한옥 숙소' : '주변 숙소';
    case 'cafe': return hanok ? '한옥 카페' : '일반 카페';
    case 'food': return hanok ? '전통 맛집' : '일반 음식점';
    case 'spot': return '고택';
    case 'market': return '전통 시장';
    case 'culture': return '문화유산';
    case 'experience': return '전통 체험';
    case 'festival': return '축제';
    default: return '명소';
  }
}

const PATH_STYLE: Record<string, { icon: typeof Home01Icon; fg: string; bg: string; darkFg: string; darkBg: string }> = {
  stay:       { icon: Home01Icon,       fg: '#8B6914', bg: '#FDF6E3', darkFg: '#F5D778', darkBg: 'rgba(245,215,120,0.12)' },
  food:       { icon: Restaurant01Icon, fg: '#B84233', bg: '#FDF0EE', darkFg: '#F5A898', darkBg: 'rgba(245,168,152,0.12)' },
  experience: { icon: PaintBrush01Icon, fg: '#4A7C59', bg: '#EEF5F0', darkFg: '#8DC7A0', darkBg: 'rgba(141,199,160,0.12)' },
  market:     { icon: Store01Icon,      fg: '#5B6AAD', bg: '#EEF0F8', darkFg: '#A8B4E0', darkBg: 'rgba(168,180,224,0.12)' },
};

const Section = styled.section`
  margin: 16px 14px 20px;
  padding: 0 0 18px;
  border-bottom: 1px solid #e5e5e3;
`;

const Title = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 1.0625rem;
  font-weight: 750;
  letter-spacing: -0.025em;
  line-height: 1.4;
`;

const Subtitle = styled.p`
  margin: 7px 0 14px;
  color: #656565;
  font-size: 0.875rem;
  line-height: 1.55;
`;

const Paths = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 14px;
`;

const PathButton = styled.button<{ $fg: string; $bg: string; $darkFg: string; $darkBg: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: ${({ $bg }) => $bg};
  color: ${({ $fg }) => $fg};
  font: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  text-align: left;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:hover {
    box-shadow: 0 2px 8px ${({ $fg }) => $fg}14;
  }

  [data-theme='dark'] & {
    background: ${({ $darkBg }) => $darkBg};
    color: ${({ $darkFg }) => $darkFg};

    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  &:focus-visible {
    outline: 2px solid ${({ $fg }) => $fg};
    outline-offset: 2px;
  }
`;

const PathIconWrap = styled.span<{ $fg: string; $darkFg: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: ${({ $fg }) => $fg}18;
  color: ${({ $fg }) => $fg};

  [data-theme='dark'] & {
    background: ${({ $darkFg }) => $darkFg}18;
    color: ${({ $darkFg }) => $darkFg};
  }
`;

const Places = styled.div`
  display: grid;
  gap: 6px;
`;

const PlaceRow = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 10px 40px 10px 12px;
  border: none;
  border-radius: 12px;
  background: #f8f8f7;
  color: #303030;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  text-align: left;
  transition: background-color 150ms ease, transform 150ms ease;
  cursor: pointer;

  &:hover {
    background: #ededeb;
    color: #1f2937;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.05);
    color: #e5e5e3;

    &:hover {
      background: rgba(255, 255, 255, 0.09);
      color: #ffffff;
    }
  }

  &:focus-visible {
    outline: 2px solid #475569;
    outline-offset: 2px;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const PlaceName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PlaceCategoryTag = styled.span<{ $category: PlaceCategory }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: ${({ $category }) => CATEGORY_STYLES[$category]?.main || '#475569'};
  background: ${({ $category }) => CATEGORY_STYLES[$category]?.lightBg || 'rgba(78, 89, 104, 0.08)'};

  [data-theme='dark'] & {
    color: ${({ $category }) => CATEGORY_STYLES[$category]?.lightBorder || '#94a3b8'};
    background: ${({ $category }) => {
      const c = CATEGORY_STYLES[$category]?.main;
      return c ? `${c}20` : 'rgba(255, 255, 255, 0.08)';
    }};
  }
`;

const PlaceSaveSlot = styled.span`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
`;

const HanokLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 5px;
  color: #64748b;
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.4;
  text-decoration: underline;
  text-decoration-color: #94a3b8;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;

  &::after {
    content: '\\2197';
    font-size: 0.95rem;
    transition: transform 150ms ease;
  }

  &:hover {
    color: #1f2937;
    text-decoration-color: currentColor;
  }

  &:hover::after {
    transform: translateX(2px);
  }

  &:focus-visible {
    outline: 2px solid #475569;
    outline-offset: 3px;
  }
`;

const DEFAULT_MAX_PLACES = 4;

interface Props {
  collection: CulturalCollection;
  places: Item[];
  loading: boolean;
  maxPlaces?: number;
  onPlaceSelect: (place: Item) => void;
  onPathSelect: (path: CulturalCollectionPath) => void;
}

export default function CulturalDiscoveryCollection({
  collection,
  places,
  loading,
  maxPlaces = DEFAULT_MAX_PLACES,
  onPlaceSelect,
  onPathSelect,
}: Props) {
  const t = useTranslations('map.editorial');
  const allReferenced = collection.placeRefs.length === 0
    ? places.filter((place) => place.isTraditional)
    : places.filter((place) => collection.placeRefs.some((ref) => ref.placeId === place.id));
  const referenced = allReferenced.slice(0, maxPlaces);

  return (
    <Section aria-busy={loading} aria-label={t('ariaLabel')}>
      <HanokLink href="/hanok">HANOK CULTURE WALK</HanokLink>
      <Title>{collection.title.ko}</Title>
      <Subtitle>{collection.subtitle.ko}</Subtitle>
      {collection.paths && collection.paths.length > 0 && (
        <Paths aria-label="한국 생활문화 탐색">
          {collection.paths.map((path) => {
            const style = PATH_STYLE[path.category] ?? PATH_STYLE.stay;
            return (
              <PathButton
                key={path.id}
                type="button"
                $fg={style.fg}
                $bg={style.bg}
                $darkFg={style.darkFg}
                $darkBg={style.darkBg}
                onClick={() => onPathSelect(path)}
              >
                <PathIconWrap $fg={style.fg} $darkFg={style.darkFg}>
                  <HugeiconsIcon icon={style.icon} size={14} />
                </PathIconWrap>
                {path.label}
              </PathButton>
            );
          })}
        </Paths>
      )}
      <Places>
        {referenced.map((place) => (
          <PlaceRow key={place.id} type="button" aria-label={place.name} onClick={() => onPlaceSelect(place)}>
            <PlaceCategoryTag $category={place.category}>
              {placeCategoryLabel(place)}
            </PlaceCategoryTag>
            <PlaceName>{place.name}</PlaceName>
            <PlaceSaveSlot onClick={(e) => e.stopPropagation()}>
              <SavePlaceButton placeId={place.id} placeName={place.name} initialSaved={place.savedByMe} compact />
            </PlaceSaveSlot>
          </PlaceRow>
        ))}
      </Places>
    </Section>
  );
}
