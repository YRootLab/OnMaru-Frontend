'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { PenLine } from 'lucide-react';
import { lightPalette , fontSize } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
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
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(232, 90, 24, 0.25);

  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${lightPalette.juhong[700]};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(232, 90, 24, 0.35);
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: linear-gradient(135deg, #e85a18 0%, #d4af37 100%);
    box-shadow: 0 2px 10px rgba(232, 90, 24, 0.35);
    border: none;

    &:hover {
      background: linear-gradient(135deg, #f06a2b 0%, #e5bd47 100%);
      box-shadow: 0 4px 14px rgba(232, 90, 24, 0.45);
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
  const searchCenter = useMapStore((s) => s.searchCenter);
  const currentAddress = useMapStore((s) => s.currentAddress);
  const [isOpen, setIsOpen] = useState(false);

  if (mode !== 'warmth') return null;

  return (
    <>
      <FloatingBtn
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="장소에 대한 온기 후기 남기기"
      >
        <PenLine size={18} strokeWidth={2} />
        <span>온기 남기기</span>
      </FloatingBtn>

      <WriteWarmthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultPlace={{
          id: `custom-${Date.now()}`,
          name: currentAddress || '현재 지도 위치',
          lat: searchCenter.lat,
          lng: searchCenter.lng,
        }}
      />
    </>
  );
}
