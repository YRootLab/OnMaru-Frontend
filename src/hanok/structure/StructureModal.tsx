'use client';

/*
  구조 챕터 모달 껍데기.

  절기 그림자와 7단계 조립이 같은 껍데기를 나눠 쓴다. 안에 들어가는 3D 캔버스와
  패널만 다르고, 덮개·닫기·Esc·바깥 클릭·배경 스크롤 잠금은 여기가 전담한다.
*/

import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

import { meok, surface } from '@/design-system/tokens';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(12px, 2vw, 28px);
  background: rgba(25, 31, 40, 0.52);
  backdrop-filter: blur(3px);
`;

const Shell = styled.div`
  position: relative;
  width: min(1180px, 100%);
  height: min(760px, 100%);
  overflow: hidden;
  border-radius: clamp(18px, 2.4vw, 28px);
  background: ${surface.light.base};
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.32);

  [data-theme='dark'] & {
    background: ${surface.dark.surface};
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;

  border: 1px solid rgba(25, 31, 40, 0.14);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.86);
  color: ${meok[700]};
  transition: background 0.2s ease-out, color 0.2s ease-out;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #ffffff;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(45, 41, 36, 0.86);
    color: ${meok[400]};

    &:hover {
      background: ${surface.dark.elevated};
      color: ${meok[100]};
    }
  }
`;

interface StructureModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function StructureModal({ title, onClose, children }: StructureModalProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  // Esc로 닫고, 열려 있는 동안 뒤쪽 도감이 따라 스크롤되지 않게 잠근다.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    shellRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <Overlay
      role="presentation"
      onMouseDown={(event) => {
        // 덮개를 직접 눌렀을 때만 닫는다. 안쪽에서 시작한 드래그(절기 슬라이더)가
        // 덮개 위에서 끝나도 닫히면 안 된다.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Shell ref={shellRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <CloseButton type="button" onClick={onClose}>
          닫기 <span aria-hidden="true">✕</span>
        </CloseButton>

        {children}
      </Shell>
    </Overlay>
  );
}
