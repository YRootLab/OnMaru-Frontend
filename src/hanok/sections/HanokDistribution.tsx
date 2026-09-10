'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { meok, lightPalette } from '@/design-system/tokens';
import SectionHeader from '@/hanok/components/SectionHeader';
import { filterLabel } from '@/hanok/filterLabels';
import type { Village } from '@/hanok/types';

/*
  진입부는 "지금 한옥은 어디에 남아 있을까"라고 묻는다. 도감과 지도는 개별 한 채씩을
  보여줄 뿐 그 질문에 답하지 않는다. 이 섹션이 수집분 전체를 한 화면으로 눌러 답한다.

  막대는 순위가 아니라 지역을 가리키므로 전부 같은 색을 쓴다. 값에 따라 색을 바꾸면
  같은 것을 크기와 색으로 두 번 말하게 되고, 색이 곧 등급이라는 오해를 부른다.
*/

const Section = styled.section``;

const StatRow = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(12px, 2vw, 24px);
  margin: 0 0 clamp(28px, 4vh, 40px);
  padding: clamp(20px, 3vw, 28px) clamp(18px, 3vw, 32px);
  background: rgba(78, 89, 104, 0.03);
  border-radius: 20px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 18px;
  }
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const StatLabel = styled.dt`
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: ${meok[500]};
`;

const StatValue = styled.dd`
  margin: 0;
  font-size: clamp(26px, 3.4vw, 38px);
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: ${meok[900]};
  font-variant-numeric: tabular-nums;
`;

const StatUnit = styled.span`
  margin-left: 3px;
  font-size: 0.45em;
  font-weight: 400;
  color: ${meok[500]};
`;

const Finding = styled.p`
  margin: 0 0 clamp(20px, 3vh, 28px);
  font-size: clamp(14px, 1.5vw, 16px);
  font-weight: 400;
  line-height: 1.75;
  color: ${meok[700]};
  word-break: keep-all;

  strong {
    font-weight: 700;
    color: ${lightPalette.kobalt[500]};
  }
`;

const Rows = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 7px 10px;
  border-radius: 10px;
  transition: background-color 0.16s ease;

  &:hover {
    background: rgba(78, 89, 104, 0.04);
  }
`;

const RegionName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${meok[900]};
  white-space: nowrap;
`;

/* 막대는 값을 글자로도 옆에 적어 두므로 스크린리더에는 감춘다 */
const Track = styled.span`
  display: block;
  width: 100%;
  height: 10px;
  min-width: 0;
`;

const Bar = styled.span<{ $ratio: number }>`
  display: block;
  width: ${({ $ratio }) => Math.max($ratio * 100, 1.5)}%;
  height: 100%;
  /* 데이터 끝만 둥글게 — 기준선 쪽은 각지게 두어야 0에서 시작한다는 게 보인다 */
  border-radius: 0 4px 4px 0;
  background: ${lightPalette.kobalt[500]};
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Count = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: ${meok[700]};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

interface HanokDistributionProps {
  villages: Village[];
}

export default function HanokDistribution({ villages }: HanokDistributionProps) {
  const { regions, total, typeCount, topType } = useMemo(() => {
    const byRegion = new Map<string, number>();
    const byType = new Map<string, number>();

    for (const v of villages) {
      if (v.region) byRegion.set(v.region, (byRegion.get(v.region) ?? 0) + 1);
      if (v.type) byType.set(v.type, (byType.get(v.type) ?? 0) + 1);
    }

    const sortedTypes = [...byType.entries()].sort((a, b) => b[1] - a[1]);

    return {
      regions: [...byRegion.entries()].sort((a, b) => b[1] - a[1]),
      total: villages.length,
      typeCount: byType.size,
      topType: sortedTypes[0]?.[0] ?? null,
    };
  }, [villages]);

  if (regions.length === 0) return null;

  const max = regions[0][1];
  // 상위 세 곳이 전체의 몇 할인지가 이 섹션이 말하려는 한 문장이다.
  const topThree = regions.slice(0, 3);
  const topThreeShare = Math.round(
    (topThree.reduce((sum, [, n]) => sum + n, 0) / total) * 100,
  );

  return (
    <Section id="distribution" aria-labelledby="distribution-heading">
      <SectionHeader
        id="distribution-heading"
        title="한옥은 어디에 남아 있나"
      />

      <StatRow>
        <Stat>
          <StatLabel>수집한 한옥</StatLabel>
          <StatValue>
            {total}
            <StatUnit>곳</StatUnit>
          </StatValue>
        </Stat>
        <Stat>
          <StatLabel>기록된 시도</StatLabel>
          <StatValue>
            {regions.length}
            <StatUnit>곳</StatUnit>
          </StatValue>
        </Stat>
        <Stat>
          <StatLabel>가장 많은 유형</StatLabel>
          <StatValue>
            {topType ? filterLabel(topType) : '—'}
            <StatUnit>외 {Math.max(typeCount - 1, 0)}종</StatUnit>
          </StatValue>
        </Stat>
      </StatRow>

      <Finding>
        {topThree.map(([name]) => name).join(' · ')} 세 곳에만{' '}
        <strong>전체의 {topThreeShare}%</strong>가 몰려 있습니다. 한옥이 고르게 남은 게
        아니라, 남은 자리가 정해져 있다는 뜻입니다.
      </Finding>

      <Rows>
        {regions.map(([name, count]) => (
          <Row key={name}>
            <RegionName>{name}</RegionName>
            <Track aria-hidden="true">
              <Bar $ratio={count / max} />
            </Track>
            <Count>{count}곳</Count>
          </Row>
        ))}
      </Rows>
    </Section>
  );
}
