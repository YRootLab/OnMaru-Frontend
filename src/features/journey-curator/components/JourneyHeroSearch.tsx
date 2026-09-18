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
  max-width: ${({ $compact }) => ($compact ? '720px' : '860px')};
  margin: 0 auto;
  padding: ${({ $compact }) => ($compact ? '0 20px 16px' : '48px 20px 24px')};
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const EyebrowBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(255, 85, 0, 0.08);
  color: ${palette.juhong[500]};
  font-size: ${fontSize.xs};
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-family: var(--font-hanok);
  font-size: ${fontSize['4xl']};
  font-weight: 700;
  color: #191f28;
  letter-spacing: -0.03em;
  margin: 0 0 14px;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }

  @media (max-width: 768px) {
    font-size: ${fontSize['3xl']};
  }
`;

const Subtitle = styled.p`
  font-size: ${fontSize.base};
  line-height: 1.6;
  color: #4e5968;
  margin: 0 0 28px;
  max-width: 620px;

  [data-theme='dark'] & {
    color: #e4e4e7;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    font-size: ${fontSize.sm};
  }
`;

const SearchForm = styled.form<{ $compact?: boolean }>`
  position: relative;
  width: 100%;
  max-width: ${({ $compact }) => ($compact ? '620px' : '680px')};
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-radius: 9999px;
  padding: ${({ $compact }) => ($compact ? '5px 6px 5px 16px' : '6px 8px 6px 18px')};
  border: none;
  box-shadow: ${({ $compact }) =>
    $compact
      ? '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.03)'
      : '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'};
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: #24211d;
    border: none;
    box-shadow: ${({ $compact }) =>
      $compact
        ? '0 4px 20px rgba(0, 0, 0, 0.32)'
        : '0 8px 32px rgba(0, 0, 0, 0.36)'};
  }

  &:focus-within {
    outline: none;
    border: none;
    box-shadow: ${({ $compact }) =>
      $compact
        ? '0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)'
        : '0 12px 36px rgba(0, 0, 0, 0.12), 0 3px 12px rgba(0, 0, 0, 0.06)'};
    transform: translateY(-1px);
  }
`;

const SearchIconWrap = styled.div`
  display: flex;
  align-items: center;
  color: ${palette.juhong[500]};
  margin-right: 12px;

  [data-theme='dark'] & {
    color: ${palette.juhong[400]};
  }
`;

const SearchIconInner = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: ${fontSize.sm};
  color: #191f28;

  [data-theme='dark'] & {
    color: #ffffff;
  }

  &::placeholder {
    color: #8b95a1;

    [data-theme='dark'] & {
      color: #71717a;
    }
  }
`;

const SubmitButton = styled.button<{ $disabled?: boolean; $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $compact }) => ($compact ? '32px' : '36px')};
  height: ${({ $compact }) => ($compact ? '32px' : '36px')};
  border-radius: 50%;
  border: none;
  background: #191f28;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: all 0.18s ease;

  [data-theme='dark'] & {
    background: #ffffff;
    color: #191f28;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  }

  &:hover {
    background: #333d4b;
    color: #ffffff;
    transform: scale(1.06);

    [data-theme='dark'] & {
      background: #f1f3f5;
      color: #191f28;
    }
  }

  &:active {
    transform: scale(0.94);
    background: #000000;

    [data-theme='dark'] & {
      background: #e5e8eb;
    }
  }
`;

const MoodChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
`;

const MoodChip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 15px;
  border-radius: 9999px;
  border: none;
  background: ${({ $active }) => ($active ? '#191f28' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#ffffff' : '#4e5968')};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 700 : 500)};
  cursor: pointer;
  white-space: nowrap;
  box-shadow: ${({ $active }) =>
    $active ? '0 3px 10px rgba(0, 0, 0, 0.16)' : '0 2px 8px rgba(0, 0, 0, 0.04)'};
  transition: all 0.18s ease;

  [data-theme='dark'] & {
    border: none;
    background: ${({ $active }) => ($active ? '#ffffff' : '#292522')};
    color: ${({ $active }) => ($active ? '#191f28' : '#d4d4d8')};
    box-shadow: ${({ $active }) =>
      $active ? '0 3px 12px rgba(0, 0, 0, 0.45)' : '0 2px 8px rgba(0, 0, 0, 0.25)'};
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#333d4b' : '#f2f4f6')};
    color: ${({ $active }) => ($active ? '#ffffff' : '#191f28')};

    [data-theme='dark'] & {
      background: ${({ $active }) => ($active ? '#f1f3f5' : '#38332e')};
      color: ${({ $active }) => ($active ? '#191f28' : '#ffffff')};
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
  border: none;
  background: rgba(0, 0, 0, 0.04);
  color: #4e5968;
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.08);
    color: #d4d4d8;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #191f28;
    transform: translateY(-1px);

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
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
