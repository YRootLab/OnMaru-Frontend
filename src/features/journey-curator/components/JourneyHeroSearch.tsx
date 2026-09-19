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
} from 'lucide-react';
import { palette, lightPalette, meok, surface, fontSize } from '@/design-system/tokens';
import { MOOD_OPTIONS } from '../data/curatedJourneys';
import { useJourneyStore } from '../store/useJourneyStore';

const Container = styled.div<{ $compact?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: ${({ $compact }) => ($compact ? '760px' : '900px')};
  margin: 0 auto;
  padding: ${({ $compact }) => ($compact ? '0 20px 16px' : '36px 20px 24px')};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const EyebrowBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 85, 0, 0.07);
  border: 1px solid rgba(255, 85, 0, 0.15);
  color: ${palette.juhong[600]};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 18px;
  backdrop-filter: blur(8px);

  [data-theme='dark'] & {
    background: rgba(255, 110, 30, 0.12);
    border-color: rgba(255, 110, 30, 0.25);
    color: ${palette.juhong[400]};
  }
`;

const Title = styled.h1`
  font-family: var(--font-hanok);
  font-size: clamp(28px, 4.2vw, 42px);
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.035em;
  line-height: 1.25;
  margin: 0 0 16px;

  [data-theme='dark'] & {
    color: #fcfcfc;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }
`;

const Subtitle = styled.p`
  font-size: clamp(14px, 1.6vw, 16.5px);
  line-height: 1.65;
  color: #4b5563;
  margin: 0 0 34px;
  max-width: 640px;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: #d1d5db;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
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
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: ${({ $compact }) =>
    $compact
      ? '0 6px 24px -4px rgba(0, 0, 0, 0.07), 0 2px 8px -2px rgba(0, 0, 0, 0.03)'
      : '0 16px 36px -6px rgba(0, 0, 0, 0.09), 0 4px 14px -2px rgba(0, 0, 0, 0.04)'};
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: rgba(36, 33, 29, 0.90);
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow: ${({ $compact }) =>
      $compact
        ? '0 8px 28px rgba(0, 0, 0, 0.45)'
        : '0 16px 40px rgba(0, 0, 0, 0.55)'};
  }

  &:focus-within {
    border-color: rgba(255, 85, 0, 0.45);
    box-shadow: ${({ $compact }) =>
      $compact
        ? '0 10px 30px -4px rgba(255, 85, 0, 0.14), 0 0 0 3px rgba(255, 85, 0, 0.08)'
        : '0 20px 48px -6px rgba(255, 85, 0, 0.18), 0 0 0 4px rgba(255, 85, 0, 0.09)'};
    transform: translateY(-2px);

    [data-theme='dark'] & {
      border-color: rgba(255, 110, 30, 0.55);
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.65), 0 0 0 4px rgba(255, 110, 30, 0.16);
    }
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
  font-family: inherit;
  font-size: ${fontSize.base};
  font-weight: 500;
  color: #111827;
  padding: 8px 0;

  [data-theme='dark'] & {
    color: #ffffff;
  }

  &::placeholder {
    color: #9ca3af;
    font-weight: 400;

    [data-theme='dark'] & {
      color: #6b7280;
    }
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
  background: linear-gradient(135deg, #FF6B35 0%, #E84E0F 100%);
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(232, 78, 15, 0.35);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: linear-gradient(135deg, #FF7B4A 0%, #D84409 100%);
    box-shadow: 0 6px 18px rgba(232, 78, 15, 0.45);
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2px 8px rgba(232, 78, 15, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const MoodChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 26px;
`;

const MoodChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 9999px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 85, 0, 0.35)' : 'rgba(0, 0, 0, 0.06)')};
  background: ${({ $active }) => ($active ? '#18181b' : 'rgba(255, 255, 255, 0.92)')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#374151')};
  font-family: inherit;
  font-size: 13.5px;
  font-weight: ${({ $active }) => ($active ? 650 : 500)};
  cursor: pointer;
  white-space: nowrap;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: ${({ $active }) =>
    $active
      ? '0 6px 18px rgba(0, 0, 0, 0.18)'
      : '0 2px 8px rgba(0, 0, 0, 0.04)'};
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    border: 1px solid ${({ $active }) => ($active ? 'rgba(255, 110, 30, 0.45)' : 'rgba(255, 255, 255, 0.08)')};
    background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(38, 35, 30, 0.85)')};
    color: ${({ $active }) => ($active ? '#18181b' : '#e4e4e7')};
    box-shadow: ${({ $active }) =>
      $active ? '0 6px 20px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.25)'};
  }

  svg {
    color: ${({ $active }) => ($active ? `${palette.juhong[400]}` : '#6b7280')};
    transition: color 0.2s ease, transform 0.2s ease;
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#27272a' : '#ffffff')};
    color: ${({ $active }) => ($active ? '#ffffff' : `${palette.juhong[600]}`)};
    border-color: ${({ $active }) => ($active ? 'rgba(255, 85, 0, 0.5)' : 'rgba(255, 85, 0, 0.25)')};
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.07);
    transform: translateY(-2px);

    svg {
      color: ${palette.juhong[500]};
      transform: scale(1.1);
    }

    [data-theme='dark'] & {
      background: ${({ $active }) => ($active ? '#f4f4f5' : '#332e29')};
      color: ${({ $active }) => ($active ? '#18181b' : '#ffffff')};
      border-color: rgba(255, 110, 30, 0.35);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);

      svg {
        color: ${palette.juhong[400]};
      }
    }
  }

  &:active {
    transform: scale(0.96);
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
  border: 1px solid rgba(0, 0, 0, 0.05);
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
    border-color: rgba(255, 255, 255, 0.10);
    color: #d1d5db;
  }

  &:hover {
    background: rgba(255, 85, 0, 0.08);
    color: ${palette.juhong[600]};
    border-color: rgba(255, 85, 0, 0.2);
    transform: translateY(-1px);

    [data-theme='dark'] & {
      background: rgba(255, 110, 30, 0.16);
      color: ${palette.juhong[400]};
      border-color: rgba(255, 110, 30, 0.3);
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
  /** 배경 그라데이션 오브를 검색창에 정확히 앵커링하기 위한 ref */
  searchFormRef?: React.RefObject<HTMLFormElement | null>;
  /** 그라데이션이 카테고리 칩 위로 번지지 않도록 하한선을 재는 ref */
  moodChipsRef?: React.RefObject<HTMLDivElement | null>;
};

export default function JourneyHeroSearch({ searchFormRef, moodChipsRef }: JourneyHeroSearchProps) {
  const currentQuery = useJourneyStore((s) => s.currentQuery);
  const setQuery = useJourneyStore((s) => s.setQuery);
  const activeMood = useJourneyStore((s) => s.activeMood);
  const selectMood = useJourneyStore((s) => s.selectMood);
  const submitSearch = useJourneyStore((s) => s.submitSearch);
  const refinePlan = useJourneyStore((s) => s.refinePlan);
  const currentPlan = useJourneyStore((s) => s.currentPlan);
  const lastError = useJourneyStore((s) => s.lastError);
  const isGenerating = useJourneyStore((s) => s.isGenerating);
  const hasSearched = useJourneyStore((s) => s.hasSearched);

  const defaultSuggestions = [
    '+ 전통 찻집 위주',
    '+ 비 오는 날 운치',
    '+ 걷는 시간 줄이기',
    '+ 역사 해설 중심',
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

  return (
    <Container $compact={hasSearched}>
      {!hasSearched && (
        <>
          <Title>어떤 한옥 여행을 떠나고 싶으세요?</Title>

          <Subtitle>
            원하는 분위기나 가고 싶은 지역을 편하게 적어보세요.
            <br />
            한옥과 주변 이야기, 현장 소리를 모아 꼭 맞는 코스를 추천해 드릴게요.
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
          placeholder="예: 비 오는 날 걷기 좋은 고즈넉한 서울 한옥길"
          aria-label="여정 검색어 입력"
        />
        <SubmitButton type="submit" $disabled={isGenerating} $compact={hasSearched} aria-label="여정 검색">
          {isGenerating ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Search size={16} />
          )}
        </SubmitButton>
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
          {MOOD_OPTIONS.map((mood) => {
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
