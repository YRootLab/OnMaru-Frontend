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
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding-bottom: 64px;

  @media (min-width: 768px) {
    padding-top: 8px;
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
  padding: 34px 0 26px;
`;

const HeroBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(240, 100, 20, 0.07);
  border: 1px solid rgba(240, 100, 20, 0.16);
  color: ${lightPalette.juhong[600]};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 12px;

  [data-theme='dark'] & {
    background: rgba(255, 120, 40, 0.12);
    border-color: rgba(255, 120, 40, 0.24);
    color: ${lightPalette.juhong[400]};
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-hanok), serif;
  font-size: clamp(26px, 4.2vw, 36px);
  font-weight: 800;
  color: ${meok[900]};
  margin: 0 0 10px;
  letter-spacing: -0.035em;
  line-height: 1.25;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const HeroAccent = styled.span`
  color: ${lightPalette.juhong[600]};

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

const HeroSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[600]};
  margin: 0;
  line-height: 1.65;
  max-width: 540px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.65);
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
  padding: 6px 14px 6px 12px;
  border-radius: 9999px;
  background: rgba(240, 100, 20, 0.06);
  border: 1px solid rgba(240, 100, 20, 0.16);
  color: ${lightPalette.juhong[600]};
  font-size: ${fontSize.xs};
  font-weight: 700;
  text-decoration: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;

  &:hover {
    background: rgba(240, 100, 20, 0.12);
    border-color: rgba(240, 100, 20, 0.28);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }

  [data-theme='dark'] & {
    background: rgba(255, 120, 40, 0.12);
    border-color: rgba(255, 120, 40, 0.24);
    color: ${lightPalette.juhong[400]};

    &:hover {
      background: rgba(255, 120, 40, 0.18);
      border-color: rgba(255, 120, 40, 0.35);
    }
  }
`;

/* ─── facet filter chips ─── */
const FacetRow = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 0 0 12px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FacetChip = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 6px 13px;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? 'transparent' : 'rgba(0, 0, 0, 0.06)')};
  background: ${({ $active }) => ($active ? meok[900] : 'rgba(0, 0, 0, 0.04)')};
  color: ${({ $active }) => ($active ? '#ffffff' : meok[700])};
  font-size: 11.5px;
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease,
    transform 0.12s ease;

  &:hover {
    background: ${({ $active }) => ($active ? meok[800] : 'rgba(0, 0, 0, 0.07)')};
    color: ${({ $active }) => ($active ? '#ffffff' : meok[900])};
  }

  &:active {
    transform: scale(0.96);
  }

  [data-theme='dark'] & {
    border-color: ${({ $active }) => ($active ? 'transparent' : 'rgba(255, 255, 255, 0.08)')};
    background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.07)')};
    color: ${({ $active }) => ($active ? meok[900] : 'rgba(255, 255, 255, 0.7)')};

    &:hover {
      background: ${({ $active }) => ($active ? '#f0f0f0' : 'rgba(255, 255, 255, 0.12)')};
      color: ${({ $active }) => ($active ? meok[900] : '#ffffff')};
    }
  }
`;

const FacetCount = styled.span`
  font-size: 10px;
  font-weight: 700;
  opacity: 0.7;
  margin-left: 4px;
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

const REGION_KO: Record<string, string> = {
  // 한국관광공사 TourAPI areaCode
  '1': '서울',
  '2': '인천',
  '3': '대전',
  '4': '대구',
  '5': '광주',
  '6': '부산',
  '7': '울산',
  '8': '세종',
  '31': '경기',
  '32': '강원',
  '33': '충북',
  '34': '충남',
  '35': '전북',
  '36': '전남',
  '37': '경북',
  '38': '경남',
  '39': '제주',
  // 표준 행정구역 코드
  '11': '서울',
  '26': '부산',
  '27': '대구',
  '28': '인천',
  '29': '광주',
  '30': '대전',
  '41': '경기',
  '42': '강원',
  '43': '충북',
  '44': '충남',
  '45': '전북',
  '46': '전남',
  '47': '경북',
  '48': '경남',
  '50': '제주',
};

function formatRegionName(code: string, labelKo?: string): string {
  if (REGION_KO[code]) return REGION_KO[code];
  if (labelKo && REGION_KO[labelKo]) return REGION_KO[labelKo];
  if (labelKo) {
    return labelKo.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '');
  }
  return code;
}

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

  const regionFacets: FacetEntry[] = facets?.regionCode?.filter((f) => f.count > 0 && (f.labelKo || REGION_KO[f.code])) ?? [];
  const roleFacets: FacetEntry[] = facets?.placeRole?.filter((f) => f.count > 0 && f.labelKo) ?? [];
  const typeFacets: FacetEntry[] = facets?.type?.filter((f) => f.count > 0 && TYPE_KO[f.code as WorkType]) ?? [];
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
                  {formatRegionName(f.code, f.labelKo)}
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
