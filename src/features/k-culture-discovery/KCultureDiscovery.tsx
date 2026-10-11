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

const UnavailableBox = styled.div`
  padding: 48px 16px;
  text-align: center;
  border-radius: 16px;
  background: ${meok[100]};
  color: ${meok[500]};

  [data-theme='dark'] & {
    background: ${meok[800]};
    color: ${meok[400]};
  }
`;

const UnavailableTitle = styled.p`
  font-family: var(--font-hanok);
  font-size: ${fontSize.base};
  font-weight: 700;
  color: ${meok[600]};
  margin: 0 0 6px;

  [data-theme='dark'] & {
    color: ${meok[300]};
  }
`;

const UnavailableDesc = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0;
  line-height: 1.6;
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

  // When the service is unavailable (flag off, 404/503), show a single friendly state
  // instead of a broken partial UI or unreviewed fixture cards.
  const serviceDown = isError && items.length === 0 && !isLoading;

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

      {serviceDown ? (
        <UnavailableBox role="status">
          <UnavailableTitle>탐색 서비스 준비 중입니다</UnavailableTitle>
          <UnavailableDesc>
            콘텐츠 검수 및 서비스 준비가 완료되는 대로 공개될 예정입니다.
          </UnavailableDesc>
        </UnavailableBox>
      ) : (
        <>
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
        </>
      )}
    </PageWrap>
  );
}
