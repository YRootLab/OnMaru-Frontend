'use client';








import { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { createPortal } from 'react-dom';

import { meok, surface , fontSize } from '@/design-system/tokens';
import { livelyModalEnter } from '@/shared/motion/modalMotion';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
    max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  background: rgba(24, 27, 32, 0.58);
  backdrop-filter: blur(8px) saturate(0.8);
  -webkit-backdrop-filter: blur(8px) saturate(0.8);
`;

const Shell = styled.div`
  position: relative;
  width: min(1180px, calc(100vw - 24px));
  height: min(760px, calc(100dvh - 24px));
  overflow: hidden;
  border-radius: clamp(18px, 2.4vw, 28px);
  background: ${surface.light.base};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: ${livelyModalEnter} 0.4s cubic-bezier(0.19, 1.15, 0.22, 1) both;

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
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #ffffff;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.14);
    background: rgba(33, 39, 52, 0.86);
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


  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    shellRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <Overlay
      data-lenis-prevent
      role="presentation"
      onPointerDown={(event) => {


        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Shell ref={shellRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <CloseButton type="button" onClick={onClose}>
          닫기 <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} aria-hidden="true" />
        </CloseButton>

        {children}
      </Shell>
    </Overlay>,
    document.body,
  );
}
