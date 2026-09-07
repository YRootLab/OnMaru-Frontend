'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
import { lightPalette, meok, surface } from '@/design-system/tokens';
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
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-family: 'MaruBuri', serif, sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #191f28;
  letter-spacing: -0.03em;
  margin: 0 0 12px;

  [data-theme='dark'] & {
    color: #f8f9fa;
  }

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Subtitle = styled.p`
  font-size: 15.5px;
  line-height: 1.6;
  color: #4e5968;
  margin: 0 0 28px;
  max-width: 620px;

  [data-theme='dark'] & {
    color: #a1a1aa;
  }

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const SearchForm = styled.form`
  position: relative;
  width: 100%;
  max-width: 680px;
  display: flex;
  align-items: center;
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
  border: none;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 15px;
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
  font-size: 14px;
  font-weight: 600;
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
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
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
        <span>인공지능 여정 큐레이터</span>
      </EyebrowBadge>

      <Title>어떤 한국을 만나고 싶으세요?</Title>

      <Subtitle>
        당신의 기분, 걷고 싶은 빠르기, 마음에 품은 정취를 자유롭게 들려주세요.
        <br />
        온마루의 한옥 문화재, 공간 오디오, 실시간 온기가 당신만의 여정으로 조립됩니다.
      </Subtitle>

      <SearchForm onSubmit={handleSubmit}>
        <SearchIconWrap>
          <Compass size={20} />
        </SearchIconWrap>
        <Input
          type="text"
          value={currentQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 서울에서 비 오는 날 고즈넉하게 한옥과 시장을 걷고 싶어"
          aria-label="여정 검색어 입력"
        />
        <SubmitButton type="submit" $disabled={isGenerating}>
          <span>{isGenerating ? '조립 중...' : '여정 탐색'}</span>
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
              <span>{mood.icon}</span>
              <span>{mood.label}</span>
            </MoodChip>
          );
        })}
      </MoodChipsContainer>
    </Container>
  );
}
