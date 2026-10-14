'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, ringShadow, fontSize } from '@/design-system/tokens';
import DiscoveryWorkCard, { DiscoveryWorkCardSkeleton } from './DiscoveryWorkCard';
import type { WorkSummary } from '../../domain/types';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EmptyBox = styled.div`
  padding: 56px 0;
  text-align: center;
  color: ${meok[400]};
  font-size: ${fontSize.sm};

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.24);
  }
`;

const ErrorBox = styled.div`
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

export interface DiscoveryWorksSectionProps {
  items: WorkSummary[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onWorkClick: (work: WorkSummary) => void;
}

export default function DiscoveryWorksSection({
  items,
  isLoading,
  isError,
  hasMore,
  onLoadMore,
  onWorkClick,
}: DiscoveryWorksSectionProps) {
  if (isLoading && items.length === 0) {
    return (
      <List aria-busy="true">
        {[...Array(5)].map((_, i) => (
          <DiscoveryWorkCardSkeleton key={i} />
        ))}
      </List>
    );
  }

  if (isError && items.length === 0) {
    return (
      <ErrorBox role="alert">
        작품 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
      </ErrorBox>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <EmptyBox>이 조건에 맞는 작품이 없습니다. 다른 필터를 선택해 보세요.</EmptyBox>
    );
  }

  return (
    <>
      <List>
        {items.map((work, i) => (
          <DiscoveryWorkCard
            key={work.workId}
            work={work}
            index={i}
            onClick={onWorkClick}
          />
        ))}
        {isLoading &&
          [...Array(3)].map((_, i) => <DiscoveryWorkCardSkeleton key={`sk-${i}`} />)}
      </List>

      {hasMore && !isLoading && (
        <LoadMoreBtn type="button" onClick={onLoadMore}>
          <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={2} aria-hidden="true" />
          더 보기
        </LoadMoreBtn>
      )}
    </>
  );
}
