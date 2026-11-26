'use client';

import React, { useState, useMemo, useEffect } from 'react';
import styled from '@emotion/styled';
import { useTranslations } from 'next-intl';
import { meok, palette, surface, typographyRole, spacingLayout, mq } from '@/design-system/tokens';
import SectionHeader from '@/features/hanok-archive/components/SectionHeader';
import FilterBar, { type VillageTypeFilter } from '@/features/hanok-archive/components/FilterBar';
import VillageCard from '@/features/hanok-archive/components/VillageCard';
import Pagination from '@/features/hanok-archive/components/Pagination';
import type { Village } from '@/features/hanok-archive/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getHanokGridPage } from './hanokGridModel';
import { EMPTY_STATE, toSearchParams, type HanokFilterState } from './hanokFilterQuery';
import { OniSearchEmpty } from '@/shared/components/OniSearchEmpty';
import {
  clearGridReveal,
  moveGridReveal,
} from '@/features/hanok-archive/presentation/gridReveal';

const Section = styled.section``;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacingLayout.cardGap};

  ${mq.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${mq.laptop} {
    grid-template-columns: repeat(3, 1fr);
  }

  ${mq.desktop} {
    grid-template-columns: repeat(4, 1fr);
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
  font-size: ${typographyRole.bodySm.fontSize};
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







const CURATION_THEMES = [
  { label: '세계유산 한옥', badge: '세계유산' },
  { label: '고택 숙박', badge: '고택숙박' },
  { label: '전통 정원', badge: '전통정원' },
  { label: '산자락 한옥', badge: '산자락' },
  { label: '도심 접근', badge: '도심접근' },
  { label: '온돌 체험', badge: '온돌구들' },
] as const;

const CurationRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 20px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const CurationChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: ${typographyRole.label.fontSize};
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.18s ease;
  border: 1px solid ${({ $active }) => ($active ? palette.juhong[500] : meok[200])};
  background: ${({ $active }) => ($active ? palette.juhong[500] : 'transparent')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};

  &:hover {
    border-color: ${palette.juhong[400]};
    color: ${({ $active }) => ($active ? '#ffffff' : palette.juhong[600])};
  }

  [data-theme='dark'] & {
    border-color: ${({ $active }) => ($active ? palette.juhong[500] : 'rgba(255,255,255,0.14)')};
    background: ${({ $active }) => ($active ? palette.juhong[500] : 'transparent')};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[300])};
  }
`;

const ResetAll = styled.button`
  padding: 8px 16px;
  border: 1px solid ${meok[200]};
  border-radius: 9999px;
  background: #ffffff;
  font-family: inherit;
  font-size: ${typographyRole.label.fontSize};
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
  const t = useTranslations('hanok.grid');
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
        title={t('sectionTitle')}
        subtitle={t('recordCount', { count: filteredCount })}
      />

      <CurationRow>
        {CURATION_THEMES.filter((theme) =>
          villages.some((v) => v.badges.includes(theme.badge)),
        ).map((theme) => {
          const isActive = state.activeBadges.includes(theme.badge);
          return (
            <CurationChip
              key={theme.badge}
              type="button"
              $active={isActive}
              onClick={() => handleBadgeToggle(theme.badge)}
            >
              {theme.label}
            </CurationChip>
          );
        })}
      </CurationRow>

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
              className="hanok-reveal-grid"
              key={`${state.activeType}-${state.region}-${state.query}-${state.activeBadges.join(',')}-${state.page}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              onPointerMove={(event) => {
                if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
                moveGridReveal(event.currentTarget, event.clientX, event.clientY);
              }}
              onPointerLeave={(event) => clearGridReveal(event.currentTarget)}
            >
              {paginatedItems.map((v) => (
                <motion.div
                  key={v.id}
                  variants={itemVariants}
                >
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
          <OniSearchEmpty
            size="lg"
            title={
              state.query
                ? t('noSearchResult', { query: state.query })
                : t('noFilterResult')
            }
            description={
              state.query
                ? t('noSearchHint')
                : t('noFilterHint')
            }
            action={
              <ResetAll type="button" onClick={() => setState(EMPTY_STATE)}>
                {t('resetAll')}
              </ResetAll>
            }
          />
        </EmptyState>
      )}
    </Section>
  );
}
