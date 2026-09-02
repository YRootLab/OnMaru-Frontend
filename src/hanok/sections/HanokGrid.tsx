'use client';

import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { meok } from '@/design-system/tokens';
import SectionHeader from '@/hanok/components/SectionHeader';
import FilterBar, { ALL_TYPES, type VillageTypeFilter } from '@/hanok/components/FilterBar';
import VillageCard from '@/hanok/components/VillageCard';
import Pagination from '@/hanok/components/Pagination';
import type { Village } from '@/hanok/types';
import { motion, AnimatePresence } from 'framer-motion';

const Section = styled.section``;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
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

const ITEMS_PER_PAGE = 12;

interface HanokGridProps {
  villages: Village[];
  onSelectVillage: (v: Village) => void;
}

export default function HanokGrid({ villages, onSelectVillage }: HanokGridProps) {
  const [activeType, setActiveType] = useState<VillageTypeFilter>('전체');
  const [activeBadges, setActiveBadges] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeType, activeBadges]);

  const filtered = villages.filter((v) => {
    if (v.type === '한옥 고택 스테이') return false;
    if (activeType !== '전체' && v.type !== activeType) return false;
    if (activeBadges.length > 0 && !activeBadges.every((b) => v.badges.includes(b))) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleBadgeToggle = (badge: string) => {
    setActiveBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
    );
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
        subtitle={`궁궐부터 고택·서원·전통마을까지 ${filtered.length}곳`}
      />

      <FilterBar
        villages={villages}
        activeType={activeType}
        activeBadges={activeBadges}
        onTypeChange={setActiveType}
        onBadgeToggle={handleBadgeToggle}
        onResetBadges={() => setActiveBadges([])}
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
