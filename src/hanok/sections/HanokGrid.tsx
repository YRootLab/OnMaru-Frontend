'use client';

import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { meok } from '@/design-system/tokens';
import SectionHeader from '@/hanok/components/SectionHeader';
import FilterBar, { type VillageTypeFilter } from '@/hanok/components/FilterBar';
import VillageCard from '@/hanok/components/VillageCard';
import Pagination from '@/hanok/components/Pagination';
import type { Village } from '@/hanok/types';
import { motion, AnimatePresence } from 'framer-motion';
import { getHanokGridPage } from './hanokGridModel';

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
  display: grid;
  place-items: center;
  color: ${meok[400]};
  font-size: 14px;
`;

interface HanokGridProps {
  villages: Village[];
  onSelectVillage: (v: Village) => void;
}

export default function HanokGrid({ villages, onSelectVillage }: HanokGridProps) {
  const [activeType, setActiveType] = useState<VillageTypeFilter>('전체');
  const [activeBadges, setActiveBadges] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { items: paginatedItems, totalPages, filteredCount } = useMemo(
    () => getHanokGridPage(villages, { activeType, activeBadges }, currentPage),
    [activeBadges, activeType, currentPage, villages],
  );

  const handleBadgeToggle = (badge: string) => {
    setCurrentPage(1);
    setActiveBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
    );
  };

  const handleTypeChange = (type: VillageTypeFilter) => {
    setCurrentPage(1);
    setActiveType(type);
  };

  const handleResetBadges = () => {
    setCurrentPage(1);
    setActiveBadges([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const element = document.getElementById('grid-heading');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Section id="grid" aria-labelledby="grid-heading">
      <SectionHeader
        id="grid-heading"
        title="한옥 도감"
        subtitle={`궁궐부터 고택·서원·전통마을까지 ${filteredCount}곳`}
      />

      <FilterBar
        villages={villages}
        activeType={activeType}
        activeBadges={activeBadges}
        onTypeChange={handleTypeChange}
        onBadgeToggle={handleBadgeToggle}
        onResetBadges={handleResetBadges}
      />

      {paginatedItems.length > 0 ? (
        <>
          <AnimatePresence mode="wait">
            <Grid
              key={`${activeType}-${activeBadges.join(',')}-${currentPage}`}
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
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <EmptyState role="status" aria-live="polite">
          조건에 맞는 한옥이 없습니다. 필터를 지우고 다시 찾아보세요.
        </EmptyState>
      )}
    </Section>
  );
}
