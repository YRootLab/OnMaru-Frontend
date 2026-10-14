'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapPinIcon, Building04Icon, Layers01Icon, Film01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import { useTourApiImage } from '../hooks/useTourApiImage';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const REGION_CODE_MAP: Record<string, string> = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구', '5': '광주',
  '6': '부산', '7': '울산', '8': '세종', '31': '경기', '32': '강원',
  '33': '충북', '34': '충남', '35': '전북', '36': '전남', '37': '경북',
  '38': '경남', '39': '제주', '11': '서울', '26': '부산', '27': '대구',
  '28': '인천', '29': '광주', '30': '대전', '41': '경기', '42': '강원',
  '43': '충북', '44': '충남', '45': '전북', '46': '전남', '47': '경북',
  '48': '경남', '50': '제주',
};

const shimmer = keyframes`
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const Card = styled(motion.button)`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.16s ease;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: #161c28;
    box-shadow: ${ringShadow.dark.card};
  }

  &:hover {
    box-shadow: ${ringShadow.light.cardHoverGlow};

    [data-theme='dark'] & {
      box-shadow: ${ringShadow.dark.cardHoverGlow};
    }
  }

  &:hover .place-img {
    transform: scale(1.05);
  }

  &:active {
    filter: brightness(0.96);
  }
`;

const ImageWrap = styled.div`
  position: relative;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  background: #ede9e1;

  [data-theme='dark'] & {
    background: #111620;
  }
`;

const PlaceImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
`;

const FallbackWrap = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(155deg, #f0ede6 0%, #e5e0d5 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  [data-theme='dark'] & {
    background: linear-gradient(155deg, #181e2a 0%, #111520 100%);
  }
`;

const FallbackIcon = styled.div`
  color: ${meok[400]};

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.2);
  }
`;

const ImageScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0.28) 0%,
    transparent 30%,
    rgba(0,0,0,0.48) 100%
  );
  pointer-events: none;
`;

const TopRow = styled.div`
  position: absolute;
  top: 9px;
  left: 9px;
  right: 9px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  z-index: 2;
  gap: 4px;
`;

const MultiPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(10,14,22,0.75);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-left: auto;
`;

const RolePill = styled.span`
  position: absolute;
  bottom: 9px;
  left: 9px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(10,14,22,0.72);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.92);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: -0.01em;
  z-index: 2;
`;

const Body = styled.div`
  padding: 11px 13px 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PlaceName = styled.h3`
  font-family: var(--font-hanok), serif;
  font-size: 14.5px;
  font-weight: 800;
  color: ${meok[900]};
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.025em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const Region = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  color: ${meok[400]};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.35);
  }
`;

const WorkRelationBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  padding: 5px 9px;
  border-radius: 7px;
  background: rgba(240,100,20,0.06);
  border: none;
  min-width: 0;

  [data-theme='dark'] & {
    background: rgba(255,120,40,0.09);
  }
`;

const WorkRelationContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.2;
`;

const WorkTitleText = styled.span`
  font-weight: 700;
  color: ${meok[800]};
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.85);
  }
`;

const WorkRoleDot = styled.span`
  color: ${meok[300]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.25);
  }
`;

const WorkRoleLabel = styled.span`
  font-weight: 600;
  color: ${lightPalette.juhong[600]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

/* ─── skeleton ─── */
export const SkeletonCard = styled.div`
  border-radius: 14px;
  border: none;
  overflow: hidden;
  background: #ffffff;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: #161c28;
    box-shadow: ${ringShadow.dark.card};
  }
`;

const SkImgWrap = styled.div`
  aspect-ratio: 3 / 2;
  background: linear-gradient(90deg, ${meok[100]} 25%, #f0efec 50%, ${meok[100]} 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
  }
`;

const SkBody = styled.div`
  padding: 11px 13px 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SkLine = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '13px'};
  border-radius: 5px;
  background: linear-gradient(90deg, ${meok[100]} 25%, #f0efec 50%, ${meok[100]} 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
  }
`;

export function DiscoveryPlaceCardSkeleton() {
  return (
    <SkeletonCard>
      <SkImgWrap />
      <SkBody>
        <SkLine $w="65%" $h="15px" />
        <SkLine $w="30%" $h="11px" />
        <SkLine $w="85%" $h="24px" />
      </SkBody>
    </SkeletonCard>
  );
}

export interface DiscoveryPlaceCardProps {
  place: DiscoveryPlaceSummary;
  index?: number;
  onClick?: (place: DiscoveryPlaceSummary) => void;
}

export default function DiscoveryPlaceCard({ place, index = 0, onClick }: DiscoveryPlaceCardProps) {
  const primaryRole = place.placeRoles[0];
  const relation = place.featuredRelation;
  const resolvedImage = useTourApiImage(place.placeId, place.placeImage);

  const rawRegion = place.region?.nameKo?.trim();
  const regionName = rawRegion || (place.region?.code ? REGION_CODE_MAP[place.region.code] : null);

  return (
    <Card
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.28), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      aria-label={`${place.name}${relation ? ` — ${relation.workTitle}` : ''}`}
      onClick={() => onClick?.(place)}
    >
      <ImageWrap>
        {resolvedImage ? (
          <PlaceImage className="place-img" src={resolvedImage} alt={place.name} loading="lazy" />
        ) : (
          <FallbackWrap>
            <FallbackIcon>
              <HugeiconsIcon icon={Building04Icon} size={28} strokeWidth={1.2} aria-hidden="true" />
            </FallbackIcon>
          </FallbackWrap>
        )}
        <ImageScrim />

        <TopRow>
          {relation && <WorkTypeBadge type={relation.type} variant="light" />}
          {place.matchingWorkCount > 1 && (
            <MultiPill>
              <HugeiconsIcon icon={Layers01Icon} size={9} strokeWidth={2} aria-hidden="true" />
              {place.matchingWorkCount}편
            </MultiPill>
          )}
        </TopRow>

        {primaryRole && <RolePill>{primaryRole.labelKo}</RolePill>}
      </ImageWrap>

      <Body>
        <PlaceName>{place.name}</PlaceName>

        {regionName && (
          <Region>
            <HugeiconsIcon icon={MapPinIcon} size={10} strokeWidth={2} aria-hidden="true" />
            <span>{regionName}</span>
          </Region>
        )}

        {relation && (
          <WorkRelationBadge>
            <HugeiconsIcon icon={Film01Icon} size={11} strokeWidth={2} color={lightPalette.juhong[500]} aria-hidden="true" />
            <WorkRelationContent>
              <WorkTitleText title={relation.workTitle}>{relation.workTitle}</WorkTitleText>
              <WorkRoleDot>·</WorkRoleDot>
              <WorkRoleLabel>{relation.relationType === 'VISIT_SPOT' ? '방문지' : '촬영지'}</WorkRoleLabel>
            </WorkRelationContent>
          </WorkRelationBadge>
        )}
      </Body>
    </Card>
  );
}
