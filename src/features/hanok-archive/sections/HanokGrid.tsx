'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styled from '@emotion/styled';
import { meok, surface , fontSize } from '@/design-system/tokens';
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

  @media (min-width: 400px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  @media (min-width: 800px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
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
  font-size: ${fontSize.sm};
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







const ResetAll = styled.button`
  padding: 8px 16px;
  border: 1px solid ${meok[200]};
  border-radius: 9999px;
  background: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.xs};
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
  externalRegion?: string | null;
}

export default function HanokGrid({
  villages,
  onSelectVillage,
  initialFilters,
  externalRegion,
}: HanokGridProps) {



  const [state, setState] = useState<HanokFilterState>(initialFilters);


  useEffect(() => {
    const search = toSearchParams(state);
    window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname);
  }, [state]);


  useEffect(() => {
    if (externalRegion) {
      setState((prev) => ({ ...prev, region: externalRegion, page: 1 }));
      document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [externalRegion]);

  const { items: paginatedItems, totalPages, filteredCount } = useMemo(
    () => getHanokGridPage(villages, state, state.page),
    [state, villages],
  );


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
        title="전국 한옥 도감"
        subtitle={`${filteredCount}곳의 기록`}
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
              ? `'${state.query}' 검색 결과가 없어요.`
              : '조건에 맞는 한옥을 찾지 못했어요.'}
          </p>
          <ResetAll type="button" onClick={() => setState(EMPTY_STATE)}>
            조건 모두 지우기
          </ResetAll>
        </EmptyState>
      )}
    </Section>
  );
}
