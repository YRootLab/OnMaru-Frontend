'use client';

// ============================================================
// 관리자 지표 카드 (src/admin/components/StatCard.tsx)
// ============================================================

import React from 'react';
import { palette, meok } from '@/design-system/tokens';

interface StatCardProps {
  label: string;
  value: number | string;
  delta?: number;
  deltaType?: 'increase' | 'decrease' | 'neutral';
  highlight?: boolean;
  comparisonText?: string;
  unit?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  deltaType,
  highlight = false,
  comparisonText = '어제 대비',
  unit = '',
  onClick,
}) => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  const isDangerHighlight = highlight && (isNaN(numericValue) ? false : numericValue > 0);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${isDangerHighlight ? 'rgba(255, 59, 48, 0.25)' : 'rgba(78, 89, 104, 0.08)'}`,
        borderRadius: '14px',
        padding: '20px',
        boxShadow: isDangerHighlight ? '0 4px 16px rgba(255, 59, 48, 0.06)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div style={{ fontSize: '13px', color: meok[500], fontWeight: 500, marginBottom: '8px' }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: isDangerHighlight ? palette.danpung[500] : meok[900],
            letterSpacing: '-0.02em',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span style={{ fontSize: '14px', color: meok[500], fontWeight: 500 }}>{unit}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
        {delta !== undefined && (
          <span
            style={{
              fontWeight: 600,
              color:
                deltaType === 'increase'
                  ? palette.cheongrok[500]
                  : deltaType === 'decrease'
                  ? palette.danpung[500]
                  : meok[500],
            }}
          >
            {deltaType === 'increase' ? '▲ ' : deltaType === 'decrease' ? '▼ ' : ''}
            {Math.abs(delta)}
          </span>
        )}
        {comparisonText && (
          <span style={{ color: meok[400], fontWeight: 400 }}>{comparisonText}</span>
        )}
      </div>
    </div>
  );
};
