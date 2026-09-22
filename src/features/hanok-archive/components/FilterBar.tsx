'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Tag, RotateCcw, Search, X } from 'lucide-react';
import { meok, palette, surface , fontSize } from '@/design-system/tokens';
import { STAY_TYPE, type Village } from '@/features/hanok-archive/types';
import { filterLabel } from '@/features/hanok-archive/filterLabels';







export type VillageTypeFilter = string;


const MIN_TYPES_TO_SHOW = 2;








const MIN_BADGE_COUNT = 3;

const Wrapper = styled.div`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;











const FindRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 560px) {
    flex-wrap: wrap;
  }
`;

const SearchBox = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: #ffffff;
  color: ${meok[500]};

  &:focus-within {
    border-color: ${palette.juhong[500]};
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.14);
    background: ${surface.dark.card};
    color: ${meok[400]};
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 8px;
  border: 0;
  outline: none;
  background: none;
  font-family: inherit;
  font-size: ${fontSize.sm};
  color: ${meok[900]};

  &::placeholder {
    color: ${meok[500]};
  }

  [data-theme='dark'] & {
    color: ${meok[100]};

    &::placeholder {
      color: ${meok[500]};
    }
  }
`;

const ClearButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  background: rgba(78, 89, 104, 0.1);
  color: ${meok[700]};
  cursor: pointer;

  &:hover {
    background: rgba(78, 89, 104, 0.18);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.1);
    color: ${meok[400]};
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
`;

const RegionSelect = styled.select`
  height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  background: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.sm};
  color: ${meok[900]};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${palette.juhong[500]};
    outline-offset: 1px;
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.14);
    background: ${surface.dark.card};
    color: ${meok[100]};
  }
`;


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
  background: rgba(0, 0, 0, 0.04);
  padding: 5px;
  border-radius: 9999px;
  gap: 4px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
  }
`;

const Segment = styled.button<{ $active: boolean }>`
  position: relative;
  background: transparent;
  border: none;
  padding: 9px 22px;
  font-size: ${fontSize.sm};
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  cursor: pointer;
  outline: none;
  border-radius: 9999px;
  transition: color 0.18s ease;
  white-space: nowrap;
  user-select: none;

  &:hover {
    color: ${({ $active }) => ($active ? '#ffffff' : palette.juhong[700])};
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};
  }
`;

const SegmentPill = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.juhong[700]} 100%);
  border-radius: 9999px;
  z-index: 0;
`;

const SegmentLabel = styled.span`
  position: relative;
  z-index: 1;
`;


const BadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: #f5f5f4;
  border-radius: 18px;

  [data-theme='dark'] & {
    background: #24211D;
  }
`;

const BadgeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  letter-spacing: 0.04em;
  color: ${meok[700]};
  margin-right: 4px;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const BadgeList = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
`;


const BadgeCount = styled.span`
  margin-left: 5px;
  font-variant-numeric: tabular-nums;
  opacity: 0.6;
`;

function getBadgeVariant(badge: string): 'cheongrok' | 'hwanggeum' | 'jaha' | 'juhong' {
  if (badge.includes('스테이') || badge.includes('체험') || badge.includes('정원') || badge.includes('쉼')) {
    return 'cheongrok';
  }
  if (badge.includes('국가') || badge.includes('유네스코') || badge.includes('보물') || badge.includes('명승')) {
    return 'hwanggeum';
  }
  if (badge.includes('선비') || badge.includes('서원') || badge.includes('종택') || badge.includes('고택')) {
    return 'jaha';
  }
  return 'juhong';
}

const BadgeChip = styled.button<{ $active: boolean; $variant?: 'cheongrok' | 'hwanggeum' | 'jaha' | 'juhong' }>`
  background: ${({ $active, $variant }) => {
    if (!$active) return '#ffffff';
    if ($variant === 'cheongrok') return `linear-gradient(135deg, ${palette.cheongrok[500]} 0%, ${palette.cheongrok[700]} 100%)`;
    if ($variant === 'hwanggeum') return `linear-gradient(135deg, ${palette.hwanggeum[500]} 0%, ${palette.hwanggeum[700]} 100%)`;
    if ($variant === 'jaha') return `linear-gradient(135deg, ${palette.jaha[500]} 0%, ${palette.jaha[700]} 100%)`;
    return `linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.juhong[700]} 100%)`;
  }};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  padding: 6px 14px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ $active }) => ($active ? undefined : meok[100])};
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background: ${({ $active, $variant }) => {
      if (!$active) return 'rgba(255, 255, 255, 0.07)';
      if ($variant === 'cheongrok') return palette.cheongrok[700];
      if ($variant === 'hwanggeum') return palette.hwanggeum[700];
      if ($variant === 'jaha') return palette.jaha[700];
      return palette.juhong[700];
    }};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[200])};
  }
`;

