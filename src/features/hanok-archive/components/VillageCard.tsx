'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, palette, fluidHeading, fontSize } from '@/design-system/tokens';
import { HugeiconsIcon } from '@hugeicons/react';
import { HeadphonesIcon, MapPinIcon } from '@hugeicons/core-free-icons';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';

const Card = styled(motion.article, transientProps)<{ $bg: string | null }>`
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  box-shadow: none;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.24s ease;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${palette.cheongrok[900]} 0%, ${meok[900]} 100%);`}

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.08);
  }

  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    &:hover {
      transform: translateY(-4px);
      border-color: ${palette.juhong[400]};

      .village-card-img {
        transform: scale(1.05);
      }
    }
  }

  @media (max-width: 480px) {
    border-radius: 16px;
  }
`;

const ImageLayer = styled(motion.div, transientProps)<{ $bg: string | null }>`
  position: absolute;
  inset: 0;
  border-radius: inherit;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${palette.cheongrok[900]} 0%, ${meok[900]} 100%);`}
`;

const SpotlightLayer = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  --spotlight-color: 232, 237, 242;
  --spotlight-core-radius: 150px;
  --spotlight-outer-radius: 340px;
  --spotlight-core-opacity: 0.33;
  --spotlight-core-mid-opacity: 0.135;
  --spotlight-outer-color: var(--spotlight-color);
  --spotlight-outer-opacity: 0.06;
  --spotlight-background:
    radial-gradient(
      circle var(--spotlight-core-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
      rgba(var(--spotlight-color), var(--spotlight-core-opacity)) 0%,
      rgba(var(--spotlight-color), var(--spotlight-core-mid-opacity)) 48%,
      rgba(var(--spotlight-color), 0) 100%
    ),
    radial-gradient(
      circle var(--spotlight-outer-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
      rgba(var(--spotlight-outer-color), var(--spotlight-outer-opacity)) 0%,
      rgba(255, 255, 255, 0.03) 55%,
      rgba(255, 255, 255, 0) 90%
    );
  background: var(--spotlight-background);
  transition: opacity 0.24s ease;

  [data-theme='dark'] & {
    --spotlight-background: radial-gradient(
      circle 216px at var(--reveal-x, 50%) var(--reveal-y, 50%),
      rgba(255, 255, 255, 0.32) 0%,
      rgba(255, 255, 255, 0.14) 42%,
      rgba(255, 255, 255, 0.05) 68%,
      rgba(255, 255, 255, 0) 84%
    );
  }

  @media (hover: hover) and (pointer: fine) {
    .hanok-reveal-grid[data-reveal-active='true'] & {
      opacity: 1;
    }
  }

  @media (max-width: 480px), (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const GlassLens = styled.div`
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  --glass-core-opacity: 0.06;
  --glass-mid-opacity: 0.0225;
  --glass-light-radius: 125px;
  --glass-mask-radius: 140px;
  background: radial-gradient(
    circle var(--glass-light-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
    rgba(232, 237, 242, var(--glass-core-opacity)) 0%,
    rgba(232, 237, 242, var(--glass-mid-opacity)) 58%,
    rgba(232, 237, 242, 0) 100%
  );
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  mask-image: radial-gradient(
    circle var(--glass-mask-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
    #000000 0%,
    rgba(0, 0, 0, 0.8) 55%,
    transparent 100%
  );
  -webkit-mask-image: radial-gradient(
    circle var(--glass-mask-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
    #000000 0%,
    rgba(0, 0, 0, 0.8) 55%,
    transparent 100%
  );
  transition: opacity 0.24s ease;

  @media (hover: hover) and (pointer: fine) {
    .hanok-reveal-grid[data-reveal-active='true'] & {
      opacity: 1;
    }
  }

  [data-theme='dark'] & {
    display: none;
  }

  @media (max-width: 480px), (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const SpotlightEdge = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  --spotlight-edge-width: 1.2px;
  --spotlight-edge-radius: 220px;
  padding: var(--spotlight-edge-width);
  border-radius: inherit;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    circle var(--spotlight-edge-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
    rgba(255, 250, 246, 0.96) 0%,
    rgba(255, 137, 82, 0.78) 34%,
    rgba(255, 85, 0, 0.34) 62%,
    rgba(255, 85, 0, 0) 80%
  );
  -webkit-mask:
    linear-gradient(#ffffff 0 0) content-box,
    linear-gradient(#ffffff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  transition: opacity 0.2s ease;

  [data-theme='dark'] & {
    --spotlight-edge-width: 1px;
    --spotlight-edge-radius: 190px;
  }

  @media (hover: hover) and (pointer: fine) {
    .hanok-reveal-grid[data-reveal-active='true'] & {
      opacity: 1;
    }
  }

  @media (max-width: 480px), (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 45%,
    rgba(0, 0, 0, 0.42) 75%,
    rgba(0, 0, 0, 0.72) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px 14px 14px;
  z-index: 2;

  @media (max-width: 480px) {
    padding: 12px 10px 10px;
  }
`;

const Name = styled.h3`
  position: relative;
  z-index: 1;
  font-family: var(--font-hanok);
  font-size: ${fluidHeading.label};
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  word-break: keep-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Region = styled.p`
  position: relative;
  z-index: 1;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const TypeBadge = styled.span`
  background: rgba(14, 16, 22, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.95);
  font-size: ${fontSize.xs};
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: 0.01em;
  box-shadow: none;
`;

const TopBadgeRow = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 6px;

  @media (max-width: 480px) {
    top: 10px;
    left: 10px;
    right: 10px;
  }
`;

const DocentTag = styled.span`
  background: rgba(14, 16, 22, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.95);
  font-size: ${fontSize.xs};
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  letter-spacing: 0.01em;
  box-shadow: none;
`;

const HAS_DOCENT_TYPES = ['고궁', '민속마을'];
const HAS_DOCENT_NAMES = [
  '경복궁', '선교장', '하회', '운조루', '임청각', '최부자',
  '소쇄원', '창덕궁', '창경궁', '덕수궁', '종묘', '남산골',
  '도산서원', '병산서원', '낙안읍성', '외암', '양동',
];

interface VillageCardProps {
  village: Village;
  onClick?: (village: Village) => void;
}

export default function VillageCard({ village, onClick }: VillageCardProps) {
  const typeLabel = filterLabel(village.type);
  const isDocentAvailable =
    village.type !== '한옥스테이' &&
    (HAS_DOCENT_TYPES.includes(village.type) ||
      HAS_DOCENT_NAMES.some((n) => village.name.includes(n)));

  return (
    <Card
      className="village-card"
      data-reveal-card
      $bg={village.hasImage ? village.image : null}
      onClick={() => onClick?.(village)}
      role="button"
      tabIndex={0}
      aria-label={`${village.name} 자세히 보기`}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 24 }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.(village);
      }}
    >
      <TopBadgeRow aria-label={`${typeLabel} 태그`}>
        <TypeBadge>{typeLabel}</TypeBadge>
        {isDocentAvailable && (
          <DocentTag>
            <HugeiconsIcon icon={HeadphonesIcon} size={11} color={palette.jangmi[400]} />
            <span>소리마루 도슨트</span>
          </DocentTag>
        )}
      </TopBadgeRow>

      <ImageLayer className="village-card-img" $bg={village.hasImage ? village.image : null} />
      <SpotlightEdge data-testid="village-card-spotlight-edge" aria-hidden="true" />

      <GradientOverlay>
        <SpotlightLayer data-testid="village-card-spotlight" aria-hidden="true" />
        <GlassLens data-testid="village-card-glass-lens" aria-hidden="true" />

        <Name>{village.name}</Name>
        {village.region && (
          <Region>
            <HugeiconsIcon icon={MapPinIcon} size={11} color="rgba(255, 255, 255, 0.7)" />
            {village.region}
          </Region>
        )}
      </GradientOverlay>
    </Card>
  );
}
