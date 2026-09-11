'use client';

// ============================================================
// 확인 및 경고 모달 (src/admin/components/ConfirmDialog.tsx)
// ============================================================

import React, { useEffect } from 'react';
import { meok, palette } from '@/design-system/tokens';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'adminModalIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes adminModalIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        <h3
          id="confirm-dialog-title"
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: meok[900],
            marginBottom: '8px',
          }}
        >
          {title}
        </h3>

        <p
          id="confirm-dialog-description"
          style={{
            fontSize: '14px',
            color: meok[500],
            lineHeight: 1.5,
            marginBottom: '24px',
            whiteSpace: 'pre-line',
          }}
        >
          {description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '8px',
              border: '1px solid rgba(78, 89, 104, 0.15)',
              backgroundColor: '#FFFFFF',
              color: meok[700],
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              height: '40px',
              padding: '0 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isDestructive ? palette.danpung[500] : palette.juhong[500],
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? '처리 중...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
