'use client';

import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Sparkles, CornerDownLeft } from 'lucide-react';
import { lightPalette, meok, surface , fontSize } from '@/design-system/tokens';
import { useJourneyStore } from '../store/useJourneyStore';

const Wrapper = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 0 20px 60px;
`;

const Box = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 20px 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 14px;

  [data-theme='dark'] & {
    background: #1c1a17;
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${fontSize.xs};
  font-weight: 500;
  color: #191f28;

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const InputRow = styled.form`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(25, 31, 40, 0.04);
  border-radius: 9999px;
  padding: 4px 6px 4px 16px;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.06);
  }

  &:focus-within {
    background: #ffffff;
    border-color: ${lightPalette.cheongrok[500]};
    box-shadow: 0 4px 16px rgba(0, 184, 130, 0.12);

    [data-theme='dark'] & {
      background: #24211d;
    }
  }
`;

const Input = styled.input`
  flex: 1;
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

const SendBtn = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: #191f28;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease;

  [data-theme='dark'] & {
    background: #ffffff;
    color: #191f28;
  }

  &:hover {
    background: ${lightPalette.cheongrok[500]};
    transform: scale(1.06);
  }

  &:active {
    transform: scale(0.94);
  }
`;

const SuggestionPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Pill = styled.button`
  font-size: ${fontSize.xs};
  color: #6b7280;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  padding: 4px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  [data-theme='dark'] & {
    border-color: rgba(255, 255, 255, 0.1);
    color: #9ca3af;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #191f28;

    [data-theme='dark'] & {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
  }
`;

export default function JourneyRefineBar() {
  const [refineText, setRefineText] = useState('');
  const refinePlan = useJourneyStore((s) => s.refinePlan);
  const isGenerating = useJourneyStore((s) => s.isGenerating);
  const currentPlan = useJourneyStore((s) => s.currentPlan);

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
    if (!refineText.trim() || isGenerating) return;
    refinePlan(refineText);
    setRefineText('');
  };

  const handlePillClick = (text: string) => {
    if (isGenerating) return;
    refinePlan(text);
  };

  return (
    <Wrapper>
      <Box>
        <Header>
          <Sparkles size={16} color={lightPalette.cheongrok[500]} />
          <span>
            {isGenerating
              ? '여정 조건을 반영하여 새로운 코스를 구성하는 중...'
              : '여정 조건을 실시간으로 재조정할 수 있어요'}
          </span>
        </Header>

        <InputRow onSubmit={handleSubmit}>
          <Input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="예: 근처 조용한 전통 찻집도 포함해줘 / 많이 걷지 않는 코스로 바꿔줘"
            aria-label="여정 조건 추가 입력"
            disabled={isGenerating}
          />
          <SendBtn type="submit" $disabled={isGenerating} title="조건 반영">
            <CornerDownLeft size={14} />
          </SendBtn>
        </InputRow>

        <SuggestionPills>
          {suggestions.map((item, idx) => (
            <Pill
              key={`${item}-${idx}`}
              type="button"
              disabled={isGenerating}
              onClick={() => handlePillClick(item)}
            >
              {item.startsWith('+') ? item : `+ ${item}`}
            </Pill>
          ))}
        </SuggestionPills>
      </Box>
    </Wrapper>
  );
}
