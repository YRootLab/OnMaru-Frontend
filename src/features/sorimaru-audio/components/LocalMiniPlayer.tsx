'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, X, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { useSorimaruAudioPlayer } from '@/features/sorimaru-audio/hooks/useSorimaruAudioPlayer';
import { useSorimaruImage } from '@/features/sorimaru-audio/hooks/useSorimaruImage';
import { SorimaruRoadview } from '@/features/sorimaru-audio/components/SorimaruRoadview';
import { meok, surface, fontSize } from '@/design-system/tokens';

const formatTime = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds || 0) / 60)}:${String(Math.floor(Math.max(0, seconds || 0) % 60)).padStart(2, '0')}`;

const PlayIcon: React.FC<{ size?: number }> = ({ size = 16 }) => {
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  return isPlaying ? <Pause size={size} strokeWidth={2.5} /> : <Play size={size} fill="currentColor" style={{ marginLeft: 2 }} />;
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=800&q=80';

/* ------------------------------------------------------------
 * 🎵 라이브 오디오 웨이브폼 비주얼라이저 (재생 인터랙션 효과)
 * ------------------------------------------------------------ */
const WaveformBar = styled(motion.span)<{ $delay: number }>`
  display: inline-block;
  width: 3px;
  border-radius: 9999px;
  background-color: #d4af37;
`;

export const LiveAudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const bars = [0.4, 0.9, 0.6, 1.0, 0.5];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', height: '16px', marginLeft: '6px' }}>
      {bars.map((height, i) => (
        <WaveformBar
          key={i}
          $delay={i * 0.12}
          animate={
            isPlaying
              ? {
                  height: ['4px', `${Math.max(8, height * 16)}px`, '4px'],
                }
              : { height: '4px' }
          }
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.14,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

/* ------------------------------------------------------------
 * 미니 플로팅 플레이어 바
 * ------------------------------------------------------------ */
const FloatingBarContainer = styled(motion.div)`
  position: fixed;
  bottom: calc(5.5rem + env(safe-area-inset-bottom));
  left: 0.75rem;
  right: 0.75rem;
  z-index: 110;
  margin-left: auto;
  margin-right: auto;
  width: auto;
  max-width: 36rem;
  overflow: hidden;
  border-radius: 1.35rem;
  background-color: rgba(248, 248, 247, 0.96);
  padding: 0.625rem 0.875rem 0.875rem;
  backdrop-filter: blur(24px);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.12);

  [data-theme='dark'] & {
    background-color: rgba(28, 26, 23, 0.95);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }

  @media (min-width: 640px) {
    padding: 0.75rem 1rem 1rem;
  }
  @media (min-width: 768px) {
    bottom: calc(1.5rem + env(safe-area-inset-bottom));
    z-index: 50;
  }
`;

const MiniPlayerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ExpandButton = styled.button`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

const ThumbnailImg = styled.img`
  height: 2.75rem;
  width: 2.75rem;
  flex-shrink: 0;
  border-radius: 0.75rem;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const MetaTextCol = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const StoryTitle = styled.span`
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-hanok);
  font-size: ${fontSize.sm};
  font-weight: 600;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const StorySubMeta = styled.span`
  display: flex;
  align-items: center;
  font-size: ${fontSize.micro};
  color: ${meok[500]};
  margin-top: 0.125rem;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }

  .category {
    color: #a88420;
    font-weight: 600;

    [data-theme='dark'] & {
      color: #d4af37;
    }
  }
  .time {
    margin-left: 0.5rem;
  }
`;

const PlayCircleBtn = styled(motion.button)`
  display: flex;
  height: 2.625rem;
  width: 2.625rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, #2b2824 0%, #171513 100%);
  color: #f5f5f4;
  border: 1px solid rgba(212, 175, 55, 0.3);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);

  [data-theme='dark'] & {
    background: linear-gradient(135deg, #d4af37 0%, #b89225 100%);
    color: #171513;
    border: none;
    box-shadow: 0 4px 16px rgba(212, 175, 55, 0.35);
  }
`;

const ScriptOpenBtn = styled.button`
  display: none;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  padding: 0.4rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #f0f0ee;
  color: ${meok[800]};
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e5e5e3;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
    color: ${meok[200]};
    border: 1px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background-color: rgba(255, 255, 255, 0.14);
    }
  }

  @media (min-width: 640px) {
    display: flex;
  }
`;

