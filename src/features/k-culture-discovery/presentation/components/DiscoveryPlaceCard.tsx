'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapPinIcon, Building04Icon, Layers01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import type { DiscoveryPlaceSummary } from '../../domain/types';

/* 이미지 없는 장소를 위한 그래디언트 팔레트 */
const FALLBACK_GRADIENTS = [
  `linear-gradient(135deg, #e8d5c0 0%, #c9b08a 100%)`,
  `linear-gradient(135deg, #c8d8c0 0%, #8aad85 100%)`,
  `linear-gradient(135deg, #c8d0e0 0%, #8a9dc4 100%)`,
  `linear-gradient(135deg, #ddc8d8 0%, #b08ab0 100%)`,
  `linear-gradient(135deg, #d8e0c8 0%, #9aaa7a 100%)`,
];

function getFallbackGradient(placeId: string): string {
  let hash = 0;
  for (let i = 0; i < placeId.length; i++) {
    hash = (hash * 31 + placeId.charCodeAt(i)) % FALLBACK_GRADIENTS.length;
  }
  return FALLBACK_GRADIENTS[hash];
}

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
  box-shadow: ${ringShadow.light.card};
  transition: box-shadow 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1);

  [data-theme='dark'] & {
    background: #1e2330;
    box-shadow: ${ringShadow.dark.card};
  }

  &:hover {
    box-shadow: ${ringShadow.light.cardHoverGlow};
    transform: translateY(-2px);

    [data-theme='dark'] & {
      box-shadow: ${ringShadow.dark.cardHoverGlow};
    }
  }

  &:active {
    transform: scale(0.985) translateY(0);
    box-shadow: none;
  }

  &:hover .place-img {
    transform: scale(1.04);
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
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
`;

const FallbackWrap = styled.div<{ $gradient: string }>`
  width: 100%;
  height: 100%;
  background: ${({ $gradient }) => $gradient};
  display: flex;
  align-items: center;
  justify-content: center;

  [data-theme='dark'] & {
    filter: brightness(0.55) saturate(0.7);
  }
`;

const FallbackIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255,255,255,0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.72);
`;

const ImageScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.12) 45%, transparent 70%);
`;

const TopRow = styled.div`
  position: absolute;
  top: 9px;
  left: 9px;
  right: 9px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const MultiPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 9999px;
  background: rgba(0,0,0,0.48);
  backdrop-filter: blur(6px);
  color: rgba(255,255,255,0.88);
  font-size: 10px;
  font-weight: 700;
  margin-left: auto;
`;

const RolePill = styled.span`
  position: absolute;
  bottom: 9px;
  left: 9px;
  padding: 3px 9px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.86);
  font-size: 10px;
  font-weight: 500;
`;

const Body = styled.div`
  padding: 10px 12px 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PlaceName = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fontSize.sm};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.025em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.88);
  }
`;

const Region = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  color: ${meok[400]};
  font-size: 11px;
  font-weight: 500;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.30);
  }
`;

const WorkRow = styled.p`
  font-size: 11px;
  color: ${lightPalette.juhong[500]};
  font-weight: 600;
  margin: 2px 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

/* ─── skeleton ─── */
export const SkeletonCard = styled.div`
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: #1e2330;
    box-shadow: ${ringShadow.dark.card};
  }
`;

const SkImgWrap = styled.div`
  aspect-ratio: 4 / 3;
  background: linear-gradient(90deg, ${meok[100]} 25%, #f0efec 50%, ${meok[100]} 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
  }
`;

const SkBody = styled.div`
  padding: 10px 12px 13px;
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
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
  }
`;

export function DiscoveryPlaceCardSkeleton() {
  return (
    <SkeletonCard>
      <SkImgWrap />
      <SkBody>
        <SkLine $w="65%" $h="15px" />
        <SkLine $w="36%" $h="11px" />
        <SkLine $w="80%" $h="11px" />
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
  const fallbackGradient = getFallbackGradient(place.placeId);

  return (
    <Card
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.04, 0.32), ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${place.name}${relation ? ` — ${relation.workTitle}` : ''}`}
      onClick={() => onClick?.(place)}
    >
      <ImageWrap>
        {place.placeImage ? (
          <PlaceImage className="place-img" src={place.placeImage} alt={place.name} loading="lazy" />
        ) : (
          <FallbackWrap $gradient={fallbackGradient}>
            <FallbackIcon>
              <HugeiconsIcon icon={Building04Icon} size={20} strokeWidth={1.5} aria-hidden="true" />
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
        <Region>
          <HugeiconsIcon icon={MapPinIcon} size={10} strokeWidth={2} aria-hidden="true" />
          {place.region.nameKo}
        </Region>
        {relation && <WorkRow>{relation.workTitle}</WorkRow>}
      </Body>
    </Card>
  );
}
