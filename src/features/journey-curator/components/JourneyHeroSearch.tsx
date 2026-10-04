'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from '@emotion/styled';
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon, Search01Icon, ArrowRight01Icon, Compass01Icon, CloudIcon, ShoppingBag01Icon, HeadphonesIcon, CloudRainIcon, Leaf01Icon, SproutIcon, LoaderCircleIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { palette, lightPalette, meok, surface, fontSize, ringShadow } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';
import { useAuth } from '@/features/auth';
import { useIsAppleDevice } from '@/shared/hooks/useIsAppleDevice';
import type { MoodId } from '../types/journey.types';

interface MoodOption {
  id: MoodId;
  label: string;
  iconName: string;
  query: string;
}

function useMoodOptions(): { moods: MoodOption[]; loading: boolean } {
  const [moods, setMoods] = React.useState<MoodOption[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/home/mood-options')
      .then((r) => r.json())
      .then((data: { moods: MoodOption[] }) => {
        if (cancelled) return;
        setMoods(data.moods ?? []);
      })
      .catch(() => {
        if (!cancelled) setMoods([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { moods, loading };
}

const Container = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: ${({ $compact }) => ($compact ? '760px' : '900px')};
  margin: 0 auto;
  padding: ${({ $compact }) => ($compact ? '0 20px 16px' : '64px 20px 24px')};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 640px) {
    padding: ${({ $compact }) => ($compact ? '0 12px 12px' : '40px 12px 16px')};
  }
`;

const EyebrowBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 85, 0, 0.07);
  border: none;
  box-shadow: ${ringShadow.light.button};
  color: ${palette.juhong[600]};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 18px;
  backdrop-filter: blur(8px);

  [data-theme='dark'] & {
    background: rgba(255, 110, 30, 0.12);
    box-shadow: ${ringShadow.dark.button};
    color: ${palette.juhong[400]};
  }

  @media (max-width: 640px) {
    font-size: 12px;
    padding: 5px 12px;
    margin-bottom: 14px;
  }
`;

const Title = styled.h1`
  position: relative;
  z-index: 2;
  font-family: var(--font-display);
  font-size: clamp(24px, 4.5vw, 42px);
  font-weight: 400;
  color: #0f172a;
  letter-spacing: -0.035em;
  line-height: 1.28;
  margin: 0 0 14px;

  [data-theme='dark'] & {
    color: #f8fafc;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 640px) {
    font-size: clamp(22px, 6vw, 28px);
    margin-bottom: 10px;
  }
`;

const Subtitle = styled.p`
  position: relative;
  z-index: 2;
  font-size: clamp(13.5px, 1.6vw, 16px);
  font-weight: 450;
  line-height: 1.65;
  color: #334155;
  margin: 0 0 clamp(54px, 6vw, 70px);
  max-width: 640px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: #cbd5e1;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 640px) {
    font-size: 13.5px;
    margin-bottom: 44px;
    line-height: 1.55;
  }
`;

const SearchFormWrapper = styled.div<{ $compact?: boolean }>`
  position: relative;
  width: 100%;
  max-width: ${({ $compact }) => ($compact ? '640px' : '720px')};
  margin: 0 auto;
`;

const OniBubble = styled.div<{ $visible?: boolean }>`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(14, 16, 22, 0.85);
  color: #f8fafc;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 30;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: rgba(14, 16, 22, 0.85) transparent transparent transparent;
  }

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.88);
    color: #111827;
    border-color: rgba(0, 0, 0, 0.12);

    &::after {
      border-color: rgba(255, 255, 255, 0.88) transparent transparent transparent;
    }
  }

  @media (max-width: 640px) {
    bottom: 84px;
    font-size: 10px;
    padding: 3px 8px;
  }
`;

const OniTrack = styled.div<{ $compact?: boolean; $isTyping?: boolean }>`
  position: absolute;
  bottom: calc(100% - 2px);
  left: 0;
  right: 0;
  height: 140px;
  pointer-events: none;
  overflow: ${({ $isTyping }) => ($isTyping ? 'visible' : 'hidden')};
  z-index: 10;
  ${({ $isTyping }) =>
    $isTyping
      ? ''
      : `
    mask-image: linear-gradient(
      to right,
      transparent 0px,
      rgba(0, 0, 0, 0.15) 30px,
      rgba(0, 0, 0, 0.7) 75px,
      black 110px,
      black calc(100% - 110px),
      rgba(0, 0, 0, 0.7) calc(100% - 75px),
      rgba(0, 0, 0, 0.15) calc(100% - 30px),
      transparent 100%
    );
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0px,
      rgba(0, 0, 0, 0.15) 30px,
      rgba(0, 0, 0, 0.7) 75px,
      black 110px,
      black calc(100% - 110px),
      rgba(0, 0, 0, 0.7) calc(100% - 75px),
      rgba(0, 0, 0, 0.15) calc(100% - 30px),
      transparent 100%
    );
  `}

  @media (max-width: 640px) {
    bottom: calc(100% - 2px);
    height: 120px;
  }
`;

const OniVideoBox = styled.div<{ $isTyping?: boolean; $direction?: 'right' | 'left' }>`
  position: relative;
  width: 96px;
  height: 82px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: transparent;
  ${({ $isTyping, $direction }) =>
    $isTyping
      ? `transform: ${$direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'};`
      : 'animation: oniFlip 42s linear infinite;'}
  transform-origin: center bottom;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes oniFlip {
    0% {
      transform: scaleX(1);
    }
    48% {
      transform: scaleX(1);
    }
    48.1% {
      transform: scaleX(-1);
    }
    98% {
      transform: scaleX(-1);
    }
    98.1% {
      transform: scaleX(1);
    }
    100% {
      transform: scaleX(1);
    }
  }

  img, video {
    position: absolute;
    bottom: -22px;
    left: 50%;
    width: 228px;
    height: 128px;
    max-width: none;
    transform: translateX(calc(-50% + 18px));
    object-fit: contain;
    display: block;
    pointer-events: none;
    filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.16));
  }

  video {
    mix-blend-mode: screen;
  }

  @media (max-width: 640px) {
    width: 80px;
    height: 68px;
    ${({ $isTyping, $direction }) =>
      $isTyping
        ? `transform: ${$direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'};`
        : 'animation: oniFlipMobile 42s linear infinite;'}

    img, video {
      bottom: -18px;
      width: 190px;
      height: 107px;
      transform: translateX(calc(-50% + 15px));
    }

    @keyframes oniFlipMobile {
      0% {
        transform: scaleX(1);
      }
      48% {
        transform: scaleX(1);
      }
      48.1% {
        transform: scaleX(-1);
      }
      98% {
        transform: scaleX(-1);
      }
      98.1% {
        transform: scaleX(1);
      }
      100% {
        transform: scaleX(1);
      }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const OniWalkerContainer = styled.div<{
  $compact?: boolean;
  $isTyping?: boolean;
  $typingLeft?: number;
}>`
  position: absolute;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  pointer-events: auto;
  transform-origin: center bottom;

  ${({ $isTyping, $typingLeft }) =>
    $isTyping && typeof $typingLeft === 'number'
      ? `
    left: ${$typingLeft}px;
    animation: none;
    opacity: 1 !important;
    filter: none !important;
    transition: left 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  `
      : `
    left: -190px;
    animation: oniPatrol 42s linear infinite;
  `}

  &:hover {
    animation-play-state: paused;
    filter: blur(0px) !important;
    opacity: 1 !important;

    ${OniVideoBox} {
      animation-play-state: paused;
      transform: scale(1.08) translateY(-2px);
    }

    ${OniBubble} {
      opacity: 1;
      transform: translateX(-50%) translateY(-2px);
    }
  }

  @keyframes oniPatrol {
    0% {
      left: -190px;
      filter: blur(8px);
      opacity: 0;
    }
    5% {
      left: -90px;
      filter: blur(4px);
      opacity: 0.6;
    }
    10% {
      left: 10px;
      filter: blur(0px);
      opacity: 1;
    }
    45% {
      left: calc(100% - 80px);
      filter: blur(0px);
      opacity: 1;
    }
    48% {
      left: calc(100% - 10px);
      filter: blur(3px);
      opacity: 0.8;
    }
    50% {
      left: calc(100% + 40px);
      filter: blur(6px);
      opacity: 0;
    }
    52% {
      left: calc(100% + 40px);
      filter: blur(6px);
      opacity: 0;
    }
    55% {
      left: calc(100% - 10px);
      filter: blur(3px);
      opacity: 0.8;
    }
    58% {
      left: calc(100% - 80px);
      filter: blur(0px);
      opacity: 1;
    }
    92% {
      left: 10px;
      filter: blur(0px);
      opacity: 1;
    }
    95% {
      left: -90px;
      filter: blur(4px);
      opacity: 0.6;
    }
    98% {
      left: -190px;
      filter: blur(8px);
      opacity: 0;
    }
    100% {
      left: -190px;
      filter: blur(8px);
      opacity: 0;
    }
  }

  @media (max-width: 640px) {
    @keyframes oniPatrol {
      0% {
        left: -140px;
        filter: blur(6px);
        opacity: 0;
      }
      6% {
        left: -60px;
        filter: blur(2px);
        opacity: 0.7;
      }
      12% {
        left: 5px;
        filter: blur(0px);
        opacity: 1;
      }
      44% {
        left: calc(100% - 65px);
        filter: blur(0px);
        opacity: 1;
      }
      48% {
        left: calc(100% + 20px);
        filter: blur(5px);
        opacity: 0;
      }
      52% {
        left: calc(100% + 20px);
        filter: blur(5px);
        opacity: 0;
      }
      56% {
        left: calc(100% - 65px);
        filter: blur(0px);
        opacity: 1;
      }
      88% {
        left: 5px;
        filter: blur(0px);
        opacity: 1;
      }
      94% {
        left: -60px;
        filter: blur(2px);
        opacity: 0.7;
      }
      100% {
        left: -140px;
        filter: blur(6px);
        opacity: 0;
      }
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
    left: 50%;
    transform: translateX(-50%);
    filter: none;
  }
`;

const SearchForm = styled.form<{ $compact?: boolean }>`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 9999px;
  padding: ${({ $compact }) => ($compact ? '6px 8px 6px 20px' : '8px 10px 8px 24px')};
  border: none;
  box-shadow: ${ringShadow.light.input};
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: rgba(23, 30, 43, 0.90);
    border: none;
    box-shadow: ${ringShadow.dark.input};
  }

  &:focus-within {
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    padding: ${({ $compact }) => ($compact ? '4px 6px 4px 14px' : '6px 6px 6px 16px')};
    gap: 8px;
  }
`;

const SearchIconWrap = styled.div`
  display: flex;
  align-items: center;
  color: ${palette.juhong[500]};
  flex-shrink: 0;

  [data-theme='dark'] & {
    color: ${palette.juhong[400]};
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  caret-color: ${palette.juhong[500]};
  font-family: inherit;
  font-size: ${fontSize.base};
  font-weight: 500;
  color: #111827;
  padding: 8px 0;

  [data-theme='dark'] & {
    color: #ffffff;
    caret-color: ${palette.juhong[400]};
  }

  &::placeholder {
    color: #9ca3af;
    font-weight: 400;

    [data-theme='dark'] & {
      color: #6b7280;
    }
  }

  @media (max-width: 640px) {
    font-size: 15px;
    padding: 6px 0;
  }
`;

const SubmitButton = styled.button<{ $disabled?: boolean; $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $compact }) => ($compact ? '36px' : '44px')};
  height: ${({ $compact }) => ($compact ? '36px' : '44px')};
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #4b5563;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.10);
    color: #e4e4e7;
    box-shadow: none;
  }

  &:hover {
    background: #e5e7eb;
    color: #111827;
    box-shadow: none;
    transform: scale(1.05);

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
      box-shadow: none;
    }
  }

  &:active {
    background: #d1d5db;
    transform: scale(0.95);
    box-shadow: none;

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.24);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 640px) {
    width: 36px;
    height: 36px;
  }
