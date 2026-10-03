'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, RotateCcwIcon } from '@hugeicons/core-free-icons'
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { SorimaruArchiveBrowse } from './SorimaruArchiveBrowse';
import { SorimaruArchiveMetaBar } from './SorimaruArchiveMetaBar';
import { SorimaruPagination } from './SorimaruPagination';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { SorimaruAutoSliceRail } from '@/private/core-ui/sorimaru/SorimaruAutoSliceRail';
import { SorimaruEditorialRail } from '@/private/core-ui/sorimaru/SorimaruEditorialRail';
import { SoundConstellationSection } from '@/private/core-ui/sorimaru/SoundConstellationSection';
import { LocalMiniPlayer } from '@/private/core-ui/sorimaru/LocalMiniPlayer';
import { SorimaruAtmosphereBackground } from './SorimaruAtmosphereBackground';
import type { SorimaruBackgroundVariant } from '@/features/sorimaru-audio/background/sorimaruBackground.types';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import SharedSectionHeading from '@/shared/components/SectionHeading';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SORIMARU_REGION_CHIPS } from '@/features/sorimaru-audio/data/sorimaruCategoryData';
import type { SorimaruRepository } from '@/features/sorimaru-audio/application/SorimaruRepository';
import type { SorimaruStoryPage, SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { SorimaruDependencyProvider, useSorimaruApiService } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { findNearbySorimaruStories, loadedEditorialRailStories, type SorimaruSelectionIntent } from './sorimaruInitialLoad';
import { catalogCategoryForSelection, useSorimaruCatalog } from '@/features/sorimaru-audio/hooks/useSorimaruCatalog';
import { useSorimaruDetailSelection } from '@/features/sorimaru-audio/hooks/useSorimaruDetailSelection';
import { useSorimaruRegionStories } from '@/features/sorimaru-audio/presentation/hooks/useSorimaruRegionStories';
import { useViewportActivation } from '@/shared/hooks/useViewportActivation';
import { SOUND_CONSTELLATION_API_ROOT_MARGIN } from '@/private/core-ui/sorimaru/soundConstellationMotion';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';
import { HanjiDeckleEdge } from '@/shared/components/HanjiDeckleEdge';

const AllStoriesModal = dynamic(
  () => import('./AllStoriesModal').then((module) => module.AllStoriesModal),
  { ssr: false },
);



const FeatureContainer = styled.div`
  position: relative;
  isolation: isolate;
  min-height: 100dvh;
  padding-bottom: 6rem;
  color: ${meok[900]};
  font-family: var(--font-hanok);
  background-color: transparent;
  transition: background-color 0.3s ease, color 0.3s ease;

  [data-theme='dark'] & {
    color: ${meok[100]};
    background-color: ${surface.dark.app};
  }

  &::selection {
    background-color: ${palette.juhong[100]};
    color: ${palette.juhong[800]};
  }
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 10;
  min-width: 0;
`;

const SorimaruSectionReveal = styled(VesselReveal)`
  width: 100%;
  padding: 2.5rem 0;

  @media (min-width: 640px) {
    padding: 3.5rem 0;
  }
`;

const ErrorAlert = styled.div`
  position: fixed;
  left: 50%;
  top: 5rem;
  z-index: 60;
  display: flex;
  width: min(92vw, 460px);
  transform: translateX(-50%);
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-radius: 1rem;
  background-color: #f8f8f7;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${meok[700]};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    color: ${meok[200]};
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const ErrorAlertMessage = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
`;

const ErrorAlertIcon = styled(HugeiconsIcon)`
  flex-shrink: 0;
  color: ${palette.juhong[600]};

  [data-theme='dark'] & {
    color: ${palette.juhong[400]};
  }
`;

const RetryButton = styled.button`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background-color: ${palette.juhong[500]};
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${palette.juhong[600]};
  }
`;

const MainSections = styled.main`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2rem;

  @media (min-width: 640px) {
    gap: 3rem;
  }

  @media (max-width: 480px) {
    gap: 1.5rem;
  }
`;

const HeroStageDiv = styled.div`
  padding-top: 2.5rem;
  padding-bottom: clamp(40px, 5vh, 64px);

  @media (min-width: 768px) {
    padding-top: clamp(3.5rem, 6vh, 4rem);
  }

  @media (max-width: 480px) {
    padding-top: 2rem;
    padding-bottom: clamp(28px, 4vh, 48px);
  }
`;

const SectionGradientTitle = styled(SharedSectionHeading)``;

const CenteredContainer = styled.div`
  margin-left: auto;
  margin-right: auto;
  width: min(calc(100% - 40px), 1140px);
  max-width: 1140px;
  padding-left: 0;
  padding-right: 0;

  @media (max-width: 1024px) {
    width: calc(100% - 28px);
  }

  @media (max-width: 640px) {
    width: calc(100% - 24px);
  }
`;

const NearbyHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 0.25rem;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
  }
