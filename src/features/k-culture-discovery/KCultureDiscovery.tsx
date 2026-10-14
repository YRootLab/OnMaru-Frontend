'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Film01Icon, ArrowRight01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { meok, lightPalette, fontSize, ringShadow } from '@/design-system/tokens';
import TopicTabBar from './presentation/components/TopicTabBar';
import DiscoveryPlacesSection from './presentation/components/DiscoveryPlacesSection';
import { useDiscoveryTopics } from './presentation/hooks/useDiscoveryTopics';
import { useDiscoveryPlaces } from './presentation/hooks/useDiscoveryPlaces';
import type { DiscoveryPlaceSummary, TopicCode, FacetEntry, WorkType } from './domain/types';

const shimmer = keyframes`
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

const PageWrap = styled.div`
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding-top: 64px;
  padding-bottom: 80px;

  @media (min-width: 768px) {
    padding-top: 80px;
  }

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

/* ─── hero ─── */
const Hero = styled.div`
  padding: 32px 0 24px;
`;

const HeroTitle = styled.h1`
  font-family: var(--font-hanok), serif;
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 800;
  color: ${meok[900]};
  margin: 0 0 10px;
  letter-spacing: -0.04em;
  line-height: 1.2;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const HeroSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0;
  line-height: 1.6;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.45);
  }
`;

/* ─── filter area ─── */
const FilterArea = styled.div`
  padding: 20px 0 0;
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FacetRow = styled.div`
  display: flex;
  gap: 5px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const FacetChip = styled.button<{ $active: boolean; $variant?: 'type' | 'region' | 'role' }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 8px;
  border: none;
  background: ${({ $active, $variant }) => {
    if (!$active) return 'rgba(0,0,0,0.04)';
    if ($variant === 'type') return `${lightPalette.juhong[50]}`;
    if ($variant === 'region') return `rgba(0, 160, 100, 0.08)`;
    return meok[100];
  }};
  color: ${({ $active, $variant }) => {
    if (!$active) return meok[600];
    if ($variant === 'type') return lightPalette.juhong[600];
    if ($variant === 'region') return lightPalette.cheongrok[700];
    return meok[800];
  }};
  box-shadow: ${({ $active }) => ($active ? ringShadow.light.chipActive : 'none')};
  font-size: 11.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $active }) => ($active ? 'inherit' : 'rgba(0,0,0,0.06)')};
    color: ${({ $active }) => ($active ? 'inherit' : meok[800])};
    box-shadow: ${({ $active }) => ($active ? ringShadow.light.chipActive : ringShadow.light.chipHover)};
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    background: ${({ $active, $variant }) => {
      if (!$active) return 'rgba(255,255,255,0.06)';
      if ($variant === 'type') return 'rgba(255, 85, 0, 0.16)';
      if ($variant === 'region') return 'rgba(0, 160, 100, 0.14)';
      return 'rgba(255,255,255,0.12)';
    }};
    color: ${({ $active, $variant }) => {
      if (!$active) return 'rgba(255,255,255,0.55)';
      if ($variant === 'type') return lightPalette.juhong[300];
      if ($variant === 'region') return lightPalette.cheongrok[300];
      return 'rgba(255,255,255,0.95)';
    }};
    box-shadow: ${({ $active }) => ($active ? ringShadow.dark.chipActive : 'none')};

    &:hover {
      background: ${({ $active }) => ($active ? 'inherit' : 'rgba(255,255,255,0.09)')};
      color: ${({ $active }) => ($active ? 'inherit' : 'rgba(255,255,255,0.85)')};
      box-shadow: ${({ $active }) => ($active ? ringShadow.dark.chipActive : ringShadow.dark.chipHover)};
    }
  }
`;

const FacetCount = styled.span`
  font-size: 10px;
  font-weight: 700;
  opacity: 0.6;
`;

/* ─── actions ─── */
const ActionsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 0 12px;
`;

const WorksLink = styled(Link)`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[500]};
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: color 0.15s ease;

  &:hover { color: ${meok[800]}; }

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.38);
    &:hover { color: rgba(255,255,255,0.7); }
  }
`;

/* ─── unavailable ─── */
const UnavailableBox = styled.div`
  padding: 72px 24px;
  text-align: center;
  border-radius: 20px;
  background: rgba(0,0,0,0.03);
  margin-top: 8px;

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.04);
  }
`;

const UnavailableTitle = styled.p`
  font-weight: 700;
  font-size: ${fontSize.base};
  color: ${meok[700]};
  margin: 0 0 6px;

  [data-theme='dark'] & { color: rgba(255,255,255,0.55); }
`;

const UnavailableSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[400]};
  margin: 0;
  line-height: 1.65;

  [data-theme='dark'] & { color: rgba(255,255,255,0.28); }
