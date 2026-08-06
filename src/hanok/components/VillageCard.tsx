'use client';

import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, lightPalette } from '@/design-system/tokens';
import type { Village } from '@/hanok/types';

const Card = styled(motion.article)`
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${lightPalette.kobalt[50]};
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 60%;
  overflow: hidden;
  background-color: ${lightPalette.kobalt[50]};
  border-radius: 16px;
`;

const ImageLayer = styled(motion.div)<{ $bg: string | null }>`
  position: absolute;
  inset: 0;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${lightPalette.kobalt[50]} 0%, ${lightPalette.kobalt[100]} 100%);`}
  transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1);

  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const TypeBadge = styled.span`
  position: absolute;
  top: 14px;
  left: 14px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-size: 11.5px;
  font-weight: 700;
  color: ${lightPalette.kobalt[700]};
  padding: 4px 12px;
  border-radius: 9999px;
  z-index: 1;
`;

const Body = styled.div`
  padding: 18px 4px 12px;
`;

const Region = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: ${lightPalette.kobalt[400]};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const Name = styled.h3`
  font-family: 'SpoqaHanSansNeo', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${meok[900]};
  margin: 6px 0 8px;
  letter-spacing: -0.015em;
  line-height: 1.3;
`;

const Summary = styled.p`
  font-size: 13px;
  color: ${meok[500]};
  line-height: 1.6;
  margin: 0 0 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Badge = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${lightPalette.kobalt[500]};
  background: ${lightPalette.kobalt[50]};
  padding: 3px 10px;
  border-radius: 9999px;
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
      whileHover={{ y: -4, scale: 1.012 }}
      whileTap={{ scale: 0.988 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.(village);
      }}
    >
      <ImageContainer>
        <ImageLayer $bg={village.hasImage ? village.image : null} />
        <TypeBadge>{village.type}</TypeBadge>
      </ImageContainer>

      <Body>
        <Region>{village.region}</Region>
        <Name>{village.name}</Name>
        {village.summary && <Summary>{village.summary}</Summary>}
        {village.badges.length > 0 && (
          <BadgeRow>
            {village.badges.slice(0, 4).map((b) => (
              <Badge key={b}>#{b}</Badge>
            ))}
          </BadgeRow>
        )}
      </Body>
    </Card>
  );
}