`;






const SectionDescription = styled.p<{ $notice?: boolean }>`
  margin-top: 6px;
  max-width: 36rem;
  font-size: 0.875rem;
  line-height: 1.25rem;

  ${({ $notice }) =>
    $notice
      ? `
        white-space: normal;
        font-weight: 600;
        color: ${palette.juhong[700]};
      `
      : `
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: ${meok[700]};
      `}

  [data-theme='dark'] & {
    color: ${({ $notice }) => ($notice ? palette.juhong[300] : meok[400])};
  }
`;

const SectionSubText = styled.span`
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const SectionStrongText = styled.strong`
  display: block;
  font-weight: 600;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[200]};
  }
`;

const LocationButton = styled.button`
  display: inline-flex;
  height: 2rem;
  align-self: flex-end;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.55);
  padding: 0 0.75rem;
  font-size: ${fontSize.micro};
  font-weight: 500;
  color: ${meok[700]};
  border: 1px solid rgba(33, 30, 25, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;

  [data-theme='dark'] & {
    background-color: rgba(33, 39, 52, 0.7);
    color: ${meok[200]};
    border-color: rgba(255, 255, 255, 0.1);
  }

  &:hover {
    transform: translateY(-2px);
    background-color: #ffffff;
    color: ${meok[900]};

    [data-theme='dark'] & {
      background-color: ${surface.dark.elevated};
      color: #ffffff;
    }
  }

  &:disabled {
    cursor: wait;
    opacity: 0.5;
  }
`;

export interface SorimaruAudioFeatureProps {
  apiService?: SorimaruRepository;
  initialPage?: SorimaruStoryPage;
  initialNearbyStories?: SorimaruStorySummary[];
  initialHeroStorySets?: Record<string, SorimaruStorySummary[]>;
  regionCode?: string;
  onLocationChange?: (latitude: number, longitude: number) => void;
  backgroundVariant?: SorimaruBackgroundVariant;
}

