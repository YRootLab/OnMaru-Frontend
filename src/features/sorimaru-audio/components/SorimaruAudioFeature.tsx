'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { motion, Variants } from 'framer-motion';
import { StoryCarousel } from './StoryCarousel';
import { CategoryTagFilter } from './CategoryTagFilter';
import { SorimaruArchiveBrowse } from './SorimaruArchiveBrowse';
import { SorimaruArchiveMetaBar } from './SorimaruArchiveMetaBar';
import { SorimaruQuestionAssistant } from './SorimaruQuestionAssistant';
import { SavedSoundDrawer } from './SavedSoundDrawer';
import { SorimaruAutoSliceRail } from './SorimaruAutoSliceRail';
import { SorimaruEditorialRail } from './SorimaruEditorialRail';
import { SorimaruFooterCTA } from './SorimaruFooterCTA';
import { SoundConstellationSection } from './SoundConstellationSection';
import { LocalMiniPlayer } from './LocalMiniPlayer';
import { SorimaruAtmosphereBackground } from './SorimaruAtmosphereBackground';
import type { SorimaruBackgroundVariant } from '@/features/sorimaru-audio/background/sorimaruBackground.types';
import { VesselReveal } from '@/shared/components/animation/VesselReveal';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem, SorimaruStoryPage, ISorimaruApiService } from '@/features/sorimaru-audio/types/sorimaru.types';
import { SorimaruDependencyProvider, useSorimaruApiService } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { loadSorimaruInitialData } from './sorimaruInitialLoad';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';
import { HanjiDeckleEdge } from '@/shared/components/HanjiDeckleEdge';

const AllStoriesModal = dynamic(
  () => import('./AllStoriesModal').then((module) => module.AllStoriesModal),
  { ssr: false },
);

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const FeatureContainer = styled.div`
  position: relative;
  isolation: isolate;
  min-height: 100vh;
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
    background-color: #FFD4E5;
    color: #D40D63;
  }
`;

const ContentLayer = styled.div`
  position: relative;
  z-index: 10;
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

const RetryButton = styled.button`
  flex-shrink: 0;
  border-radius: 9999px;
  background-color: ${palette.jangmi[500]};
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${palette.jangmi[700]};
  }
`;

const MainSections = styled.main`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (min-width: 640px) {
    gap: 3rem;
  }
