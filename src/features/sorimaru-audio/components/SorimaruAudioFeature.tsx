'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { SorimaruArchiveBrowse } from './SorimaruArchiveBrowse';
import { SorimaruArchiveMetaBar } from './SorimaruArchiveMetaBar';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { SorimaruAutoSliceRail } from '@/private/core-ui/sorimaru/SorimaruAutoSliceRail';
import { SorimaruEditorialRail } from '@/private/core-ui/sorimaru/SorimaruEditorialRail';
import { SoundConstellationSection } from '@/private/core-ui/sorimaru/SoundConstellationSection';
import { LocalMiniPlayer } from '@/private/core-ui/sorimaru/LocalMiniPlayer';
import { SorimaruAtmosphereBackground } from './SorimaruAtmosphereBackground';
import type { SorimaruBackgroundVariant } from '@/features/sorimaru-audio/background/sorimaruBackground.types';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import type { SorimaruRepository } from '@/features/sorimaru-audio/application/SorimaruRepository';
import type { SorimaruStoryPage, SorimaruStorySummary } from '@/features/sorimaru-audio/domain/sorimaruStory';
import { SorimaruDependencyProvider, useSorimaruApiService } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { findNearbySorimaruStories, loadNextSorimaruPage, loadSorimaruInitialData } from './sorimaruInitialLoad';
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

const ErrorAlertIcon = styled(AlertCircle)`
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
  padding-top: 3.25rem;
  padding-bottom: clamp(40px, 5vh, 64px);

  @media (min-width: 768px) {
    padding-top: clamp(6rem, 10vh, 8rem);
  }

  @media (max-width: 480px) {
    padding-top: 2.5rem;
    padding-bottom: clamp(28px, 4vh, 48px);
  }
`;

const SectionGradientTitle = styled.h2`
  display: inline-block;
  background: linear-gradient(to right, #211e19, #403b35, #6a6158);
  -webkit-background-clip: text;
  background-clip: text;
  font-family: var(--font-hanok);
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 700;
  letter-spacing: -0.045em;
  color: transparent;

  [data-theme='dark'] & {
    background: linear-gradient(to right, #ffffff, #d9d9d7, #b0b8c1);
    -webkit-background-clip: text;
    background-clip: text;
  }
`;

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
    background-color: rgba(45, 41, 36, 0.7);
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

