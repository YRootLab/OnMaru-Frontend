'use client';

import React, { useMemo } from 'react';
import styled from '@emotion/styled';
import SectionHeader from '@/hanok/components/SectionHeader';
import VillageCard from '@/hanok/components/VillageCard';
import type { Village } from '@/hanok/types';

const Section = styled.section``;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
`;

interface HanokMonthlyProps {
  villages: Village[];
  onSelectVillage?: (v: Village) => void;
}

export default function HanokMonthly({ villages, onSelectVillage }: HanokMonthlyProps) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  const monthlyItems = useMemo(() => {
    if (villages.length === 0) return [];
    const len = villages.length;
    const offset = ((currentMonth - 1) * 4) % len;
    return [
      villages[offset % len],
      villages[(offset + 1) % len],
      villages[(offset + 2) % len],
      villages[(offset + 3) % len],
    ].filter(Boolean);
  }, [villages, currentMonth]);

  return (
    <Section id="monthly" aria-labelledby="monthly-heading">
      <SectionHeader
        id="monthly-heading"
        title={`${currentMonth}월의 한옥`}
        subtitle="계절과 계절 사이에 거니는 이번 달의 추천 한옥 이야기"
      />

      <Grid>
        {monthlyItems.map((v) => (
          <VillageCard key={`${currentMonth}-${v.id}`} village={v} onClick={onSelectVillage} />
        ))}
      </Grid>
    </Section>
  );
}
