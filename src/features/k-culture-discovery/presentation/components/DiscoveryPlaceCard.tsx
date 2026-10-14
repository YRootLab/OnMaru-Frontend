'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import type { IconSvgElement } from '@hugeicons/react';
import { Layers01Icon } from '@hugeicons/core-free-icons';
import { meok, ringShadow } from '@/design-system/tokens';
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
  border-radius: 16px;
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  width: 100%;
  display: block;
  transition: box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: ${ringShadow.light.card};
  will-change: transform;

  [data-theme='dark'] & {
    box-shadow: ${ringShadow.dark.card};
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(0,0,0,0.20), 0 3px 10px rgba(0,0,0,0.10);

    [data-theme='dark'] & {
      box-shadow: 0 12px 36px rgba(0,0,0,0.55), 0 3px 10px rgba(0,0,0,0.35);
    }
  }

  &:hover .place-img {
    transform: scale(1.06);
  }

  &:active {
    transform: translateY(0);
    filter: brightness(0.90);
  }
`;

const ImageWrap = styled.div`
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #ccc8c0;

  @media (min-width: 480px) {
    aspect-ratio: 4 / 3;
  }

  [data-theme='dark'] & {
    background: #0f1420;
  }
`;

const PlaceImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
`;

const FallbackWrap = styled.div<{ $type?: string }>`
  width: 100%;
  height: 100%;
  background: ${({ $type }) => {
    switch ($type) {
      case 'DRAMA':    case 'K_DRAMA':   return 'linear-gradient(160deg, #d6d0e8 0%, #c8c0dc 100%)';
      case 'MOVIE':    case 'K_MOVIE':   return 'linear-gradient(160deg, #c8ccd8 0%, #bcc0cc 100%)';
      case 'MUSIC_VIDEO': case 'K_POP_MV':
      case 'ARTIST':   case 'K_ARTIST':  return 'linear-gradient(160deg, #d8d0e8 0%, #ccbede 100%)';
      case 'VARIETY':                     return 'linear-gradient(160deg, #dcd8cc 0%, #cec8bc 100%)';
      default:                            return 'linear-gradient(160deg, #d4cfc6 0%, #c8c2b8 100%)';
    }
  }};

  [data-theme='dark'] & {
    background: ${({ $type }) => {
      switch ($type) {
        case 'DRAMA':    case 'K_DRAMA':  return 'linear-gradient(160deg, #1e1830 0%, #16122a 100%)';
        case 'MOVIE':    case 'K_MOVIE':  return 'linear-gradient(160deg, #181c2e 0%, #12162a 100%)';
        case 'MUSIC_VIDEO': case 'K_POP_MV':
        case 'ARTIST':   case 'K_ARTIST': return 'linear-gradient(160deg, #1c1530 0%, #140e28 100%)';
        case 'VARIETY':                    return 'linear-gradient(160deg, #201e18 0%, #181612 100%)';
        default:                           return 'linear-gradient(160deg, #1a1e2e 0%, #111520 100%)';
      }
    }};
  }
`;

const BottomScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0,0,0,0.06) 0%,
    transparent 28%,
    transparent 44%,
    rgba(0,0,0,0.52) 70%,
    rgba(0,0,0,0.86) 100%
  );
  pointer-events: none;
  z-index: 1;
`;

const TopRow = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
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
  background: rgba(8,12,22,0.72);
  backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.88);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-left: auto;
`;

const BottomInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 12px 13px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`;

const PlaceNameOverlay = styled.h3`
  font-family: var(--font-hanok), serif;
  font-size: 15px;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
  line-height: 1.25;
  letter-spacing: -0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 8px rgba(0,0,0,0.28);
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  color: rgba(255,255,255,0.62);
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const MetaSep = styled.span`
  flex-shrink: 0;
  opacity: 0.55;
`;

/* ─── skeleton ─── */
export const SkeletonCard = styled.div`
  border-radius: 16px;
  overflow: hidden;
  background: ${meok[100]};

  [data-theme='dark'] & {
    background: #161c28;
  }
`;

const SkImgWrap = styled.div`
  aspect-ratio: 3 / 4;
  background: linear-gradient(90deg, ${meok[100]} 25%, #ece9e3 50%, ${meok[100]} 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite ease-in-out;

  @media (min-width: 480px) {
    aspect-ratio: 4 / 3;
  }

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
  }
`;

export function DiscoveryPlaceCardSkeleton() {
  return (
    <SkeletonCard>
      <SkImgWrap />
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
  const workType = relation?.type ?? place.topics?.[0] ?? undefined;

  const rawRegion = place.region?.nameKo?.trim();
  const regionName = rawRegion || (place.region?.code ? REGION_CODE_MAP[place.region.code] : null);

  const metaSecond = relation?.workTitle ?? primaryRole?.labelKo ?? null;

  return (
    <Card
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.28), ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.97 }}
      aria-label={`${place.name}${relation ? ` — ${relation.workTitle}` : ''}`}
      onClick={() => onClick?.(place)}
    >
      <ImageWrap>
        {resolvedImage ? (
          <PlaceImage className="place-img" src={resolvedImage} alt={place.name} loading="lazy" />
        ) : (
          <FallbackWrap $type={workType} />
        )}

        <BottomScrim />

        <TopRow>
          {relation && <WorkTypeBadge type={relation.type} variant="light" />}
          {place.matchingWorkCount > 1 && (
            <MultiPill>
              <HugeiconsIcon icon={Layers01Icon} size={9} strokeWidth={2} aria-hidden="true" />
              {place.matchingWorkCount}편
            </MultiPill>
          )}
        </TopRow>

        <BottomInfo>
          <PlaceNameOverlay>{place.name}</PlaceNameOverlay>
          {(regionName || metaSecond) && (
            <MetaRow>
              {regionName && <span>{regionName}</span>}
              {regionName && metaSecond && <MetaSep>·</MetaSep>}
              {metaSecond && (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {metaSecond}
                </span>
              )}
            </MetaRow>
          )}
        </BottomInfo>
      </ImageWrap>
    </Card>
  );
}
