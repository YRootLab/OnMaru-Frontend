'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { SORIMARU_HERO_TABS, SORIMARU_THEME_CATEGORIES } from '@/features/sorimaru-audio/data/sorimaruCategoryData';
import { palette, meok } from '@/design-system/tokens';

interface FeaturedStoryRailProps {
  stories: SorimaruStoryItem[];
  storySets?: Record<string, SorimaruStoryItem[]>;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1548115184-bc6544d06a58?auto=format&fit=crop&w=1200&q=80',
];

function getFallbackImage(seed = ''): string {
  const index = Array.from(seed).reduce((total, char) => total + char.charCodeAt(0), 0) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[index];
}

function getValidImage(url?: string, seed?: string): string {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return getFallbackImage(seed);
  }
  return url;
}

function formatCategory(story: SorimaruStoryItem): string {
  return story.category || story.locationName || '한국의 문화 이야기';
}

const SectionWrapper = styled.section`
  width: 100%;
  padding-bottom: 3rem;

  @media (min-width: 640px) {
    padding-bottom: 4rem;
  }
`;

const TabsRail = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  white-space: nowrap;
  border-radius: 9999px;
  padding: 0.5rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;

  ${({ $active }) =>
    $active
      ? `
        background-color: #211e19;
        color: #ffffff;
      `
      : `
        background-color: #f7f4ee;
        color: #655b4d;
        &:hover {
          background-color: #ede5d8;
          color: #211e19;
        }
      `}
