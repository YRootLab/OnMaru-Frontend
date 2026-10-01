'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { PenLineIcon } from '@hugeicons/core-free-icons'
import { meok, fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import { hasAuthenticatedUser, showLoginRequiredToast } from '@/features/auth/privateState';
import WriteWarmthModal from './WriteWarmthModal';

const FloatingBtn = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 42px;
  padding: 0 18px;

  border-radius: 9999px;
  border: none;
  background: ${meok[900]};
  color: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 700;

  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${meok[800]};
    transform: translateY(-2px);
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: ${meok[900]};

    &:hover {
      background: ${meok[800]};
    }
  }

  @media (max-width: 1023px) {
    height: 38px;
    padding: 0 14px;
    font-size: ${fontSize.xs};
  }
`;

export default function WriteButton() {
  const mode = useMapStore((s) => s.mode);
  const [isOpen, setIsOpen] = useState(false);

  if (mode !== 'warmth') return null;

  return (
    <>
      <FloatingBtn
        type="button"
        data-write-btn="true"
        onClick={() => {
          if (!hasAuthenticatedUser()) {
            showLoginRequiredToast();
            return;
          }
          setIsOpen((prev) => !prev);
        }}
        aria-label="장소에 대한 온기 후기 남기기"
      >
        <HugeiconsIcon icon={PenLineIcon} size={18} strokeWidth={2} />
        <span>온기 남기기</span>
      </FloatingBtn>

      <WriteWarmthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
