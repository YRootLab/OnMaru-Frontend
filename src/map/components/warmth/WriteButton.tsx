'use client';

import React from 'react';
import styled from '@emotion/styled';
import { PenSquare } from 'lucide-react';
import { lightPalette } from '@/design-system/tokens';
import { useMapStore } from '../../hooks/useMapStore';

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
  border: none;
  border-radius: 9999px;
  background: ${lightPalette.juhong[500]};
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(232, 90, 24, 0.28);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${lightPalette.juhong[700]};
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(232, 90, 24, 0.35);
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

  if (mode !== 'warmth') return null;

  return (
    <FloatingBtn
      type="button"
      onClick={() => alert('온기 작성 기능이 곧 오픈됩니다!')}
      aria-label="장소에 대한 온기 후기 남기기"
    >
      <PenSquare size={16} />
      <span>온기 남기기</span>
    </FloatingBtn>
  );
}
