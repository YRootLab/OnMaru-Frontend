'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { Tag, RotateCcw, Search, X } from 'lucide-react';
import { meok, lightPalette, surface } from '@/design-system/tokens';
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

/*
  이보다 적게 걸리는 태그는 세우지 않는다.

  뱃지는 제목과 주소만 보고 붙는다(TourAPI 목록 응답에 설명이 없다). 그래서 한두 곳에만
  걸리는 태그가 생기는데, 1곳짜리 칩은 거르는 장치가 아니라 그냥 라벨이다. 누르면
  화면이 거의 비므로 고장으로 읽힌다.
*/
const MIN_BADGE_COUNT = 3;

const Wrapper = styled.div`
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

/*
  1단: 찾는 줄.

  707곳에서 한 곳을 찾는 길이 23쪽을 눈으로 넘기는 것뿐이었다. 지역은 지도와 스테이만
  갖고 있어서, 바로 위 분포 섹션이 '경북 165곳'이라 말해 놓고 목록에서는 경북만
  볼 수 없었다.

  지역은 17개라 칩으로 늘어놓으면 한 줄을 다 먹는다. select는 네이티브라 모바일에서
  기기 고유의 고르는 화면이 뜨고 키보드 조작도 그냥 된다 — 직접 만들 이유가 없다.
*/
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
  border: 1px solid ${lightPalette.kobalt[100]};
  border-radius: 12px;
  background: #ffffff;
  color: ${meok[500]};

  &:focus-within {
    border-color: ${lightPalette.kobalt[500]};
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
  font-size: 14px;
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
  border: 1px solid ${lightPalette.kobalt[100]};
  border-radius: 12px;
  background: #ffffff;
  font-family: inherit;
  font-size: 14px;
  color: ${meok[900]};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${lightPalette.kobalt[500]};
    outline-offset: 1px;
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.14);
    background: ${surface.dark.card};
    color: ${meok[100]};
  }
`;

/* 2단: 건축/마을 유형 세그먼트 컨트롤 탭 */
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

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
  }
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

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};
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

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.05);
  }
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

/* 칩 안의 개수. 색을 따로 주지 않고 흐리기만 해서 태그 이름을 가리지 않는다. */
const BadgeCount = styled.span`
  margin-left: 5px;
  font-variant-numeric: tabular-nums;
  opacity: 0.6;
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

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active
        ? `linear-gradient(135deg, ${lightPalette.kobalt[500]} 0%, ${lightPalette.kobalt[700]} 100%)`
        : 'rgba(255, 255, 255, 0.06)'};
  }

  [data-theme='dark'] &:hover {
    background: ${({ $active }) =>
      $active
        ? `linear-gradient(135deg, ${lightPalette.kobalt[400]} 0%, ${lightPalette.kobalt[700]} 100%)`
        : 'rgba(255, 255, 255, 0.1)'};
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

  [data-theme='dark'] & {
    color: ${meok[400]};
  }

  [data-theme='dark'] &:hover {
    color: ${meok[100]};
    background: rgba(255, 255, 255, 0.08);
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

  /*
    태그마다 몇 곳인지 세어 둔다.

    세계유산 1곳, 돌담길 2곳처럼 희박한 태그가 섞여 있어서, 개수를 안 적으면 눌러 본
    뒤에야 한 곳뿐인 걸 알게 된다. 세는 모집단은 그리드와 같아야 한다 —
    getHanokGridPage가 스테이를 빼므로 여기서도 뺀다. 안 그러면 적힌 수보다 적게 나온다.
  */
  /*
    지역 목록도 수집분이 정한다.

    17개 시도를 못 박아 두면 한 곳도 없는 지역이 목록에 남고, 고르면 빈 화면이 나온다.
    스테이 섹션의 지역 탭이 그렇게 하드코딩이라 경북이 아예 빠져 있었다.
  */
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
            placeholder="이름이나 지역으로 찾기 — 북촌, 안동, 종택"
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

      {/* 2단: 건축/마을 유형 메인 세그먼트 탭 */}
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

      {/* 3단: 특징 태그 뱃지 필터 바 */}
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
              <RotateCcw size={12} strokeWidth={2} /> 태그 초기화
            </ResetBtn>
          )}
        </BadgeContainer>
      )}
    </Wrapper>
  );
}
