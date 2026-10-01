'use client';





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
        border: `1px solid ${isDangerHighlight ? 'rgba(255, 59, 48, 0.3)' : 'rgba(78, 89, 104, 0.10)'}`,
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: isDangerHighlight
          ? '0 6px 20px rgba(255, 59, 48, 0.08)'
          : '0 2px 10px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '130px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease',
      }}
    >
      <div style={{ fontSize: '14px', color: meok[600], fontWeight: 600, marginBottom: '10px' }}>
        {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
        <span
          style={{
            fontSize: '36px',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: isDangerHighlight ? palette.danpung[500] : meok[900],
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span style={{ fontSize: '16px', color: meok[500], fontWeight: 600 }}>{unit}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        {delta !== undefined && (
          <span
            style={{
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor:
                deltaType === 'increase'
                  ? 'rgba(34, 197, 94, 0.12)'
                  : deltaType === 'decrease'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(78, 89, 104, 0.08)',
              color:
                deltaType === 'increase'
                  ? '#16a34a'
                  : deltaType === 'decrease'
                  ? '#dc2626'
                  : meok[600],
            }}
          >
            {deltaType === 'increase' ? '▲ ' : deltaType === 'decrease' ? '▼ ' : ''}
            {Math.abs(delta)}
          </span>
        )}
        {comparisonText && (
          <span style={{ color: meok[500], fontWeight: 500 }}>{comparisonText}</span>
        )}
      </div>
    </div>
  );
};
