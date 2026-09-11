'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styled from '@emotion/styled';
import { meok, surface } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import FilterBar, { type VillageTypeFilter } from '@/features/hanok-archive/components/FilterBar';
import VillageCard from '@/features/hanok-archive/components/VillageCard';
import Pagination from '@/features/hanok-archive/components/Pagination';
import type { Village } from '@/features/hanok-archive/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getHanokGridPage } from './hanokGridModel';
import { EMPTY_STATE, toSearchParams, type HanokFilterState } from './hanokFilterQuery';

const Section = styled.section``;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 20px;

  @media (min-width: 540px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  @media (min-width: 800px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  @media (min-width: 1080px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
`;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const EmptyState = styled.div`
  min-height: 240px;
  background: rgba(78, 89, 104, 0.04);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: ${meok[500]};
  font-size: 14px;
  text-align: center;
  word-break: keep-all;

  p {
    margin: 0;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.05);
    color: ${meok[400]};
  }
`;

/*
  빈 화면에서 나가는 문.

  '필터를 지우고 다시 찾아보세요'라고만 적혀 있었다. 어느 필터가 걸려 있는지 알려면
  위로 올라가 네 줄을 훑어야 하는데, 지우는 건 여기서 한 번이면 된다.
*/
const ResetAll = styled.button`
  padding: 8px 16px;
  border: 1px solid ${meok[200]};
  border-radius: 9999px;
  background: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: ${meok[700]};
  cursor: pointer;

  &:hover {
    background: ${meok[100]};
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.14);
    background: ${surface.dark.card};
    color: ${meok[400]};
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: ${meok[100]};
  }
`;

interface HanokGridProps {
  villages: Village[];
  onSelectVillage: (v: Village) => void;
  initialFilters: HanokFilterState;
}

export default function HanokGrid({ villages, onSelectVillage, initialFilters }: HanokGridProps) {
  /*
    필터 넷과 쪽수를 한 덩어리로 든다.

    따로 들면 '거르면 1쪽으로 돌아간다'는 규칙을 네 군데에 따로 적어야 하고, 한 군데를
    빠뜨리면 5쪽을 보던 중에 검색어를 넣었을 때 빈 화면이 뜬다.
  */
  const [state, setState] = useState<HanokFilterState>(initialFilters);

  // 고른 것을 주소창에 되싣는다. replaceState라 방문 기록이 필터 조작마다 쌓이지 않는다.
  useEffect(() => {
    const search = toSearchParams(state);
    window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
  }, [state]);

  const { items: paginatedItems, totalPages, filteredCount } = useMemo(
    () => getHanokGridPage(villages, state, state.page),
    [state, villages],
  );

  /** 거르는 조건이 바뀌면 늘 첫 쪽으로 돌아간다. */
  const narrow = (patch: Partial<HanokFilterState>) =>
    setState((prev) => ({ ...prev, ...patch, page: 1 }));

  const handleBadgeToggle = (badge: string) =>
    narrow({
      activeBadges: state.activeBadges.includes(badge)
        ? state.activeBadges.filter((b) => b !== badge)
        : [...state.activeBadges, badge],
    });

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, page }));
    document.getElementById('grid-heading')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Section id="grid" aria-labelledby="grid-heading">
      <SectionHeader
        id="grid-heading"
        title="찾는 곳이 있나요?"
        subtitle={`${filteredCount}곳`}
      />

      <FilterBar
        villages={villages}
        query={state.query}
        region={state.region}
        activeType={state.activeType}
        activeBadges={state.activeBadges}
        onQueryChange={(query) => narrow({ query })}
        onRegionChange={(region) => narrow({ region })}
        onTypeChange={(activeType: VillageTypeFilter) => narrow({ activeType })}
        onBadgeToggle={handleBadgeToggle}
        onResetBadges={() => narrow({ activeBadges: [] })}
      />

      {paginatedItems.length > 0 ? (
        <>
          <AnimatePresence mode="wait">
            <Grid
              key={`${state.activeType}-${state.region}-${state.query}-${state.activeBadges.join(',')}-${state.page}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
            >
              {paginatedItems.map((v) => (
                <motion.div key={v.id} variants={itemVariants}>
                  <VillageCard village={v} onClick={onSelectVillage} />
                </motion.div>
              ))}
            </Grid>
          </AnimatePresence>
          <Pagination
            currentPage={state.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <EmptyState role="status" aria-live="polite">
          <p>
            {state.query
              ? `'${state.query}'에 걸리는 한옥이 없습니다.`
              : '조건에 맞는 한옥이 없습니다.'}
          </p>
          <ResetAll type="button" onClick={() => setState(EMPTY_STATE)}>
            조건 모두 지우기
          </ResetAll>
        </EmptyState>
      )}
    </Section>
  );
}
