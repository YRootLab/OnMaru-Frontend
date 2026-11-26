'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapPinIcon, Film01Icon, MusicNote01Icon, Mic01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { meok, fontSize } from '@/design-system/tokens';
import { useTourApiImage } from '../hooks/useTourApiImage';
import { getLocalizedRegionName } from '../utils/regionLabel';
import type { DiscoveryPlaceSummary, WorkType } from '../../domain/types';

const FALLBACK_GRADIENT: Partial<Record<WorkType, string>> = {
  DRAMA:       'linear-gradient(135deg, #1a0a2e 0%, #2d1040 50%, #1a0a30 100%)',
  MOVIE:       'linear-gradient(135deg, #0a0a1a 0%, #16213e 50%, #0d0d20 100%)',
  MUSIC_VIDEO: 'linear-gradient(135deg, #1a0040 0%, #3d0a6e 50%, #1a0040 100%)',
  ARTIST:      'linear-gradient(135deg, #1a0040 0%, #3d0a6e 50%, #1a0040 100%)',
  VARIETY:     'linear-gradient(135deg, #0d221c 0%, #14382e 50%, #0d221c 100%)',
};

const FALLBACK_ICON: Partial<Record<WorkType, React.ComponentProps<typeof HugeiconsIcon>['icon']>> = {
  DRAMA:       Film01Icon,
  MOVIE:       Camera01Icon,
  MUSIC_VIDEO: MusicNote01Icon,
  ARTIST:      MusicNote01Icon,
  VARIETY:     Mic01Icon,
};

const Wrap = styled(motion.button)`
  position: relative;
  width: 100%;
  aspect-ratio: 21 / 8;
  border-radius: 20px;
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;
  display: block;
  text-align: left;
  background: ${meok[900]};

  @media (max-width: 640px) {
    aspect-ratio: 4 / 3;
    border-radius: 16px;
  }

  &:hover .feat-img {
    transform: scale(1.04);
  }
`;

const Img = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
`;

const FallbackBg = styled.div<{ $type?: string }>`
  position: absolute;
  inset: 0;
  background: ${({ $type }) =>
    FALLBACK_GRADIENT[$type as WorkType] ?? 'linear-gradient(135deg, #181a1f 0%, #272b33 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.1);
`;

const Scrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.84) 0%,
    rgba(0, 0, 0, 0.42) 42%,
    rgba(0, 0, 0, 0.08) 72%,
    transparent 100%
  );
  pointer-events: none;
`;

const TopRow = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  z-index: 2;
`;

const TypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.92);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
`;

const FeaturedLabel = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: ${meok[900]};
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Bottom = styled.div<{ $hasControls?: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: ${({ $hasControls }) => ($hasControls ? '28px 24px 44px' : '28px 24px 22px')};
  z-index: 2;

  @media (max-width: 640px) {
    padding: ${({ $hasControls }) => ($hasControls ? '20px 16px 38px' : '20px 16px 16px')};
  }
`;

const PlaceName = styled.h2`
  font-family: var(--font-hanok), serif;
  font-size: clamp(22px, 3.5vw, 36px);
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 6px;
  letter-spacing: -0.04em;
  line-height: 1.15;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
`;

const WorkTitle = styled.p`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: rgba(255, 255, 255, 0.78);
  margin: 0 0 10px;
  letter-spacing: -0.01em;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const RegionChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  font-weight: 500;
`;

const RoleChip = styled.span`
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  font-weight: 600;
`;

export interface FeaturedPlaceCardProps {
  place: DiscoveryPlaceSummary;
  onClick: (place: DiscoveryPlaceSummary) => void;
  badgeText?: string;
  hasCarouselControls?: boolean;
}

export default function FeaturedPlaceCard({
  place,
  onClick,
  badgeText,
  hasCarouselControls = false,
}: FeaturedPlaceCardProps) {
  const t = useTranslations('kCulture');
  const resolvedImage = useTourApiImage(place.placeId, place.placeImage);
  const relation = place.featuredRelation;
  const workType = relation?.type;
  const primaryRole = place.placeRoles[0];
  const regionName = getLocalizedRegionName(place.region, t);

  const label = badgeText ?? t('featuredLabel');

  return (
    <Wrap
      type="button"
      whileHover={{ scale: 1.004 }}
      whileTap={{ scale: 0.996 }}
      aria-label={`${t('featuredPlace', { name: place.name })}${relation ? ` — ${relation.workTitle}` : ''}`}
      onClick={() => onClick(place)}
    >
      {resolvedImage ? (
        <Img className="feat-img" src={resolvedImage} alt={place.name} />
      ) : (
        <FallbackBg $type={workType}>
          {workType && FALLBACK_ICON[workType] && (
            <HugeiconsIcon icon={FALLBACK_ICON[workType]!} size={64} strokeWidth={0.8} aria-hidden="true" />
          )}
        </FallbackBg>
      )}

      <Scrim />

      <TopRow>
        <FeaturedLabel>{label}</FeaturedLabel>
        {workType && (
          <TypeBadge>
            <HugeiconsIcon icon={FALLBACK_ICON[workType] ?? Film01Icon} size={10} strokeWidth={2} aria-hidden="true" />
            {t(`workType.${workType}`)}
          </TypeBadge>
        )}
      </TopRow>

      <Bottom $hasControls={hasCarouselControls}>
        <PlaceName>{place.name}</PlaceName>
        {relation && <WorkTitle>{relation.workTitle}</WorkTitle>}
        <MetaRow>
          {regionName && (
            <RegionChip>
              <HugeiconsIcon icon={MapPinIcon} size={11} strokeWidth={2} aria-hidden="true" />
              {regionName}
            </RegionChip>
          )}
          {primaryRole && <RoleChip>{primaryRole.labelKo}</RoleChip>}
          {relation && (
            <RoleChip>
              {relation.relationType === 'VISIT_SPOT' ? t('visitSpot') : t('filmingLocation')}
            </RoleChip>
          )}
        </MetaRow>
      </Bottom>
    </Wrap>
  );
}
