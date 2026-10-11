'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react';
import { Film01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize } from '@/design-system/tokens';
import TopicTabBar from './presentation/components/TopicTabBar';
import DiscoveryPlacesSection from './presentation/components/DiscoveryPlacesSection';
import { useDiscoveryTopics } from './presentation/hooks/useDiscoveryTopics';
import { useDiscoveryPlaces } from './presentation/hooks/useDiscoveryPlaces';
import type { DiscoveryPlaceSummary, TopicCode } from './domain/types';

const PageWrap = styled.div`
  padding: 0 0 40px;
`;

const PageHeader = styled.div`
  margin-bottom: 20px;
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
  margin: 0 0 20px;
`;

const CountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const MatchCount = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  font-weight: 500;
`;

const WorksLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${lightPalette.juhong[500]};
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: ${lightPalette.juhong[700]};
  }
`;

export interface KCultureDiscoveryProps {
  initialTopic?: TopicCode | 'all';
  workId?: string;
}

export default function KCultureDiscovery({ initialTopic = 'all', workId }: KCultureDiscoveryProps) {
  const router = useRouter();
  const [activeTopic, setActiveTopic] = useState<TopicCode | 'all'>(initialTopic);

  const { topics, isLoading: topicsLoading } = useDiscoveryTopics();
  const {
    items,
    matchingCount,
    isLoading,
    isError,
    hasMore,
    loadMore,
  } = useDiscoveryPlaces({
    topic: activeTopic === 'all' ? undefined : activeTopic,
    workId,
  });

  const handleTopicChange = (code: TopicCode | 'all') => {
    setActiveTopic(code);
  };

  const handlePlaceClick = (place: DiscoveryPlaceSummary) => {
    router.push(`/discover/places/${encodeURIComponent(place.placeId)}`);
  };

  return (
    <PageWrap>
      <PageHeader>
        <PageTitle>
          <HugeiconsIcon icon={SparklesIcon} size={22} strokeWidth={1.5} style={{ verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
          K-Culture 탐색
        </PageTitle>
        <PageSubtitle>
          전통 공간·문화유산부터 드라마·영화·MV 촬영지까지, 근거가 확인된 K-Culture 장소를 탐색하세요.
        </PageSubtitle>
      </PageHeader>

      <TopicTabBar
        topics={topics}
        activeCode={activeTopic}
        isLoading={topicsLoading}
        onChange={handleTopicChange}
      />

      <CountRow>
        <MatchCount>
          {isLoading && items.length === 0
            ? '검색 중…'
            : `장소 ${matchingCount.toLocaleString()}개`}
        </MatchCount>
        <WorksLink href="/discover/works">
          <HugeiconsIcon icon={Film01Icon} size={13} strokeWidth={2} aria-hidden="true" />
          작품 목록 보기
        </WorksLink>
      </CountRow>

      <DiscoveryPlacesSection
        items={items}
        isLoading={isLoading}
        isError={isError}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onPlaceClick={handlePlaceClick}
      />
    </PageWrap>
  );
}
