'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import {
  Sparkles,
  ArrowRight,
  Compass,
  Cloud,
  ShoppingBag,
  Headphones,
  CloudRain,
  Leaf,
} from 'lucide-react';
import { lightPalette, meok, surface , fontSize } from '@/design-system/tokens';
import { MOOD_OPTIONS } from '../data/curatedJourneys';
import { useJourneyStore } from '../store/useJourneyStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 20px 24px;
`;

const EyebrowBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(0, 184, 130, 0.08);
  color: ${lightPalette.cheongrok[500]};
  font-size: ${fontSize.xs};
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-family: var(--font-hanok);
  font-size: ${fontSize['4xl']};
  /* 36px — 크기가 이미 위계를 만든다. 굵기는 덜어낸다 */
  font-weight: 300;
  color: #191f28;
  letter-spacing: -0.03em;
  margin: 0 0 12px;

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
    color: #a1a1aa;
  }

  @media (max-width: 768px) {
    font-size: ${fontSize.sm};
  }
`;

const SearchForm = styled.form`
  position: relative;
  width: 100%;
  max-width: 680px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border-radius: 9999px;
  padding: 6px 8px 6px 18px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);

  [data-theme='dark'] & {
    background: #24211d;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.36);
  }

  &:focus-within {
    border-color: ${lightPalette.cheongrok[500]};
    box-shadow: 0 12px 36px rgba(0, 184, 130, 0.16), 0 3px 12px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
`;

const SearchIconWrap = styled.div`
  display: flex;
  align-items: center;
  color: ${lightPalette.cheongrok[500]};
  margin-right: 12px;
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
  }
`;

const SubmitButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 9999px;
  border: none;
  background: #191f28;
  color: #ffffff;
  font-family: inherit;
  font-size: ${fontSize.sm};
  /* 검색 실행 — 이 화면의 주 행동 */
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  [data-theme='dark'] & {
    background: #ffffff;
    color: #191f28;
  }

  &:hover {
    background: ${lightPalette.cheongrok[500]};
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.97);
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
  padding: 6px 14px;
  border-radius: 9999px;
  border: ${({ $active }) => ($active ? '1.5px solid #222222' : '1px solid #e5e8eb')};
  background: ${({ $active }) => ($active ? '#f2f4f6' : '#ffffff')};
  color: ${({ $active }) => ($active ? '#191f28' : '#333d4b')};
  font-family: inherit;
  font-size: ${fontSize.xs};
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.18s ease;

  [data-theme='dark'] & {
    border: ${({ $active }) =>
      $active ? '1.5px solid rgba(255, 255, 255, 0.85)' : '1px solid rgba(255, 255, 255, 0.12)'};
    background: ${({ $active }) =>
      $active ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${({ $active }) => ($active ? '#ffffff' : '#a1a1aa')};
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#f2f4f6' : '#f8f9fa')};
    border-color: ${({ $active }) => ($active ? '#222222' : '#d1d5db')};
    color: #191f28;

    [data-theme='dark'] & {
      color: #ffffff;
    }
  }

  &:active {
    transform: scale(0.96);
  }
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

export default function JourneyHeroSearch() {
  const currentQuery = useJourneyStore((s) => s.currentQuery);
  const setQuery = useJourneyStore((s) => s.setQuery);
  const activeMood = useJourneyStore((s) => s.activeMood);
  const selectMood = useJourneyStore((s) => s.selectMood);
  const submitSearch = useJourneyStore((s) => s.submitSearch);
  const isGenerating = useJourneyStore((s) => s.isGenerating);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
  };

  return (
    <Container>
      <EyebrowBadge>
        <Sparkles size={14} />
        <span>나만의 한옥 여정</span>
      </EyebrowBadge>

      <Title>어떤 한옥 여행을 떠나고 싶으세요?</Title>

      <Subtitle>
        원하는 분위기나 가고 싶은 지역을 편하게 적어보세요.
        <br />
        한옥과 주변 이야기, 현장 소리를 모아 꼭 맞는 코스를 추천해 드릴게요.
      </Subtitle>

      <SearchForm onSubmit={handleSubmit}>
        <SearchIconWrap>
          <Compass size={20} />
        </SearchIconWrap>
        <Input
          type="text"
          value={currentQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 비 오는 날 걷기 좋은 고즈넉한 서울 한옥길"
          aria-label="여정 검색어 입력"
        />
        <SubmitButton type="submit" $disabled={isGenerating}>
          <span>{isGenerating ? '여정 찾는 중...' : '여정 찾기'}</span>
          <ArrowRight size={14} />
        </SubmitButton>
      </SearchForm>

      <MoodChipsContainer>
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
    </Container>
  );
}
