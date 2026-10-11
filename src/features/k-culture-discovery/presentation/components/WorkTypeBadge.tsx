'use client';

import type { ComponentProps } from 'react';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ClapperboardIcon,
  Film01Icon,
  Tv01Icon,
  Music02Icon,
} from '@hugeicons/core-free-icons';
import { fontSize } from '@/design-system/tokens';
import type { WorkType } from '../../domain/types';

const WORK_TYPE_META: Record<WorkType, { label: string; icon: ComponentProps<typeof HugeiconsIcon>['icon'] }> = {
  DRAMA: { label: '드라마', icon: ClapperboardIcon },
  MOVIE: { label: '영화', icon: Film01Icon },
  VARIETY: { label: '예능', icon: Tv01Icon },
  MUSIC_VIDEO: { label: 'MV', icon: Music02Icon },
};

const Badge = styled.span<{ $variant: 'dark' | 'light' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  ${({ $variant }) =>
    $variant === 'dark'
      ? `background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); color: #fff;`
      : `background: rgba(255,255,255,0.14); color: rgba(255,255,255,0.9);`}
`;

export interface WorkTypeBadgeProps {
  type: WorkType;
  variant?: 'dark' | 'light';
  size?: number;
}

export default function WorkTypeBadge({ type, variant = 'dark', size = 12 }: WorkTypeBadgeProps) {
  const { label, icon } = WORK_TYPE_META[type] ?? WORK_TYPE_META.DRAMA;
  return (
    <Badge $variant={variant}>
      <HugeiconsIcon icon={icon} size={size} strokeWidth={2} aria-hidden="true" />
      {label}
    </Badge>
  );
}
