'use client';

import React from 'react';
import styled from '@emotion/styled';
import { meok, palette, surface } from '@/design-system/tokens';
import { BookOpen, Home, Sun, MapPin } from 'lucide-react';

const IndexContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(78, 89, 104, 0.12);
  border-radius: 9999px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  max-width: fit-content;
  margin: -24px auto 0;
  position: relative;
  z-index: 10;

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.85);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 640px) {
    gap: 6px;
    padding: 8px 12px;
    border-radius: 18px;
  }
`;

const IndexChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid transparent;
  background: transparent;
  color: ${meok[700]};
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.01em;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: rgba(78, 89, 104, 0.07);
    color: ${meok[900]};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }

  [data-theme='dark'] & {
    color: ${meok[200]};

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
  }

  @media (max-width: 640px) {
    padding: 6px 10px;
    font-size: 12px;
  }
`;

interface QuickIndexBarProps {
  className?: string;
}

export default function QuickIndexBar({ className }: QuickIndexBarProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <IndexContainer className={className} aria-label="한옥 마루 주요 챕터 바로가기">
      <IndexChip type="button" onClick={() => scrollTo('grid')}>
        <BookOpen size={15} strokeWidth={2} color={palette.kobalt[500]} />
        <span>전국 한옥 도감</span>
      </IndexChip>

      <IndexChip type="button" onClick={() => scrollTo('hanok-stays')}>
        <Home size={15} strokeWidth={2} color={palette.cheongrok[500]} />
        <span>지역별 한옥 스테이</span>
      </IndexChip>

      <IndexChip type="button" onClick={() => scrollTo('structure')}>
        <Sun size={15} strokeWidth={2} color={palette.hwanggeum[500]} />
        <span>3D 구조 & 처마 일조 랩</span>
      </IndexChip>

      <IndexChip type="button" onClick={() => scrollTo('map')}>
        <MapPin size={15} strokeWidth={2} color={palette.juhong[500]} />
        <span>전국 공간 지도</span>
      </IndexChip>
    </IndexContainer>
  );
}
