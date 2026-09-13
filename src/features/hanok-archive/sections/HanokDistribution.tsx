'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { meok, palette, fluidHeading, fontSize } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import { filterLabel } from '@/features/hanok-archive/filterLabels';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { Village } from '@/features/hanok-archive/types';

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
  border: 1px solid rgba(78, 89, 104, 0.06);
  border-radius: 20px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
  }

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
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: 0.06em;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const StatValue = styled.dd`
  margin: 0;
  font-size: ${fluidHeading.feature};
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: ${meok[900]};
  font-variant-numeric: tabular-nums;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const StatUnit = styled.span`
  margin-left: 3px;
  font-size: 0.45em;
  font-weight: 400;
  color: ${meok[500]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const Finding = styled.p`
  margin: 0 0 clamp(20px, 3vh, 28px);
  font-size: ${fontSize.base};
  font-weight: 400;
  line-height: 1.75;
  color: ${meok[700]};
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[200]};
  }

  strong {
    font-weight: 700;
    color: ${palette.hwanggeum[700]};

    [data-theme='dark'] & {
      color: ${palette.hwanggeum[400]};
    }
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

/* 막대는 값을 글자로도 옆에 적어 두므로 스크린리더에는 감춘다 */
const Track = styled.span`
  display: block;
  width: 100%;
  height: 8px;
  min-width: 0;
  background: rgba(78, 89, 104, 0.08);
  border-radius: 4px;
  overflow: hidden;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const Bar = styled.span<{ $ratio: number }>`
  display: block;
  width: ${({ $ratio }) => Math.max($ratio * 100, 1.5)}%;
  height: 100%;
  /* 데이터 끝만 둥글게 — 기준선 쪽은 각지게 두어야 0에서 시작한다는 게 보인다 */
  border-radius: 0 4px 4px 0;
  background: ${palette.kobalt[500]};
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.16s ease;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, ${palette.kobalt[500]} 0%, ${palette.kobalt[400]} 100%);
  }
`;

const Row = styled(motion.li)`
  display: grid;
  grid-template-columns: 52px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: rgba(27, 91, 255, 0.06);
    transform: translateX(4px);
  }

  &:hover ${Bar} {
    background: ${palette.kobalt[400]};
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.07);
  }

  [data-theme='dark'] &:hover ${Bar} {
    background: ${palette.kobalt[200]};
  }
`;

const RegionName = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[900]};
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const Count = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 400;
  color: ${meok[700]};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${meok[200]};
  }
`;

const Percent = styled.span`
  margin-left: 4px;
  color: ${palette.hwanggeum[700]};
  opacity: 0;
  transition: opacity 0.16s ease;

  [data-theme='dark'] & {
    color: ${palette.hwanggeum[400]};
  }

  ${Row}:hover & {
    opacity: 1;
  }
`;

interface HanokDistributionProps {
  villages: Village[];
  onSelectRegion?: (region: string) => void;
}

export default function HanokDistribution({ villages, onSelectRegion }: HanokDistributionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
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
        title="전국 한옥 분포 & 지역별 탐색"
        subtitle={onSelectRegion ? "지역을 선택하면 아래 도감에서 바로 확인할 수 있습니다" : undefined}
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
          <StatLabel>기록된 시·도</StatLabel>
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
        <strong>전체의 {topThreeShare}%</strong>가 자리잡고 있습니다.
        {onSelectRegion && ' 관심 있는 지역을 탭하여 해당 지역의 고택과 스테이를 탐색해보세요.'}
      </Finding>

      <Rows>
        {regions.map(([name, count], index) => (
          <Row
            key={name}
            role={onSelectRegion ? 'button' : undefined}
            tabIndex={onSelectRegion ? 0 : undefined}
            title={onSelectRegion ? `${name} 한옥 ${count}곳 도감에서 보기` : undefined}
            onClick={() => onSelectRegion?.(name)}
            onKeyDown={(e) => {
              if (onSelectRegion && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelectRegion(name);
              }
            }}
            initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            whileHover={prefersReducedMotion ? undefined : { x: 2 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.32, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
          >
            <RegionName>{name}</RegionName>
            <Track aria-hidden="true">
              <Bar $ratio={count / max} />
            </Track>
            <Count>
              {count}곳<Percent>· {Math.round((count / total) * 100)}%</Percent>
            </Count>
          </Row>
        ))}
      </Rows>
    </Section>
  );
}
