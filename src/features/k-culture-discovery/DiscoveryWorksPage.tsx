'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Film01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import DiscoveryWorksSection from './presentation/components/DiscoveryWorksSection';
import { useDiscoveryWorks } from './presentation/hooks/useDiscoveryWorks';
import type { WorkSummary, WorkType } from './domain/types';

/* full-bleed → 자체 여백 */
const PageWrap = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 16px 64px;

  @media (min-width: 768px) {
    padding-top: 66px;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[400]};
  text-decoration: none;
  margin: 20px 0 0;
  transition: color 0.14s ease;

  &:hover { color: ${meok[700]}; }

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.28);
    &:hover { color: rgba(255,255,255,0.60); }
  }
`;

const PageHeader = styled.div`
  padding: 16px 0 20px;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
`;

const TitleIconWrap = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${lightPalette.juhong[50]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightPalette.juhong[500]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: rgba(255,85,0,0.12);
    color: ${lightPalette.juhong[400]};
  }
`;

const PageTitle = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(20px, 3.2vw, 26px);
  font-weight: 700;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.03em;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.90);
  }
`;

const PageSub = styled.p`
  font-size: ${fontSize.xs};
  color: ${meok[400]};
  margin: 0;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.28);
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) => ($active ? lightPalette.juhong[500] : meok[100])};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[600])};
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  font-family: inherit;
  transition: background 0.14s ease, color 0.14s ease, transform 0.10s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[400] : meok[200]};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[800])};
  }

  &:active { transform: scale(0.96); }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? lightPalette.juhong[500] : 'rgba(255,255,255,0.07)'};
    color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255,255,255,0.45)')};

    &:hover {
      background: ${({ $active }) =>
        $active ? lightPalette.juhong[400] : 'rgba(255,255,255,0.12)'};
      color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255,255,255,0.70)')};
    }
  }
`;

const CountRow = styled.div`
  margin-bottom: 12px;
`;

const MatchCount = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[400]};
  font-weight: 500;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.28);
  }
`;

const UnavailableBox = styled.div`
  padding: 64px 24px;
  text-align: center;
  border-radius: 16px;
  background: ${meok[100]};

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.04);
  }
`;

const UnavailableTitle = styled.p`
  font-weight: 700;
  font-size: ${fontSize.base};
  color: ${meok[600]};
  margin: 0 0 6px;

  [data-theme='dark'] & { color: rgba(255,255,255,0.40); }
`;

const UnavailableSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[400]};
  margin: 0;
  line-height: 1.65;

  [data-theme='dark'] & { color: rgba(255,255,255,0.24); }
`;

const WORK_TYPE_LABELS: Record<WorkType | 'all', string> = {
  all: '전체',
  DRAMA: 'K-드라마',
  ARTIST: '아티스트',
  MOVIE: '영화',
  VARIETY: '예능',
  MUSIC_VIDEO: 'MV',
};

const TYPE_FILTERS: Array<WorkType | 'all'> = ['all', 'DRAMA', 'ARTIST', 'MOVIE', 'VARIETY', 'MUSIC_VIDEO'];

export default function DiscoveryWorksPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<WorkType | 'all'>('all');

  const { items, matchingCount, isLoading, isError, hasMore, loadMore } = useDiscoveryWorks({
    type: activeType === 'all' ? undefined : activeType,
  });

  const handleWorkClick = (work: WorkSummary) =>
    router.push(`/discover/works/${encodeURIComponent(work.workId)}`);

  const serviceDown = isError && items.length === 0 && !isLoading;

  return (
    <PageWrap>
      <BackLink href="/discover">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={12} strokeWidth={2.5} />
        탐색마루
      </BackLink>

      <PageHeader>
        <TitleRow>
          <TitleIconWrap aria-hidden="true">
            <HugeiconsIcon icon={Film01Icon} size={18} strokeWidth={1.5} />
          </TitleIconWrap>
          <PageTitle>작품 목록</PageTitle>
        </TitleRow>
        <PageSub>촬영지·방문지가 확인된 K-Culture 작품과 아티스트</PageSub>
      </PageHeader>

      {serviceDown ? (
        <UnavailableBox role="status">
          <UnavailableTitle>작품 목록 서비스 준비 중입니다</UnavailableTitle>
          <UnavailableSub>콘텐츠 검수 완료 후 공개 예정입니다.</UnavailableSub>
        </UnavailableBox>
      ) : (
        <>
          <FilterRow>
            {TYPE_FILTERS.map((type) => (
              <Chip
                key={type}
                type="button"
                $active={activeType === type}
                onClick={() => setActiveType(type)}
              >
                {WORK_TYPE_LABELS[type]}
              </Chip>
            ))}
          </FilterRow>

          <CountRow>
            <MatchCount>
              {isLoading && items.length === 0 ? '검색 중…' : `총 ${matchingCount.toLocaleString()}편`}
            </MatchCount>
          </CountRow>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <DiscoveryWorksSection
                items={items}
                isLoading={isLoading}
                isError={isError}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onWorkClick={handleWorkClick}
              />
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </PageWrap>
  );
}
