'use client';

// ============================================================
// 관리자 페이지네이션 (src/admin/components/Pagination.tsx)
// ============================================================
import React from 'react';
import { meok, palette } from '@/design-system/tokens';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  // 최대 5개 페이지 번호 노출
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

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
    <div
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
        <ChevronLeft size={16} strokeWidth={2} />
      </button>

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
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
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
};
