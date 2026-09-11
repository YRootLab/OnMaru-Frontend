'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, palette } from '@/design-system/tokens';
import { Headphones } from 'lucide-react';
import type { Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';

const Card = styled(motion.article, transientProps)`
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.2;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  background: #191f28;

`;

const ImageLayer = styled(motion.div, transientProps)<{ $bg: string | null }>`
  position: absolute;
  inset: 0;
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
  font-size: clamp(15px, 1.35vw, 18px);
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
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const Summary = styled.p`
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.5;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: keep-all;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const Badge = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 3.5px 10px;
  border-radius: 9999px;

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
  font-size: 13px;
  font-weight: 500;
  letter-spacing: -0.01em;

  transition: background-color 0.2s ease, transform 0.2s ease;

  .village-card:hover & {
    background: #f8fafc;
    transform: translateY(-1px);
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
  font-size: 10.5px;
  font-weight: 600;
  padding: 3.5px 9px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const HAS_DOCENT_TYPES = ['고궁', '민속마을'];
const HAS_DOCENT_NAMES = ['경복궁', '선교장', '하회', '운조루', '임청각', '최부자', '소쇄원', '창덕궁', '창경궁', '덕수궁', '종묘', '남산골'];

interface VillageCardProps {
  village: Village;
  onClick?: (village: Village) => void;
}

export default function VillageCard({ village, onClick }: VillageCardProps) {
  const isDocentAvailable =
    HAS_DOCENT_TYPES.includes(village.type) ||
    HAS_DOCENT_NAMES.some((n) => village.name.includes(n));

  return (
    <Card
      className="village-card"
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
            <span>오디오 도슨트</span>
          </DocentTag>
        </TopBadgeRow>
      )}

      <ImageLayer $bg={village.hasImage ? village.image : null} />

      <GradientOverlay>
        <HeaderRow>
          <Name>{village.name}</Name>
          <TypeBadge>{filterLabel(village.type)}</TypeBadge>
        </HeaderRow>

        {village.summary && <Summary>{village.summary}</Summary>}

        <BadgeRow>
          <Badge>{village.region}</Badge>
          {village.badges.slice(0, 2).map((b) => (
            <Badge key={b}>#{filterLabel(b)}</Badge>
          ))}
        </BadgeRow>

        <ActionButton>자세히 보기</ActionButton>
      </GradientOverlay>
    </Card>
  );
}

