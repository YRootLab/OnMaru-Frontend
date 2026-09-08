'use client';

// ============================================================
// 빈 상태 안내 컴포넌트 (src/admin/components/EmptyState.tsx)
// ============================================================

import React from 'react';
import { meok, palette } from '@/design-system/tokens';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = '데이터가 없습니다',
  description = '조건을 변경하거나 새로운 항목을 등록해 보세요.',
  icon,
  actionText,
  onAction,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: meok[200],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: meok[500],
          fontSize: '26px',
          marginBottom: '16px',
        }}
      >
        {icon || <Inbox size={26} strokeWidth={1.8} />}
      </div>

      <div
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: meok[900],
          marginBottom: '6px',
        }}
      >
        {title}
      </div>

      {description && (
        <div
          style={{
            fontSize: '13px',
            color: meok[500],
            maxWidth: '360px',
            lineHeight: 1.5,
            marginBottom: actionText ? '20px' : 0,
          }}
        >
          {description}
        </div>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: palette.juhong[500],
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
