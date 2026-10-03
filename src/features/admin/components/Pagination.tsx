'use client';




import React from 'react';
import { meok, palette } from '@/design-system/tokens';
import { HugeiconsIcon } from '@hugeicons/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@hugeicons/core-free-icons'

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;


  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="페이지 내비게이션"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '20px 0',
      }}
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: '1px solid rgba(78, 89, 104, 0.12)',
          backgroundColor: '#FFFFFF',
          color: currentPage <= 1 ? meok[400] : meok[700],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s ease',
        }}
      >
        <HugeiconsIcon icon={ChevronLeftIcon} size={16} strokeWidth={2} />
      </button>

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={isActive ? 'page' : undefined}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: isActive ? 'none' : '1px solid rgba(78, 89, 104, 0.12)',
              backgroundColor: isActive ? palette.juhong[500] : '#FFFFFF',
              color: isActive ? '#FFFFFF' : meok[700],
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          border: '1px solid rgba(78, 89, 104, 0.12)',
          backgroundColor: '#FFFFFF',
          color: currentPage >= totalPages ? meok[400] : meok[700],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s ease',
        }}
      >
        <HugeiconsIcon icon={ChevronRightIcon} size={16} strokeWidth={2} />
      </button>
    </nav>
  );
};

export interface CursorPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  isLoading?: boolean;
  className?: string;
}

export const CursorPagination: React.FC<CursorPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  rangeStart,
  rangeEnd,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  isLoading = false,
  className,
}) => {
  return (
    <nav
      aria-label="커서 페이지 내비게이션"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 20px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: meok[500], fontSize: '13px' }}>
        <strong style={{ color: meok[800] }}>전체 {totalCount.toLocaleString('ko-KR')}건</strong>
        {totalCount > 0 && <span>{rangeStart.toLocaleString('ko-KR')}–{rangeEnd.toLocaleString('ko-KR')}건 표시</span>}
      </div>

      {(hasPrev || hasNext) && <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev || isLoading}
        aria-label="이전 페이지"
        style={{
          height: '34px',
          padding: '0 12px',
          borderRadius: '8px',
          border: '1px solid rgba(78, 89, 104, 0.15)',
          backgroundColor: '#FFFFFF',
          color: !hasPrev || isLoading ? meok[400] : meok[700],
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: !hasPrev || isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <HugeiconsIcon icon={ChevronLeftIcon} size={16} strokeWidth={2} />
        <span>이전</span>
      </button>

      <div
        aria-current="page"
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          backgroundColor: 'rgba(78, 89, 104, 0.05)',
          fontSize: '13px',
          fontWeight: 600,
          color: meok[800],
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {currentPage} / {totalPages} 페이지
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext || isLoading}
        aria-label="다음 페이지"
        style={{
          height: '34px',
          padding: '0 12px',
          borderRadius: '8px',
          border: '1px solid rgba(78, 89, 104, 0.15)',
          backgroundColor: '#FFFFFF',
          color: !hasNext || isLoading ? meok[400] : meok[700],
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: !hasNext || isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <span>다음</span>
        <HugeiconsIcon icon={ChevronRightIcon} size={16} strokeWidth={2} />
      </button>
      </div>}
    </nav>
  );
};
