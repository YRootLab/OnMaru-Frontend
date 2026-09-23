'use client';





import React from 'react';
import { palette, meok } from '@/design-system/tokens';

export type BadgeStatusType =
  | 'PUBLISHED' | 'HIDDEN' | 'DELETED' | 'PENDING' | 'RESOLVED' | 'REJECTED' | 'ACTIVE' | 'SUSPENDED'
  | '게시중' | '숨김' | '삭제됨' | '대기' | '정지' | '처리완료' | '반려';

interface StatusBadgeProps {
  status: BadgeStatusType | string;
  className?: string;
}

interface BadgeConfig {
  label: string;
  bg: string;
  color: string;
}

const BADGE_CONFIG_MAP: Record<string, BadgeConfig> = {

  PUBLISHED: { label: '게시중', bg: palette.cheongrok[50], color: palette.cheongrok[700] },
  ACTIVE: { label: '정상', bg: palette.cheongrok[50], color: palette.cheongrok[700] },
  게시중: { label: '게시중', bg: palette.cheongrok[50], color: palette.cheongrok[700] },
  정상: { label: '정상', bg: palette.cheongrok[50], color: palette.cheongrok[700] },


  HIDDEN: { label: '숨김', bg: meok[200], color: meok[700] },
  숨김: { label: '숨김', bg: meok[200], color: meok[700] },


  PENDING: { label: '대기', bg: palette.hwanggeum[50], color: palette.hwanggeum[700] },
  대기: { label: '대기', bg: palette.hwanggeum[50], color: palette.hwanggeum[700] },


  RESOLVED: { label: '처리완료', bg: palette.cheongrok[50], color: palette.cheongrok[700] },
  처리완료: { label: '처리완료', bg: palette.cheongrok[50], color: palette.cheongrok[700] },


  DELETED: { label: '삭제됨', bg: palette.danpung[50], color: palette.danpung[700] },
  삭제됨: { label: '삭제됨', bg: palette.danpung[50], color: palette.danpung[700] },
  SUSPENDED: { label: '정지', bg: palette.danpung[50], color: palette.danpung[700] },
  정지: { label: '정지', bg: palette.danpung[50], color: palette.danpung[700] },
  REJECTED: { label: '반려', bg: meok[200], color: meok[700] },
  반려: { label: '반려', bg: meok[200], color: meok[700] },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = BADGE_CONFIG_MAP[status] || {
    label: status,
    bg: meok[200],
    color: meok[700],
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '22px',
        padding: '0 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: config.bg,
        color: config.color,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {config.label}
    </span>
  );
};
