'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Pause, Play } from 'lucide-react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { SorimaruStoryItem } from '@/features/sorimaru-audio/types/sorimaru.types';
import { palette, meok, fontSize } from '@/design-system/tokens';

interface EditorialStoryListProps {
  stories: SorimaruStoryItem[];
}

const LIST_FALLBACK_IMAGES = [
  '/images/hanok/hanok-main.png',
  '/images/hanok/hanok-exterior.png',
  '/images/hanok/hanok-interior.png',
  '/images/hanok/hanok-porch.png',
  '/images/hanok/giwa-detail.png',
];

const imageFor = (story: SorimaruStoryItem, index: number) => {
  if (story.imageUrl) return story.imageUrl;
  const seed = Array.from(`${story.stid}${story.title}`).reduce((sum, char) => sum + char.charCodeAt(0), index);
  return LIST_FALLBACK_IMAGES[seed % LIST_FALLBACK_IMAGES.length];
};

const categoryLabelFor = (story: SorimaruStoryItem) => {
  const categoryLabels: Record<string, string> = {
    한옥: '한옥/고택',
    시장: '전통시장',
    마을: '전통마을',
    궁: '궁궐/역사',
    길: '자연/둘레길',
  };
  if (story.category && story.category !== '오디 이야기') return categoryLabels[story.category] || story.category;
  if (story.title.includes('한옥') || story.title.includes('고택')) return '한옥/고택';
  if (story.title.includes('시장')) return '전통시장';
  if (story.title.includes('궁') || story.title.includes('왕')) return '궁궐/역사';
  return story.badgeText === '음원 제공' ? '문화유산' : '';
};

const shimmerKeyframe = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e5e5e3 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmerKeyframe} 1.6s ease-in-out infinite;
  border-radius: 4px;
`;

export const EditorialStoryListSkeleton: React.FC = () => (
  <div aria-label="트랙 목록 로딩 중" style={{ width: '100%', padding: '0.5rem 0' }} aria-busy="true">
    {Array.from({ length: 7 }, (_, index) => (
      <div
        key={index}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid rgba(33, 30, 25, 0.08)',
          padding: '0.875rem 0.25rem',
        }}
      >
        <SkeletonBox style={{ height: 12, width: 20, borderRadius: 4 }} />
        <SkeletonBox style={{ height: 64, width: 76, flexShrink: 0, borderRadius: 10 }} />
        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <SkeletonBox style={{ height: 10, width: 80 }} />
          <SkeletonBox style={{ height: 16, width: '60%' }} />
          <SkeletonBox style={{ height: 10, width: 120 }} />
        </div>
        <SkeletonBox style={{ height: 32, width: 32, flexShrink: 0, borderRadius: '50%' }} />
      </div>
    ))}
  </div>
);

const listVariants: Variants = {
  hidden: { opacity: 0, y: 5, filter: 'blur(2px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1], staggerChildren: 0.025 } },
  exit: { opacity: 0, y: -3, filter: 'blur(2px)', transition: { duration: 0.14 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

const RowItem = styled(motion.div)<{ $isCurrent: boolean }>`
  position: relative;
  display: grid;
  cursor: pointer;
  grid-template-columns: 24px 76px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0.25rem;
  transition: background-color 0.3s ease;

  @media (min-width: 640px) {
    grid-template-columns: 30px 80px minmax(0, 1fr) auto;
    gap: 1rem;
    padding: 1rem 0.25rem;
  }

  background-color: ${({ $isCurrent }) => ($isCurrent ? '#fff8fa' : 'transparent')};

  &:hover {
    background-color: ${({ $isCurrent }) => ($isCurrent ? '#fff8fa' : '#faf8f4')};
  }
`;

const PlayIconBtn = styled.button<{ $isPlaying: boolean }>`
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid;
  transition: all 0.2s ease;
  cursor: pointer;

  ${({ $isPlaying }) =>
    $isPlaying
      ? `
        border-color: ${palette.jangmi[500]};
        background-color: ${palette.jangmi[500]};
        color: #ffffff;
      `
      : `
        border-color: rgba(33, 30, 25, 0.15);
        background-color: transparent;
        color: #655b4d;
        &:hover {
          border-color: ${palette.jangmi[500]};
          color: ${palette.jangmi[500]};
        }
      `}
