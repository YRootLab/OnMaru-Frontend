'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { meok, fontSize, ringShadow } from '@/design-system/tokens';
import TopicTabBar from './presentation/components/TopicTabBar';
import DiscoveryPlacesSection from './presentation/components/DiscoveryPlacesSection';
import FeaturedCarousel from './presentation/components/FeaturedCarousel';
import HorizontalSection from './presentation/components/HorizontalSection';
import { useDiscoveryTopics } from './presentation/hooks/useDiscoveryTopics';
import { useDiscoveryPlaces } from './presentation/hooks/useDiscoveryPlaces';
import { selectFeaturedPlaces } from './domain/discoveryPresentation';
import { getLocalizedRegionName } from './presentation/utils/regionLabel';
import type { DiscoveryPlaceSummary, TopicCode, WorkType } from './domain/types';

const SECTION_WORK_TYPES: WorkType[] = ['DRAMA', 'MOVIE', 'MUSIC_VIDEO', 'ARTIST', 'VARIETY'];

const PageWrap = styled.div`
  width: min(calc(100% - 32px), 1140px);
  max-width: 1140px;
  margin: 0 auto;
  padding-top: 64px;
  padding-bottom: 80px;

  @media (min-width: 768px) {
    padding-top: 80px;
  }

  @media (max-width: 1024px) {
    width: calc(100% - 32px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 32px);
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

/* ─── search ─── */
const SearchRow = styled.div`
  padding: 16px 0 14px;
  position: relative;
`;

const SearchIconWrap = styled.span`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: ${meok[400]};
  pointer-events: none;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.30);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  font-size: ${fontSize.sm};
  font-weight: 500;
  color: ${meok[900]};
  background: #f5f5f4;
  border: none;
  border-radius: 12px;
  padding: 12px 16px 12px 42px;
  outline: none;
  letter-spacing: -0.01em;
  box-shadow: ${ringShadow.light.input};
  transition: box-shadow 0.15s ease, background 0.15s ease;

  &::placeholder {
    color: ${meok[400]};
    font-weight: 400;
  }

  &:focus {
    box-shadow: ${ringShadow.light.focusJuhong};
    background: #ffffff;
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.90);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: ${ringShadow.dark.input};

    &::placeholder {
      color: rgba(255, 255, 255, 0.28);
    }

    &:focus {
      box-shadow: ${ringShadow.dark.focusJuhong};
      background: rgba(255, 255, 255, 0.09);
    }
  }
`;

/* ─── section divider ─── */
const SectionDivider = styled.div`
  height: 1px;
  background: linear-gradient(to right, ${meok[200]}, transparent);
  margin: 40px 0 0;

  [data-theme='dark'] & {
    background: linear-gradient(to right, rgba(255, 255, 255, 0.08), transparent);
  }
`;

const SectionGroupLabel = styled.h3`
  font-size: ${fontSize.xs};
  font-weight: 700;
  color: ${meok[400]};
  margin: 20px 0 0;
  letter-spacing: 0.02em;
  text-transform: uppercase;

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.25);
  }
`;

/* ─── actions ─── */
const ActionsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 0 16px;
`;

const WorksLink = styled(Link)`
  font-size: ${fontSize.xs};
  font-weight: 600;
  color: ${meok[500]};
  text-decoration: none;
  letter-spacing: -0.01em;
  transition: color 0.15s ease;

  &:hover {
    color: ${meok[800]};
  }

  [data-theme='dark'] & {
    color: rgba(255, 255, 255, 0.38);

    &:hover {
      color: rgba(255, 255, 255, 0.7);
    }
  }
`;

