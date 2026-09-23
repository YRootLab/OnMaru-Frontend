'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  Sparkles,
  Search,
  ArrowRight,
  Compass,
  Cloud,
  ShoppingBag,
  Headphones,
  CloudRain,
  Leaf,
  Loader2,
  X,
} from 'lucide-react';
import { palette, lightPalette, meok, surface, fontSize, ringShadow } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';
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
  font-family: var(--font-hanok);
  font-size: clamp(24px, 4.5vw, 42px);
  font-weight: 700;
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
  margin: 0 0 32px;
  max-width: 640px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: #cbd5e1;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 640px) {
    font-size: 13.5px;
    margin-bottom: 22px;
    line-height: 1.55;
  }
`;

const SearchForm = styled.form<{ $compact?: boolean }>`
  position: relative;
  width: 100%;
  max-width: ${({ $compact }) => ($compact ? '640px' : '720px')};
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
    background: rgba(36, 33, 29, 0.90);
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
  margin-top: 26px;

  @media (max-width: 640px) {
    gap: 8px;
    margin-top: 18px;
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

const ErrorBanner = styled.div`
  margin-top: 10px;
  font-size: ${fontSize.xs};
  color: ${palette.danpung[500]};
  font-weight: 500;
`;

function getMoodIcon(id: string) {
  switch (id) {
    case 'quiet':
      return <Cloud size={15} />;
    case 'market':
      return <ShoppingBag size={15} />;
    case 'story':
      return <Headphones size={15} />;
    case 'rainy':
      return <CloudRain size={15} />;
    case 'rest':
      return <Leaf size={15} />;
    default:
      return <Sparkles size={15} />;
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
  const lastError = useJourneyStore((s) => s.lastError);
  const isGenerating = useJourneyStore((s) => s.isGenerating);
  const hasSearched = useJourneyStore((s) => s.hasSearched);
  const { moods } = useMoodOptions();
  const [isCancelling, setIsCancelling] = useState(false);

  const defaultSuggestions = [
    '+ 전통 찻집 더보기',
    '+ 비 오는 날 코스',
    '+ 걷는 시간 줄이기',
    '+ 역사 해설 포함',
  ];

  const suggestions = currentPlan?.refineSuggestions?.length
    ? currentPlan.refineSuggestions
    : defaultSuggestions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <Title>어떤 한옥으로 떠나고 싶으세요?</Title>

          <Subtitle>
            원하는 분위기나 지역을 적어주시면,
            <br />
            한옥과 주변 볼거리, 생생한 소리를 엮어 꼭 맞는 일정을 만들어 드려요.
          </Subtitle>
        </>
      )}

      <SearchForm ref={searchFormRef} onSubmit={handleSubmit} $compact={hasSearched}>
        <SearchIconWrap>
          <Compass size={hasSearched ? 18 : 20} />
        </SearchIconWrap>
        <Input
          type="text"
          value={currentQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="어디로 떠나고 싶으세요?"
          aria-label="여행하고 싶은 한옥이나 지역 입력"
        />
        {isGenerating ? (
          <SubmitButton type="button" $disabled={isCancelling} $compact={hasSearched} onClick={handleCancel} aria-label="생성 취소">
            {isCancelling ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <X size={16} />
            )}
          </SubmitButton>
        ) : (
          <SubmitButton type="submit" $compact={hasSearched} aria-label="맞춤 코스 찾기">
            <Search size={16} />
          </SubmitButton>
        )}
      </SearchForm>

      {hasSearched && (
        <>
          {lastError && <ErrorBanner>{lastError} 기존 코스는 그대로 유지했어요.</ErrorBanner>}
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
                onClick={() => selectMood(mood.id)}
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
