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
  '1': '서울',
  '2': '인천',
  '3': '대전',
  '4': '대구',
  '5': '광주',
  '6': '부산',
  '7': '울산',
  '8': '세종',
  '31': '경기',
  '32': '강원',
  '33': '충북',
  '34': '충남',
  '35': '전북',
  '36': '전남',
  '37': '경북',
  '38': '경남',
  '39': '제주',
  '11': '서울',
  '26': '부산',
  '27': '대구',
  '28': '인천',
  '29': '광주',
  '30': '대전',
  '41': '경기',
  '42': '강원',
  '43': '충북',
  '44': '충남',
  '45': '전북',
  '46': '전남',
  '47': '경북',
  '48': '경남',
  '50': '제주',
};

const shimmer = keyframes`
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const Card = styled(motion.button)`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0;
  cursor: pointer;
  text-align: left;
  width: 100%;
  box-shadow: ${ringShadow.light.card};
  transition:
    box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.22s ease,
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: #191f2c;
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: ${ringShadow.dark.card};
  }

  &:hover {
    box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
    transform: translateY(-3px);
    border-color: rgba(0, 0, 0, 0.08);

    [data-theme='dark'] & {
      box-shadow: 0 14px 32px -6px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.14);
    }
  }

  &:active {
    transform: scale(0.985) translateY(0);
  }

  &:hover .place-img {
    transform: scale(1.04);
  }
`;

const ImageWrap = styled.div`
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #f0eee8;

  [data-theme='dark'] & {
    background: #141822;
  }
`;

const PlaceImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
`;

const FallbackWrap = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #f6f5f1 0%, #ebe7dc 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;

  [data-theme='dark'] & {
    background: linear-gradient(145deg, #1b212d 0%, #131720 100%);
  }
`;

const FallbackIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${meok[600]};

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    color: rgba(255, 255, 255, 0.65);
  }
`;

const FallbackLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${meok[500]};
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const ImageScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.35) 0%,
    transparent 35%,
    rgba(0, 0, 0, 0.55) 100%
  );
  pointer-events: none;
`;

const TopRow = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
`;

const MultiPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 9999px;
  background: rgba(14, 18, 26, 0.68);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  margin-left: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
`;

const RolePill = styled.span`
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 3px 9px;
  border-radius: 9999px;
  background: rgba(14, 18, 26, 0.65);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.95);
  font-size: 10.5px;
  font-weight: 600;
  z-index: 2;
`;

const Body = styled.div`
  padding: 13px 14px 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const PlaceName = styled.h3`
  font-family: var(--font-hanok), serif;
  font-size: 15px;
  font-weight: 800;
  color: ${meok[900]};
  margin: 0;
  line-height: 1.35;
  letter-spacing: -0.025em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s ease;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const Region = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${meok[500]};
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.45);
  }
`;

const WorkRelationBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(240, 100, 20, 0.05);
  border: 1px solid rgba(240, 100, 20, 0.14);
  min-width: 0;

  [data-theme='dark'] & {
    background: rgba(255, 120, 40, 0.09);
    border-color: rgba(255, 120, 40, 0.20);
  }
`;

const WorkRelationIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.juhong[600]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

const WorkRelationContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  font-size: 11.5px;
  line-height: 1.2;
`;

const WorkTitleText = styled.span`
  font-weight: 700;
  color: ${meok[900]};
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const WorkRoleDot = styled.span`
  color: ${meok[400]};
  font-weight: 400;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.35);
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
/* ─── skeleton ─── */
export const SkeletonCard = styled.div`
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: ${ringShadow.light.card};

  [data-theme='dark'] & {
    background: #191f2c;
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow: ${ringShadow.dark.card};
  }
`;

const SkImgWrap = styled.div`
  aspect-ratio: 16 / 10;
  background: linear-gradient(90deg, ${meok[100]} 25%, #f0efec 50%, ${meok[100]} 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
  }
`;

const SkBody = styled.div`
  padding: 13px 14px 15px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SkLine = styled.div<{ $w?: string; $h?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '13px'};
  border-radius: 6px;
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
        <SkLine $w="68%" $h="16px" />
        <SkLine $w="32%" $h="12px" />
        <SkLine $w="88%" $h="26px" />
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

  // 지역명이 비어 있거나 없는 경우 코드 기반 보완
  const rawRegion = place.region?.nameKo?.trim();
  const regionName = rawRegion || (place.region?.code ? REGION_CODE_MAP[place.region.code] : null);

  return (
    <Card
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.04, 0.32), ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${place.name}${relation ? ` — ${relation.workTitle}` : ''}`}
      onClick={() => onClick?.(place)}
    >
      <ImageWrap>
        {resolvedImage ? (
          <PlaceImage className="place-img" src={resolvedImage} alt={place.name} loading="lazy" />
        ) : (
          <FallbackWrap>
            <FallbackIcon>
              <HugeiconsIcon icon={Building04Icon} size={22} strokeWidth={1.5} aria-hidden="true" />
            </FallbackIcon>
            <FallbackLabel>문화유산 공간</FallbackLabel>
          </FallbackWrap>
        )}
        <ImageScrim />

        <TopRow>
          {relation && <WorkTypeBadge type={relation.type} variant="light" />}
          {place.matchingWorkCount > 1 && (
            <MultiPill>
              <HugeiconsIcon icon={Layers01Icon} size={10} strokeWidth={2} aria-hidden="true" />
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
            <HugeiconsIcon icon={MapPinIcon} size={11} strokeWidth={2} aria-hidden="true" />
            <span>{regionName}</span>
          </Region>
        )}

        {relation && (
          <WorkRelationBadge>
            <WorkRelationIcon>
              <HugeiconsIcon icon={Film01Icon} size={13} strokeWidth={2} aria-hidden="true" />
            </WorkRelationIcon>
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