`;

const BentoGrid = styled.div`
  display: grid;
  grid-auto-rows: 72px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.625rem;

  @media (min-width: 768px) {
    grid-auto-rows: 68px;
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
`;

const getCardLayout = (index: number) => {
  switch (index) {
    case 0:
      return css`
        grid-column: span 2;
        min-height: 360px;
        @media (min-width: 768px) {
          grid-column: span 7;
          grid-row: span 6;
          min-height: 0;
        }
      `;
    case 1:
    case 2:
      return css`
        grid-column: span 1;
        min-height: 220px;
        @media (min-width: 768px) {
          grid-column: span 5;
          grid-row: span 3;
          min-height: 0;
        }
      `;
    case 3:
      return css`
        grid-column: span 1;
        min-height: 230px;
        @media (min-width: 768px) {
          grid-column: span 4;
          grid-row: span 4;
          min-height: 0;
        }
      `;
    case 4:
      return css`
        grid-column: span 1;
        min-height: 230px;
        @media (min-width: 768px) {
          grid-column: span 3;
          grid-row: span 4;
          min-height: 0;
        }
      `;
    case 5:
      return css`
        grid-column: span 1;
        min-height: 230px;
        @media (min-width: 768px) {
          grid-column: span 5;
          grid-row: span 4;
          min-height: 0;
        }
      `;
    case 6:
      return css`
        grid-column: span 2;
        min-height: 250px;
        @media (min-width: 768px) {
          grid-column: span 7;
          grid-row: span 4;
          min-height: 0;
        }
      `;
    default:
      return css`
        grid-column: span 2;
        min-height: 240px;
        @media (min-width: 768px) {
          grid-column: span 4;
          grid-row: span 3;
        }
      `;
  }
};

const CardArticle = styled(motion.article)<{ $index: number; $isLead: boolean }>`
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  background-color: #fbf8f2;
  outline: none;
  cursor: pointer;
  transition: box-shadow 0.3s ease;
  ${({ $index }) => getCardLayout($index)}

  &:hover img {
    transform: scale(1.02);
  }
  &:focus-visible {
    outline: 2px solid rgba(169, 77, 53, 0.7);
    outline-offset: 2px;
  }
`;

const CardPhoto = styled.img<{ $isLead: boolean }>`
  position: absolute;
  object-fit: cover;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease, filter 0.7s ease;

  ${({ $isLead }) =>
    $isLead
      ? `
        top: 0;
        bottom: 0;
        right: 0;
        height: 100%;
        width: 47%;
        opacity: 0.65;
        filter: grayscale(0.2) saturate(0.65);
        @media (min-width: 640px) {
          width: 43%;
        }
      `
      : `
        left: 0;
        right: 0;
        top: 0;
        height: 40%;
        width: 100%;
        opacity: 0.7;
        filter: grayscale(0.15) saturate(0.7);
      `}
`;

const LeadGlowGradient = styled.div`
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 52%;
  background: linear-gradient(to right, #fbf8f2, rgba(251, 248, 242, 0.1), transparent);
`;

const CardContent = styled.div<{ $isLead: boolean }>`
  z-index: 10;
  color: #211e19;

  ${({ $isLead }) =>
    $isLead
      ? `
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        display: flex;
        width: 70%;
        flex-direction: column;
        justify-content: flex-end;
        background-color: rgba(251, 248, 242, 0.96);
        padding: 1.25rem;
        @media (min-width: 640px) {
          width: 63%;
          padding: 1.5rem;
        }
      `
      : `
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        top: 40%;
        background-color: #fbf8f2;
        padding: 0.875rem;
        @media (min-width: 640px) {
          padding: 1rem;
        }
      `}
`;

const CardCategoryText = styled.p<{ $isLead: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ $isLead }) => ($isLead ? '0.75rem' : '10px')};
  font-weight: 600;
  color: #8c7e6c;
`;

const CardHeading = styled.h3<{ $isLead: boolean }>`
  margin-top: 0.25rem;
  font-family: var(--font-hanok);
  font-size: ${({ $isLead }) => ($isLead ? '1.5rem' : '0.875rem')};
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.035em;
  color: #211e19;

  @media (min-width: 640px) {
    font-size: ${({ $isLead }) => ($isLead ? '1.875rem' : '1rem')};
  }
`;

const PlayLeadButton = styled.button`
  display: inline-flex;
  height: 2.5rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  background-color: #211e19;
  padding: 0 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fffaf3;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${palette.juhong[700]};
  }
`;

const SubBadgePlaying = styled.span`
  position: absolute;
  right: 0.75rem;
  top: 0.75rem;
  border-radius: 9999px;
  background-color: ${palette.juhong[700]};
  padding: 0.25rem 0.5rem;
  font-size: 10px;
  font-weight: 700;
  color: #ffffff;
`;

export const FeaturedStoryRail: React.FC<FeaturedStoryRailProps> = ({ stories, storySets }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState('추천');
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplayVersion, setAutoplayVersion] = useState(0);
  const [isSectionInView, setIsSectionInView] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((s) => s.setCurrentStory);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);

  const activeMeta = SORIMARU_THEME_CATEGORIES.find((category) => category.id === activeTab);
  const activeTabMeta = SORIMARU_HERO_TABS.find((tab) => tab.id === activeTab);

  const featured = useMemo(() => {
    const apiStories = storySets?.[activeTab];
    if (apiStories?.length) return apiStories.slice(0, 7);
    if (activeTab === '추천') return stories.slice(0, 7);

    const keywords = [activeTab, activeTabMeta?.keyword].filter(Boolean) as string[];
    const matched = stories.filter((story) =>
      keywords.some(
        (keyword) =>
          story.category.includes(keyword) ||
          story.title.includes(keyword) ||
          story.audioTitle.includes(keyword) ||
          story.locationName?.includes(keyword)
      )
    );

    return (matched.length ? matched : stories).slice(0, 7);
  }, [activeTab, activeTabMeta?.keyword, stories, storySets]);

  const normalizedIndex = featured.length > 0 ? activeIndex % featured.length : 0;
  const boardStories = useMemo(
    () => featured.map((_, index) => featured[(normalizedIndex + index) % featured.length]),
    [featured, normalizedIndex]
  );
  const lead = boardStories[0];

  useEffect(() => {
    if (featured.length < 2 || !isSectionInView || shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((index) => (index + 1) % featured.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [featured.length, autoplayVersion, isSectionInView, shouldReduceMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setIsSectionInView(entry.isIntersecting), {
      threshold: 0.15,
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  if (!lead) return null;

  const move = (nextDirection: number) => {
    setDirection(nextDirection);
    setActiveIndex((index) => (index + nextDirection + featured.length) % featured.length);
    setAutoplayVersion((version) => version + 1);
  };

  const selectStory = (index: number) => {
    setDirection(index === 0 ? 1 : -1);
    setActiveIndex((normalizedIndex + index) % featured.length);
    setAutoplayVersion((version) => version + 1);
  };

  const play = () => {
    if (currentStory.stid === lead.stid) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStory(lead);
    }
  };

  return (
    <SectionWrapper ref={sectionRef}>
      <div>
        <TabsRail role="tablist" aria-label="소리마루 핵심 카테고리">
          {SORIMARU_HERO_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TabButton
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveIndex(0);
                  setAutoplayVersion((version) => version + 1);
                }}
                $active={isActive}
              >
                {tab.label}
              </TabButton>
            );
          })}
        </TabsRail>

        <BentoGrid>
          {boardStories.map((story, index) => {
            const imageUrl = getValidImage(story.imageUrl, story.stid);
            const isLead = index === 0;
            const isPlayingStory = currentStory.stid === story.stid && isPlaying;

            return (
              <CardArticle
                key={`${story.stid}-${index}`}
                layout
                tabIndex={0}
                aria-current={isLead ? 'true' : undefined}
                onClick={() => selectStory(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectStory(index);
                  }
                }}
                initial={shouldReduceMotion ? undefined : { opacity: 0, x: direction * 14 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                transition={{ layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
                $index={index}
                $isLead={isLead}
              >
                <CardPhoto
                  src={imageUrl}
                  alt={story.title}
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getFallbackImage(story.stid);
                  }}
                  $isLead={isLead}
                />
                {isLead && <LeadGlowGradient />}

                <CardContent $isLead={isLead}>
                  <CardCategoryText $isLead={isLead}>
                    {story.locationName || formatCategory(story)}
                  </CardCategoryText>
                  <CardHeading $isLead={isLead}>
                    {story.title}
                  </CardHeading>

                  {isLead ? (
                    <>
                      <p style={{ marginTop: '0.5rem', maxWidth: '32rem', fontSize: '0.75rem', lineHeight: '1.25rem', color: '#655b4d' }}>
                        {story.audioTitle}
                      </p>
                      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PlayLeadButton
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            play();
                          }}
                          aria-label={story.title + ' ' + (isPlayingStory ? '일시정지' : '듣기')}
                        >
                          <span aria-hidden="true">{isPlayingStory ? 'Ⅱ' : '▶'}</span>
                          {isPlayingStory ? '일시정지' : '이야기 듣기'}
                          {story.formattedDuration && (
                            <span style={{ fontWeight: 400, color: '#d8d0c5' }}>{story.formattedDuration}</span>
                          )}
                        </PlayLeadButton>
                        <span style={{ fontSize: 10, color: '#8c7e6c' }}>{activeMeta?.label || '오늘의 추천'}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: 10, color: '#786d5e' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {activeMeta?.label || formatCategory(story)}
                      </span>
                      <span style={{ flexShrink: 0 }}>{story.formattedDuration || '오디오'}</span>
                    </div>
                  )}
                </CardContent>

                {!isLead && isPlayingStory && (
                  <SubBadgePlaying>
                    재생 중
                  </SubBadgePlaying>
                )}
              </CardArticle>
            );
          })}
        </BentoGrid>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem' }}>
          <span style={{ fontSize: 10, color: '#8c7e6c' }}>
            {String(normalizedIndex + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}
            <span style={{ marginLeft: '0.5rem' }}>카드를 고르면 앞으로 이동합니다</span>
          </span>
          <button
            type="button"
            onClick={() => move(1)}
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#211e19',
              textDecoration: 'underline',
              textUnderlineOffset: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            다음 이야기 →
          </button>
        </div>
      </div>
    </SectionWrapper>
  );
};
