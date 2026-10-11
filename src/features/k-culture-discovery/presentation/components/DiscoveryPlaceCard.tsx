'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MapPinIcon,
  PlayListAdd01Icon,
  Building04Icon,
} from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const shimmerAnim = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const Card = styled(motion.button)`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  width: 100%;
  box-shadow: ${ringShadow.light.cardElevated};
  transition: box-shadow 0.22s ease;

  [data-theme='dark'] & {
    background: ${meok[800]};
    box-shadow: ${ringShadow.dark.cardElevated};
  }

  &:hover {
    box-shadow: ${ringShadow.light.cardLift};

    [data-theme='dark'] & {
      box-shadow: ${ringShadow.dark.cardLift};
    }
  }

  &:hover img {
    transform: scale(1.05);
  }
`;

const ImageWrap = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
`;

const PlaceImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.36s cubic-bezier(0.16, 1, 0.3, 1);
`;

const ImageScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 55%);
`;

const FallbackImage = styled.div`
  width: 100%;
  height: 100%;
  background: ${meok[200]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[400]};

  [data-theme='dark'] & {
    background: ${meok[700]};
    color: ${meok[500]};
  }
`;

const BadgeRow = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const WorkCountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
`;

const PlaceRolePill = styled.span`
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 3px 10px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(6px);
  color: rgba(255,255,255,0.92);
  font-size: 11px;
  font-weight: 500;
`;

const Body = styled.div`
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PlaceName = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.02em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const RegionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  color: ${meok[500]};
  font-size: ${fontSize.xs};
  font-weight: 500;
`;

const WorkTitle = styled.p`
  font-size: ${fontSize.xs};
  color: ${lightPalette.juhong[600]};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

export const SkeletonCard = styled.div`
  border-radius: 18px;
  overflow: hidden;
  background: ${meok[200]};
  box-shadow: ${ringShadow.light.cardElevated};

  [data-theme='dark'] & {
    background: #252422;
    box-shadow: ${ringShadow.dark.cardElevated};
  }
`;

const SkeletonImageWrap = styled.div`
  aspect-ratio: 4 / 3;
  background: linear-gradient(90deg, #e4e4e2 25%, #dcdcd9 50%, #e4e4e2 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #32302d 25%, #3d3a36 50%, #32302d 75%);
    background-size: 200% 100%;
  }
`;

const SkeletonBody = styled.div`
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SkeletonLine = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '14px'};
  border-radius: 6px;
  background: linear-gradient(90deg, #e4e4e2 25%, #dcdcd9 50%, #e4e4e2 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #32302d 25%, #3d3a36 50%, #32302d 75%);
    background-size: 200% 100%;
  }
`;

export function DiscoveryPlaceCardSkeleton() {
  return (
    <SkeletonCard>
      <SkeletonImageWrap />
      <SkeletonBody>
        <SkeletonLine $w="65%" $h="18px" />
        <SkeletonLine $w="40%" $h="13px" />
        <SkeletonLine $w="80%" $h="13px" />
      </SkeletonBody>
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

  return (
    <Card
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${place.name} — ${relation?.workTitle ?? '정보 없음'}`}
      onClick={() => onClick?.(place)}
    >
      <ImageWrap>
        {place.placeImage ? (
          <PlaceImage src={place.placeImage} alt={place.name} loading="lazy" />
        ) : (
          <FallbackImage>
            <HugeiconsIcon icon={Building04Icon} size={36} strokeWidth={1.5} aria-hidden="true" />
          </FallbackImage>
        )}
        <ImageScrim />

        <BadgeRow>
          {relation && (
            <WorkTypeBadge type={relation.type} variant="dark" />
          )}
          {place.matchingWorkCount > 1 && (
            <WorkCountBadge>
              <HugeiconsIcon icon={PlayListAdd01Icon} size={11} strokeWidth={2} aria-hidden="true" />
              작품 {place.matchingWorkCount}개
            </WorkCountBadge>
          )}
        </BadgeRow>

        {primaryRole && (
          <PlaceRolePill>{primaryRole.labelKo}</PlaceRolePill>
        )}
      </ImageWrap>

      <Body>
        <PlaceName>{place.name}</PlaceName>
        <RegionRow>
          <HugeiconsIcon icon={MapPinIcon} size={11} strokeWidth={2} aria-hidden="true" />
          {place.region.nameKo}
        </RegionRow>
        {relation && (
          <WorkTitle>{relation.workTitle}</WorkTitle>
        )}
      </Body>
    </Card>
  );
}