const ProgressSlot = styled.div`
  position: absolute;
  bottom: 0.375rem;
  left: 1rem;
  right: 1rem;

  @media (min-width: 640px) {
    left: 1.25rem;
    right: 1.25rem;
  }
`;

const ProgressTrack = styled.div`
  height: 3px;
  width: 100%;
  overflow: hidden;
  border-radius: 9999px;
  background-color: rgba(0, 0, 0, 0.08);

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, #b89225 0%, #d4af37 100%);
  transition: width 0.25s linear;
  width: ${({ $width }) => $width}%;
`;

/* ------------------------------------------------------------
 * 팝업 Drawer / 모달 스타일링
 * ------------------------------------------------------------ */
const DrawerBackdrop = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 200;
  background-color: rgba(14, 16, 22, 0.75);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overscroll-behavior: contain;
  touch-action: none;

  @media (min-width: 1024px) {
    align-items: center;
    padding: 2rem;
  }
`;

const DrawerPanel = styled(motion.aside)<{ $isTranscriptOpen: boolean }>`
  position: relative;
  width: 100%;
  max-width: 32rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
  border-top-left-radius: 1.75rem;
  border-top-right-radius: 1.75rem;
  background-color: #f8f8f7;
  padding: 1.5rem;
  padding-bottom: calc(1.75rem + env(safe-area-inset-bottom));
  box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.25);
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  [data-theme='dark'] & {
    background-color: #1c1a17;
    color: ${meok[100]};
    box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 768px) {
    max-width: 68rem;
  }

  @media (min-width: 1024px) {
    border-radius: 1.75rem;
    max-height: 88vh;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  }
`;

const DrawerHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
`;

const BackToPlayerBtn = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #a88420;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #8c6c15;
  }

  [data-theme='dark'] & {
    color: #d4af37;
    &:hover {
      color: #e5c04e;
    }
  }
`;

const CloseBtn = styled(motion.button)`
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: ${meok[600]};
  background-color: #efefed;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #e5e5e3;
    color: ${meok[900]};
  }

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
    color: ${meok[300]};

    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }
  }
`;

const PlayerHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeartSaveButton = styled(motion.button)<{ $saved: boolean }>`
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
  color: ${({ $saved }) => ($saved ? '#8b7a49' : meok[600])};
  background: ${({ $saved }) => ($saved ? 'rgba(139, 122, 73, 0.12)' : '#efefed')};
  border: 1px solid ${({ $saved }) => ($saved ? 'rgba(139, 122, 73, 0.3)' : 'rgba(0, 0, 0, 0.05)')};

  [data-theme='dark'] & {
    color: ${({ $saved }) => ($saved ? '#c8b77a' : meok[300])};
    background: ${({ $saved }) => ($saved ? 'rgba(200, 183, 122, 0.14)' : 'rgba(255, 255, 255, 0.08)')};
    border-color: ${({ $saved }) => ($saved ? 'rgba(200, 183, 122, 0.28)' : 'rgba(255, 255, 255, 0.08)')};
  }
`;

const PlayingStatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  background-color: #f3f3f1;
  font-size: ${fontSize.micro};
  font-weight: 600;
  color: #a88420;
  border: 1px solid rgba(168, 132, 32, 0.2);

  [data-theme='dark'] & {
    background-color: rgba(212, 175, 55, 0.1);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.25);
  }
`;

/* ------------------------------------------------------------
 * 럭셔리 커스텀 Range Slider (촌스러운 핑크 완전 제거)
 * ------------------------------------------------------------ */
const CustomSliderContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 0.5rem 0;

  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 5px;
    border-radius: 9999px;
    background: #e5e5e3;
    outline: none;
    cursor: pointer;
    transition: height 0.15s ease;

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.12);
    }

    &:hover {
      height: 7px;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #1c1a17;
      border: 2.5px solid #d4af37;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      cursor: grab;
      transition: transform 0.15s ease;

      [data-theme='dark'] & {
        background: #ffffff;
        border: 2.5px solid #d4af37;
      }

      &:active {
        cursor: grabbing;
        transform: scale(1.35);
      }
    }

    &::-moz-range-thumb {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #1c1a17;
      border: 2.5px solid #d4af37;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
      cursor: grab;

      [data-theme='dark'] & {
        background: #ffffff;
      }
    }
  }
