'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, palette, fluidHeading , fontSize } from '@/design-system/tokens';
import { Headphones } from 'lucide-react';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';

const Card = styled(motion.article, transientProps)<{ $bg: string | null }>`
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${palette.cheongrok[900]} 0%, ${meok[900]} 100%);`}

  @media (max-width: 480px) {
    border-radius: 16px;
  }
`;

const ImageLayer = styled(motion.div, transientProps)<{ $bg: string | null }>`
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${palette.cheongrok[900]} 0%, ${meok[900]} 100%);`}
  transition: transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);

  .village-card:hover & {
    transform: scale(1.06);
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.15) 40%,
    rgba(14, 18, 16, 0.7) 70%,
    rgba(10, 14, 12, 0.88) 100%
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

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
`;

const Name = styled.h3`
  font-family: var(--font-hanok);
  font-size: ${fluidHeading.label};
  font-weight: 400;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  word-break: keep-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TypeBadge = styled.span`
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  color: #ffffff;
  font-size: ${fontSize.micro};
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const ActionButton = styled(motion.div, transientProps)`
  width: 100%;
  height: 38px;
  background: #ffffff;
  color: #191f28;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: -0.01em;

  transition: background-color 0.2s ease, transform 0.2s ease;

  .village-card:hover & {
    background: #f8fafc;
    transform: translateY(-1px);
  }

  @media (max-width: 480px) {
    height: 32px;
    font-size: ${fontSize.micro};
  }
`;

const TopBadgeRow = styled.div`
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 3;
  display: flex;
  gap: 6px;
`;

const DocentTag = styled.span`
  background: rgba(28, 26, 23, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
  box-shadow: none;
  color: #ffffff;
  font-size: ${fontSize.micro};
  font-weight: 600;
  padding: 3.5px 9px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
  const isDocentAvailable =
    village.type !== '한옥스테이' &&
    (HAS_DOCENT_TYPES.includes(village.type) ||
      HAS_DOCENT_NAMES.some((n) => village.name.includes(n)));

  return (
    <Card
      className="village-card"
      $bg={village.hasImage ? village.image : null}
      onClick={() => onClick?.(village)}
      role="button"
      tabIndex={0}
      aria-label={`${village.name} 자세히 보기`}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 350, damping: 24 }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.(village);
      }}
    >
      {isDocentAvailable && (
        <TopBadgeRow>
          <DocentTag>
            <Headphones size={11} color={palette.jangmi[400]} />
            <span>소리마루 도슨트</span>
          </DocentTag>
        </TopBadgeRow>
      )}

      <ImageLayer $bg={village.hasImage ? village.image : null} />

      <GradientOverlay>
        <HeaderRow>
          <Name>{village.name}</Name>
          <TypeBadge>{filterLabel(village.type)}</TypeBadge>
        </HeaderRow>

        <ActionButton>도감 해설 보기</ActionButton>
      </GradientOverlay>
    </Card>
  );
}
