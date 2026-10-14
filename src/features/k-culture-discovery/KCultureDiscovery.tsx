'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Film01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, palette, fontSize } from '@/design-system/tokens';
import TopicTabBar from './presentation/components/TopicTabBar';
import DiscoveryPlacesSection from './presentation/components/DiscoveryPlacesSection';
import { useDiscoveryTopics } from './presentation/hooks/useDiscoveryTopics';
import { useDiscoveryPlaces } from './presentation/hooks/useDiscoveryPlaces';
import type { DiscoveryPlaceSummary, TopicCode, FacetEntry, WorkType } from './domain/types';

const shimmer = keyframes`
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

/* ─── full-bleed page → 자체 여백 적용 ─── */
const PageWrap = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 16px 64px;

  @media (min-width: 768px) {
    padding-top: 8px;
  }
`;

/* ─── hero ─── */
const Hero = styled.div`
  padding: 28px 0 24px;
`;

const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  background: ${lightPalette.juhong[50]};
  color: ${lightPalette.juhong[600]};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 12px;

  [data-theme='dark'] & {
    background: rgba(255, 85, 0, 0.14);
    color: ${lightPalette.juhong[300]};
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-display);
  font-size: clamp(24px, 4.5vw, 36px);
  font-weight: 400;
  color: ${meok[900]};
  margin: 0 0 8px;
  letter-spacing: -0.03em;
  line-height: 1.2;
  white-space: nowrap;

  @media (max-width: 360px) {
    white-space: normal;
    font-size: 22px;
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.92);
  }
`;

const HeroAccent = styled.span`
  color: ${lightPalette.juhong[500]};

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

const HeroSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0;
  line-height: 1.7;
  max-width: 400px;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
`;

/* ─── stats bar (그림자 구분선, border 없음) ─── */
const StatsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 14px;
  margin-bottom: 4px;
`;

const StatsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const StatsDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 9999px;
  background: ${lightPalette.cheongrok[500]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: ${lightPalette.cheongrok[400]};
  }
`;

const StatsText = styled.span`
  font-size: ${fontSize.xs};
  color: ${meok[500]};
  font-weight: 500;
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
`;

const StatsBold = styled.strong`
  color: ${meok[800]};
  font-weight: 700;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.85);
  }
`;

const SkeletonCount = styled.div`
  width: 64px;
  height: 13px;
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    ${meok[100]} 25%, #f3f3f1 50%, ${meok[100]} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 75%
    );
    background-size: 200% 100%;
  }
`;

const WorksLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px 6px 11px;
  border-radius: 9999px;
  background: ${lightPalette.juhong[50]};
  color: ${lightPalette.juhong[600]};
  font-size: ${fontSize.xs};
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${lightPalette.juhong[100]};
    color: ${lightPalette.juhong[700]};
  }

  [data-theme='dark'] & {
    background: rgba(255, 85, 0, 0.13);
    color: ${lightPalette.juhong[300]};

    &:hover {
      background: rgba(255, 85, 0, 0.20);
      color: ${lightPalette.juhong[200]};
    }
  }
`;

/* ─── facet filter chips ─── */
const FacetRow = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 0 10px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const FacetChip = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 5px 12px;
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) =>
    $active ? lightPalette.cheongrok[500] : meok[100]};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[600])};
  font-size: 11px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.14s ease, color 0.14s ease, transform 0.10s ease;

  &:hover {
    background: ${({ $active }) =>
      $active ? lightPalette.cheongrok[400] : meok[200]};
  }

  &:active { transform: scale(0.96); }

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? lightPalette.cheongrok[600] : 'rgba(255,255,255,0.07)'};
    color: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255,255,255,0.45)')};

    &:hover {
      background: ${({ $active }) =>
        $active ? lightPalette.cheongrok[500] : 'rgba(255,255,255,0.12)'};
    }
  }
`;

const FacetCount = styled.span`
  font-size: 10px;
  font-weight: 600;
  opacity: 0.65;
  margin-left: 3px;
`;

/* ─── unavailable ─── */
const UnavailableBox = styled.div`
  padding: 64px 24px;
  text-align: center;
  border-radius: 20px;
  background: ${meok[100]};
  margin-top: 8px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const UnavailableIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: ${meok[200]};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${meok[400]};

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.28);
  }
`;

const UnavailableTitle = styled.p`
  font-weight: 700;
  font-size: ${fontSize.base};
  color: ${meok[700]};
  margin: 0 0 6px;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.55);
  }
`;

const UnavailableSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[400]};
  margin: 0;
  line-height: 1.65;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.28);
  }
`;

const TYPE_KO: Record<string, string> = {
  DRAMA: '드라마',
  ARTIST: '아티스트',
  MOVIE: '영화',
  VARIETY: '예능',
  MUSIC_VIDEO: 'MV',
};

/* ─── component ─── */
export interface KCultureDiscoveryProps {
  initialTopic?: TopicCode | 'all';
  workId?: string;
}

