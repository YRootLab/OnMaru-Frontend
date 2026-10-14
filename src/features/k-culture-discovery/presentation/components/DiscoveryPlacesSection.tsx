'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { meok, ringShadow, fontSize } from '@/design-system/tokens';
import DiscoveryPlaceCard, { DiscoveryPlaceCardSkeleton } from './DiscoveryPlaceCard';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const ITEMS_PER_PAGE = 6;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
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

/* ─── pagination controls ─── */
const PaginationContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 36px;
  padding: 8px 0 24px;
  user-select: none;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border-radius: 10px;
  border: none;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  transition: all 0.16s ease;

  background: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  box-shadow: ${({ $active }) => ($active ? ringShadow.light.button : ringShadow.light.card)};

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? meok[800] : meok[100])};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
    box-shadow: ${ringShadow.light.buttonHover};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  [data-theme='dark'] & {
    background: ${({ $active }) => ($active ? '#ffffff' : '#161c28')};
    color: ${({ $active }) => ($active ? meok[900] : 'rgba(255, 255, 255, 0.75)')};
    box-shadow: ${({ $active }) => ($active ? ringShadow.dark.button : ringShadow.dark.card)};

    &:hover:not(:disabled) {
      background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.1)')};
      color: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
      box-shadow: ${ringShadow.dark.buttonHover};
    }
  }
`;

const ArrowBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  background: #ffffff;
  color: ${meok[700]};
  box-shadow: ${ringShadow.light.card};
  transition: all 0.16s ease;

  &:hover:not(:disabled) {
    background: ${meok[100]};
    color: ${meok[900]};
    box-shadow: ${ringShadow.light.buttonHover};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  [data-theme='dark'] & {
    background: #161c28;
    color: rgba(255, 255, 255, 0.75);
    box-shadow: ${ringShadow.dark.card};

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      box-shadow: ${ringShadow.dark.buttonHover};
    }
  }
`;

const Dots = styled.span`
  color: ${meok[400]};
  padding: 0 4px;
  font-size: ${fontSize.xs};

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.35);
  }
`;

function getPageList(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'dots')[] = [1];
  if (current > 3) pages.push('dots');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) pages.push(i);
  }

  if (current < total - 2) pages.push('dots');
  pages.push(total);
  return pages;
}

export interface DiscoveryPlacesSectionProps {
  items: DiscoveryPlaceSummary[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  filterKey?: string;
  onLoadMore: () => void;
  onPlaceClick: (place: DiscoveryPlaceSummary) => void;
}

export default function DiscoveryPlacesSection({
  items,
  isLoading,
  isError,
  hasMore,
  filterKey,
  onLoadMore,
  onPlaceClick,
}: DiscoveryPlacesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when filtering conditions change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKey]);

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

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const pageToRender = Math.min(currentPage, totalPages);
  const currentItems = items.slice((pageToRender - 1) * ITEMS_PER_PAGE, pageToRender * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);

    // If nearing the end of fetched items and more are available, pre-fetch next batch
    if (hasMore && (page + 1) * ITEMS_PER_PAGE >= items.length) {
      onLoadMore();
    }

    if (sectionRef.current) {
      const yOffset = -90;
      const y = sectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  return (
    <div ref={sectionRef}>
      <Grid>
        {currentItems.map((place, i) => (
          <DiscoveryPlaceCard
            key={place.placeId}
            place={place}
            index={(pageToRender - 1) * ITEMS_PER_PAGE + i}
            onClick={onPlaceClick}
          />
        ))}
        {isLoading && [...Array(3)].map((_, i) => <DiscoveryPlaceCardSkeleton key={`sk-${i}`} />)}
      </Grid>

      {totalPages > 1 && (
        <PaginationContainer role="navigation" aria-label="장소 페이지 이동">
          <ArrowBtn
            type="button"
            disabled={pageToRender === 1}
            onClick={() => handlePageChange(pageToRender - 1)}
            aria-label="이전 페이지"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.2} aria-hidden="true" />
          </ArrowBtn>

          {getPageList(pageToRender, totalPages).map((p, idx) =>
            p === 'dots' ? (
              <Dots key={`dots-${idx}`}>…</Dots>
            ) : (
              <PageBtn
                key={p}
                type="button"
                $active={p === pageToRender}
                onClick={() => handlePageChange(p)}
                aria-current={p === pageToRender ? 'page' : undefined}
                aria-label={`${p}페이지`}
              >
                {p}
              </PageBtn>
            )
          )}

          <ArrowBtn
            type="button"
            disabled={pageToRender === totalPages}
            onClick={() => handlePageChange(pageToRender + 1)}
            aria-label="다음 페이지"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2.2} aria-hidden="true" />
          </ArrowBtn>
        </PaginationContainer>
      )}
    </div>
  );
}
