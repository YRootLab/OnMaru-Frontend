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
  padding-bottom: 80px;

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
  padding: 36px 0 28px;
`;

const HeroEyebrow = styled.p`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${lightPalette.juhong[500]};
  margin: 0 0 10px;

  [data-theme='dark'] & {
    color: ${lightPalette.juhong[400]};
  }
`;

const HeroTitle = styled.h1`
  font-family: var(--font-hanok), serif;
  font-size: clamp(28px, 4.5vw, 42px);
  font-weight: 800;
  color: ${meok[900]};
  margin: 0 0 12px;
  letter-spacing: -0.04em;
  line-height: 1.2;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const HeroAccent = styled.span`
  background: linear-gradient(135deg, ${lightPalette.juhong[500]} 0%, ${lightPalette.juhong[400]} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  [data-theme='dark'] & {
    background: linear-gradient(135deg, ${lightPalette.juhong[400]} 0%, ${lightPalette.juhong[300]} 100%);
    -webkit-background-clip: text;
    background-clip: text;
  }
`;

const HeroSub = styled.p`
  font-size: ${fontSize.sm};
  color: ${meok[500]};
  margin: 0;
  line-height: 1.7;
  max-width: 480px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const HeroDivider = styled.div`
  height: 1px;
  background: linear-gradient(to right, rgba(0,0,0,0.07) 0%, transparent 80%);
  margin-top: 24px;

  [data-theme='dark'] & {
    background: linear-gradient(to right, rgba(255,255,255,0.08) 0%, transparent 80%);
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

const FacetGroupLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${meok[400]};
  padding: 0 2px;

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.3);
  }
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

/* ─── stats + works link ─── */
const StatsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;
`;

const StatsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatsCount = styled.span`
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: ${meok[500]};
  letter-spacing: -0.01em;

  strong {
    font-weight: 700;
    color: ${meok[800]};

    [data-theme='dark'] & {
      color: rgba(255,255,255,0.85);
    }
  }

  [data-theme='dark'] & {
    color: rgba(255,255,255,0.4);
  }
`;

const LiveDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${lightPalette.cheongrok[500]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    background: ${lightPalette.cheongrok[400]};
  }
`;

const SkeletonCount = styled.div`
  width: 72px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.05) 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s infinite ease-in-out;

  [data-theme='dark'] & {
    background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.05) 75%);
    background-size: 200% 100%;
  }
`;

const WorksLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 13px 6px 10px;
  border-radius: 9999px;
  border: none;
  background: ${meok[900]};
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: -0.01em;
  box-shadow: ${ringShadow.light.button};
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;

  &:hover {
    background: ${meok[800]};
    box-shadow: ${ringShadow.light.buttonHover};
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
  }

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.85);
    box-shadow: ${ringShadow.dark.button};

    &:hover {
      background: rgba(255,255,255,0.18);
      box-shadow: ${ringShadow.dark.buttonHover};
    }
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

const UnavailableIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${meok[400]};

  [data-theme='dark'] & {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.28);
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
        <HeroEyebrow>K-Culture Discovery</HeroEyebrow>
        <HeroTitle>
          공간이 된{' '}
          <HeroAccent>문화의 기록</HeroAccent>
        </HeroTitle>
        <HeroSub>
          드라마·영화 촬영지부터 아티스트 성지까지, 근거가 확인된 K-Culture 장소를 탐색하세요.
        </HeroSub>
        <HeroDivider />
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
            <FilterArea>
              <FilterSection>
                {typeFacets.length > 0 && (
                  <>
                    <FacetGroupLabel>콘텐츠 유형</FacetGroupLabel>
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
                  </>
                )}
                {regionFacets.length > 0 && (
                  <>
                    <FacetGroupLabel>지역</FacetGroupLabel>
                    <FacetRow aria-label="지역 필터">
                      {regionFacets.map((f) => (
                        <FacetChip
                          key={`r-${f.code}`}
                          type="button"
                          $active={activeRegion === f.code}
                          $variant="region"
                          onClick={() => setActiveRegion(activeRegion === f.code ? null : f.code)}
                        >
                          <HugeiconsIcon icon={Location01Icon} size={10} strokeWidth={2} aria-hidden="true" />
                          {formatRegionName(f.code, f.labelKo)}
                          <FacetCount>{f.count}</FacetCount>
                        </FacetChip>
                      ))}
                    </FacetRow>
                  </>
                )}
                {roleFacets.length > 0 && (
                  <>
                    <FacetGroupLabel>장소 유형</FacetGroupLabel>
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
                  </>
                )}
              </FilterSection>
            </FilterArea>
          )}

          <StatsBar>
            <StatsLeft>
              <LiveDot />
              <StatsCount>
                {isLoading && items.length === 0 ? (
                  <SkeletonCount />
                ) : (
                  <>장소 <strong>{matchingCount.toLocaleString()}</strong>곳</>
                )}
              </StatsCount>
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
