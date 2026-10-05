'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, palette, fontSize } from '@/design-system/tokens';
import { HugeiconsIcon } from '@hugeicons/react';
import { HeadphonesIcon, MapPinIcon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';

const Card = styled(motion.article, transientProps)`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  background: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  user-select: none;

  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
    &:hover {
      .luxe-photo-img {
        transform: scale(1.045);
      }

      .luxe-arrow {
        transform: translate(2px, -2px);
        color: ${meok[900]};
      }

      .luxe-title {
        color: ${palette.juhong[600]};
      }
    }

    [data-theme='dark'] &:hover {
      .luxe-arrow {
        color: #ffffff;
      }

      .luxe-title {
        color: ${palette.juhong[400]};
      }
    }
  }
`;

const PhotoContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1.08;
  border-radius: 18px;
  overflow: hidden;
  background: ${meok[200]};

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.05);
  }

  @media (max-width: 480px) {
    border-radius: 14px;
    aspect-ratio: 1 / 1.04;
  }
`;

const ImageLayer = styled(motion.div, transientProps)<{ $bg: string | null }>`
  position: absolute;
  inset: 0;
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
  z-index: 1;
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
  z-index: 1;
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
  z-index: 2;
  --spotlight-edge-width: 1.2px;
  --spotlight-edge-radius: 220px;
  padding: var(--spotlight-edge-width);
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    circle var(--spotlight-edge-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.12) 40%,
    rgba(255, 255, 255, 0) 80%
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
    background: radial-gradient(
      circle var(--spotlight-edge-radius) at var(--reveal-x, 50%) var(--reveal-y, 50%),
      rgba(255, 255, 255, 0.35) 0%,
      rgba(255, 255, 255, 0.1) 40%,
      rgba(255, 255, 255, 0) 80%
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

const TopBadgeRow = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  z-index: 3;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;

  @media (max-width: 480px) {
    top: 8px;
    left: 8px;
    right: 8px;
  }
`;

const TypeBadge = styled.span`
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: ${meok[800]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  [data-theme='dark'] & {
    background: rgba(23, 30, 43, 0.88);
    border-color: rgba(255, 255, 255, 0.12);
    color: ${meok[200]};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const DocentTag = styled.span`
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: ${meok[800]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  letter-spacing: -0.01em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  [data-theme='dark'] & {
    background: rgba(23, 30, 43, 0.88);
    border-color: rgba(255, 255, 255, 0.12);
    color: ${meok[200]};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const TypographyArea = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px 2px 0;
  gap: 4px;

  @media (max-width: 480px) {
    padding: 10px 2px 0;
    gap: 3px;
  }
`;

const Name = styled.h3`
  font-family: var(--font-hanok);
  font-size: 1.02rem;
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.35;
  word-break: keep-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 2px;
`;

const RegionText = styled.p`
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[500]};
  margin: 0;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  gap: 3px;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ArrowIconWrap = styled.span`
  color: ${meok[400]};
  display: inline-flex;
  align-items: center;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), color 0.22s ease;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
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
      onClick={() => onClick?.(village)}
      role="button"
      tabIndex={0}
      aria-label={`${village.name} 자세히 보기`}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 24 }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.key === ' ') e.preventDefault();
          onClick?.(village);
        }
      }}
    >
      <PhotoContainer>
        <ImageLayer className="village-card-img luxe-photo-img" $bg={village.hasImage ? village.image : null} />
        <SpotlightEdge data-testid="village-card-spotlight-edge" aria-hidden="true" />
        <SpotlightLayer data-testid="village-card-spotlight" aria-hidden="true" />
        <GlassLens data-testid="village-card-glass-lens" aria-hidden="true" />

        <TopBadgeRow aria-label={`${typeLabel} 태그`}>
          <TypeBadge>{typeLabel}</TypeBadge>
          {isDocentAvailable && (
            <DocentTag>
              <HugeiconsIcon icon={HeadphonesIcon} size={11} color={palette.jangmi[500]} />
              <span>소리마루 도슨트</span>
            </DocentTag>
          )}
        </TopBadgeRow>
      </PhotoContainer>

      <TypographyArea>
        <Name className="luxe-title">{village.name}</Name>
        <MetaRow>
          {village.region ? (
            <RegionText>
              <HugeiconsIcon icon={MapPinIcon} size={12} color="currentColor" />
              {village.region}
            </RegionText>
          ) : (
            <span />
          )}
          <ArrowIconWrap className="luxe-arrow" aria-hidden="true">
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
          </ArrowIconWrap>
        </MetaRow>
      </TypographyArea>
    </Card>
  );
}
