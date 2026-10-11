'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { MapPin01Icon, ClapperboardIcon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import WorkTypeBadge from './WorkTypeBadge';
import type { WorkSummary } from '../../domain/types';

const shimmerAnim = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const Card = styled(motion.button)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: none;
  background: #ffffff;
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
`;

const ArtworkWrap = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
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

const ArtworkImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fontSize.sm};
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Year = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
`;

const ArtistName = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const PlaceCount = styled.span`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: ${lightPalette.cheongrok[600]};
  font-weight: 600;
  margin-left: auto;
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: ${lightPalette.cheongrok[400]};
  }
`;

const SkeletonCard = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: none;
  background: #ffffff;
  box-shadow: ${ringShadow.light.cardElevated};

  [data-theme='dark'] & {
    background: ${meok[800]};
    box-shadow: ${ringShadow.dark.cardElevated};
  }
`;

const SkeletonArtwork = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: linear-gradient(90deg, #e4e4e2 25%, #dcdcd9 50%, #e4e4e2 75%);
  background-size: 200% 100%;
  animation: ${shimmerAnim} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, #32302d 25%, #3d3a36 50%, #32302d 75%);
    background-size: 200% 100%;
  }
`;

const SkeletonInfo = styled.div`
  flex: 1;
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

export function DiscoveryWorkCardSkeleton() {
  return (
    <SkeletonCard>
      <SkeletonArtwork />
      <SkeletonInfo>
        <SkeletonLine $w="70%" $h="16px" />
        <SkeletonLine $w="45%" $h="13px" />
      </SkeletonInfo>
    </SkeletonCard>
  );
}

export interface DiscoveryWorkCardProps {
  work: WorkSummary;
  index?: number;
  onClick?: (work: WorkSummary) => void;
}

export default function DiscoveryWorkCard({ work, index = 0, onClick }: DiscoveryWorkCardProps) {
  const artist = work.artists[0];

  return (
    <Card
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${work.canonicalTitle}${work.releaseYear ? ` (${work.releaseYear})` : ''}`}
      onClick={() => onClick?.(work)}
    >
      <ArtworkWrap>
        {work.workArtwork ? (
          <ArtworkImg src={work.workArtwork} alt={work.canonicalTitle} loading="lazy" />
        ) : (
          <HugeiconsIcon icon={ClapperboardIcon} size={24} strokeWidth={1.5} aria-hidden="true" />
        )}
      </ArtworkWrap>

      <Info>
        <Title>{work.canonicalTitle}</Title>
        <Meta>
          <WorkTypeBadge type={work.type} variant="dark" size={11} />
          {work.releaseYear && <Year>{work.releaseYear}</Year>}
          {artist && <ArtistName>{artist.name}</ArtistName>}
        </Meta>
      </Info>

      {work.publicPlaceCount > 0 && (
        <PlaceCount>
          <HugeiconsIcon icon={MapPin01Icon} size={11} strokeWidth={2} aria-hidden="true" />
          {work.publicPlaceCount}
        </PlaceCount>
      )}
    </Card>
  );
}
