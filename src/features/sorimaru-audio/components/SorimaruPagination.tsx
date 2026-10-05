'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@hugeicons/core-free-icons'
import { meok } from '@/design-system/tokens';

interface SorimaruPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const PaginationContainer = styled.nav`
  margin-top: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.5rem 0;
`;

const NavPillGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 9999px;
  background: rgba(248, 248, 247, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: none;
  box-shadow: none;

  [data-theme='dark'] & {
    background: rgba(11, 18, 32, 0.8);
    border: none;
    box-shadow: none;
  }
`;

const ArrowButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 8px;
  border-radius: 9999px;
  background: transparent;
  border: none;
  font-family: var(--font-hanok);
  font-size: 12px;
  font-weight: 600;
  color: ${meok[700]};
  cursor: pointer;
  gap: 2px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
    color: ${meok[900]};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  [data-theme='dark'] & {
    color: ${meok[300]};

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
  }
`;

const PageStatus = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  height: 32px;
  padding: 0 10px;
  border-radius: 9999px;
  font-family: var(--font-hanok);
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${meok[700]};
  background: rgba(255, 255, 255, 0.8);

  [data-theme='dark'] & {
    color: ${meok[300]};
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const SorimaruPagination: React.FC<SorimaruPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {

  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page === currentPage || isLoading) return;
    onPageChange(page);


    const target = document.getElementById('sorimaru-archive');
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <PaginationContainer aria-label="오디오 아카이브 페이지 이동">
      <NavPillGroup>
        <ArrowButton
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="이전 페이지"
        >
          <HugeiconsIcon icon={ChevronLeftIcon} size={15} />
          <span>이전</span>
        </ArrowButton>

        <PageStatus aria-current="page" aria-label={`${totalPages}페이지 중 ${currentPage}페이지`}>
          {currentPage} / {totalPages}
        </PageStatus>

        <ArrowButton
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="다음 페이지"
        >
          <span>다음</span>
          <HugeiconsIcon icon={ChevronRightIcon} size={15} />
        </ArrowButton>
      </NavPillGroup>
    </PaginationContainer>
  );
};
