'use client';





import React, { useEffect } from 'react';
import { palette } from '@/design-system/tokens';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === 'success'
      ? palette.cheongrok[500]
      : type === 'error'
      ? palette.danpung[500]
      : palette.kobalt[500];

  const Icon =
    type === 'success'
      ? CheckCircle2
      : type === 'error'
      ? AlertCircle
      : Info;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '24px',
        right: '28px',
        zIndex: 10000,
        backgroundColor: bgColor,
        color: '#FFFFFF',
        borderRadius: '10px',
        padding: '12px 18px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px',
        fontWeight: 600,
        animation: 'adminToastSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes adminToastSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Icon size={18} strokeWidth={2.2} />
      <span>{message}</span>
    </div>
  );
};
