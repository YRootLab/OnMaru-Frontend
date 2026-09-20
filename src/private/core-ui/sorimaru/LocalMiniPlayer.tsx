'use client';

import React, { useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play,
  Pause,
  X,
  Heart,
  RotateCcw,
  RotateCw,
  Compass,
  BookOpen,
} from 'lucide-react';
import { useSorimaruAudioStore } from '@/features/sorimaru-audio/store/useSorimaruAudioStore';
import { useSorimaruAudioPlayer } from '@/features/sorimaru-audio/hooks/useSorimaruAudioPlayer';
import { useSorimaruImage } from '@/features/sorimaru-audio/hooks/useSorimaruImage';
import { SorimaruRoadview } from './SorimaruRoadview';
import { PlayerTranscriptPanel } from './PlayerTranscriptPanel';
import { normalizeContentTags } from './playerTranscriptModel';
import { palette, meok, fontSize } from '@/design-system/tokens';
import { transientProps } from '@/design-system/styled';

type ViewMode = 'roadview' | 'transcript';

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
  background-color: ${palette.juhong[400]};
`;

export const LiveAudioVisualizer: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const bars = [0.4, 0.9, 0.6, 1.0, 0.5];
  if (!isPlaying) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', height: '16px' }}>
      {bars.map((height, i) => (
        <WaveformBar
          key={i}
          $delay={i * 0.12}
          animate={{
            height: ['4px', `${Math.max(8, height * 16)}px`, '4px'],
          }}
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
  bottom: calc(6.25rem + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  margin: 0 auto;
  width: min(calc(100% - 1.5rem), 36rem);
  z-index: 110;
  overflow: hidden;
  border-radius: 1.35rem;
  background-color: rgba(255, 255, 255, 0.98);
  padding: 0.625rem 0.875rem 0.875rem;
  backdrop-filter: blur(24px);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.1);

  [data-theme='dark'] & {
    background-color: rgba(28, 26, 23, 0.95);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }

  @media (min-width: 640px) {
    padding: 0.75rem 1rem 1rem;
  }
  @media (min-width: 768px) {
    bottom: calc(2.25rem + env(safe-area-inset-bottom));
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
    color: ${palette.juhong[600]};
    font-weight: 600;

    [data-theme='dark'] & {
      color: ${palette.juhong[400]};
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
  background: linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.juhong[600]} 100%);
  color: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(255, 85, 0, 0.28);

  [data-theme='dark'] & {
    background: linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.juhong[600]} 100%);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 16px rgba(255, 85, 0, 0.35);
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
  background: linear-gradient(90deg, ${palette.juhong[300]} 0%, ${palette.juhong[500]} 100%);
  transition: width 0.25s linear;
  width: ${({ $width }) => $width}%;
`;

/* ------------------------------------------------------------
 * 팝업 Drawer / 모달 스타일링 (Hero / Bottom Sheet 트랜지션)
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
    padding: 1.5rem;
  }
`;

const DrawerPanel = styled(motion.aside)`
  position: relative;
  width: 100%;
  max-width: 36rem;
  height: min(90dvh, 48rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: contain;
  touch-action: pan-y;
  border-top-left-radius: 1.75rem;
  border-top-right-radius: 1.75rem;
  background-color: #ffffff;
  padding: 1.25rem 1.25rem 1rem;
  padding-bottom: calc(0.875rem + env(safe-area-inset-bottom));
  box-shadow: 0 -12px 48px rgba(0, 0, 0, 0.2);
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
    max-width: 40rem;
    padding: 1.35rem 1.5rem 1.15rem;
  }

  @media (min-width: 1024px) {
    border-radius: 1.75rem;
    height: min(86vh, 46rem);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
`;

/* ------------------------------------------------------------
 * 🏛️ 상단 바 & 세그먼트 뷰 스위처 (Segmented Control Menu Bar)
 * ------------------------------------------------------------ */
const DrawerHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.65rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  flex-shrink: 0;

  [data-theme='dark'] & {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
`;

const HeaderLeftArea = styled.div`
  display: flex;
  align-items: center;
  min-width: 4rem;
`;

const SegmentedControl = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.28rem;
  border-radius: 9999px;
  background: #f4f4f3;
  border: 1px solid rgba(0, 0, 0, 0.04);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const SegmentTab = styled.button<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.45rem 1rem;
  border-radius: 9999px;
  font-size: 0.825rem;
  font-weight: 600;
  color: ${({ $active }) => ($active ? '#171513' : meok[600])};
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1;
  transition: color 0.2s ease;
  white-space: nowrap;

  [data-theme='dark'] & {
    color: ${({ $active }) => ($active ? '#ffffff' : meok[400])};
  }

  &:hover {
    color: ${({ $active }) => ($active ? '#171513' : meok[900])};
    [data-theme='dark'] & {
      color: ${({ $active }) => ($active ? '#ffffff' : meok[200])};
    }
  }

  .tab-icon {
    color: ${({ $active }) => ($active ? palette.juhong[500] : 'currentColor')};
    [data-theme='dark'] & {
      color: ${({ $active }) => ($active ? palette.juhong[400] : 'currentColor')};
    }
  }
`;

const ActiveTabPill = styled(motion.div)`
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: -1;

  [data-theme='dark'] & {
    background: #282521;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }
`;

const PlayerHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 4rem;
  justify-content: flex-end;
`;

const HeartSaveButton = styled(motion.button, transientProps)<{ $saved: boolean }>`
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
  color: ${({ $saved }) => ($saved ? palette.juhong[500] : meok[600])};
  background: ${({ $saved }) => ($saved ? palette.juhong[50] : '#efefed')};
  border: 1px solid ${({ $saved }) => ($saved ? palette.juhong[200] : 'rgba(0, 0, 0, 0.05)')};

  [data-theme='dark'] & {
    color: ${({ $saved }) => ($saved ? palette.juhong[400] : meok[300])};
    background: ${({ $saved }) => ($saved ? 'rgba(255, 85, 0, 0.15)' : 'rgba(255, 255, 255, 0.08)')};
    border-color: ${({ $saved }) => ($saved ? 'rgba(255, 85, 0, 0.3)' : 'rgba(255, 255, 255, 0.08)')};
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

/* 미니 플레이어 바 전용 슬림 하트 버튼 */
const MiniHeartBtn = styled(motion.button, transientProps)<{ $saved: boolean }>`
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  cursor: pointer;
  color: ${({ $saved }) => ($saved ? palette.juhong[500] : meok[600])};
  background: ${({ $saved }) => ($saved ? palette.juhong[50] : 'transparent')};
  border: none;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: ${({ $saved }) => ($saved ? palette.juhong[100] : 'rgba(0, 0, 0, 0.05)')};
  }

  [data-theme='dark'] & {
    color: ${({ $saved }) => ($saved ? palette.juhong[400] : meok[400])};
    background: ${({ $saved }) => ($saved ? 'rgba(255, 85, 0, 0.15)' : 'transparent')};

    &:hover {
      background: ${({ $saved }) => ($saved ? 'rgba(255, 85, 0, 0.25)' : 'rgba(255, 255, 255, 0.08)')};
    }
  }
`;

/* ------------------------------------------------------------
 * 뷰 전환 메인 영역 (Main View Area)
 * ------------------------------------------------------------ */
const MainViewArea = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  padding: 0.5rem 0.2rem 0;
`;

/* 🏛️ 모드 1: 현장 사진 뷰어 모드 (위-아래 2단 구조: 1단 사진 + 2단 2줄 타이틀 & 슬림 2문단 대본) */
const RoadviewSplitModeContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  gap: 0.6rem;
  overflow: hidden;
  padding: 0.2rem 0.25rem 0.4rem;
`;

/* 1단: 적절한 높이로 정돈된 현장 사진 뷰어 (섀도우 클리핑 방지 마진/테두리 최적화) */
const TopMediaWrap = styled.div`
  width: 100%;
  flex: 1 1 auto;
  min-height: 180px;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  [data-theme='dark'] & {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;



/* 심리스 실시간 대본 래퍼 (상하단 linear-gradient 페이드 마스크 & 확장된 높이) */
const CompactTranscriptWrap = styled.div`
  width: 100%;
  height: 6.5rem;
  overflow: hidden;
  position: relative;
  padding: 0 0.2rem;
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 12%,
    black 88%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 12%,
    black 88%,
    transparent 100%
  );
`;

const fullStoryMetaVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

const metaItemFadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

/* 📖 모드 2: 전체 대본 모드 (전체보기 - 대본 풀스크린 확장) */
const FullTranscriptModeContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  gap: 0.5rem;
  overflow: hidden;
  padding: 0.2rem 0.25rem;
`;

const FullStoryMeta = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
  padding: 0 0.35rem;

  .main-title {
    margin: 0;
    font-family: var(--font-hanok);
    font-size: 1.2rem;
    font-weight: 700;
    color: ${meok[900]};

    [data-theme='dark'] & {
      color: #ffffff;
    }
  }

  .sub-info {
    margin: 0;
    font-size: 0.8125rem;
    color: ${palette.juhong[600]};
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.35rem;

    [data-theme='dark'] & {
      color: ${palette.juhong[400]};
    }
  }
`;

const HashtagsScrollWrap = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.1rem 0 0.15rem;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const HashtagChip = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${meok[500]};
  background: transparent;
  border: none;
  padding: 0;
  white-space: nowrap;
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: ${meok[400]};
    background: transparent;
    border: none;
  }
`;

const contentFadeUpVariants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      delay: 0.1,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const FullTranscriptPanelWrap = styled(motion.div)`
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
`;

/* ------------------------------------------------------------
 * 🎛️ 하단 공통 오디오 컨트롤 독 (Fixed Bottom Audio Deck)
 * ------------------------------------------------------------ */
const AudioControlSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
  padding-top: 0.25rem;
  border-top: none;

  [data-theme='dark'] & {
    border-top: none;
  }
`;

const SliderWrap = styled.div`
  width: 65%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const CustomSliderContainer = styled.div<{ $progress?: number }>`
  position: relative;
  width: 100%;
  padding: 0.2rem 0;

  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 5px;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      ${palette.juhong[400]} 0%,
      ${palette.juhong[500]} ${({ $progress = 0 }) => $progress}%,
      #e5e5e3 ${({ $progress = 0 }) => $progress}%,
      #e5e5e3 100%
    );
    outline: none;
    cursor: pointer;
    transition: height 0.15s ease;

    [data-theme='dark'] & {
      background: linear-gradient(
        to right,
        ${palette.juhong[400]} 0%,
        ${palette.juhong[500]} ${({ $progress = 0 }) => $progress}%,
        rgba(255, 255, 255, 0.14) ${({ $progress = 0 }) => $progress}%,
        rgba(255, 255, 255, 0.14) 100%
      );
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
      background: #ffffff;
      border: 2.5px solid ${palette.juhong[500]};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 10px rgba(255, 85, 0, 0.4);
      cursor: grab;
      transition: transform 0.15s ease;

      [data-theme='dark'] & {
        background: #1c1a17;
        border: 2.5px solid ${palette.juhong[400]};
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 85, 0, 0.5);
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
      background: #ffffff;
      border: 2.5px solid ${palette.juhong[500]};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      cursor: grab;

      [data-theme='dark'] & {
        background: #1c1a17;
        border: 2.5px solid ${palette.juhong[400]};
      }
    }
  }
`;

const TimeRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${meok[500]};
  margin-top: -0.15rem;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const DeckControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.25rem;
`;

const DeckCenterCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const BigPlayBtn = styled(motion.button)`
  display: flex;
  height: 3.25rem;
  width: 3.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.juhong[600]} 100%);
  color: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 85, 0, 0.35);

  [data-theme='dark'] & {
    background: linear-gradient(135deg, ${palette.juhong[500]} 0%, ${palette.juhong[600]} 100%);
    color: #ffffff;
    border: none;
    box-shadow: 0 6px 22px rgba(255, 85, 0, 0.45);
  }