export const SorimaruAudioFeature: React.FC<SorimaruAudioFeatureProps> = ({
  apiService,
  initialPage,
  initialNearbyStories,
  initialHeroStorySets,
  regionCode,
  onLocationChange,
  backgroundVariant,
}) => {
  const searchParams = useSearchParams();
  const trackParam = searchParams.get('track');
  const keywordParam = searchParams.get('keyword') || searchParams.get('query');
  const titleParam = searchParams.get('title');
  const stidParam = searchParams.get('stid');
  const autoPlayParam = searchParams.get('autoPlay');
  const activeApiService = useSorimaruApiService(apiService);
  const { ref: regionSectionRef, isActive: regionSectionActive } = useViewportActivation<HTMLDivElement>({
    rootMargin: SOUND_CONSTELLATION_API_ROOT_MARGIN,
  });
  const regionStories = useSorimaruRegionStories(activeApiService, regionSectionActive);
  const selectedCategory = useSorimaruAudioStore((s) => s.selectedCategory);
  const searchQuery = useSorimaruAudioStore((s) => s.searchQuery);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const selectAndLoadStory = useSorimaruAudioStore((s) => s.selectAndLoadStory);
  const hydrateSavedStories = useSorimaruAudioStore((s) => s.hydrateSavedStories);
  const regionName = SORIMARU_REGION_CHIPS.find((name) => name === selectedCategory);
  const categoryScope = catalogCategoryForSelection(selectedCategory);
  const { catalog, initialData, initialError, initialLoading, currentPage, goToPage, retry } = useSorimaruCatalog(
    activeApiService, categoryScope, regionCode, initialPage, regionName,
  );
  const selectFromIntent = useSorimaruDetailSelection(activeApiService);
  const [nearbyOverride, setNearbyOverride] = useState<SorimaruStorySummary[] | null>(null);
  const nearbyStories = nearbyOverride ?? initialData?.nearbyStories ?? initialNearbyStories ?? initialPage?.items ?? [];
  const heroStorySets = initialData ? { '추천': initialData.heroStories } : initialHeroStorySets ?? {};
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('기본 위치');
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 반경 3km의 실제 오디오를 찾아드려요.');

  const [locationNotice, setLocationNotice] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    void hydrateSavedStories();
  }, [hydrateSavedStories]);

  const hasAutoLocatedRef = useRef(false);
  useEffect(() => {
    if (initialLoading || hasAutoLocatedRef.current || !navigator.geolocation) return;
    hasAutoLocatedRef.current = true;
    const tryLocate = () => handleLocate();
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(() => tryLocate()).catch(tryLocate);
    } else {
      tryLocate();
    }
  }, [initialLoading]);

  const [selectionError, setSelectionError] = useState<Error | null>(null);
  const pendingSelectionRef = useRef<(SorimaruSelectionIntent & { autoPlay: boolean }) | null>(null);
  const pendingRailSelectionRef = useRef<SorimaruStorySummary | null>(null);
  const currentCatalogPage = catalog.pages[currentPage - 1];
  const storyList = (currentCatalogPage?.items ?? []).filter((story) => {
    if (!searchQuery) return true;
    const keyword = searchQuery.toLowerCase();
    return [story.title, story.audioTitle, story.region.name, ...story.contentTags]
      .some((value) => value.toLowerCase().includes(keyword));
  });
  const editorialRailStories = React.useMemo(() => loadedEditorialRailStories(catalog.pages), [catalog.pages]);
  const apiError = initialError || catalog.error || selectionError
    ? '소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
    : null;
  const lastPage = catalog.pages.at(-1);
  const totalArchivePages = catalog.pages.length + (lastPage?.hasMore && lastPage.nextCursor ? 1 : 0);
  const handleRailStorySelection = useCallback((summary: SorimaruStorySummary, intent: 'play') => {
    pendingRailSelectionRef.current = summary;
    void selectAndLoadStory(summary, intent, activeApiService)
      .then(() => {
        if (pendingRailSelectionRef.current !== summary) return;
        pendingRailSelectionRef.current = null;
        setSelectionError(null);
      })
      .catch((reason: unknown) => {
        if (pendingRailSelectionRef.current !== summary) return;
        setSelectionError(reason instanceof Error ? reason : new Error('Sorimaru detail request failed'));
      });
  }, [activeApiService, selectAndLoadStory]);

  const handleRegionStorySelection = useCallback((summary: SorimaruStorySummary) => {
    const player = useSorimaruAudioStore.getState();
    if (player.currentStory?.storyId === summary.storyId) player.setIsPlaying(!player.isPlaying);
    else handleRailStorySelection(summary, 'play');
  }, [handleRailStorySelection]);

  const retryRegionRequests = () => {
    if (regionStories.groupsState.error) void regionStories.retryGroups();
    else if (regionStories.regionStoriesState.error) void regionStories.retryRegion();
  };

  useEffect(() => {
    let active = true;
    const intent = { stid: stidParam, title: titleParam, keyword: keywordParam, track: trackParam, autoPlay: autoPlayParam === 'true' };
    pendingSelectionRef.current = intent;
    const loadedStories = [...(initialData?.archive?.items ?? initialPage?.items ?? []), ...catalog.pages.flatMap((page) => page.items)];
    void selectFromIntent(loadedStories, intent).then(() => {
      if (active) setSelectionError(null);
    }).catch((reason: unknown) => {
      if (active) setSelectionError(reason instanceof Error ? reason : new Error('Sorimaru detail request failed'));
    });
    return () => { active = false; };
  }, [stidParam, titleParam, keywordParam, trackParam, autoPlayParam, initialData, initialPage, catalog.pages, selectFromIntent]);

  const retryApiRequests = () => {
    if (initialError || catalog.error) {
      void retry();
    } else if (selectionError && pendingRailSelectionRef.current) {
      setSelectionError(null);
      handleRailStorySelection(pendingRailSelectionRef.current, 'play');
    } else if (selectionError && pendingSelectionRef.current) {
      setSelectionError(null);
      const loadedStories = [...(initialData?.archive?.items ?? initialPage?.items ?? []), ...catalog.pages.flatMap((page) => page.items)];
      void selectFromIntent(loadedStories, pendingSelectionRef.current, true)
        .then(() => setSelectionError(null))
        .catch((reason: unknown) => setSelectionError(reason instanceof Error ? reason : new Error('Sorimaru detail request failed')));
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationMessage('이 브라우저에서는 위치 기반 이야기를 사용할 수 없어요.');
      setLocationNotice(true);
      return;
    }

    setIsLocating(true);
    setLocationNotice(false);
    setLocationMessage('현재 위치를 확인하고 주변 이야기를 찾는 중이에요.');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const stories = findNearbySorimaruStories(initialData?.archive?.items ?? initialPage?.items ?? [], coords.latitude, coords.longitude);
        if (onLocationChange) onLocationChange(coords.latitude, coords.longitude);
        if (stories.length > 0) {
          setNearbyOverride(stories);
          setLocationLabel('현재 위치 기준, 반경 3km');
          setLocationMessage(`${stories.length}개의 이야기를 찾았어요. 가까운 장소부터 들려드릴게요.`);
          setLocationNotice(false);
        } else {
          setLocationMessage('반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드릴게요.');
          setLocationNotice(true);
        }
        setIsLocating(false);
      },
      () => {
        setLocationMessage('브라우저 설정 → 위치 → 허용으로 바꾸면 주변 이야기를 들을 수 있어요.');
        setLocationNotice(true);
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <SorimaruDependencyProvider apiService={activeApiService}>
      <FeatureContainer>
        {}
        <SorimaruAtmosphereBackground
          variant={backgroundVariant}
          selectedCategory={selectedCategory}
          isPlaying={isPlaying}
        />
        <ContentLayer>
          {apiError && (
            <ErrorAlert role="alert">
              <ErrorAlertMessage>
                <ErrorAlertIcon icon={AlertCircleIcon} size={18} aria-hidden="true" />
                <span>{apiError}</span>
              </ErrorAlertMessage>
              <RetryButton type="button" onClick={retryApiRequests}>
                <HugeiconsIcon icon={RotateCcwIcon} size={14} aria-hidden="true" />
                다시 시도
              </RetryButton>
            </ErrorAlert>
          )}

          <MainSections>
            {}
            <HeroStageDiv data-sorimaru-stage="featured">
              <SorimaruAutoSliceRail stories={storyList} storySets={heroStorySets} />
            </HeroStageDiv>

            {}
            <VesselReveal style={{ minHeight: '660px', paddingBottom: '2.5rem' }}>
              <div style={{ marginTop: '1rem', width: '100%' }} data-sorimaru-stage="themes">
                <CenteredContainer>
                  <div style={{ paddingTop: '1rem' }}>
                    <SectionGradientTitle
                      headingLevel={3}
                      title="장면을 따라 걷는 소리"
                    />
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <SorimaruEditorialRail
                      stories={editorialRailStories}
                      storySets={heroStorySets}
                      isLoading={initialLoading || catalog.status === 'loading'}
                      error={catalog.error}
                      onRetry={retryApiRequests}
                      onSelectStory={handleRailStorySelection}
                    />
                  </div>
                </CenteredContainer>
              </div>
            </VesselReveal>

            <SorimaruSectionReveal style={{ minHeight: '760px' }}>
              <div ref={regionSectionRef} style={{ width: '100%' }}>
                <SoundConstellationSection
                  groupsState={regionStories.groupsState}
                  regionStoriesState={regionStories.regionStoriesState}
                  selectedRegionId={regionStories.selectedRegionId}
                  onSelectRegion={regionStories.selectRegion}
                  onLoadMore={regionStories.loadNextRegionPage}
                  onSelectStory={handleRegionStorySelection}
                  onRetry={retryRegionRequests}
                />
              </div>
            </SorimaruSectionReveal>

            {}
            <SorimaruSectionReveal style={{ minHeight: '440px' }}>
              <section
                aria-labelledby="nearby-stories-heading"
                style={{ width: '100%' }}
                data-sorimaru-stage="nearby"
              >
                <CenteredContainer>
                  <NearbyHeader>
                    <div style={{ minWidth: 0 }}>
                      <SectionGradientTitle
                        id="nearby-stories-heading"
                        title="오늘, 여기에서"
                      />
                      <SectionDescription $notice={locationNotice}>
                        {locationMessage}
                      </SectionDescription>
                    </div>
                    <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <span style={{ textAlign: 'right', fontSize: fontSize.micro, lineHeight: '1rem' }}>
                        <SectionSubText style={{ display: 'block' }}>{locationLabel}</SectionSubText>
                        <SectionStrongText>
                          내 주변 오디오 {nearbyStories.length}개
                        </SectionStrongText>
                      </span>
                      <LocationButton
                        type="button"
                        onClick={handleLocate}
                        disabled={isLocating}
                      >
                        {isLocating ? '위치 확인 중…' : '내 위치 사용'}
                        {!isLocating && <span aria-hidden="true" style={{ fontSize: '0.75rem', lineHeight: 1 }}>?</span>}
                      </LocationButton>
                    </div>
                  </NearbyHeader>

                  <div style={{ marginTop: '1.25rem' }}>
                    <StoryCarousel stories={nearbyStories} isLoading={initialLoading || isLocating} />
                  </div>
                </CenteredContainer>
              </section>
            </SorimaruSectionReveal>

            {}
            <SorimaruSectionReveal id="sorimaru-archive">
              <section
                style={{ width: '100%' }}
                data-sorimaru-stage="archive"
              >
                <CenteredContainer>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <SectionGradientTitle
                      id="archive-heading"
                      title="소리로 만나는 한국"
                    />
                    <SectionDescription>
                      처마 끝 바람 소리부터 천년 고도의 숨결까지, 마음에 머무는 이야기 트랙.
                    </SectionDescription>
                  </div>

                  <div>
                    <CategoryTagFilter />
                  </div>
                  <div>
                    <SorimaruArchiveMetaBar
                      resultCount={storyList.length}
                      totalCount={searchQuery ? undefined : currentCatalogPage?.totalCount}
                    />
                  </div>

                  <div style={{ position: 'relative', overflow: 'visible' }}>
                    <SorimaruArchiveBrowse
                      stories={storyList}
                      isLoading={catalog.status === 'loading'}
                      error={catalog.error}
                      onRetry={retryApiRequests}
                    />
                  </div>

                  <div>
                    <SorimaruPagination
                      currentPage={currentPage}
                      totalPages={totalArchivePages}
                      onPageChange={(page) => { void goToPage(page); }}
                      isLoading={catalog.status === 'loading' || catalog.loadingNext}
                    />
                  </div>
                </CenteredContainer>
              </section>
            </SorimaruSectionReveal>
          </MainSections>
        </ContentLayer>

        <LocalMiniPlayer />
        {isModalOpen && (
          <AllStoriesModal isOpen onClose={() => setIsModalOpen(false)} allStories={storyList} />
        )}
      </FeatureContainer>
    </SorimaruDependencyProvider>
  );
};
