'use client';

import React from 'react';
import styled from '@emotion/styled';
import { palette, fontFamily, fontSize } from '@/design-system/tokens';
import { HanokIcon } from './HanokIcon';

export interface EmphasisBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const StyledBadge = styled.span<{ $size: 'sm' | 'md' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: ${palette.juhong[500]};
  color: #ffffff;
  font-family: ${fontFamily.dohyun};
  font-weight: normal;
  letter-spacing: -0.01em;
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
  box-sizing: border-box;
  user-select: none;

  /* sm: 목록 카드용, md: 일반 뱃지용 */
  padding: ${({ $size }) => ($size === 'sm' ? '2.5px 7.5px' : '4px 10px')};
  font-size: ${({ $size }) => ($size === 'sm' ? fontSize.micro : fontSize.xs)};

  [data-theme='dark'] & {
    background: ${palette.juhong[500]};
    color: #ffffff;
  }
`;

/**
 * 도현체 강조 뱃지 (<EmphasisBadge />)
 *
 * 규칙:
 * - 폰트: 도현체 (fontFamily.dohyun), font-weight: normal (가짜 볼드 방지).
 * - 배경: juhong[500] (badge.emphasis.bg, 프로젝트 메인 컬러).
 * - 글자: 흰색 (#FFFFFF, badge.emphasis.fg).
 * - 아이콘: /icon/hanok.svg 기반 HanokIcon 지원 (showIcon prop).
 * - 용도: 한옥 표식, 국가민속문화유산, 공식 한옥체험업 등 도현체 강조 라벨.
 */
export function EmphasisBadge({
  children,
  size = 'md',
  showIcon = false,
  className,
  style,
  ...rest
}: EmphasisBadgeProps) {
  return (
    <StyledBadge
      $size={size}
      className={className}
      style={style}
      {...rest}
    >
      {showIcon && (
        <HanokIcon
          size={size === 'sm' ? 14 : 16}
          style={{ marginRight: 4, display: 'inline-block' }}
        />
      )}
      {children}
    </StyledBadge>
  );
}