type CatalogState = {
  pages: SorimaruStoryPage[];
  status: 'loading' | 'error' | 'empty' | 'success';
  error: Error | null;
  loadingNext: boolean;
};

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
  const activeApiService = useSorimaruApiService(apiService);
  const selectedCategory = useSorimaruAudioStore((s) => s.selectedCategory);
  const searchQuery = useSorimaruAudioStore((s) => s.searchQuery);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const hydrateSavedStories = useSorimaruAudioStore((s) => s.hydrateSavedStories);
  const [nearbyStories, setNearbyStories] = useState<SorimaruStorySummary[]>(() => initialNearbyStories || initialPage?.items || []);
  const [heroStorySets, setHeroStorySets] = useState<Record<string, SorimaruStorySummary[]>>(() => initialHeroStorySets || {});
  const [catalog, setCatalog] = useState<CatalogState>(() => ({
    pages: initialPage ? [initialPage] : [],
    status: initialPage ? (initialPage.items.length ? 'success' : 'empty') : 'loading',
    error: null,
    loadingNext: false,
  }));
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('기본 위치');
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 반경 3km의 실제 오디오를 찾아드려요.');

  const [locationNotice, setLocationNotice] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    void hydrateSavedStories();
  }, [hydrateSavedStories]);

  const [isNearbyLoading, setIsNearbyLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [initialLoadVersion, setInitialLoadVersion] = useState(0);
  const initialLoadCompleteRef = useRef(false);
  const initialArchiveRef = useRef<SorimaruStoryPage | null>(initialPage ?? null);
  const pagesRef = useRef<SorimaruStoryPage[]>(initialPage ? [initialPage] : []);
  const requestGenerationRef = useRef(0);
  const loadingNextRef = useRef(false);
  const scopeKey = `${selectedCategory}\u0000${regionCode ?? ''}`;
  const scopeKeyRef = useRef(scopeKey);
  scopeKeyRef.current = scopeKey;
  const storyList = catalog.pages.flatMap((page) => page.items).filter((story) => {
    if (!searchQuery) return true;
    const keyword = searchQuery.toLowerCase();
    return [story.title, story.audioTitle, story.region.name, ...story.contentTags]
      .some((value) => value.toLowerCase().includes(keyword));
  });
  const handleApiError = useCallback(() => {
    setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
  }, []);

  useEffect(() => {
    let isMounted = true;
    initialLoadCompleteRef.current = false;
    requestGenerationRef.current += 1;
    loadingNextRef.current = false;
    if (retryToken > 0) initialArchiveRef.current = null;

    async function loadInitialContent() {
      try {
        const result = initialPage && retryToken === 0
          ? { archive: initialPage, heroStories: initialPage.items.slice(0, 7), nearbyStories: initialPage.items, archiveError: null }
          : await loadSorimaruInitialData(activeApiService);

        if (isMounted) {
          setNearbyStories(result.nearbyStories);
          setHeroStorySets({ '추천': result.heroStories });
          if (result.archive) {
            initialArchiveRef.current = result.archive;
            if (scopeKeyRef.current === '전체\u0000') {
              pagesRef.current = [result.archive];
              setCatalog({ pages: [result.archive], status: result.archive.items.length ? 'success' : 'empty', error: null, loadingNext: false });
              setApiError(null);
            }
          } else if (scopeKeyRef.current === '전체\u0000') {
            pagesRef.current = [];
            setCatalog({ pages: [], status: 'error', error: result.archiveError, loadingNext: false });
          }
          if (result.archiveError) {
            setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
          }
          initialLoadCompleteRef.current = true;
          setInitialLoadVersion((version) => version + 1);
        }
      } catch {
        if (isMounted) {
          setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
          setCatalog({ pages: [], status: 'error', error: new Error('Sorimaru archive request failed'), loadingNext: false });
        }
      } finally {
        if (isMounted) setIsNearbyLoading(false);
      }
    }

    loadInitialContent();

    return () => {
      isMounted = false;
    };
  }, [activeApiService, initialPage, retryToken]);

  useEffect(() => {
    let isMounted = true;
    if (!initialLoadCompleteRef.current) return;
    const generation = ++requestGenerationRef.current;
    const requestedScope = scopeKey;
    loadingNextRef.current = false;

    const isInitialScope = selectedCategory === '전체' && !regionCode;
    if (isInitialScope && initialArchiveRef.current) {
      const initialArchive = initialArchiveRef.current;
      pagesRef.current = [initialArchive];
      setCatalog({ pages: [initialArchive], status: initialArchive.items.length ? 'success' : 'empty', error: null, loadingNext: false });
      return;
    }
    if (isInitialScope) return;

    async function fetchArchiveData() {
      pagesRef.current = [];
      setCatalog({ pages: [], status: 'loading', error: null, loadingNext: false });
      try {
        const page = await activeApiService.listStories({
          language: 'ko-KR', limit: 12,
          ...(selectedCategory === '전체' ? {} : { category: selectedCategory }),
          ...(regionCode ? { regionCode } : {}),
        });

        if (isMounted && generation === requestGenerationRef.current && requestedScope === scopeKeyRef.current) {
          pagesRef.current = [page];
          setCatalog({ pages: [page], status: page.items.length ? 'success' : 'empty', error: null, loadingNext: false });
          setApiError(null);
        }
      } catch (reason) {
        if (isMounted && generation === requestGenerationRef.current && requestedScope === scopeKeyRef.current) {
          const error = reason instanceof Error ? reason : new Error('Sorimaru archive request failed');
          setCatalog({ pages: [], status: 'error', error, loadingNext: false });
          setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        }
      }
    }

    fetchArchiveData();

    return () => {
      isMounted = false;
    };
  }, [activeApiService, initialLoadVersion, selectedCategory, regionCode, retryToken, scopeKey]);

  const loadNextPage = useCallback(async () => {
    const lastPage = pagesRef.current.at(-1);
    if (loadingNextRef.current || !lastPage?.hasMore || !lastPage.nextCursor) return;
    const generation = requestGenerationRef.current;
    const requestedScope = scopeKeyRef.current;
    loadingNextRef.current = true;
    setCatalog((current) => ({ ...current, loadingNext: true, error: null }));
    try {
      const pages = await loadNextSorimaruPage(activeApiService, pagesRef.current, {
        language: 'ko-KR', limit: 12,
        ...(selectedCategory === '전체' ? {} : { category: selectedCategory }),
        ...(regionCode ? { regionCode } : {}),
      });
      if (generation !== requestGenerationRef.current || requestedScope !== scopeKeyRef.current) return;
      pagesRef.current = pages;
      setCatalog({ pages, status: pages.flatMap((page) => page.items).length ? 'success' : 'empty', error: null, loadingNext: false });
    } catch (reason) {
      if (generation !== requestGenerationRef.current || requestedScope !== scopeKeyRef.current) return;
      const error = reason instanceof Error ? reason : new Error('Sorimaru archive request failed');
      setCatalog((current) => ({ ...current, error, loadingNext: false }));
      setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      if (generation === requestGenerationRef.current) loadingNextRef.current = false;
    }
  }, [activeApiService, selectedCategory, regionCode]);

  const retryApiRequests = () => {
    setApiError(null);
    setIsNearbyLoading(true);
    setCatalog((current) => ({ ...current, status: 'loading', error: null }));
    setRetryToken((token) => token + 1);
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
        const stories = findNearbySorimaruStories(initialArchiveRef.current?.items ?? [], coords.latitude, coords.longitude);
        if (onLocationChange) onLocationChange(coords.latitude, coords.longitude);
        if (stories.length > 0) {
          setNearbyStories(stories);
          setLocationLabel('현재 위치 기준, 반경 3km');
          setLocationMessage(`불러온 이야기 중 ${stories.length}개가 가까이에 있어요.`);
          setLocationNotice(false);
        } else {
          setLocationMessage('불러온 이야기 중 가까운 장소가 없어요. 전국 큐레이션을 보여드릴게요.');
          setLocationNotice(true);
        }
        setIsLocating(false);
      },
      () => {
        setLocationMessage('위치 권한을 확인하지 못했어요. 권한 없이도 전국 큐레이션을 둘러볼 수 있어요.');
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
                <ErrorAlertIcon size={18} aria-hidden="true" />
                <span>{apiError}</span>
              </ErrorAlertMessage>
              <RetryButton type="button" onClick={retryApiRequests}>
                <RotateCcw size={14} aria-hidden="true" />
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
                    <SectionGradientTitle as="h3">
                      장면을 따라 걷는 소리
                    </SectionGradientTitle>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <SorimaruEditorialRail
                      key={retryToken}
                      stories={storyList}
                      storySets={heroStorySets}
                      apiService={activeApiService}
                      onApiError={handleApiError}
                    />
                  </div>
                </CenteredContainer>
              </div>
            </VesselReveal>

            <SorimaruSectionReveal style={{ minHeight: '760px' }}>
              <div style={{ width: '100%' }}>
                <SoundConstellationSection stories={storyList} />
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
                      <SectionGradientTitle id="nearby-stories-heading">
                        오늘, 여기에서
                      </SectionGradientTitle>
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
                        {!isLocating && <span aria-hidden="true" style={{ fontSize: '0.75rem', lineHeight: 1 }}>›</span>}
                      </LocationButton>
                    </div>
                  </NearbyHeader>

                  <div style={{ marginTop: '1.25rem' }}>
                    <StoryCarousel stories={nearbyStories} isLoading={isNearbyLoading || isLocating} />
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
                    <SectionGradientTitle id="archive-heading">
                      소리로 만나는 한국
                    </SectionGradientTitle>
                    <SectionDescription>
                      처마 끝 바람 소리부터 천년 고도의 숨결까지, 마음에 머무는 이야기 트랙.
                    </SectionDescription>
                  </div>

                  <div>
                    <CategoryTagFilter />
                  </div>
                  <div>
                    <SorimaruArchiveMetaBar resultCount={storyList.length} />
                  </div>

                  <div style={{ position: 'relative', overflow: 'visible' }}>
                    <SorimaruArchiveBrowse stories={storyList} isLoading={catalog.status === 'loading'} />
                  </div>

                  {catalog.pages.at(-1)?.hasMore && catalog.pages.at(-1)?.nextCursor && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                      <RetryButton type="button" onClick={() => void loadNextPage()} disabled={catalog.loadingNext}>
                        {catalog.loadingNext ? '불러오는 중…' : '이야기 더 보기'}
                      </RetryButton>
                    </div>
                  )}
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
