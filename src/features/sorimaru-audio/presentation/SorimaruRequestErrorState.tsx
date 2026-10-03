'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { RotateCcwIcon } from '@hugeicons/core-free-icons';
import { OniSearchEmpty } from '@/shared/components/OniSearchEmpty/OniSearchEmpty';
import { fontSize, meok, palette } from '@/design-system/tokens';

const RetryButton = styled.button`
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border: 1px solid ${meok[300]};
  border-radius: 9999px;
  background: #ffffff;
  padding: 0.5rem 1rem;
  color: ${meok[800]};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;

  &:hover { border-color: ${palette.juhong[400]}; color: ${palette.juhong[600]}; }
  &:active { transform: scale(0.97); }
  &:focus-visible { outline: 2px solid ${palette.juhong[400]}; outline-offset: 2px; }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.16);
    background: ${meok[900]};
    color: ${meok[100]};
  }
`;

export interface SorimaruRequestErrorStateProps {
  onRetry: () => void;
  compact?: boolean;
}

export function SorimaruRequestErrorState({ onRetry, compact = false }: SorimaruRequestErrorStateProps) {
  return (
    <OniSearchEmpty
      size={compact ? 'sm' : 'md'}
      compact={compact}
      role="alert"
      videoSrc=""
      imageSrc="/images/character/Oni_server_error.png"
      title="잠시 연결이 불안정해요"
      description="이야기를 불러오는 데 시간이 걸리고 있어요. 잠시 후 다시 시도해 주세요."
      action={(
        <RetryButton type="button" onClick={onRetry}>
          <HugeiconsIcon icon={RotateCcwIcon} size={14} aria-hidden="true" />
          다시 시도
        </RetryButton>
      )}
    />
  );
}