`;

const HeroStageDiv = styled(motion.div)`
  padding-top: 3.25rem;
  padding-bottom: clamp(40px, 5vh, 64px);

  @media (min-width: 768px) {
    padding-top: clamp(6rem, 10vh, 8rem);
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

const NearbyHeader = styled(motion.div)`
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

const SectionDescription = styled.p`
  margin-top: 4px;
  max-width: 36rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
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

const PageIndicator = styled.span`
  min-width: 4rem;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${meok[900]};

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

const PaginationPill = styled.button`
  height: 2.25rem;
  border-radius: 9999px;
  padding: 0 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${palette.jangmi[400]};
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: #FFF0F6;
  }

  [data-theme='dark'] & {
    color: ${palette.jangmi[400]};

    &:hover {
      background-color: rgba(255, 92, 159, 0.15);
    }
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
`;

export interface SorimaruAudioFeatureProps {
  apiService?: ISorimaruApiService;
  initialStories?: SorimaruStoryItem[];
  initialNearbyStories?: SorimaruStoryItem[];
  initialHeroStorySets?: Record<string, SorimaruStoryItem[]>;
  onLocationChange?: (latitude: number, longitude: number) => void;
  backgroundVariant?: SorimaruBackgroundVariant;
}

export const SorimaruAudioFeature: React.FC<SorimaruAudioFeatureProps> = ({
  apiService,
  initialStories,
  initialNearbyStories,
  initialHeroStorySets,
  onLocationChange,
  backgroundVariant,
}) => {
  const activeApiService = useSorimaruApiService(apiService);
  const selectedCategory = useSorimaruAudioStore((s) => s.selectedCategory);
  const searchQuery = useSorimaruAudioStore((s) => s.searchQuery);
  const setSelectedCategory = useSorimaruAudioStore((s) => s.setSelectedCategory);
  const setSearchQuery = useSorimaruAudioStore((s) => s.setSearchQuery);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const savedStories = useSorimaruAudioStore((s) => s.savedStories);
  const hydrateSavedStories = useSorimaruAudioStore((s) => s.hydrateSavedStories);
  const removeSavedStory = useSorimaruAudioStore((s) => s.removeSavedStory);
  const [storyList, setStoryList] = useState<SorimaruStoryItem[]>(() => initialStories || []);
  const [nearbyStories, setNearbyStories] = useState<SorimaruStoryItem[]>(() => initialNearbyStories || []);
  const [heroStorySets, setHeroStorySets] = useState<Record<string, SorimaruStoryItem[]>>(() => initialHeroStorySets || {});
  const [archiveMeta, setArchiveMeta] = useState<SorimaruStoryPage>({
    items: initialStories || [],
    pageNo: 1,
    numOfRows: 7,
    totalCount: initialStories?.length || 0,
    source: 'mock',
  });
  const [archivePage, setArchivePage] = useState(1);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('기본 위치');
  const [locationMessage, setLocationMessage] = useState('내 위치를 허용하면 반경 3km의 실제 오디오를 찾아드려요.');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(hydrateSavedStories, 0);
    return () => window.clearTimeout(timeoutId);
  }, [hydrateSavedStories]);

  const [isNearbyLoading, setIsNearbyLoading] = useState(true);
  const [isArchiveLoading, setIsArchiveLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [initialLoadVersion, setInitialLoadVersion] = useState(0);
  const initialLoadCompleteRef = useRef(false);
  const initialArchiveRef = useRef<SorimaruStoryPage | null>(
    initialStories
      ? {
          items: initialStories,
          pageNo: 1,
          numOfRows: 12,
          totalCount: initialStories.length,
          source: 'mock',
        }
      : null
  );
  const archiveScopeRef = useRef({ selectedCategory, searchQuery, archivePage });
  const handleApiError = useCallback(() => {
    setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
  }, []);

  useEffect(() => {
    archiveScopeRef.current = { selectedCategory, searchQuery, archivePage };
  }, [archivePage, searchQuery, selectedCategory]);

  useEffect(() => {
    let isMounted = true;
    initialLoadCompleteRef.current = false;

    async function loadInitialContent() {
      try {
        const result = await loadSorimaruInitialData(activeApiService);

        if (isMounted) {
          setNearbyStories(result.nearbyStories);
          setHeroStorySets({ '추천': result.heroStories });

          if (result.archive) {
            initialArchiveRef.current = result.archive;

            const scope = archiveScopeRef.current;
            if (scope.selectedCategory === '전체' && !scope.searchQuery && scope.archivePage === 1) {
              setStoryList(result.archive.items);
              setArchiveMeta(result.archive);
            }
          }
          if (result.archiveError || result.nearbyError) {
            setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
          }
          setIsArchiveLoading(false);
          initialLoadCompleteRef.current = true;
          setInitialLoadVersion((version) => version + 1);
        }
      } catch {
        if (isMounted) {
          setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
          setIsArchiveLoading(false);
        }
      } finally {
        if (isMounted) setIsNearbyLoading(false);
      }
    }

    loadInitialContent();

    return () => {
      isMounted = false;
    };
  }, [activeApiService, retryToken]);

  useEffect(() => {
    let isMounted = true;
    if (!initialLoadCompleteRef.current) return;

    const isInitialScope = selectedCategory === '전체' && !searchQuery && archivePage === 1;
    if (isInitialScope && initialArchiveRef.current) {
      const initialArchive = initialArchiveRef.current;
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setStoryList(initialArchive.items);
        setArchiveMeta(initialArchive);
        setIsArchiveLoading(false);
      });
      return;
    }

    async function fetchArchiveData() {
      setIsArchiveLoading(true);
      try {
        const page = await activeApiService.getStoryPage(selectedCategory, searchQuery, archivePage, 12);

        if (isMounted) {
          if (page.items.length === 0 && archivePage > 1) {
            setArchivePage(1);
            return;
          }
          setStoryList(page.items);
          setArchiveMeta(page);
        }
      } catch {
        if (isMounted) setApiError('소리마루 이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      } finally {
        if (isMounted) setIsArchiveLoading(false);
      }
    }

    fetchArchiveData();

    return () => {
      isMounted = false;
    };
  }, [activeApiService, archivePage, initialLoadVersion, selectedCategory, searchQuery, retryToken]);

  const retryApiRequests = () => {
    setApiError(null);
    setIsNearbyLoading(true);
    setIsArchiveLoading(true);
    setRetryToken((token) => token + 1);
  };

  const totalArchivePages = Math.max(1, Math.ceil(archiveMeta.totalCount / archiveMeta.numOfRows));

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationMessage('이 브라우저에서는 위치 기반 이야기를 사용할 수 없습니다.');
      return;
    }

    setIsLocating(true);
    setLocationMessage('현재 위치를 확인하고 주변 이야기를 찾는 중입니다.');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const stories = await activeApiService.getNearbyStories(coords.latitude, coords.longitude);
        if (onLocationChange) onLocationChange(coords.latitude, coords.longitude);
        if (stories.length > 0) {
          setNearbyStories(stories);
          setLocationLabel('현재 위치 기준, 반경 3km');
          setLocationMessage(`${stories.length}개의 이야기를 찾았습니다. 가까운 장소부터 들려드릴게요.`);
        } else {
          setLocationMessage('반경 3km 안에는 아직 등록된 이야기가 없어요. 전국 큐레이션을 보여드립니다.');
        }
        setIsLocating(false);
      },
      () => {
        setLocationMessage('위치 권한을 확인하지 못했습니다. 권한 없이도 전국 큐레이션을 둘러볼 수 있어요.');
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <SorimaruDependencyProvider apiService={activeApiService}>
      <FeatureContainer>
        {/* <HanjiDeckleEdge /> */}
        <SorimaruAtmosphereBackground
          variant={backgroundVariant}
          selectedCategory={selectedCategory}
          isPlaying={isPlaying}
        />
        <ContentLayer>
          {apiError && (
            <ErrorAlert role="alert">
              <span>{apiError}</span>
              <RetryButton type="button" onClick={retryApiRequests}>
                다시 시도
              </RetryButton>
            </ErrorAlert>
          )}

          <MainSections>
            {/* 섹션 1: 히어로 큐레이션 레일 */}
            <HeroStageDiv
              data-sorimaru-stage="featured"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            >
              <SorimaruAutoSliceRail stories={storyList} storySets={heroStorySets} />
            </HeroStageDiv>

            {/* 섹션 2: 한 단어로, 한 장면 */}
            <VesselReveal style={{ minHeight: '650px' }}>
              <div style={{ marginTop: '1rem' }} data-sorimaru-stage="themes">
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

            <VesselReveal style={{ minHeight: '760px', width: '100%', padding: '1.5rem 0' }}>
              <SoundConstellationSection stories={storyList} />
            </VesselReveal>

            {/* 섹션 3: 오늘, 여기에서 */}
            <VesselReveal style={{ minHeight: '440px', width: '100%', padding: '1.5rem 0' }}>
              <section aria-labelledby="nearby-stories-heading" style={{ width: '100%' }} data-sorimaru-stage="nearby">
                <CenteredContainer>
                  <NearbyHeader variants={titleVariants}>
                    <div style={{ minWidth: 0 }}>
                      <SectionGradientTitle id="nearby-stories-heading">
                        오늘, 여기에서
                      </SectionGradientTitle>
                      <SectionDescription>
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

                  <motion.div variants={contentVariants} style={{ marginTop: '1.25rem' }}>
                    <StoryCarousel stories={nearbyStories} isLoading={isNearbyLoading || isLocating} />
                  </motion.div>
                </CenteredContainer>
              </section>
            </VesselReveal>

            {/* 오디오 아카이브 섹션 (통합 메인 뷰) */}
            <VesselReveal id="sorimaru-archive" style={{ minHeight: '900px', width: '100%', padding: '2rem 0' }}>
              <section style={{ width: '100%' }} data-sorimaru-stage="archive">
                <CenteredContainer>
                  <motion.div variants={titleVariants} style={{ marginBottom: '1rem' }}>
                    <SectionGradientTitle id="archive-heading">
                      소리로 만나는 한국
                    </SectionGradientTitle>
                    <SectionDescription>
                      처마 끝 바람 소리부터 천년 고도의 숨결까지, 마음에 머무는 이야기 트랙.
                    </SectionDescription>
                  </motion.div>

                  <motion.div variants={contentVariants}>
                    <CategoryTagFilter />
                  </motion.div>
                  <SorimaruArchiveMetaBar resultCount={storyList.length} totalCount={archiveMeta.totalCount} />

                  <div style={{ position: 'relative', minHeight: 600, overflow: 'visible' }}>
                    <SorimaruArchiveBrowse stories={storyList} isLoading={isArchiveLoading} />
                  </div>

                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '1rem' }}>
                    <SectionSubText style={{ fontSize: fontSize.micro }}>
                      {archiveMeta.totalCount > 0 ? `${archiveMeta.totalCount.toLocaleString()}개 중 ${archiveMeta.pageNo}페이지` : '검색 결과 없음'}
                    </SectionSubText>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <PaginationPill
                        type="button"
                        onClick={() => {
                          setIsArchiveLoading(true);
                          setArchivePage((page) => Math.max(1, page - 1));
                        }}
                        disabled={archivePage <= 1 || isArchiveLoading}
                      >
                        이전
                      </PaginationPill>
                      <PageIndicator>
                        {archivePage} / {totalArchivePages}
                      </PageIndicator>
                      <PaginationPill
                        type="button"
                        onClick={() => {
                          setIsArchiveLoading(true);
                          setArchivePage((page) => Math.min(totalArchivePages, page + 1));
                        }}
                        disabled={archivePage >= totalArchivePages || isArchiveLoading}
                      >
                        다음
                      </PaginationPill>
                    </div>
                  </div>

                  <SorimaruQuestionAssistant
                    filters={{ category: selectedCategory, query: searchQuery }}
                    onOpenSource={(source) => {
                      setSelectedCategory('전체');
                      setSearchQuery(source.title);
                      setArchivePage(1);
                    }}
                  />
                </CenteredContainer>
              </section>
            </VesselReveal>

            {/* 하단 이탈 방지 & 재방문 CTA */}
            <VesselReveal style={{ minHeight: '220px' }}>
              <div data-sorimaru-stage="closing">
                <SorimaruFooterCTA />
              </div>
            </VesselReveal>
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