const ResetBtn = styled.button`
  background: transparent;
  color: ${meok[500]};
  font-size: ${fontSize.xs};
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  transition: all 0.18s ease;

  &:hover {
    color: ${palette.juhong[500]};
    background: rgba(255, 85, 0, 0.08);
  }

  [data-theme='dark'] & {
    color: ${meok[400]};
    &:hover {
      color: ${palette.juhong[400]};
      background: rgba(255, 85, 0, 0.15);
    }
  }
`;

interface FilterBarProps {
  villages: Village[];
  query: string;
  region: string;
  activeType: VillageTypeFilter;
  activeBadges: string[];
  onQueryChange: (q: string) => void;
  onRegionChange: (r: string) => void;
  onTypeChange: (t: VillageTypeFilter) => void;
  onBadgeToggle: (b: string) => void;
  onResetBadges?: () => void;
}

export default function FilterBar({
  villages,
  query,
  region,
  activeType,
  activeBadges,
  onQueryChange,
  onRegionChange,
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









  const availableTypes = useMemo(() => {
    const present = new Set<string>();
    for (const v of villages) {


      if (!v.type || v.type === STAY_TYPE) continue;
      present.add(v.type);
    }
    return ['전체', ...[...present].sort((a, b) => a.localeCompare(b, 'ko'))];
  }, [villages]);














  const regions = useMemo(() => {
    const present = new Set<string>();
    for (const v of villages) {
      if (v.type === STAY_TYPE || !v.region) continue;
      present.add(v.region);
    }
    return [...present].sort((a, b) => a.localeCompare(b, 'ko'));
  }, [villages]);

  const badgeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of villages) {
      if (v.type === STAY_TYPE) continue;
      for (const b of v.badges) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return counts;
  }, [villages]);

  const allBadges = useMemo(
    () => MAJOR_BADGES.filter((b) => (badgeCounts.get(b) ?? 0) >= MIN_BADGE_COUNT),
    [badgeCounts, MAJOR_BADGES],
  );

  return (
    <Wrapper>
      <FindRow>
        <SearchBox>
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <SearchInput
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="이름이나 지역으로 찾아보세요 (예: 북촌, 안동)"
            aria-label="한옥 이름이나 주소로 찾기"
          />
          {query && (
            <ClearButton type="button" onClick={() => onQueryChange('')} aria-label="검색어 지우기">
              <X size={13} strokeWidth={2.5} />
            </ClearButton>
          )}
        </SearchBox>

        <RegionSelect
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
          aria-label="지역으로 거르기"
        >
          <option value="전체">전국</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </RegionSelect>
      </FindRow>

      {}
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

      {}
      {allBadges.length > 0 && (
        <BadgeContainer>
          <BadgeHeader>
            <Tag size={13} strokeWidth={2} color={palette.hwanggeum[700]} />
            <span>특징 태그</span>
          </BadgeHeader>
          <BadgeList>
            {allBadges.map((b) => {
              const isActive = activeBadges.includes(b);
              return (
                <BadgeChip
                  key={b}
                  $active={isActive}
                  $variant={getBadgeVariant(b)}
                  onClick={() => onBadgeToggle(b)}
                  aria-pressed={isActive}
                  aria-label={`${filterLabel(b)} ${badgeCounts.get(b)}곳`}
                >
                  #{filterLabel(b)}
                  <BadgeCount>{badgeCounts.get(b)}</BadgeCount>
                </BadgeChip>
              );
            })}
          </BadgeList>
          {activeBadges.length > 0 && (
            <ResetBtn onClick={onResetBadges || (() => activeBadges.forEach((b) => onBadgeToggle(b)))}>
              <RotateCcw size={12} strokeWidth={2} /> 선택한 태그 지우기
            </ResetBtn>
          )}
        </BadgeContainer>
      )}
    </Wrapper>
  );
}