`;

const TYPE_KO: Record<string, string> = {
  DRAMA: '드라마',
  ARTIST: '아티스트',
  MOVIE: '영화',
  VARIETY: '예능',
  MUSIC_VIDEO: 'MV',
};

const REGION_KO: Record<string, string> = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구',
  '5': '광주', '6': '부산', '7': '울산', '8': '세종',
  '31': '경기', '32': '강원', '33': '충북', '34': '충남',
  '35': '전북', '36': '전남', '37': '경북', '38': '경남', '39': '제주',
  '11': '서울', '26': '부산', '27': '대구', '28': '인천',
  '29': '광주', '30': '대전', '41': '경기', '42': '강원',
  '43': '충북', '44': '충남', '45': '전북', '46': '전남',
  '47': '경북', '48': '경남', '50': '제주',
};

function formatRegionName(code: string, labelKo?: string): string {
  if (REGION_KO[code]) return REGION_KO[code];
  if (labelKo && REGION_KO[labelKo]) return REGION_KO[labelKo];
  if (labelKo) return labelKo.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
  return code;
}

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
  const { items, facets, isLoading, isError, hasMore, loadMore } =
    useDiscoveryPlaces({
      topic: activeTopic === 'all' ? undefined : activeTopic,
      regionCode: activeRegion ?? undefined,
      placeRole: activePlaceRole ?? undefined,
      type: activeWorkType ?? undefined,
      workId,
      limit: 20,
    });

  const handleTopicChange = (code: TopicCode | 'all') => {
    setActiveTopic(code);
    setActiveRegion(null);
    setActivePlaceRole(null);
    setActiveWorkType(null);
  };

  const handlePlaceClick = (place: DiscoveryPlaceSummary) =>
    router.push(`/discover/places/${encodeURIComponent(place.placeId)}`);

  const regionFacets: FacetEntry[] = facets?.regionCode?.filter((f) => f.count > 0 && (f.labelKo || REGION_KO[f.code])) ?? [];
  const roleFacets: FacetEntry[] = facets?.placeRole?.filter((f) => f.count > 0 && f.labelKo) ?? [];
  const typeFacets: FacetEntry[] = facets?.type?.filter((f) => f.count > 0 && TYPE_KO[f.code as WorkType]) ?? [];
  const hasFacets = regionFacets.length > 0 || roleFacets.length > 0 || typeFacets.length > 0;
  const serviceDown = isError && items.length === 0 && !isLoading;

  return (
    <PageWrap>
      <Hero>
        <HeroTitle>공간이 된 문화의 기록</HeroTitle>
        <HeroSub>드라마·영화·K-팝의 실제 공간을 탐색하세요.</HeroSub>
      </Hero>

      {serviceDown ? (
        <UnavailableBox role="status">
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
            <FilterArea>
              <FilterSection>
                {typeFacets.length > 0 && (
                  <FacetRow aria-label="콘텐츠 유형 필터">
                    {typeFacets.map((f) => (
                      <FacetChip
                        key={`t-${f.code}`}
                        type="button"
                        $active={activeWorkType === (f.code as WorkType)}
                        $variant="type"
                        onClick={() => setActiveWorkType(activeWorkType === f.code ? null : (f.code as WorkType))}
                      >
                        {TYPE_KO[f.code as WorkType]}
                        <FacetCount>{f.count}</FacetCount>
                      </FacetChip>
                    ))}
                  </FacetRow>
                )}
                {regionFacets.length > 0 && (
                  <FacetRow aria-label="지역 필터">
                    {regionFacets.map((f) => (
                      <FacetChip
                        key={`r-${f.code}`}
                        type="button"
                        $active={activeRegion === f.code}
                        $variant="region"
                        onClick={() => setActiveRegion(activeRegion === f.code ? null : f.code)}
                      >
                        {formatRegionName(f.code, f.labelKo)}
                        <FacetCount>{f.count}</FacetCount>
                      </FacetChip>
                    ))}
                  </FacetRow>
                )}
                {roleFacets.length > 0 && (
                  <FacetRow aria-label="장소 유형 필터">
                    {roleFacets.map((f) => (
                      <FacetChip
                        key={`p-${f.code}`}
                        type="button"
                        $active={activePlaceRole === f.code}
                        $variant="role"
                        onClick={() => setActivePlaceRole(activePlaceRole === f.code ? null : f.code)}
                      >
                        {f.labelKo}
                        <FacetCount>{f.count}</FacetCount>
                      </FacetChip>
                    ))}
                  </FacetRow>
                )}
              </FilterSection>
            </FilterArea>
          )}

          <ActionsBar>
            <WorksLink href="/discover/works">작품 목록</WorksLink>
          </ActionsBar>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTopic}|${activeRegion ?? ''}|${activePlaceRole ?? ''}|${activeWorkType ?? ''}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              <DiscoveryPlacesSection
                items={items}
                isLoading={isLoading}
                isError={isError}
                hasMore={hasMore}
                filterKey={`${activeTopic}|${activeRegion ?? ''}|${activePlaceRole ?? ''}|${activeWorkType ?? ''}`}
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
