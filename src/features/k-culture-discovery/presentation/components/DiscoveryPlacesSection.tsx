'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import DiscoveryPlaceCard, { DiscoveryPlaceCardSkeleton } from './DiscoveryPlaceCard';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyBox = styled.div`
  grid-column: 1 / -1;
  padding: 48px 0;
  text-align: center;
  color: ${meok[500]};
  font-size: ${fontSize.sm};
`;

const ErrorBox = styled.div`
  grid-column: 1 / -1;
  padding: 32px 16px;
  text-align: center;
  color: ${meok[500]};
  font-size: ${fontSize.sm};
  border-radius: 12px;
  background: ${meok[100]};

  [data-theme='dark'] & {
    background: ${meok[800]};
  }
`;

const LoadMoreBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 4px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: ${meok[100]};
  color: ${meok[600]};
  font-size: ${fontSize.sm};
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    background: ${meok[200]};
    color: ${lightPalette.juhong[500]};
    box-shadow: ${ringShadow.light.chipHover};
  }

  [data-theme='dark'] & {
    background: ${meok[800]};
    color: ${meok[300]};

    &:hover {
      background: ${meok[700]};
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
  items,
  isLoading,
  isError,
  hasMore,
  onLoadMore,
  onPlaceClick,
}: DiscoveryPlacesSectionProps) {
  if (isLoading && items.length === 0) {
    return (
      <Grid aria-busy="true">
        {[...Array(6)].map((_, i) => (
          <DiscoveryPlaceCardSkeleton key={i} />
        ))}
      </Grid>
    );
  }

  if (isError && items.length === 0) {
    return (
      <Grid>
        <ErrorBox role="alert">
          탐색 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </ErrorBox>
      </Grid>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <Grid>
        <EmptyBox>이 조건에 맞는 장소가 없습니다. 다른 주제나 필터를 선택해 보세요.</EmptyBox>
      </Grid>
    );
  }

  return (
    <>
      <Grid>
        {items.map((place, i) => (
          <DiscoveryPlaceCard
            key={place.placeId}
            place={place}
            index={i}
            onClick={onPlaceClick}
          />
        ))}
        {isLoading &&
          [...Array(3)].map((_, i) => <DiscoveryPlaceCardSkeleton key={`sk-${i}`} />)}
      </Grid>

      {hasMore && !isLoading && (
        <LoadMoreBtn type="button" onClick={onLoadMore}>
          <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={2} aria-hidden="true" />
          더 보기
        </LoadMoreBtn>
      )}
    </>
  );
}