`;

const ScriptProgressTrack = styled.div`
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e5e5e3;

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
  }
`;

const ScriptProgressActive = styled(motion.div)`
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  background: linear-gradient(to bottom, #b89225, #d4af37);
`;

const ScriptLineBtn = styled(motion.button)<{ $active: boolean }>`
  display: block;
  width: 100%;
  border-radius: 0.85rem;
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  line-height: 1.6;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  ${({ $active }) =>
    $active
      ? `
        background-color: #ffffff;
        font-weight: 700;
        color: #1c1a17;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        border-left: 3px solid #d4af37;
      `
      : `
        background: none;
        color: ${meok[600]};
        &:hover {
          background-color: #f0f0ee;
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $active }) =>
      $active
        ? `
          background-color: #24211d;
          font-weight: 700;
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
          border-left: 3px solid #d4af37;
        `
        : `
          background: none;
          color: ${meok[400]};
          &:hover {
            background-color: rgba(255, 255, 255, 0.05);
            color: ${meok[100]};
          }
        `}
  }
`;

const BigPlayBtn = styled(motion.button)`
  display: flex;
  height: 3.5rem;
  width: 3.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, #1c1a17 0%, #2b2824 100%);
  color: #f5f5f4;
  border: 1.5px solid rgba(212, 175, 55, 0.4);
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);

  [data-theme='dark'] & {
    background: linear-gradient(135deg, #d4af37 0%, #b89225 100%);
    color: #171513;
    border: none;
    box-shadow: 0 8px 28px rgba(212, 175, 55, 0.35);
  }
`;

const SkipTimeBtn = styled(motion.button)`
  padding: 0.45rem 0.85rem;
  border-radius: 9999px;
  background-color: #efefed;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${meok[800]};
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #e5e5e3;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
    color: ${meok[200]};
    border: 1px solid rgba(255, 255, 255, 0.08);

    &:hover {
      background-color: rgba(255, 255, 255, 0.14);
    }
  }
`;

const PreviewLineBtn = styled.button<{ $active: boolean }>`
  display: block;
  width: 100%;
  border-radius: 0.5rem;
  padding: 0.45rem 0.625rem;
  text-align: left;
  font-size: 0.8125rem;
  line-height: 1.5;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  ${({ $active }) =>
    $active
      ? `
        background-color: #ffffff;
        font-weight: 700;
        color: #1c1a17;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        border-left: 2.5px solid #d4af37;
      `
      : `
        background: none;
        color: ${meok[600]};
        &:hover {
          color: ${meok[900]};
        }
      `}

  [data-theme='dark'] & {
    ${({ $active }) =>
      $active
        ? `
          background-color: rgba(255, 255, 255, 0.08);
          font-weight: 700;
          color: #ffffff;
          border-left: 2.5px solid #d4af37;
        `
        : `
          background: none;
          color: ${meok[400]};
          &:hover {
            color: ${meok[100]};
          }
        `}
  }
`;

const SpeedButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.125rem;
  border-radius: 9999px;
  background-color: #efefed;
  color: ${meok[900]};
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: #e5e5e3;
  }

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.08);
    color: ${meok[100]};
    border: 1px solid rgba(255, 255, 255, 0.08);

    &:hover {
      background-color: rgba(255, 255, 255, 0.14);
    }
  }
`;

const PlayerExperienceGrid = styled.div`
  display: grid;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 1.2fr) minmax(15rem, 0.8fr);
    align-items: stretch;
  }
`;

const PlaybackColumn = styled.div`
  min-width: 0;
`;

const TranscriptSidebar = styled.section`
  display: flex;
  min-height: 15rem;
  flex-direction: column;
  border-radius: 1.25rem;
  background: #f1f1ef;
  padding: 1rem;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    min-height: 0;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
  }

  & > section {
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
    margin-top: 0 !important;
    padding-top: 0 !important;
    border-top: 0 !important;
  }

  & > section > div:last-child {
    min-height: 0;
    flex: 1;
    height: auto !important;
    overflow-y: auto !important;
    overscroll-behavior: contain;
  }