export default function KCultureDiscovery({ initialTopic = 'all', workId }: KCultureDiscoveryProps) {
  const router = useRouter();
  const [activeTopic, setActiveTopic] = useState<TopicCode | 'all'>(initialTopic);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activePlaceRole, setActivePlaceRole] = useState<string | null>(null);
  const [activeWorkType, setActiveWorkType] = useState<WorkType | null>(null);

  const { topics, isLoading: topicsLoading } = useDiscoveryTopics();
  const { items, facets, matchingCount, isLoading, isError, hasMore, loadMore } =
    useDiscoveryPlaces({
      topic: activeTopic === 'all' ? undefined : activeTopic,
      regionCode: activeRegion ?? undefined,
      placeRole: activePlaceRole ?? undefined,
      type: activeWorkType ?? undefined,
      workId,
    });

  const handleTopicChange = (code: TopicCode | 'all') => {
    setActiveTopic(code);
    setActiveRegion(null);
    setActivePlaceRole(null);
    setActiveWorkType(null);
  };
  const handlePlaceClick = (place: DiscoveryPlaceSummary) =>
    router.push(`/discover/places/${encodeURIComponent(place.placeId)}`);

  const regionFacets: FacetEntry[] = facets?.regionCode?.filter((f) => f.count > 0) ?? [];
  const roleFacets: FacetEntry[] = facets?.placeRole?.filter((f) => f.count > 0) ?? [];
  const typeFacets: FacetEntry[] = facets?.type?.filter((f) => f.count > 0) ?? [];
  const hasFacets = regionFacets.length > 0 || roleFacets.length > 0 || typeFacets.length > 0;

  const serviceDown = isError && items.length === 0 && !isLoading;

  return (
    <PageWrap>
      <Hero>
        <HeroBadge>K-Culture Discovery</HeroBadge>
        <HeroTitle>공간이 된 <HeroAccent>문화의 기록</HeroAccent></HeroTitle>
        <HeroSub>드라마·영화 촬영지부터 아티스트 성지까지, 근거가 확인된 K-Culture 장소를 탐색하세요.</HeroSub>
      </Hero>

      {serviceDown ? (
        <UnavailableBox role="status">
          <UnavailableIcon aria-hidden="true">
            <HugeiconsIcon icon={Film01Icon} size={22} strokeWidth={1.5} />
          </UnavailableIcon>
          <UnavailableTitle>탐색 서비스 준비 중입니다</UnavailableTitle>
          <UnavailableSub>콘텐츠 검수 완료 후 공개 예정입니다.</UnavailableSub>
        </UnavailableBox>
      ) : (
        <>
          <TopicTabBar
            topics={topics}
            activeCode={activeTopic}
            isLoading={topicsLoading}
            onChange={handleTopicChange}
          />

          {hasFacets && (
            <FacetRow aria-label="세부 필터">
              {typeFacets.map((f) => (
                <FacetChip
                  key={`t-${f.code}`}
                  type="button"
                  $active={activeWorkType === (f.code as WorkType)}
                  onClick={() => setActiveWorkType(activeWorkType === f.code ? null : (f.code as WorkType))}
                >
                  {TYPE_KO[f.code as WorkType] ?? f.code}
                  <FacetCount>{f.count}</FacetCount>
                </FacetChip>
              ))}
              {regionFacets.map((f) => (
                <FacetChip
                  key={`r-${f.code}`}
                  type="button"
                  $active={activeRegion === f.code}
                  onClick={() => setActiveRegion(activeRegion === f.code ? null : f.code)}
                >
                  {f.labelKo ?? f.code}
                  <FacetCount>{f.count}</FacetCount>
                </FacetChip>
              ))}
              {roleFacets.map((f) => (
                <FacetChip
                  key={`p-${f.code}`}
                  type="button"
                  $active={activePlaceRole === f.code}
                  onClick={() => setActivePlaceRole(activePlaceRole === f.code ? null : f.code)}
                >
                  {f.labelKo ?? f.code}
                  <FacetCount>{f.count}</FacetCount>
                </FacetChip>
              ))}
            </FacetRow>
          )}

          <StatsBar>
            <StatsLeft>
              <StatsDot />
              <StatsText>
                {isLoading && items.length === 0 ? (
                  <SkeletonCount />
                ) : (
                  <>장소 <StatsBold>{matchingCount.toLocaleString()}</StatsBold>곳</>
                )}
              </StatsText>
            </StatsLeft>

            <WorksLink href="/discover/works">
              <HugeiconsIcon icon={Film01Icon} size={12} strokeWidth={2} aria-hidden="true" />
              작품 목록
              <HugeiconsIcon icon={ArrowRight01Icon} size={11} strokeWidth={2.5} aria-hidden="true" />
            </WorksLink>
          </StatsBar>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTopic}|${activeRegion ?? ''}|${activePlaceRole ?? ''}|${activeWorkType ?? ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <DiscoveryPlacesSection
                items={items}
                isLoading={isLoading}
                isError={isError}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onPlaceClick={handlePlaceClick}
              />
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </PageWrap>
  );
}