`;

export const EditorialStoryList: React.FC<EditorialStoryListProps> = ({ stories }) => {
  const currentStory = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const setCurrentStory = useSorimaruAudioStore((s) => s.setCurrentStory);
  const selectStory = useSorimaruAudioStore((s) => s.selectStory);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);
  const selectedCategory = useSorimaruAudioStore((s) => s.selectedCategory);
  const searchQuery = useSorimaruAudioStore((s) => s.searchQuery);

  const handlePlayClick = (story: SorimaruStoryItem, event: React.MouseEvent) => {
    event.stopPropagation();
    if (currentStory.stid === story.stid) setIsPlaying(!isPlaying);
    else setCurrentStory(story);
  };

  if (stories.length === 0) {
    return (
      <div style={{ width: '100%', padding: '4rem 0', textAlign: 'center', color: '#655b4d' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 500 }}>선택한 조건에 해당하는 오디오 가이드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0.5rem 0' }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${selectedCategory}-${searchQuery}`}
          variants={listVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {stories.map((story, index) => {
            const isCurrent = currentStory.stid === story.stid;
            const isThisPlaying = isCurrent && isPlaying;
            const trackNum = String(index + 1).padStart(2, '0');

            return (
              <RowItem
                key={`${story.stid}-${index}`}
                variants={itemVariants}
                onClick={() => selectStory(story)}
                $isCurrent={isCurrent}
                style={{ borderBottom: '1px solid rgba(33, 30, 25, 0.08)' }}
              >
                <div style={{ textAlign: 'center' }}>
                  {isThisPlaying ? (
                    <span
                      style={{
                        margin: '0 auto',
                        display: 'block',
                        height: 6,
                        width: 6,
                        borderRadius: '50%',
                        backgroundColor: palette.jangmi[500],
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        fontWeight: 600,
                        color: isCurrent ? palette.jangmi[500] : '#a09282',
                      }}
                    >
                      {trackNum}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    position: 'relative',
                    height: '4rem',
                    width: '4.75rem',
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: 10,
                    backgroundColor: '#f3eee8',
                  }}
                >
                  <img
                    src={imageFor(story, index)}
                    alt={story.title}
                    loading="lazy"
                    decoding="async"
                    style={{ height: '100%', width: '100%', transform: 'scale(1.12)', objectFit: 'cover' }}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = LIST_FALLBACK_IMAGES[0];
                    }}
                  />
                  {!story.imageUrl && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        borderRadius: 4,
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        padding: '2px 4px',
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'rgba(255, 255, 255, 0.9)',
                      }}
                    >
                      참고용
                    </span>
                  )}
                  {isThisPlaying && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        backgroundColor: 'rgba(33, 30, 25, 0.45)',
                      }}
                    >
                      <span
                        style={{
                          height: 8,
                          width: 8,
                          borderRadius: '50%',
                          backgroundColor: palette.jangmi[500],
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0, paddingRight: '0.25rem' }}>
                  <div style={{ marginBottom: '0.25rem', display: 'flex', minWidth: 0, alignItems: 'center', gap: '0.375rem', fontSize: 10, color: '#8c7e6c' }}>
                    {categoryLabelFor(story) && (
                      <>
                        <span style={{ flexShrink: 0, fontWeight: 500, color: palette.jangmi[500] }}>
                          {categoryLabelFor(story)}
                        </span>
                        <span style={{ color: '#d1c9bf' }}>·</span>
                      </>
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {story.locationName || '대한민국 문화유산'}
                    </span>
                  </div>
                  <h4
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-hanok)',
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '-0.025em',
                      color: isCurrent ? palette.jangmi[500] : '#211e19',
                    }}
                  >
                    {story.title}
                  </h4>
                  <p
                    style={{
                      marginTop: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 10,
                      color: '#786d5e',
                    }}
                  >
                    {story.audioTitle || story.locationName || '대한민국 문화유산'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#8c7e6c' }}>
                    {story.formattedDuration || '3:00'}
                  </span>
                  <PlayIconBtn
                    type="button"
                    onClick={(event) => handlePlayClick(story, event)}
                    $isPlaying={isThisPlaying}
                    title={isThisPlaying ? '일시정지' : '재생'}
                  >
                    {isThisPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
                  </PlayIconBtn>
                </div>
              </RowItem>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
