'use client';

import React from 'react';
import styled from '@emotion/styled';
import { meok, fontSize } from '@/design-system/tokens';
import DiscoveryPlaceCard from './DiscoveryPlaceCard';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const Section = styled.div`
  margin-top: 32px;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
`;

const Label = styled.h3`
  font-family: var(--font-hanok), serif;
  font-size: ${fontSize.base};
  font-weight: 800;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.03em;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const Count = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${meok[400]};

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const ScrollRow = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { display: none; }
`;

const CardWrap = styled.div`
  flex-shrink: 0;
  width: 200px;

  @media (min-width: 768px) {
    width: 240px;
  }
`;

interface Props {
  label: string;
  items: DiscoveryPlaceSummary[];
  onPlaceClick: (place: DiscoveryPlaceSummary) => void;
}

export default function HorizontalSection({ label, items, onPlaceClick }: Props) {
  if (items.length === 0) return null;

  return (
    <Section>
      <Header>
        <Label>{label}</Label>
        <Count>{items.length}곳</Count>
      </Header>
      <ScrollRow>
        {items.map((place, i) => (
          <CardWrap key={place.placeId}>
            <DiscoveryPlaceCard place={place} index={i} onClick={onPlaceClick} />
          </CardWrap>
        ))}
      </ScrollRow>
    </Section>
  );
}