`;

const JumpControlButton = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: #f0f0ee;
  border: 1px solid rgba(0, 0, 0, 0.04);
  color: ${meok[700]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #e5e5e3;
    color: #171513;
    transform: translateY(-1px);
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: ${meok[300]};

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }

  span {
    font-size: 0.5625rem;
    font-weight: 700;
    margin-top: -2px;
    letter-spacing: -0.02em;
  }
`;

const SpeedChip = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  padding: 0.4rem 0.65rem;
  border-radius: 9999px;
  background: #f0f0ee;
  border: 1px solid rgba(0, 0, 0, 0.04);
  color: ${meok[800]};
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #e5e5e3;
    color: #171513;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: ${meok[200]};

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
    }
  }
`;

/* ------------------------------------------------------------
 * 🏛️ LocalMiniPlayer 메인 컴포넌트
 * ------------------------------------------------------------ */
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

  const [isVisible, setIsVisible] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('roadview');

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

  // 🔒 모달 열렸을 때 백그라운드 스크롤 완벽 차단 & 상단 헤더 숨김 유지
  // 🔒 모달 열렸을 때 백그라운드 스크롤 안전 잠금 (좌우 레이아웃 시프트 원천 방지)
  useEffect(() => {
    if (!isExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.dataset.sorimaruPlayerOpen = 'true';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isExpanded]);

  // 🎬 상세 모달 진입 시 1회만 전체 대본 시네마틱 애니메이션 재생 (모달 닫혔다 다시 열릴 때 리셋)
  const [hasAnimatedTranscript, setHasAnimatedTranscript] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      setHasAnimatedTranscript(false);
    }
  }, [isExpanded]);

  // 전체 대본 모드가 처음 노출될 때 1회 애니메이션 적용
  const shouldAnimateTranscript = isExpanded && activeViewMode === 'transcript' && !hasAnimatedTranscript;

  useEffect(() => {
    if (isExpanded && activeViewMode === 'transcript' && !hasAnimatedTranscript) {
      setHasAnimatedTranscript(true);
    }
  }, [isExpanded, activeViewMode, hasAnimatedTranscript]);

  // 🚀 모달 exit 트랜지션 완료 시 상태 복원
  const handleExitComplete = () => {
    document.body.style.overflow = '';
    delete document.body.dataset.sorimaruPlayerOpen;
  };

  const audioProgress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const isSaved = savedStories.some((saved) => (saved.stid || saved.title) === (story.stid || story.title));

  const closePlayer = () => {
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
        {isVisible && !isExpanded && (
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
                aria-label={isPlaying ? '일시정지' : '재생'}
              >
                <PlayIcon />
              </PlayCircleBtn>
              <MiniHeartBtn
                type="button"
                $saved={isSaved}
                whileTap={{ scale: 0.88 }}
                onClick={(e) => { e.stopPropagation(); toggleSavedStory(story); }}
                aria-label={isSaved ? '마음에 담은 소리에서 제거' : '마음에 담기'}
                title={isSaved ? '마음에 담음' : '마음에 담기'}
              >
                <Heart size={16} strokeWidth={2.2} fill={isSaved ? 'currentColor' : 'none'} />
              </MiniHeartBtn>
              <ScriptOpenBtn
                type="button"
                onClick={() => {
                  setActiveViewMode('transcript');
                  setIsExpanded(true);
                }}
              >
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

      {/* 🏛️ 확장 플레이어 모달 (직관적이고 깔끔한 슬라이드 업 & 다운 트랜지션) */}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isExpanded && (
          <DrawerBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={closePlayer}
          >
            <DrawerPanel
              initial={{ opacity: 0, y: '80%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '80%' }}
              transition={{
                type: 'tween',
                ease: [0.16, 1, 0.3, 1],
                duration: 0.3,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {/* 🎛️ 상단 네비게이션 헤더: [ 현장 사진 뷰어 ] | [ 전체 대본 모드 ] 세그먼트 메뉴바 */}
              <DrawerHeader>
                <HeaderLeftArea />

                <SegmentedControl role="tablist" aria-label="플레이어 뷰 모드 선택">
                  <SegmentTab
                    role="tab"
                    aria-selected={activeViewMode === 'roadview'}
                    $active={activeViewMode === 'roadview'}
                    onClick={() => setActiveViewMode('roadview')}
                  >
                    {activeViewMode === 'roadview' && (
                      <ActiveTabPill
                        layoutId="activeTabPill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <Compass size={15} className="tab-icon" strokeWidth={2.2} />
                    <span>현장 사진</span>
                  </SegmentTab>

                  <SegmentTab
                    role="tab"
                    aria-selected={activeViewMode === 'transcript'}
                    $active={activeViewMode === 'transcript'}
                    onClick={() => setActiveViewMode('transcript')}
                  >
                    {activeViewMode === 'transcript' && (
                      <ActiveTabPill
                        layoutId="activeTabPill"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <BookOpen size={15} className="tab-icon" strokeWidth={2.2} />
                    <span>전체 대본</span>
                  </SegmentTab>
                </SegmentedControl>

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
              </DrawerHeader>

              {/* 🔄 메인 뷰 영역 (모드 1: 뷰어+2줄메타+2문단대본 vs 모드 2: 전체 대본 풀스크린) */}
              <MainViewArea>
                <AnimatePresence mode="wait">
                  {activeViewMode === 'roadview' ? (
                    <RoadviewSplitModeContainer
                      key="roadview-split-view"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      {/* 1단 (상단): 메뉴바 바로 아래 최상단에 배치된 현장 사진 뷰어 */}
                      <TopMediaWrap>
                        <SorimaruRoadview
                          mapX={story.mapX}
                          mapY={story.mapY}
                          fallbackImage={imgSrc}
                          title={story.title}
                          analyserRef={analyserRef}
                          isPlaying={isPlaying}
                        />
                      </TopMediaWrap>

                      {/* 2단 (하단): 확장된 높이의 심리스 실시간 대본 스크롤 */}
                      <CompactTranscriptWrap>
                        <PlayerTranscriptPanel
                          lines={lines}
                          activeLineId={lines[activeIndex]?.id}
                          onSeek={seekTo}
                          imageUrl={imgSrc || story.imageUrl}
                          isLoading={!lines.length}
                          isPlaying={isPlaying}
                          seamless
                        />
                      </CompactTranscriptWrap>
                    </RoadviewSplitModeContainer>
                  ) : (
                    <FullTranscriptModeContainer
                      key="full-transcript-view"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      {/* 타이틀, 서브제목 & 4개 핵심 해시태그 (첫 진입 시에만 순차적 슬라이드 업 모션) */}
                      <FullStoryMeta
                        variants={shouldAnimateTranscript ? fullStoryMetaVariants : undefined}
                        initial={shouldAnimateTranscript ? "initial" : false}
                        animate={shouldAnimateTranscript ? "animate" : undefined}
                      >
                        <motion.h3
                          className="main-title"
                          variants={shouldAnimateTranscript ? metaItemFadeUp : undefined}
                        >
                          {story.title || '한옥 소리 이야기'}
                        </motion.h3>
                        <motion.p
                          className="sub-info"
                          variants={shouldAnimateTranscript ? metaItemFadeUp : undefined}
                        >
                          <span>{story.audioTitle || '조선시대의 생활상을 엿볼 수 있는 한옥마을'}</span>
                        </motion.p>
                        <HashtagsScrollWrap
                          variants={shouldAnimateTranscript ? metaItemFadeUp : undefined}
                          aria-label="이야기 관련 해시태그"
                        >
                          {(() => {
                            const customTags = (story.tags || []).filter(
                              (t) => !t.includes('대한민국') && !t.includes('소리')
                            );
                            const titleKeyword = story.title?.split(/[-—\s]/)[0];
                            const baseTags = [
                              titleKeyword,
                              '한옥도슨트',
                              '오디오가이드',
                              '조선생활상',
                              '전통공간',
                              '청학동',
                            ].filter((t): t is string => Boolean(t && t.trim() && !t.includes('대한민국')));

                            const merged = [...new Set([...customTags, ...baseTags])]
                              .map((t) => (t.startsWith('#') ? t : `#${t.trim()}`))
                              .filter((t) => t.length > 1);

                            return merged.slice(0, 4).map((tag, idx) => (
                              <HashtagChip key={idx}>{tag}</HashtagChip>
                            ));
                          })()}
                        </HashtagsScrollWrap>
                      </FullStoryMeta>

                      {/* 풀스크린 전체 대본 뷰어 (내용 컴포넌트 전체가 한 번에 아래에서 위로 부드럽게 slide-up & fade-in) */}
                      <FullTranscriptPanelWrap
                        variants={shouldAnimateTranscript ? contentFadeUpVariants : undefined}
                        initial={shouldAnimateTranscript ? "initial" : false}
                        animate={shouldAnimateTranscript ? "animate" : undefined}
                      >
                        <PlayerTranscriptPanel
                          lines={lines}
                          activeLineId={lines[activeIndex]?.id}
                          onSeek={seekTo}
                          imageUrl={imgSrc || story.imageUrl}
                          isLoading={!lines.length}
                          isPlaying={isPlaying}
                          seamless
                        />
                      </FullTranscriptPanelWrap>
                    </FullTranscriptModeContainer>
                  )}
                </AnimatePresence>
              </MainViewArea>

              {/* 🎛️ 하단 공통 컨트롤 독 */}
              <AudioControlSection>
                <SliderWrap>
                  {/* 다이내믹 골드 슬라이더 트랙 (65% width) */}
                  <CustomSliderContainer $progress={audioProgress}>
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={(event) => seekTo(Number(event.target.value))}
                      aria-label="오디오 재생 위치 조절"
                    />
                  </CustomSliderContainer>

                  {/* 타임스탬프 */}
                  <TimeRow>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </TimeRow>
                </SliderWrap>

                {/* 인터랙션 버튼 컨트롤러 */}
                <DeckControlsRow>
                  <SpeedChip
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={cyclePlaybackRate}
                    title="재생 속도 변경"
                    aria-label={`재생 속도 ${playbackRate}배`}
                  >
                    {playbackRate}×
                  </SpeedChip>

                  <DeckCenterCluster>
                    <JumpControlButton
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => seekTo(Math.max(0, currentTime - 10))}
                      title="10초 전으로"
                      aria-label="10초 전으로"
                    >
                      <RotateCcw size={15} strokeWidth={2.4} />
                      <span>10</span>
                    </JumpControlButton>

                    <BigPlayBtn
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.06 }}
                      onClick={() => setIsPlaying(!isPlaying)}
                      aria-label={isPlaying ? '일시정지' : '재생'}
                    >
                      <PlayIcon size={20} />
                    </BigPlayBtn>

                    <JumpControlButton
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => seekTo(Math.min(duration || currentTime + 10, currentTime + 10))}
                      title="10초 후로"
                      aria-label="10초 후로"
                    >
                      <RotateCw size={15} strokeWidth={2.4} />
                      <span>10</span>
                    </JumpControlButton>
                  </DeckCenterCluster>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '2.5rem' }}>
                    <LiveAudioVisualizer isPlaying={isPlaying} />
                  </div>
                </DeckControlsRow>
              </AudioControlSection>
            </DrawerPanel>
          </DrawerBackdrop>
        )}
      </AnimatePresence>
    </>
  );
};