`;

const MoodChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;

  @media (max-width: 640px) {
    gap: 8px;
    margin-top: 14px;
  }
`;

const MoodChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 9999px;
  border: none;
  box-shadow: ${({ $active }) => ($active ? ringShadow.light.focusJuhong : ringShadow.light.button)};
  background: ${({ $active }) => ($active ? '#18181b' : 'rgba(0, 0, 0, 0.045)')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#374151')};
  font-family: inherit;
  font-size: 13.5px;
  font-weight: ${({ $active }) => ($active ? 650 : 500)};
  cursor: pointer;
  white-space: nowrap;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    border: none;
    box-shadow: ${({ $active }) => ($active ? ringShadow.dark.focusJuhong : ringShadow.dark.button)};
    background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255, 255, 255, 0.08)')};
    color: ${({ $active }) => ($active ? '#18181b' : '#e4e4e7')};
  }

  svg {
    color: ${({ $active }) => ($active ? `${palette.juhong[400]}` : '#6b7280')};
    transition: color 0.2s ease, transform 0.2s ease;
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#27272a' : 'rgba(0, 0, 0, 0.075)')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#111827')};
    box-shadow: ${({ $active }) => ($active ? ringShadow.light.focusJuhong : ringShadow.light.buttonHoverGlow)};
    transform: translateY(-2px);

    svg {
      color: ${palette.juhong[500]};
      transform: scale(1.1);
    }

    [data-theme='dark'] & {
      background: ${({ $active }) => ($active ? '#f4f4f5' : 'rgba(255, 255, 255, 0.14)')};
      color: ${({ $active }) => ($active ? '#18181b' : '#ffffff')};
      box-shadow: ${({ $active }) => ($active ? ringShadow.dark.focusJuhong : ringShadow.dark.buttonHoverGlow)};

      svg {
        color: ${palette.juhong[400]};
      }
    }
  }

  &:active {
    transform: scale(0.96);
  }

  @media (max-width: 640px) {
    padding: 8px 14px;
    font-size: 12.5px;
    gap: 5px;
  }
