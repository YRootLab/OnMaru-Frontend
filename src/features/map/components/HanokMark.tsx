'use client';

import React from 'react';
import styled from '@emotion/styled';
import { palette } from '@/design-system/tokens';

export interface HanokMarkProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export const HanokMarkCircle = styled.span<{ $size: number }>`
  display: inline-block;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${palette.juhong[500]};
  border: 1.5px solid #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  box-sizing: border-box;
  flex-shrink: 0;
  pointer-events: none;

  [data-theme='dark'] & {
    background: ${palette.juhong[500]};
    border-color: #ffffff;
  }
`;

/**
 * 한옥 표식 (2겹) 컴포넌트
 *
 * 규칙:
 * - juhong[500] 배경에 1.5px 흰색 테두리.
 * - 핀 본체 색은 변경하지 않고, 모서리에 얹는 마크 역할.
 * - 다크 모드에서도 juhong[500] 유지.
 */
export function HanokMark({
  size = 9,
  className,
  style,
  title = '한옥',
}: HanokMarkProps) {
  return (
    <HanokMarkCircle
      $size={size}
      className={className}
      style={style}
      title={title}
      role="img"
      aria-label={title}
    />
  );
}

/**
 * Kakao Maps CustomOverlay innerHTML용 문자열 생성 함수
 */
export function renderHanokMarkHtml(
  className = 'om-hanok-mark',
  title = '한옥'
): string {
  return `<span class="${className}" title="${title}" aria-label="${title}" role="img"></span>`;
}
