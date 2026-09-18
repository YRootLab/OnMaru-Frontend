'use client';

import React from 'react';
import styled from '@emotion/styled';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { meok, surface } from '@/design-system/tokens';

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
  border: 1px solid rgba(33, 30, 25, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
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

const PageNumberButton = styled.button<{ $isActive: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: 9999px;
  border: none;
  font-family: var(--font-hanok);
  font-size: 12.5px;
  font-weight: ${({ $isActive }) => ($isActive ? '700' : '500')};
  cursor: pointer;
  transition: all 0.2s ease;

  color: ${({ $isActive }) => ($isActive ? '#1c1a17' : meok[700])};
  background: ${({ $isActive }) => ($isActive ? '#d4af37' : 'transparent')};
  box-shadow: ${({ $isActive }) => ($isActive ? '0 2px 10px rgba(212, 175, 55, 0.35)' : 'none')};

  &:hover:not(:disabled) {
    ${({ $isActive }) =>
      !$isActive &&
      `
      background: rgba(0, 0, 0, 0.05);
      color: ${meok[900]};
    `}
  }

  [data-theme='dark'] & {
    color: ${({ $isActive }) => ($isActive ? '#1c1a17' : meok[400])};
    background: ${({ $isActive }) => ($isActive ? '#d4af37' : 'transparent')};

    &:hover:not(:disabled) {
      ${({ $isActive }) =>
        !$isActive &&
        `
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      `}
    }
  }
`;

const EllipsisSpan = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 32px;
  font-size: 11px;
  color: ${meok[500]};
  user-select: none;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
`;

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export const SorimaruPagination: React.FC<SorimaruPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}) => {
  // 1페이지 이하(데이터가 1페이지만 존재할 때)에는 불필요하므로 미노출
  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page === currentPage || isLoading) return;
    onPageChange(page);

    // 섹션 상단으로 부드럽게 스크롤
    const target = document.getElementById('sorimaru-archive');
    if (target) {
      const top = target.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <PaginationContainer aria-label="오디오 아카이브 페이지 번호">
      <NavPillGroup>
        <ArrowButton
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="이전 페이지"
        >
          <ChevronLeft size={15} />
          <span>이전</span>
        </ArrowButton>

        {pageNumbers.map((page, index) =>
          page === '...' ? (
            <EllipsisSpan key={`ellipsis-${index}`}>…</EllipsisSpan>
          ) : (
            <PageNumberButton
              key={page}
              type="button"
              $isActive={page === currentPage}
              onClick={() => handlePageClick(page)}
              disabled={isLoading}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </PageNumberButton>
          )
        )}

        <ArrowButton
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
          aria-label="다음 페이지"
        >
          <span>다음</span>
          <ChevronRight size={15} />
        </ArrowButton>
      </NavPillGroup>
    </PaginationContainer>
  );
};