`;

const RefineChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
`;

const RefineChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 9999px;
  border: none;
  box-shadow: ${ringShadow.light.button};
  background: rgba(0, 0, 0, 0.04);
  color: #4b5563;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: ${ringShadow.dark.button};
    color: #d1d5db;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.07);
    color: #111827;
    box-shadow: ${ringShadow.light.buttonHoverGlow};
    transform: translateY(-1px);

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      box-shadow: ${ringShadow.dark.buttonHoverGlow};
    }
  }

  &:active {
    transform: scale(0.96);
  }
`;


function getMoodIcon(id: string) {
  switch (id) {
    case 'quiet':
      return <HugeiconsIcon icon={CloudIcon} size={15} />;
    case 'market':
      return <HugeiconsIcon icon={ShoppingBag01Icon} size={15} />;
    case 'story':
      return <HugeiconsIcon icon={HeadphonesIcon} size={15} />;
    case 'rain':
    case 'rainy':
      return <HugeiconsIcon icon={CloudRainIcon} size={15} />;
    case 'nature':
    case 'rest':
      return <HugeiconsIcon icon={SproutIcon} size={15} />;
    default:
      return <HugeiconsIcon icon={SparklesIcon} size={15} />;
  }
}

type JourneyHeroSearchProps = {

  searchFormRef?: React.RefObject<HTMLFormElement | null>;

  moodChipsRef?: React.RefObject<HTMLDivElement | null>;
};

export default function JourneyHeroSearch({ searchFormRef, moodChipsRef }: JourneyHeroSearchProps) {
  const currentQuery = useJourneyStore((s) => s.currentQuery);
  const setQuery = useJourneyStore((s) => s.setQuery);
  const activeMood = useJourneyStore((s) => s.activeMood);
  const selectMood = useJourneyStore((s) => s.selectMood);
  const submitSearch = useJourneyStore((s) => s.submitSearch);
  const refinePlan = useJourneyStore((s) => s.refinePlan);
  const cancelRun = useJourneyStore((s) => s.cancelRun);
  const currentPlan = useJourneyStore((s) => s.currentPlan);
  const isGenerating = useJourneyStore((s) => s.isGenerating);
  const hasSearched = useJourneyStore((s) => s.hasSearched);
  const { moods } = useMoodOptions();
  const isApple = useIsAppleDevice();
  const [isCancelling, setIsCancelling] = useState(false);
  const [oniVideoError, setOniVideoError] = useState(false);
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const oniVideoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 타이핑 위치 실시간 추적 상태 및 Ref
  const [typingX, setTypingX] = useState<number | null>(null);
  const [facingDirection, setFacingDirection] = useState<'right' | 'left'>('right');
  const prevQueryLenRef = useRef<number>(0);
  const textMeasurerRef = useRef<HTMLSpanElement>(null);
  const localFormRef = useRef<HTMLFormElement | null>(null);

  const handleFormRef = (node: HTMLFormElement | null) => {
    localFormRef.current = node;
    if (searchFormRef) {
      (searchFormRef as React.MutableRefObject<HTMLFormElement | null>).current = node;
    }
  };

  useEffect(() => {
    const input = inputRef.current;
    const measurer = textMeasurerRef.current;
    if (!input || !measurer) return;
    const s = window.getComputedStyle(input);
    measurer.style.fontFamily = s.fontFamily;
    measurer.style.fontSize = s.fontSize;
    measurer.style.fontWeight = s.fontWeight;
    measurer.style.letterSpacing = s.letterSpacing;
  }, [hasSearched]);

  useEffect(() => {
    const trimmed = currentQuery || '';
    if (!trimmed) {
      setTypingX(null);
      prevQueryLenRef.current = 0;
      return;
    }

    const currentLen = trimmed.length;
    if (currentLen > prevQueryLenRef.current) {
      setFacingDirection('right');
    } else if (currentLen < prevQueryLenRef.current) {
      setFacingDirection('left');
    }
    prevQueryLenRef.current = currentLen;

    if (textMeasurerRef.current && localFormRef.current) {
      const textWidth = textMeasurerRef.current.offsetWidth;
      const formWidth = localFormRef.current.offsetWidth;
      const isMobile = window.innerWidth <= 640;
      const startPadding = isMobile ? 42 : 56;
      const oniWidth = isMobile ? 80 : 96;
      const targetLeft = Math.max(
        12,
        Math.min(formWidth - oniWidth - 52, startPadding + textWidth - oniWidth / 2)
      );
      setTypingX(targetLeft);
    }
  }, [currentQuery]);

  useEffect(() => {
    const video = oniVideoRef.current;
    if (!video) return;
    video.defaultMuted = true;
    video.muted = true;
    video.playbackRate = 0.8;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, []);

  const defaultSuggestions = [
    '+ 전통 찻집 더보기',
    '+ 비 오는 날 코스',
    '+ 걷는 시간 줄이기',
    '+ 역사 해설 포함',
  ];

  const suggestions = currentPlan?.refineSuggestions?.length
    ? currentPlan.refineSuggestions
    : defaultSuggestions;

  const guardAuth = () => {
    if (isAuthLoading) return false;
    if (!isLoggedIn) {
      router.push('/auth/login');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardAuth()) return;
    submitSearch();
  };

  const handleRefineClick = (text: string) => {
    if (isGenerating) return;
    refinePlan(text);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelRun();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Container $compact={hasSearched}>
      {!hasSearched && (
        <>
          <Title>
            {isLoggedIn && user?.displayName
              ? `${user.displayName}님, 어떤 장소로 떠나고 싶으세요?`
              : '어떤 장소로 떠나고 싶으세요?'}
          </Title>

          <Subtitle>
            원하는 분위기나 지역을 적어주시면,
            <br />
            한옥과 주변 볼거리, 생생한 소리를 엮어 꼭 맞는 일정을 만들어 드려요.
          </Subtitle>
        </>
      )}

      <SearchFormWrapper $compact={hasSearched}>
        <span
          ref={textMeasurerRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            height: 0,
            overflow: 'hidden',
            whiteSpace: 'pre',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {currentQuery || ''}
        </span>

        {!hasSearched && (
          <OniTrack $compact={hasSearched} $isTyping={Boolean(currentQuery)}>
            <OniWalkerContainer
              $compact={hasSearched}
              $isTyping={Boolean(currentQuery)}
              $typingLeft={typingX ?? undefined}
              aria-hidden="true"
            >
              <OniBubble $visible={Boolean(currentQuery)}>
                {currentQuery ? '온이가 길을 비추고 있어요 ??' : '온이가 길을 밝히고 있어요'}
              </OniBubble>
              <OniVideoBox $isTyping={Boolean(currentQuery)} $direction={facingDirection}>
                {isApple || oniVideoError ? (
                  <img src="/images/character/Oni_walking.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <video
                    ref={oniVideoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    aria-label="온이가 길을 밝히고 있어요"
                    onError={() => setOniVideoError(true)}
                    onCanPlay={(e) => {
                      e.currentTarget.muted = true;
                      e.currentTarget.playbackRate = 0.8;
                      e.currentTarget.play().catch(() => {});
                    }}
                  >
                    <source src="/videos/Oni_walking_no_bg.webm" type="video/webm" onError={() => setOniVideoError(true)} />
                  </video>
                )}
              </OniVideoBox>
            </OniWalkerContainer>
          </OniTrack>
        )}

        <SearchForm ref={handleFormRef} onSubmit={handleSubmit} $compact={hasSearched}>
          <Input
            ref={inputRef}
            type="text"
            value={currentQuery}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어디로 떠나고 싶으세요?"
            aria-label="여행하고 싶은 한옥이나 지역 입력"
          />
          {isGenerating ? (
            <SubmitButton type="button" $disabled={isCancelling} $compact={hasSearched} onClick={handleCancel} aria-label="생성 취소">
              {isCancelling ? (
                <HugeiconsIcon icon={LoaderCircleIcon} size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              )}
            </SubmitButton>
          ) : (
            <SubmitButton type="submit" $compact={hasSearched} aria-label="맞춤 코스 찾기">
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </SubmitButton>
          )}
        </SearchForm>
      </SearchFormWrapper>

      {hasSearched && (
        <>
          <RefineChipsContainer>
            {suggestions.map((item, idx) => (
              <RefineChip
                key={`${item}-${idx}`}
                type="button"
                disabled={isGenerating}
                onClick={() => handleRefineClick(item)}
              >
                {item.startsWith('+') ? item : `+ ${item}`}
              </RefineChip>
            ))}
          </RefineChipsContainer>
        </>
      )}

      {!hasSearched && (
        <MoodChipsContainer ref={moodChipsRef}>
          {moods.map((mood) => {
            const isActive = activeMood === mood.id;
            return (
              <MoodChip
                key={mood.id}
                type="button"
                $active={isActive}
                onClick={() => { if (guardAuth()) selectMood(mood.id); }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>{getMoodIcon(mood.id)}</span>
                <span>{mood.label}</span>
              </MoodChip>
            );
          })}
        </MoodChipsContainer>
      )}
    </Container>
  );
}

