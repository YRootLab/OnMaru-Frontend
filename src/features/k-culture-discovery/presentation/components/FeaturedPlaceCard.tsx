'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapPinIcon, Film01Icon, MusicNote01Icon, Mic01Icon, Camera01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import { useTourApiImage } from '../hooks/useTourApiImage';
import type { DiscoveryPlaceSummary, WorkType } from '../../domain/types';

const FALLBACK_GRADIENT: Partial<Record<WorkType, string>> = {
  DRAMA:       'linear-gradient(135deg, #1a0a2e 0%, #2d1040 50%, #1a0a30 100%)',
  MOVIE:       'linear-gradient(135deg, #0a0a1a 0%, #16213e 50%, #0d0d20 100%)',
  MUSIC_VIDEO: 'linear-gradient(135deg, #1a0040 0%, #3d0a6e 50%, #1a0040 100%)',
  ARTIST:      'linear-gradient(135deg, #1a0040 0%, #3d0a6e 50%, #1a0040 100%)',
  VARIETY:     'linear-gradient(135deg, #2a1a00 0%, #4a2e00 50%, #2a1a00 100%)',
};

const FALLBACK_ICON: Partial<Record<WorkType, object>> = {
  DRAMA:       Film01Icon,
  MOVIE:       Camera01Icon,
  MUSIC_VIDEO: MusicNote01Icon,
  ARTIST:      MusicNote01Icon,
  VARIETY:     Mic01Icon,
};

const REGION_MAP: Record<string, string> = {
  '1': '서울', '11': '서울', '2': '인천', '28': '인천',
  '3': '대전', '30': '대전', '4': '대구', '27': '대구',
  '5': '광주', '29': '광주', '6': '부산', '26': '부산',
  '7': '울산', '8': '세종', '31': '경기', '41': '경기',
  '32': '강원', '42': '강원', '33': '충북', '43': '충북',
  '34': '충남', '44': '충남', '35': '전북', '45': '전북',
  '36': '전남', '46': '전남', '37': '경북', '47': '경북',
  '38': '경남', '48': '경남', '39': '제주', '50': '제주',
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
  background: ${({ $type }) => FALLBACK_GRADIENT[$type as WorkType] ?? 'linear-gradient(135deg, #0f0e0c 0%, #201c18 100%)'};
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
    rgba(0, 0, 0, 0.82) 0%,
    rgba(0, 0, 0, 0.38) 40%,
    rgba(0, 0, 0, 0.08) 70%,
    transparent 100%
  );
  pointer-events: none;
`;

const TopRow = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
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
  color: rgba(255, 255, 255, 0.9);
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

const Bottom = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 28px 24px 22px;
  z-index: 2;

  @media (max-width: 640px) {
    padding: 20px 16px 16px;
  }
`;

const WorkTitle = styled.p`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 6px;
  letter-spacing: -0.01em;
`;

const PlaceName = styled.h2`
  font-family: var(--font-hanok), serif;
  font-size: clamp(22px, 3.5vw, 36px);
  font-weight: 900;
  color: #ffffff;
  margin: 0 0 10px;
  letter-spacing: -0.04em;
  line-height: 1.15;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RegionChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  font-weight: 500;
`;

const RoleChip = styled.span`
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  font-weight: 600;
`;

const TYPE_KO: Partial<Record<WorkType, string>> = {
  DRAMA: '드라마', MOVIE: '영화', MUSIC_VIDEO: 'MV', ARTIST: '아티스트', VARIETY: '예능',
};

interface Props {
  place: DiscoveryPlaceSummary;
  onClick: (place: DiscoveryPlaceSummary) => void;
}

export default function FeaturedPlaceCard({ place, onClick }: Props) {
  const resolvedImage = useTourApiImage(place.placeId, place.placeImage);
  const relation = place.featuredRelation;
  const workType = relation?.type;
  const primaryRole = place.placeRoles[0];
  const rawRegion = place.region?.nameKo?.trim();
  const regionName = rawRegion?.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '') ||
    (place.region?.code ? REGION_MAP[place.region.code] : null);

  return (
    <Wrap
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      aria-label={`추천 장소: ${place.name}${relation ? ` — ${relation.workTitle}` : ''}`}
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
        <FeaturedLabel>추천</FeaturedLabel>
        {workType && TYPE_KO[workType] && (
          <TypeBadge>
            <HugeiconsIcon icon={(FALLBACK_ICON[workType] ?? Film01Icon) as object} size={10} strokeWidth={2} aria-hidden="true" />
            {TYPE_KO[workType]}
          </TypeBadge>
        )}
      </TopRow>

      <Bottom>
        {relation && <WorkTitle>{relation.workTitle}</WorkTitle>}
        <PlaceName>{place.name}</PlaceName>
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
              {relation.relationType === 'VISIT_SPOT' ? '방문지' : '촬영지'}
            </RoleChip>
          )}
        </MetaRow>
      </Bottom>
    </Wrap>
  );
}