/* ─── unavailable ─── */
const UnavailableBox = styled.div`
  padding: 72px 24px;
  text-align: center;
  border-radius: 20px;
  background: #f5f5f4;
  margin-top: 8px;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.04);
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

export interface KCultureDiscoveryProps {
  initialTopic?: TopicCode | 'all';
  workId?: string;
}

export default function KCultureDiscovery({ initialTopic = 'all', workId }: KCultureDiscoveryProps) {
  const t = useTranslations('kCulture');
  const router = useRouter();
  const [activeTopic, setActiveTopic] = useState<TopicCode | 'all'>(initialTopic);
  const [searchQuery, setSearchQuery] = useState('');

  const { topics, isLoading: topicsLoading } = useDiscoveryTopics();
  const { items, isLoading, isError, hasMore, loadMore } = useDiscoveryPlaces({
    topic: activeTopic === 'all' ? undefined : activeTopic,
    workId,
  });

  const handleTopicChange = (code: TopicCode | 'all') => {
    setActiveTopic(code);
    setSearchQuery('');
  };

  const handlePlaceClick = (place: DiscoveryPlaceSummary) =>
    router.push(`/discover/places/${encodeURIComponent(place.placeId)}`);

  const q = searchQuery.trim();
  const qLower = q.toLowerCase();
  const filteredItems = q
    ? items.filter(
        (p) =>
          p.name.toLowerCase().includes(qLower) ||
          (p.featuredRelation?.workTitle.toLowerCase().includes(qLower) ?? false),
      )
    : items;

  const isAllNoFilter = activeTopic === 'all' && !q && !workId;

  const { featured: featuredPlaces, rest: sectionPool } = useMemo(
    () => (isAllNoFilter ? selectFeaturedPlaces(items, 5) : { featured: [], rest: [] }),
    [isAllNoFilter, items],
  );

  const grouped = useMemo(() => {
    if (!isAllNoFilter || sectionPool.length < 2) return null;

    const byType = new Map<WorkType, DiscoveryPlaceSummary[]>();
    const byRegion = new Map<string, DiscoveryPlaceSummary[]>();

    sectionPool.forEach((place) => {
      const type = place.featuredRelation?.type;
      if (type) {
        if (!byType.has(type)) byType.set(type, []);
        byType.get(type)!.push(place);
      }
      const regionName = getLocalizedRegionName(place.region, t);
      if (regionName) {
        if (!byRegion.has(regionName)) byRegion.set(regionName, []);
        byRegion.get(regionName)!.push(place);
      }
    });

    return { byType, byRegion };
  }, [isAllNoFilter, sectionPool, t]);

  const typeSections = grouped
    ? SECTION_WORK_TYPES.filter((type) => (grouped.byType.get(type)?.length ?? 0) >= 2).map(
        (type) => ({
          key: type,
          label: t(`typeSectionLabel.${type}`),
          items: grouped.byType.get(type)!,
        }),
      )
    : [];

  const regionSections = grouped
    ? [...grouped.byRegion.entries()]
        .filter(([, v]) => v.length >= 2)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5)
        .map(([region, regionItems]) => ({ label: region, items: regionItems }))
    : [];

  const hasSections = typeSections.length > 0 || regionSections.length > 0;
  const serviceDown = isError && items.length === 0 && !isLoading;

  return (
    <PageWrap>
      <Hero>
        <HeroTitle>{t('heroTitle')}</HeroTitle>
        <HeroSub>{t('heroSub')}</HeroSub>
      </Hero>

      {serviceDown ? (
        <UnavailableBox role="status">
          <UnavailableTitle>{t('serviceTitle')}</UnavailableTitle>
          <UnavailableSub>{t('serviceSub')}</UnavailableSub>
        </UnavailableBox>
      ) : (
        <>
          <SearchRow>
            <SearchIconWrap aria-hidden="true">
              <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={1.8} />
            </SearchIconWrap>
            <SearchInput
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={t('searchLabel')}
            />
          </SearchRow>

          <TopicTabBar
            topics={topics}
            activeCode={activeTopic}
            isLoading={topicsLoading}
            onChange={handleTopicChange}
          />

          <ActionsBar>
            <WorksLink href="/discover/works">{t('worksLink')}</WorksLink>
          </ActionsBar>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTopic}|${q}|${workId ?? ''}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              {isAllNoFilter && !isLoading && featuredPlaces.length > 0 && hasSections ? (
                <>
                  <FeaturedCarousel places={featuredPlaces} onPlaceClick={handlePlaceClick} />

                  {typeSections.map((s) => (
                    <HorizontalSection
                      key={s.key}
                      label={s.label}
                      items={s.items}
                      onPlaceClick={handlePlaceClick}
                    />
                  ))}

                  {regionSections.length > 0 && (
                    <>
                      <SectionDivider />
                      <SectionGroupLabel>{t('regionGroupLabel')}</SectionGroupLabel>
                      {regionSections.map((s) => (
                        <HorizontalSection
                          key={s.label}
                          label={s.label}
                          items={s.items}
                          onPlaceClick={handlePlaceClick}
                        />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <DiscoveryPlacesSection
                  items={filteredItems}
                  isLoading={isLoading}
                  isError={isError}
                  hasMore={hasMore && !q}
                  filterKey={`${activeTopic}|${q}|${workId ?? ''}`}
                  onLoadMore={loadMore}
                  onPlaceClick={handlePlaceClick}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </PageWrap>
  );
}
