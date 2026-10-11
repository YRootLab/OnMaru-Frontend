'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Film01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import DiscoveryWorksSection from './presentation/components/DiscoveryWorksSection';
import { useDiscoveryWorks } from './presentation/hooks/useDiscoveryWorks';
import type { WorkSummary, WorkType } from './domain/types';

const PageWrap = styled.div`
  padding: 0 0 40px;
  max-width: 680px;
  margin: 0 auto;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: ${meok[600]};
  text-decoration: none;
  margin: 16px 0 0;
  transition: color 0.15s ease;

  &:hover {
    color: ${lightPalette.juhong[500]};
  }
`;

const PageHeader = styled.div`
  margin: 20px 0 16px;
`;

const PageTitle = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(22px, 3.5vw, 30px);
  font-weight: 700;
  color: ${meok[900]};
  margin: 0 0 4px;
  letter-spacing: -0.03em;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const PageSubtitle = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterChip = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1.5px solid ${({ $active }) =>
    $active ? lightPalette.juhong[400] : 'rgba(78, 89, 104, 0.18)'};
  background: ${({ $active }) => ($active ? lightPalette.juhong[50] : 'transparent')};
  color: ${({ $active }) => ($active ? lightPalette.juhong[600] : meok[600])};
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${lightPalette.juhong[400]};
    color: ${lightPalette.juhong[600]};
  }

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? lightPalette.juhong[400] : meok[300])};
    background: ${({ $active }) => ($active ? 'rgba(220, 80, 80, 0.12)' : 'transparent')};
  }
`;

const CountRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const MatchCount = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  font-weight: 500;
`;

const WORK_TYPE_LABELS: Record<WorkType | 'all', string> = {
  all: '전체',
  DRAMA: 'K-드라마',
  MOVIE: '영화',
  VARIETY: '예능',
  MUSIC_VIDEO: 'MV',
};

const TYPE_FILTERS: Array<WorkType | 'all'> = ['all', 'DRAMA', 'MOVIE', 'VARIETY', 'MUSIC_VIDEO'];

export default function DiscoveryWorksPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState<WorkType | 'all'>('all');

  const { items, matchingCount, isLoading, isError, hasMore, loadMore } = useDiscoveryWorks({
    type: activeType === 'all' ? undefined : activeType,
  });

  const handleWorkClick = (work: WorkSummary) => {
    router.push(`/discover/works/${encodeURIComponent(work.workId)}`);
  };

  return (
    <PageWrap>
      <BackLink href="/discover">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={15} strokeWidth={2.5} />
        탐색마루
      </BackLink>

      <PageHeader>
        <PageTitle>
          <HugeiconsIcon icon={Film01Icon} size={22} strokeWidth={1.5} style={{ verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
          작품 목록
        </PageTitle>
        <PageSubtitle>촬영지가 확인된 K-Culture 작품을 탐색하세요.</PageSubtitle>
      </PageHeader>

      <FilterRow>
        {TYPE_FILTERS.map((type) => (
          <FilterChip
            key={type}
            type="button"
            $active={activeType === type}
            onClick={() => setActiveType(type)}
          >
            {WORK_TYPE_LABELS[type]}
          </FilterChip>
        ))}
      </FilterRow>

      <CountRow>
        <MatchCount>
          {isLoading && items.length === 0
            ? '검색 중…'
            : `작품 ${matchingCount.toLocaleString()}편`}
        </MatchCount>
      </CountRow>

      <DiscoveryWorksSection
        items={items}
        isLoading={isLoading}
        isError={isError}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onWorkClick={handleWorkClick}
      />
    </PageWrap>
  );
}
