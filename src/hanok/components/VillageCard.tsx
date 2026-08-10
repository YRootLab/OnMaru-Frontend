'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, lightPalette } from '@/design-system/tokens';
import type { Village } from '@/hanok/types';

const Card = styled(motion.article)`
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4.4;
  border-radius: 32px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  background: #191f28;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const ImageLayer = styled(motion.div)<{ $bg: string | null }>`
  position: absolute;
  inset: 0;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${lightPalette.kobalt[700]} 0%, ${meok[900]} 100%);`}
  transition: transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);

  ${Card}:hover & {
    transform: scale(1.06);
  }
`;

const GradientOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.15) 45%,
    rgba(14, 18, 16, 0.65) 75%,
    rgba(10, 14, 12, 0.85) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px 18px 18px;
  z-index: 2;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
`;

const Name = styled.h3`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: clamp(20px, 2.2vw, 24px);
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.25;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`;

const TypeBadge = styled.span`
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 9999px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const Summary = styled.p`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.55;
  margin: 0 0 14px;
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
  gap: 8px;
  margin-bottom: 20px;
`;

const Badge = styled.span`
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 5px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const ActionButton = styled(motion.div)`
  width: 100%;
  height: 48px;
  background: #ffffff;
  color: #191f28;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
  transition: background-color 0.2s ease, transform 0.2s ease;

  ${Card}:hover & {
    background: #f8fafc;
    transform: translateY(-1px);
  }
`;

interface VillageCardProps {
  village: Village;
  onClick?: (village: Village) => void;
}

export default function VillageCard({ village, onClick }: VillageCardProps) {
  return (
    <Card
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
      <ImageLayer $bg={village.hasImage ? village.image : null} />

      <GradientOverlay>
        <HeaderRow>
          <Name>{village.name}</Name>
          <TypeBadge>{village.type}</TypeBadge>
        </HeaderRow>

        {village.summary && <Summary>{village.summary}</Summary>}

        <BadgeRow>
          <Badge>{village.region}</Badge>
          {village.badges.slice(0, 2).map((b) => (
            <Badge key={b}>#{b}</Badge>
          ))}
        </BadgeRow>

        <ActionButton>자세히 보기</ActionButton>
      </GradientOverlay>
    </Card>
  );
}

