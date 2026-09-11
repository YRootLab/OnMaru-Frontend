'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { PenLine } from 'lucide-react';
import { lightPalette } from '@/design-system/tokens';
import { useMapStore } from '@/features/map/hooks/useMapStore';
import WriteWarmthModal from './WriteWarmthModal';

const FloatingBtn = styled.button`
  position: absolute;
  right: 76px;
  bottom: 16px;
  z-index: 15;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 44px;
  padding: 0 18px;

  border-radius: 9999px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;

  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${lightPalette.juhong[700]};
    transform: translateY(-2px);

  }

  &:active {
    transform: scale(0.96);
  }

  @media (max-width: 1023px) {
    right: 16px;
    bottom: 236px; /* 모바일: 줌 컨트롤 상단 */
    height: 40px;
    padding: 0 14px;
    font-size: 13px;
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
