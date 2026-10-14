'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import DiscoveryPlaceCard, { DiscoveryPlaceCardSkeleton } from './DiscoveryPlaceCard';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyBox = styled.div`
  grid-column: 1 / -1;
  padding: 56px 0;
  text-align: center;
  color: ${meok[400]};
  font-size: ${fontSize.sm};

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.24);
  }
`;

const ErrorBox = styled.div`
  grid-column: 1 / -1;
  padding: 40px 20px;
  text-align: center;
  border-radius: 14px;
  background: ${meok[100]};
  color: ${meok[500]};
  font-size: ${fontSize.sm};

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.30);
  }
`;

const LoadMoreBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 10px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: ${meok[100]};
  color: ${meok[600]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.14s ease, color 0.14s ease, transform 0.10s ease;

  &:hover {
    background: ${meok[200]};
    color: ${meok[800]};
  }

  &:active {
    transform: scale(0.98);
    background: ${meok[200]};
  }

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.45);

    &:hover {
      background: rgba(255,255,255,0.10);
      color: rgba(255,255,255,0.70);
    }
  }
`;

export interface DiscoveryPlacesSectionProps {
  items: DiscoveryPlaceSummary[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPlaceClick: (place: DiscoveryPlaceSummary) => void;
}

export default function DiscoveryPlacesSection({
  items, isLoading, isError, hasMore, onLoadMore, onPlaceClick,
}: DiscoveryPlacesSectionProps) {
  if (isLoading && items.length === 0) {
    return (
      <Grid aria-busy="true">
        {[...Array(6)].map((_, i) => <DiscoveryPlaceCardSkeleton key={i} />)}
      </Grid>
    );
  }

  if (isError && items.length === 0) {
    return (
      <Grid>
        <ErrorBox role="alert">탐색 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</ErrorBox>
      </Grid>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <Grid>
        <EmptyBox>이 조건에 맞는 장소가 없습니다.</EmptyBox>
      </Grid>
    );
  }

  return (
    <>
      <Grid>
        {items.map((place, i) => (
          <DiscoveryPlaceCard key={place.placeId} place={place} index={i} onClick={onPlaceClick} />
        ))}
        {isLoading && [...Array(3)].map((_, i) => <DiscoveryPlaceCardSkeleton key={`sk-${i}`} />)}
      </Grid>

      {hasMore && !isLoading && (
        <LoadMoreBtn type="button" onClick={onLoadMore}>
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2} aria-hidden="true" />
          더 보기
        </LoadMoreBtn>
      )}
    </>
  );
}
