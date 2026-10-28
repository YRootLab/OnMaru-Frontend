'use client';

import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserMultiple02Icon } from '@hugeicons/core-free-icons';
import { meok, ringShadow } from '@/design-system/tokens';

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  pointer-events: none;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.92);
  color: ${meok[900]};
  border: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: ${ringShadow.light.card};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  [data-theme='dark'] & {
    background: rgba(20, 24, 32, 0.92);
    color: #f0f0f0;
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: ${ringShadow.dark.card};
  }
`;

const BadgeLabel = styled.span`
  @media (max-width: 1023px) {
    display: none;
  }
`;

const Dot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
`;

export function CollabSessionBadge() {
  return (
    <Badge aria-label="공유 지도 세션 중">
      <HugeiconsIcon icon={UserMultiple02Icon} size={14} strokeWidth={2} />
      <Dot />
      <BadgeLabel>공유된 지도를 보고 있어요</BadgeLabel>
    </Badge>
  );
}
