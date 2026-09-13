'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { Heart, Pause, Play } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem, ISorimaruApiService } from '@/features/sorimaru-audio/types/sorimaru.types';
import { SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';
import { useSorimaruApiService } from '@/features/sorimaru-audio/context/SorimaruDependencyContext';
import { palette, meok } from '@/design-system/tokens';

interface KeywordSpotlightSectionProps {
  onBookmarkStory?: (story: SorimaruStoryItem) => void;
  bookmarkedIds?: Set<string>;
  apiService?: ISorimaruApiService;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&q=82';

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

function getExcerpt(script = ''): string {
  const line = script.split(/\r?\n/).find((item) => item.trim());
  const excerpt = line?.trim() || '장소에 머무는 아름다운 소리를 천천히 들어보세요.';
  return excerpt.length > 150 ? `${excerpt.slice(0, 149)}…` : excerpt;
}

function getTagLabel(label: string): string {
  return label.split('/')[0];
}

function getDailyIndex(length: number, keyword: string): number {
  if (length <= 1) return 0;
  const today = new Date();
  const dateSeed = today.getFullYear() * 372 + today.getMonth() * 31 + today.getDate();
  const keywordSeed = Array.from(keyword).reduce((total, char) => total + char.charCodeAt(0), 0);
  return (dateSeed + keywordSeed) % length;
}

const pulseShimmer = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const SkeletonBox = styled.div`
  background-color: #d9d9d7;
  animation: ${pulseShimmer} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 4px;
`;

const SkeletonWrapper = styled.div`
  display: grid;
  min-height: 480px;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  }
`;

const KeywordSpotlightSkeleton: React.FC = () => (
  <SkeletonWrapper>
    <article
      style={{
        display: 'grid',
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 280,
          minHeight: 280,
          overflow: 'hidden',
          backgroundColor: '#e5e5e3',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(33, 30, 25, 0.3), transparent)' }} />
      </div>
      <div style={{ display: 'flex', minWidth: 0, flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem' }}>
        <div>
          <SkeletonBox style={{ height: 14, width: 112 }} />
          <SkeletonBox style={{ marginTop: 16, height: 32, width: '80%', borderRadius: 6 }} />
          <SkeletonBox style={{ marginTop: 12, height: 16, width: '50%' }} />
          <div style={{ marginTop: 32, borderLeft: '2px solid #e5e5e3', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonBox style={{ height: 16, width: '100%' }} />
            <SkeletonBox style={{ height: 16, width: '75%' }} />
          </div>
        </div>
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 16, paddingTop: 16 }}>
          <SkeletonBox style={{ height: 36, width: 128, borderRadius: 9999 }} />
          <SkeletonBox style={{ height: 16, width: 80 }} />
        </div>
      </div>
    </article>
    <aside style={{ backgroundColor: '#f5f5f4', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingBottom: 16 }}>
        <SkeletonBox style={{ height: 16, width: 112 }} />
        <SkeletonBox style={{ height: 12, width: 24 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 0', borderBottom: '1px solid rgba(33, 30, 25, 0.12)' }}>
            <SkeletonBox style={{ height: 12, width: 16 }} />
            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkeletonBox style={{ height: 12, width: 80 }} />
              <SkeletonBox style={{ height: 16, width: '75%' }} />
            </div>
            <SkeletonBox style={{ height: 32, width: 32, borderRadius: '50%', flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </aside>
  </SkeletonWrapper>
);

const SectionRoot = styled.section`
  width: 100%;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
  min-height: 580px;

  @media (min-width: 640px) {
    padding-top: 2rem;
    padding-bottom: 4rem;
  }
`;

const SectionHeader = styled(motion.div)`
  padding-bottom: 0.25rem;
`;

const SectionTitle = styled.h2`
  display: inline-block;
  background: linear-gradient(to right, #211e19, #403b35, #6a6158);
  -webkit-background-clip: text;
  background-clip: text;
  font-family: var(--font-hanok);
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 700;
  letter-spacing: -0.045em;
  color: transparent;
`;

const SectionDesc = styled.p`
  margin-top: 0.625rem;
  max-width: 36rem;
  font-size: 0.75rem;
  line-height: 1.6;
  color: #786d5e;

  @media (min-width: 640px) {
    font-size: 0.875rem;
  }
`;

const KeywordNav = styled(motion.nav)`
  margin-top: 1.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TagList = styled.div`
  display: flex;
  min-width: max-content;
  align-items: center;
  gap: 1.25rem;

  @media (min-width: 640px) {
    gap: 1.75rem;
  }
`;

const TagButton = styled.button<{ $selected: boolean }>`
  padding-bottom: 0.5rem;
  font-size: 0.875rem;
  transition: color 0.3s ease;
  background: none;
  border: none;
  cursor: pointer;

  ${({ $selected }) =>
    $selected
      ? `
        font-weight: 700;
        color: ${palette.juhong[700]};
      `
      : `
        font-weight: 500;
        color: #8c7e6c;
        &:hover {
          color: #211e19;
        }
      `}
`;

const StageContainer = styled(motion.div)`
  margin-top: 2rem;
  min-height: 480px;
  overflow: hidden;
  background-color: #fbf7ef;
`;

const StageGrid = styled(motion.div)`
  display: grid;
  min-height: 480px;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  }
`;

const MainArticle = styled.article`
  display: grid;
  min-width: 0;

  @media (min-width: 768px) {
    grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.1fr);
  }
`;

const PhotoContainer = styled.div`
  position: relative;
  height: 280px;
  min-height: 280px;
  overflow: hidden;
  background-color: #d9cdbc;

  @media (min-width: 768px) {
    height: 100%;
    min-height: 480px;
  }
`;

const SpotlightImage = styled.img`
  height: 100%;
  width: 100%;
  object-fit: cover;
  filter: grayscale(0.12);
  transition: transform 0.7s ease;

  &:hover {
    transform: scale(1.03);
  }
`;

const SpotlightScrim = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(33, 30, 25, 0.65), transparent 60%);
`;

const LocationCaption = styled.p`
  position: absolute;
  bottom: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: #ffffff;
`;

const ArticleContentCol = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;

  @media (min-width: 640px) {
    padding: 2rem;
  }
`;

const CategoryDesc = styled.p`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${palette.juhong[700]};
`;

const StoryMainHeading = styled.h3`
  margin-top: 0.75rem;
  font-family: var(--font-hanok);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.045em;
  color: #211e19;

  @media (min-width: 640px) {
    font-size: 1.875rem;
  }
`;

const StoryAudioDesc = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5rem;
  color: #655b4d;
`;

const StoryQuote = styled.blockquote`
  margin-top: 1.75rem;
  border-left: 2px solid ${palette.juhong[700]};
  padding-left: 1rem;
  font-family: var(--font-hanok);
  font-size: 1.125rem;
  line-height: 2rem;
  color: #403a31;

  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
`;

const ActionButtonsRow = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
`;

const PlaySpotlightBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: ${palette.juhong[700]};
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #211e19;
  }
`;

const CirclePlayIcon = styled.span`
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background-color: ${palette.juhong[700]};
  color: #ffffff;
`;

const BookmarkActionBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition: color 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ $active }) => ($active ? palette.juhong[700] : '#8c7e6c')};

  &:hover {
    color: ${palette.juhong[700]};
  }
`;

const RelatedAside = styled.aside`
  background-color: #f3ecdf;
  padding: 1.5rem;

  @media (min-width: 640px) {
    padding: 2rem;
  }
`;

const RelatedHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 1rem;
`;

const RelatedItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(33, 30, 25, 0.12);
`;

const MiniRoundPlay = styled.button<{ $isPlaying: boolean }>`
  display: flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;

  ${({ $isPlaying }) =>
    $isPlaying
      ? `
        background-color: ${palette.juhong[700]};
        color: #ffffff;
      `
      : `
        background-color: transparent;
        color: #211e19;
        &:hover {
          color: ${palette.juhong[700]};
        }
      `}
`;

export const KeywordSpotlightSection: React.FC<KeywordSpotlightSectionProps> = ({
  onBookmarkStory,
  bookmarkedIds = new Set(),
  apiService,
}) => {
  const activeApiService = useSorimaruApiService(apiService);
  const [selectedKeyword, setSelectedKeyword] = useState('한옥');
  const [spotlightStory, setSpotlightStory] = useState<SorimaruStoryItem | null>(null);
  const [relatedStories, setRelatedStories] = useState<SorimaruStoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentStory = useSorimaruAudioStore((state) => state.currentStory);
  const isPlaying = useSorimaruAudioStore((state) => state.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((state) => state.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((state) => state.setIsPlaying);

  useEffect(() => {
    let isMounted = true;

    async function loadSpotlight() {
      setIsLoading(true);
      try {
        const stories = await activeApiService.getStoryList(undefined, selectedKeyword);
        const pool = stories.filter((story) => story.audioUrl);
        const main = pool[getDailyIndex(pool.length, selectedKeyword)] || pool[0] || null;
        const connected = pool.filter((story) => story.stid !== main?.stid).slice(0, 3);

        if (isMounted) {
          setSpotlightStory(main);
          setRelatedStories(connected);
        }
      } catch {
        if (isMounted) {
          setSpotlightStory(null);
          setRelatedStories([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSpotlight();
    return () => {
      isMounted = false;
    };
  }, [activeApiService, selectedKeyword]);

  const activeCategory = useMemo(
    () => SORIMARU_THEME_CATEGORIES.find((category) => category.keyword === selectedKeyword) || SORIMARU_THEME_CATEGORIES[0],
    [selectedKeyword]
  );

  const isCurrentPlaying = Boolean(
    spotlightStory && currentStory.stid === spotlightStory.stid && isPlaying
  );

  const handlePlay = (story: SorimaruStoryItem) => {
    if (currentStory.stid === story.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(story);
    }
  };

  return (
    <SectionRoot aria-labelledby="keyword-spotlight-heading">
      <div style={{ width: '100%' }}>
        {/* 섹션 2 타이틀 */}
        <SectionHeader variants={titleVariants}>
          <SectionTitle id="keyword-spotlight-heading">
            한 단어로, 한 장면
          </SectionTitle>
          <SectionDesc>
            마음이 머무는 주제를 고르면 오늘의 대표 이야기가 열립니다. 내일은 또 다른 장면을 만나보세요.
          </SectionDesc>
        </SectionHeader>

        {/* 주제 카테고리 네비게이션 */}
        <KeywordNav variants={contentVariants} aria-label="이야기 주제">
          <TagList>
            {SORIMARU_THEME_CATEGORIES.map((category) => {
              const isSelected = selectedKeyword === category.keyword;
              return (
                <TagButton
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedKeyword(category.keyword)}
                  aria-pressed={isSelected}
                  $selected={isSelected}
                >
                  #{getTagLabel(category.label)}
                </TagButton>
              );
            })}
          </TagList>
        </KeywordNav>

        {/* 대표 이야기 스포트라이트 스테이지 */}
        <StageContainer variants={contentVariants}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="spotlight-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <KeywordSpotlightSkeleton />
              </motion.div>
            ) : spotlightStory ? (
              <StageGrid
                key={selectedKeyword}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              >
                <MainArticle>
                  <PhotoContainer>
                    <SpotlightImage
                      src={spotlightStory?.imageUrl || FALLBACK_IMAGE}
                      alt={spotlightStory?.title || '오늘의 대표 이야기'}
                      loading="eager"
                      decoding="sync"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                    />
                    <SpotlightScrim />
                    {spotlightStory && (
                      <LocationCaption>
                        {spotlightStory.locationName || '대한민국의 한 장소'}
                      </LocationCaption>
                    )}
                  </PhotoContainer>

                  <ArticleContentCol>
                    <div>
                      <CategoryDesc>{activeCategory.description}</CategoryDesc>
                      <StoryMainHeading>
                        {spotlightStory.title}
                      </StoryMainHeading>
                      <StoryAudioDesc>{spotlightStory.audioTitle}</StoryAudioDesc>
                      <StoryQuote>
                        “{getExcerpt(spotlightStory.script)}”
                      </StoryQuote>
                    </div>

                    <ActionButtonsRow>
                      <PlaySpotlightBtn
                        type="button"
                        onClick={() => handlePlay(spotlightStory)}
                      >
                        <CirclePlayIcon>
                          {isCurrentPlaying ? (
                            <Pause size={14} strokeWidth={2} />
                          ) : (
                            <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />
                          )}
                        </CirclePlayIcon>
                        {isCurrentPlaying ? '잠시 멈추기' : '이야기 듣기'}
                        <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 400, color: '#8c7e6c' }}>
                          {spotlightStory.formattedDuration || '오디오'}
                        </span>
                      </PlaySpotlightBtn>

                      {onBookmarkStory && (
                        <BookmarkActionBtn
                          type="button"
                          onClick={() => onBookmarkStory(spotlightStory)}
                          aria-pressed={bookmarkedIds.has(spotlightStory.stid)}
                          $active={bookmarkedIds.has(spotlightStory.stid)}
                        >
                          {bookmarkedIds.has(spotlightStory.stid) ? (
                            <Heart size={14} strokeWidth={2} fill="currentColor" />
                          ) : (
                            <Heart size={14} strokeWidth={2} />
                          )}
                          <span>{bookmarkedIds.has(spotlightStory.stid) ? '담아둔 소리' : '마음에 담기'}</span>
                        </BookmarkActionBtn>
                      )}
                    </ActionButtonsRow>
                  </ArticleContentCol>
                </MainArticle>

                <RelatedAside>
                  <RelatedHeader>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: palette.juhong[700] }}>이어지는 소리</p>
                      <h3 style={{ marginTop: '0.25rem', fontFamily: 'var(--font-hanok)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: '#211e19' }}>
                        함께 들으면 좋은 장면
                      </h3>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#8c7e6c' }}>
                      {String(relatedStories.length).padStart(2, '0')}
                    </span>
                  </RelatedHeader>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {relatedStories.map((story, index) => {
                      const isRelatedPlaying = currentStory.stid === story.stid && isPlaying;
                      return (
                        <RelatedItemRow key={story.stid}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: palette.juhong[700] }}>
                            0{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePlay(story)}
                            style={{ minWidth: 0, flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10, color: '#8c7e6c' }}>
                              {story.locationName || '소리의 장소'}
                            </span>
                            <span style={{ marginTop: 2, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-hanok)', fontSize: '0.875rem', fontWeight: 700, color: '#211e19' }}>
                              {story.title}
                            </span>
                          </button>
                          <MiniRoundPlay
                            type="button"
                            onClick={() => handlePlay(story)}
                            aria-label={`${story.title} ${isRelatedPlaying ? '일시정지' : '재생'}`}
                            $isPlaying={isRelatedPlaying}
                          >
                            {isRelatedPlaying ? (
                              <Pause size={12} strokeWidth={2} />
                            ) : (
                              <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />
                            )}
                          </MiniRoundPlay>
                        </RelatedItemRow>
                      );
                    })}
                  </div>
                </RelatedAside>
              </StageGrid>
            ) : (
              <motion.div
                key={`spotlight-empty-${selectedKeyword}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', minHeight: 480, alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem', textAlign: 'center' }}
              >
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#655b4d' }}>이 주제의 오디오가 아직 준비되지 않았어요.</p>
                  <p style={{ marginTop: 4, fontSize: '0.75rem', color: '#8c7e6c' }}>다른 주제를 선택해 새로운 이야기를 찾아보세요.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </StageContainer>
      </div>
    </SectionRoot>
  );
};
