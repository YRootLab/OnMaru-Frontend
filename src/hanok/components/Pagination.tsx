'use client';

import React from 'react';
import styled from '@emotion/styled';
import { meok, lightPalette } from '@/design-system/tokens';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 48px;
  flex-wrap: wrap;
`;

const PageBtn = styled.button<{ $active?: boolean; $disabled?: boolean }>`
  background: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  border-radius: 9999px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;

  &:hover:not(:disabled) {
    border-color: ${meok[900]};
    background: ${({ $active }) => ($active ? meok[900] : meok[100])};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }
`;

const Dots = styled.span`
  color: ${meok[400]};
  padding: 0 4px;
  font-size: 14px;
`;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Wrapper role="navigation" aria-label="페이지 이동">
      <PageBtn
        $disabled={currentPage === 1}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="이전 페이지"
      >
        ‹ 이전
      </PageBtn>

      {getPages().map((p, idx) =>
        typeof p === 'number' ? (
          <PageBtn
            key={p}
            $active={p === currentPage}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </PageBtn>
        ) : (
          <Dots key={`dots-${idx}`}>…</Dots>
        )
      )}

      <PageBtn
        $disabled={currentPage === totalPages}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="다음 페이지"
      >
        다음 ›
      </PageBtn>
    </Wrapper>
  );
}
