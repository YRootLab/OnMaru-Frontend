'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Tag, RotateCcw } from 'lucide-react';
import { meok, lightPalette } from '@/design-system/tokens';
import { STAY_TYPE, type Village } from '@/hanok/types';
import { filterLabel } from '@/hanok/filterLabels';

/*
  유형 값은 문자열 그대로다.

  예전에는 유니온으로 후보를 못박아 뒀지만 뒤에 `| string`이 붙어 있어 실제로는
  아무 문자열이나 통과했다 — 타입이 거짓말을 하고 있었다.
*/
export type VillageTypeFilter = string;

/** 유형 바는 후보가 둘 이상 있을 때만 의미가 있다. */
const MIN_TYPES_TO_SHOW = 2;

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

  /*
    유형 목록은 데이터에서 뽑는다.

    예전에는 '궁궐 한옥' '사대부 고택' 같은 후보를 손으로 적어 뒀는데, TourAPI가 주는
    village.type 이 전부 '전통마을'로 바뀐 뒤로도 그 목록이 그대로 남아 있었다.
    결과는 눌러도 0곳만 나오는 죽은 칩 일곱 개였다. 아래 태그 바와 같은 방식으로
    실제 있는 값만 세운다.
  */
  const availableTypes = useMemo(() => {
    const present = new Set<string>();
    for (const v of villages) {
      // 그리드(getHanokGridPage)가 스테이를 걸러내므로 여기서도 빼야 한다.
      // 넣어두면 눌러도 0곳만 나오는 칩이 다시 생긴다.
      if (!v.type || v.type === STAY_TYPE) continue;
      present.add(v.type);
    }
    return ['전체', ...[...present].sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [villages]);

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
      {availableTypes.length >= MIN_TYPES_TO_SHOW + 1 && (
      <SegmentScrollWrapper>
        <SegmentScrollContainer>
          <SegmentControl role="group" aria-label="마을 유형 필터">
            {availableTypes.map((t) => {
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
                  <SegmentLabel>{filterLabel(t)}</SegmentLabel>
                </Segment>
              );
            })}
          </SegmentControl>
        </SegmentScrollContainer>
      </SegmentScrollWrapper>
      )}

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
                  #{filterLabel(b)}
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
