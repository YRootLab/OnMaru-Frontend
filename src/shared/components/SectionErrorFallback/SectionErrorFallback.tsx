'use client';

import React from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { RefreshCwIcon, AlertCircleIcon, LoaderCircleIcon } from '@hugeicons/core-free-icons'
import { OnmaruApiError } from '@/lib/api/errors';
import { resolveSectionErrorState } from './sectionErrorFallbackModel';

const FallbackContainer = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ $compact }) => ($compact ? '24px 16px' : '48px 24px')};
  background-color: #f8f8f7;
  border: 1px solid #e5e5e3;
  border-radius: 16px;
  margin: 12px 0;

  [data-theme='dark'] & {
    background-color: #171E2B;
    border-color: #38332c;
  }
`;

const IconWrapper = styled.div<{ $isWaking?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: ${({ $isWaking }) => ($isWaking ? '#eef2ff' : '#fef2f2')};
  color: ${({ $isWaking }) => ($isWaking ? '#4f46e5' : '#dc2626')};
  margin-bottom: 16px;

  [data-theme='dark'] & {
    background-color: ${({ $isWaking }) => ($isWaking ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.15)')};
    color: ${({ $isWaking }) => ($isWaking ? '#818cf8' : '#f87171')};
  }
`;

const MainTitle = styled.h3`
  font-family: var(--font-hanok), sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #0B1220;
  margin: 0 0 6px 0;

  [data-theme='dark'] & {
    color: #f8f8f7;
  }
`;

const SubDescription = styled.p`
  font-size: 0.875rem;
  color: #666460;
  margin: 0 0 12px 0;
  line-height: 1.5;

  [data-theme='dark'] & {
    color: #a09d96;
  }
`;

const RequestIdText = styled.div`
  font-size: 0.75rem;
  font-family: monospace;
  color: #8c8983;
  background-color: #e5e5e3;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 16px;
  display: inline-block;

  [data-theme='dark'] & {
    color: #b0ada6;
    background-color: #38332c;
  }
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0B1220;
  background-color: #ffffff;
  border: 1px solid #d9d9d7;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f4;
    border-color: #cdcdca;
  }

  [data-theme='dark'] & {
    color: #f8f8f7;
    background-color: #212734;
    border-color: #454038;

    &:hover {
      background-color: #38332c;
    }
  }
`;

export interface SectionErrorFallbackProps {
  error?: OnmaruApiError | unknown;
  title?: string;
  description?: string;
  requestId?: string | null;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export const SectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({
  error,
  title: customTitle,
  description: customDescription,
  requestId: customRequestId,
  onRetry,
  compact = false,
  className,
}) => {
  const { title, description, requestId, isWaking, canRetry } = resolveSectionErrorState(
    error,
    customTitle,
    customDescription,
    customRequestId
  );

  return (
    <FallbackContainer $compact={compact} className={className} role="alert" aria-live="polite">
      <IconWrapper $isWaking={isWaking}>
        {isWaking ? <HugeiconsIcon icon={LoaderCircleIcon} size={22} className="animate-spin" /> : <HugeiconsIcon icon={AlertCircleIcon} size={22} />}
      </IconWrapper>

      {/* Typography Hierarchy: Main Title ALWAYS at the top, Subtitle/description below */}
      <MainTitle>{title}</MainTitle>
      <SubDescription>{description}</SubDescription>

      {requestId && <RequestIdText>오류 ID: {requestId}</RequestIdText>}

      {canRetry && onRetry && (
        <RetryButton type="button" onClick={onRetry}>
          <HugeiconsIcon icon={RefreshCwIcon} size={14} />
          다시 시도
        </RetryButton>
      )}
    </FallbackContainer>
  );
};
