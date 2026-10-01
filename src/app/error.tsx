'use client';

import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { RotateCcwIcon } from '@hugeicons/core-free-icons'
import OniSearchEmpty from '@/shared/components/OniSearchEmpty/OniSearchEmpty';

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
  padding: 40px 20px;
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 9999px;
  background: #0B1220;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;

  [data-theme='dark'] & {
    background: #ffffff;
    color: #171513;
  }

  &:hover {
    transform: translateY(-1px);
    opacity: 0.92;
  }
`;

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App routing error caught:', error);
  }, [error]);

  return (
    <PageWrapper>
      <OniSearchEmpty
        size="lg"
        title="페이지를 불러올 수 없어요"
        description="예상치 못한 오류가 발생했어요. 잠시 후 다시 시도해 주세요."
        action={
          <RetryButton type="button" onClick={() => reset()}>
            <HugeiconsIcon icon={RotateCcwIcon} size={16} />
            다시 시도하기
          </RetryButton>
        }
      />
    </PageWrapper>
  );
}
