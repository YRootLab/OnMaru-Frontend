'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Tag, RotateCcw } from 'lucide-react';
import { meok, lightPalette } from '@/design-system/tokens';
import type { Village } from '@/hanok/types';

export const ALL_TYPES = [
  '전체',
  '한옥 공공건축물',
  '궁궐 한옥',
  '사대부 고택',
  '서원·향교',
  '도심형',
  '집성촌형',
  '체험형',
] as const;

export type VillageTypeFilter = (typeof ALL_TYPES)[number] | string;

const Wrapper = styled.div`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/* 1단: 건축/마을 유형 세그먼트 컨트롤 탭 */
const SegmentScrollWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SegmentScrollContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  padding: 2px 0;
`;

const SegmentControl = styled.div`
  display: inline-flex;
  background: ${lightPalette.kobalt[50]};
  padding: 5px;
  border-radius: 9999px;
  gap: 4px;
`;

const Segment = styled.button<{ $active: boolean }>`
  position: relative;
  background: transparent;
  padding: 9px 22px;
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  cursor: pointer;
  outline: none;
  border-radius: 9999px;
  transition: color 0.18s ease;
  white-space: nowrap;
  user-select: none;

  &:hover {
    color: ${({ $active }) => ($active ? '#ffffff' : lightPalette.kobalt[700])};
  }
`;

const SegmentPill = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%);
  border-radius: 9999px;
  z-index: 0;
`;

const SegmentLabel = styled.span`
  position: relative;
  z-index: 1;
`;

/* 2단: 특징 태그 뱃지 바 */
const BadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: rgba(248, 250, 255, 0.7);
  border-radius: 18px;
`;

const BadgeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: ${lightPalette.kobalt[700]};
  margin-right: 4px;
  white-space: nowrap;
`;

const BadgeList = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
`;

const BadgeChip = styled.button<{ $active: boolean }>`
  background: ${({ $active }) =>
    $active
      ? `linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%)`
      : '#ffffff'};
  color: ${({ $active }) => ($active ? '#ffffff' : lightPalette.kobalt[700])};
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  padding: 5px 14px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${lightPalette.kobalt[400]};
    background: ${({ $active }) =>
      $active
        ? `linear-gradient(135deg, ${lightPalette.kobalt[400]} 0%, ${lightPalette.kobalt[700]} 100%)`
        : lightPalette.kobalt[50]};
  }
`;

const ResetBtn = styled.button`
  background: transparent;
  color: ${meok[500]};
  font-size: 12px;
  font-weight: 400;
  padding: 4px 10px;
  border-radius: 9999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  transition: all 0.18s ease;

  &:hover {
    color: ${meok[900]};
    border-color: ${meok[400]};
    background: rgba(0, 0, 0, 0.04);
  }
`;

interface FilterBarProps {
  villages: Village[];
  activeType: VillageTypeFilter;
  activeBadges: string[];
  onTypeChange: (t: VillageTypeFilter) => void;
  onBadgeToggle: (b: string) => void;
  onResetBadges?: () => void;
}

export default function FilterBar({
  villages,
  activeType,
  activeBadges,
  onTypeChange,
  onBadgeToggle,
  onResetBadges,
}: FilterBarProps) {
  const MAJOR_BADGES = useMemo(
    () => [
      '세계유산',
      '국가지정',
      '궁궐',
      '고택',
      '서원·향교',
      '공공건축물',
      '민속마을',
      '돌담길',
      '전통체험',
      '조선시대',
    ],
    []
  );

  const allBadges = useMemo(() => {
    const present = new Set<string>();
    for (const v of villages) {
      for (const b of v.badges) present.add(b);
    }
    return MAJOR_BADGES.filter((b) => present.has(b));
  }, [villages, MAJOR_BADGES]);

  return (
    <Wrapper>
      {/* 1단: 건축/마을 유형 메인 세그먼트 탭 */}
      <SegmentScrollWrapper>
        <SegmentScrollContainer>
          <SegmentControl role="group" aria-label="마을 유형 필터">
            {ALL_TYPES.map((t) => {
              const isActive = activeType === t;
              return (
                <Segment
                  key={t}
                  $active={isActive}
                  onClick={() => onTypeChange(t)}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <SegmentPill
                      layoutId="typePill"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <SegmentLabel>{t}</SegmentLabel>
                </Segment>
              );
            })}
          </SegmentControl>
        </SegmentScrollContainer>
      </SegmentScrollWrapper>

      {/* 2단: 특징 태그 뱃지 필터 바 */}
      {allBadges.length > 0 && (
        <BadgeContainer>
          <BadgeHeader>
            <Tag size={13} strokeWidth={2} />
            <span>특징 태그</span>
          </BadgeHeader>
          <BadgeList>
            {allBadges.map((b) => {
              const isActive = activeBadges.includes(b);
              return (
                <BadgeChip
                  key={b}
                  $active={isActive}
                  onClick={() => onBadgeToggle(b)}
                  aria-pressed={isActive}
                >
                  #{b}
                </BadgeChip>
              );
            })}
          </BadgeList>
          {activeBadges.length > 0 && (
            <ResetBtn onClick={onResetBadges || (() => activeBadges.forEach((b) => onBadgeToggle(b)))}>
              <RotateCcw size={12} strokeWidth={2} /> 태그 초기화
            </ResetBtn>
          )}
        </BadgeContainer>
      )}
    </Wrapper>
  );
}