`;

export const LocalMiniPlayer: React.FC = () => {
  const story = useSorimaruAudioStore((s) => s.currentStory);
  const isPlaying = useSorimaruAudioStore((s) => s.isPlaying);
  const currentTime = useSorimaruAudioStore((s) => s.currentTime);
  const duration = useSorimaruAudioStore((s) => s.duration);
  const playbackRate = useSorimaruAudioStore((s) => s.playbackRate);
  const setPlaybackRate = useSorimaruAudioStore((s) => s.setPlaybackRate);
  const activeIndex = useSorimaruAudioStore((s) => s.activeScriptIndex);
  const lines = useSorimaruAudioStore((s) => s.parsedScriptLines);
  const isExpanded = useSorimaruAudioStore((s) => s.isPlayerExpanded);
  const setIsPlaying = useSorimaruAudioStore((s) => s.setIsPlaying);
  const setIsExpanded = useSorimaruAudioStore((s) => s.setIsPlayerExpanded);
  const savedStories = useSorimaruAudioStore((s) => s.savedStories);
  const toggleSavedStory = useSorimaruAudioStore((s) => s.toggleSavedStory);
  const { seekTo, analyserRef } = useSorimaruAudioPlayer();
  const imgSrc = useSorimaruImage(story);
  const activeLineRef = useRef<HTMLButtonElement>(null);
  const activeSidebarLineRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const hasValidAudio = Boolean(story.audioUrl);
      setIsVisible(hasValidAudio);
    };
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, [story.audioUrl]);

  // 🔒 모달 열렸을 때 백그라운드 스크롤 완벽 차단
  useEffect(() => {
    if (!isExpanded) return;
    const scrollY = window.scrollY;
    const bodyStyle = document.body.style;
    const rootStyle = document.documentElement.style;
    const previousModalState = document.body.dataset.sorimaruPlayerOpen;
    const previous = {
      bodyOverflow: bodyStyle.overflow,
      bodyPosition: bodyStyle.position,
      bodyTop: bodyStyle.top,
      bodyWidth: bodyStyle.width,
      bodyPaddingRight: bodyStyle.paddingRight,
      rootOverflow: rootStyle.overflow,
      rootOverscrollBehavior: rootStyle.overscrollBehavior,
    };
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    bodyStyle.overflow = 'hidden';
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = '100%';
    bodyStyle.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
    rootStyle.overflow = 'hidden';
    rootStyle.overscrollBehavior = 'none';
    document.body.dataset.sorimaruPlayerOpen = 'true';

    return () => {
      bodyStyle.overflow = previous.bodyOverflow;
      bodyStyle.position = previous.bodyPosition;
      bodyStyle.top = previous.bodyTop;
      bodyStyle.width = previous.bodyWidth;
      bodyStyle.paddingRight = previous.bodyPaddingRight;
      rootStyle.overflow = previous.rootOverflow;
      rootStyle.overscrollBehavior = previous.rootOverscrollBehavior;
      if (previousModalState === undefined) delete document.body.dataset.sorimaruPlayerOpen;
      else document.body.dataset.sorimaruPlayerOpen = previousModalState;
      window.scrollTo(0, scrollY);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (isTranscriptOpen && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, isTranscriptOpen]);

  useEffect(() => {
    if (isExpanded && !isTranscriptOpen && activeSidebarLineRef.current) {
      activeSidebarLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, isExpanded, isTranscriptOpen]);

  const previewStart = Math.max(0, Math.min(activeIndex, Math.max(0, lines.length - 6)));
  const previewLines = lines.slice(previewStart, previewStart + 6);
  const audioProgress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const transcriptProgress = lines.length ? ((activeIndex + 1) / lines.length) * 100 : 0;
  const isSaved = savedStories.some((saved) => (saved.stid || saved.title) === (story.stid || story.title));
  const closePlayer = () => {
    setIsTranscriptOpen(false);
    setIsExpanded(false);
  };

  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    setPlaybackRate(rates[(currentIndex + 1) % rates.length]);
  };

  return (
    <>
      {/* 🎵 하단 플로팅 미니 플레이어 */}
      <AnimatePresence>
        {isVisible && (
          <FloatingBarContainer
            key="mini-player-floating-bar"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <MiniPlayerContent>
              <ExpandButton type="button" onClick={() => setIsExpanded(true)}>
                <ThumbnailImg src={story.imageUrl || FALLBACK_IMAGE} alt="" />
                <MetaTextCol>
                  <StoryTitle>{story.title}</StoryTitle>
                  <StorySubMeta>
                    <span className="category">{story.category}</span>
                    <span className="time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </StorySubMeta>
                </MetaTextCol>
              </ExpandButton>

              <PlayCircleBtn
                type="button"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.06 }}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                <PlayIcon />
              </PlayCircleBtn>
              <ScriptOpenBtn type="button" onClick={() => setIsExpanded(true)}>
                대본 보기
              </ScriptOpenBtn>
            </MiniPlayerContent>

            {/* 미니 플레이어 바닥면 슬릭 골드 프로그레스 바 */}
            <ProgressSlot>
              <ProgressTrack>
                <ProgressFill $width={audioProgress} />
              </ProgressTrack>
            </ProgressSlot>
          </FloatingBarContainer>
        )}
      </AnimatePresence>

      {/* 🏛️ 확장 플레이어 & 360° 로드뷰 & 전체 대본 Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <DrawerBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlayer}
          >
            <DrawerPanel
              layout
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(event) => event.stopPropagation()}
              $isTranscriptOpen={isTranscriptOpen}
            >
              {isTranscriptOpen ? (
                <>
                  <DrawerHeader>
                    <BackToPlayerBtn
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsTranscriptOpen(false)}
                    >
                      <ChevronLeft size={16} strokeWidth={2.5} />
                      <span>오디오 플레이어로</span>
                    </BackToPlayerBtn>
                    <CloseBtn
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={closePlayer}
                      aria-label="패널 닫기"
                    >
                      <X size={18} strokeWidth={2.5} />
                    </CloseBtn>
                  </DrawerHeader>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0 1.25rem' }}>
                    <div>
                      <h2
                        style={{
                          marginTop: 0,
                          maxWidth: 280,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--font-hanok)',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: meok[900],
                        }}
                      >
                        {story.title}
                      </h2>
                      <p style={{ fontSize: '0.8125rem', color: meok[500], marginTop: '0.25rem' }}>
                        {story.locationName || '대한민국 문화유산'}
                      </p>
                    </div>
                    <PlayCircleBtn
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.06 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{ height: '3rem', width: '3rem' }}
                    >
                      <PlayIcon size={18} />
                    </PlayCircleBtn>
                  </div>

                  <div style={{ position: 'relative', paddingLeft: '1.25rem', paddingRight: '0.5rem', paddingTop: '0.5rem' }}>
                    <ScriptProgressTrack />
                    <ScriptProgressActive
                      animate={{ height: `${transcriptProgress}%` }}
                      transition={{ duration: 0.45 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      <AnimatePresence>
                        {lines.map((line, idx) => {
                          const isActive = line.id === lines[activeIndex]?.id;
                          return (
                            <ScriptLineBtn
                              key={line.id}
                              ref={isActive ? activeLineRef : null}
                              type="button"
                              onClick={() => seekTo(line.timeSec)}
                              $active={isActive}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.02 }}
                              layout
                            >
                              {line.text}
                            </ScriptLineBtn>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PlayingStatusBadge>
                      <span>지금 재생 중</span>
                      <LiveAudioVisualizer isPlaying={isPlaying} />
                    </PlayingStatusBadge>
                    <PlayerHeaderActions>
                      <HeartSaveButton
                        type="button"
                        $saved={isSaved}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.06 }}
                        onClick={() => toggleSavedStory(story)}
                        aria-label={isSaved ? '마음에 담은 소리에서 제거' : '마음에 담은 소리에 추가'}
                        title={isSaved ? '마음에 담음' : '마음에 담기'}
                      >
                        <Heart size={17} strokeWidth={2.2} fill={isSaved ? 'currentColor' : 'none'} />
                      </HeartSaveButton>
                      <CloseBtn
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={closePlayer}
                        aria-label="패널 닫기"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </CloseBtn>
                    </PlayerHeaderActions>
                  </div>

                  {/* 360° 로드뷰 & 현장 몰입형 캔버스 */}
                  <PlayerExperienceGrid>
                    <PlaybackColumn>
                  <motion.div
                    layoutId="sorimaru-player-art"
                    style={{ width: '100%', borderRadius: '1.25rem', overflow: 'hidden' }}
                  >
                    <SorimaruRoadview
                      mapX={story.mapX}
                      mapY={story.mapY}
                      fallbackImage={imgSrc}
                      title={story.title}
                      analyserRef={analyserRef}
                      isPlaying={isPlaying}
                    />
                  </motion.div>

                  {/* 메인 타이틀 & 서브타이틀 UX */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: meok[500] }}>
                        {story.locationName || '대한민국 문화유산'}
                      </span>
                    </div>

                    <h2
                      style={{
                        marginTop: '0.5rem',
                        fontFamily: 'var(--font-hanok)',
                        fontSize: '1.35rem',
                        fontWeight: 700,
                        color: meok[900],
                        lineHeight: 1.3,
                      }}
                    >
                      {story.title}
                    </h2>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8125rem', lineHeight: '1.3', color: meok[600] }}>
                      <span style={{ display: 'block' }}>{story.audioTitle}</span>
                      <span style={{ marginTop: '0.2rem', display: 'block', color: meok[500], fontWeight: 500 }}>
                        {story.speaker || '온마루 문화해설사'}
                      </span>
                    </p>
                  </div>

                  {/* 럭셔리 슬라이더 컨트롤 */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <CustomSliderContainer>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={(event) => seekTo(Number(event.target.value))}
                      />
                    </CustomSliderContainer>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        color: meok[500],
                        marginTop: '0.125rem',
                      }}
                    >
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* 재생 & 탐색 인터랙션 버튼 그룹 */}
                  <div
                    style={{
                      marginTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1.25rem',
                      position: 'relative',
                    }}
                  >
                    <SpeedButton
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={cyclePlaybackRate}
                      style={{ position: 'absolute', left: 0 }}
                      title="재생 속도 변경"
                    >
                      {playbackRate}x
                    </SpeedButton>

                    <SkipTimeBtn
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => seekTo(Math.max(0, currentTime - 10))}
                    >
                      <SkipBack size={13} strokeWidth={2.5} />
                      <span>10초 전</span>
                    </SkipTimeBtn>

                    <BigPlayBtn
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      <PlayIcon size={22} />
                    </BigPlayBtn>

                    <SkipTimeBtn
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => seekTo(Math.min(duration || currentTime + 10, currentTime + 10))}
                    >
                      <span>10초 후</span>
                      <SkipForward size={13} strokeWidth={2.5} />
                    </SkipTimeBtn>
                  </div>

                  {/* 대본 미리보기 & 전체 대본 보기 전환 */}
                    </PlaybackColumn>
                    <TranscriptSidebar aria-label="실시간 해설 대본">
                  {previewLines.length > 0 && (
                    <section style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #eaeae8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: fontSize.micro, fontWeight: 700, letterSpacing: '0.12em', color: '#a88420' }}>
                            실시간 해설 대본
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsTranscriptOpen(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: '#efefed',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: meok[800],
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span>전체 대본 보기</span>
                          <ChevronRight size={13} strokeWidth={2.5} />
                        </button>
                      </div>

                      <div
                        style={{
                          position: 'relative',
                          marginTop: '0.75rem',
                          height: '100%',
                          minHeight: '12rem',
                          overflowY: 'auto',
                          borderRadius: '1rem',
                          backgroundColor: '#f1f1ef',
                          padding: '0.75rem',
                          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          {lines.map((line) => (
                            <PreviewLineBtn
                              key={line.id}
                              ref={line.id === lines[activeIndex]?.id ? activeSidebarLineRef : null}
                              type="button"
                              onClick={() => seekTo(line.timeSec)}
                              $active={line.id === lines[activeIndex]?.id}
                            >
                              {line.text}
                            </PreviewLineBtn>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                    </TranscriptSidebar>
                  </PlayerExperienceGrid>
                </>
              )}
            </DrawerPanel>
          </DrawerBackdrop>
        )}
      </AnimatePresence>
    </>
  );
};
