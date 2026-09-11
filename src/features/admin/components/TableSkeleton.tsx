'use client';

// ============================================================
// 테이블 로딩 스켈레톤 (src/admin/components/TableSkeleton.tsx)
// ============================================================

import React from 'react';

interface TableSkeletonProps {
  rowCount?: number;
  colCount?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rowCount = 8,
  colCount = 6,
}) => {
  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <style>{`
        @keyframes adminSkeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .admin-skeleton-box {
          background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e3 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: adminSkeletonShimmer 1.5s infinite;
          border-radius: 4px;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Array.from({ length: rowCount }).map((_, rIdx) => (
          <div
            key={rIdx}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '64px',
              padding: '0 16px',
              borderBottom: '1px solid rgba(78, 89, 104, 0.06)',
              gap: '16px',
            }}
          >
            {Array.from({ length: colCount }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="admin-skeleton-box"
                style={{
                  height: '18px',
                  width: cIdx === 0 ? '32px' : cIdx === 1 ? '140px' : cIdx === 2 ? '180px' : '80px',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
