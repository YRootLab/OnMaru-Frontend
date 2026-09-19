'use client';

import React, { FormEvent, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { ArrowUp, RotateCcw, Search } from 'lucide-react';
import type { SorimaruAssistantFilters, SorimaruAssistantResponse, SorimaruAssistantSource } from '@/features/sorimaru-audio/api/sorimaruAssistant.types';
import { palette, meok, surface, fontSize } from '@/design-system/tokens';

interface SorimaruQuestionAssistantProps {
  filters: SorimaruAssistantFilters;
  onOpenSource: (source: SorimaruAssistantSource) => void;
}

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const SectionContainer = styled.section`
  margin-top: 3rem;
  padding-top: 1.75rem;
  @media (min-width: 640px) {
    margin-top: 3.5rem;
    padding-top: 2rem;
  }
`;

const CardBox = styled.div`
  display: grid;
  gap: 1.25rem;
  border-radius: 18px;
  background-color: #f8f8f7;
  padding: 1.25rem;

  [data-theme='dark'] & {
    background-color: ${surface.dark.card};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 640px) {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 0.8fr);
    align-items: start;
    padding: 1.5rem;
  }
`;

const QuestionHeading = styled.h3`
  font-family: inherit;
  font-size: ${fontSize.lg};
  font-weight: 700;
  letter-spacing: -0.035em;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const QuestionDesc = styled.p`
  margin-top: 0.375rem;
  font-size: ${fontSize.xs};
  line-height: 1.25rem;
  color: ${meok[700]};

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const SuggestionsRow = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
`;

const SuggestionButton = styled.button`
  border: none;
  border-radius: 9999px;
  background-color: #ffffff;
  padding: 0.375rem 0.625rem;
  text-align: left;
  font-size: ${fontSize.micro};
  line-height: 1rem;
  color: ${meok[700]};
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: ${palette.juhong[50]};
    color: ${palette.juhong[500]};
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.surface};
    color: ${meok[200]};
    border: 1px solid rgba(255, 255, 255, 0.06);

    &:hover {
      background-color: rgba(255, 85, 0, 0.2);
      color: ${palette.juhong[400]};
    }
  }
`;

const FormContainer = styled.form`
  align-self: stretch;
`;

const InputWrapper = styled.div`
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 9999px;
  background-color: #ffffff;
  padding: 0 0.75rem;
  transition: background-color 0.2s ease;

  &:focus-within {
    background-color: ${palette.juhong[50]};
  }

  [data-theme='dark'] & {
    background-color: ${surface.dark.surface};
    border: 1px solid rgba(255, 255, 255, 0.08);

    &:focus-within {
      background-color: ${surface.dark.elevated};
      border-color: ${palette.juhong[400]};
    }
  }
`;

const StyledInput = styled.input`
  min-width: 0;
  flex: 1;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: ${fontSize.xs};
  color: ${meok[900]};
  outline: none;

  &::placeholder {
    color: ${meok[500]};
  }

  [data-theme='dark'] & {
    color: ${meok[100]};

    &::placeholder {
      color: ${meok[400]};
    }
  }
`;

const SubmitButton = styled.button`
  display: grid;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  place-items: center;
  border: none;
  border-radius: 9999px;
  background-color: ${palette.juhong[500]};
  color: #ffffff;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.35;
  }

  & .spinning {
    animation: ${spinAnimation} 1s linear infinite;
  }
`;

const HelperText = styled.p`
  margin-top: 0.75rem;
  font-size: ${fontSize.micro};
  color: ${meok[700]};
  line-height: 1.25rem;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ResultCard = styled.div`
  margin-top: 0.75rem;
  border-radius: 18px;
  background-color: #ffffff;
  padding: 1.25rem;

  [data-theme='dark'] & {
    background-color: ${surface.dark.surface};
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  @media (min-width: 640px) {
    padding: 1.5rem;
  }
`;

const ResultAnswer = styled.p`
  font-size: ${fontSize.sm};
  line-height: 1.5rem;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const SourcesRow = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-top: 1px solid ${meok[200]};
  padding-top: 1rem;

  [data-theme='dark'] & {
    border-top-color: rgba(255, 255, 255, 0.08);
  }
`;

const SourceButton = styled.button`
  max-width: 100%;
  border: none;
  border-radius: 8px;
  background-color: ${meok[200]};
  padding: 0.5rem 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${palette.juhong[50]};
  }

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.06);

    &:hover {
      background-color: rgba(255, 85, 0, 0.15);
    }
  }

  & .title {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${fontSize.xs};
    font-weight: 600;
    color: ${meok[900]};

    [data-theme='dark'] & {
      color: ${meok[100]};
    }
  }

  & .desc {
    display: block;
    margin-top: 0.125rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${fontSize.micro};
    color: ${meok[700]};

    [data-theme='dark'] & {
      color: ${meok[400]};
    }
  }
`;

const SrOnly = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

const SUGGESTIONS = [
  '경주에서 10분 안에 들을 수 있는 이야기를 찾아줘',
  '아이와 함께 듣기 좋은 한옥 이야기를 알려줘',
  '조용히 걸으며 듣기 좋은 자연 이야기가 있을까?',
];

export function SorimaruQuestionAssistant({ filters, onOpenSource }: SorimaruQuestionAssistantProps) {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<SorimaruAssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sorimaru/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, filters }),
      });
      const payload = await response.json() as SorimaruAssistantResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || '안내를 불러오지 못했습니다');
      setResult(payload);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : '안내를 불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionContainer aria-labelledby="sorimaru-question-heading">
      <CardBox>
        <div>
          <QuestionHeading id="sorimaru-question-heading">어떤 이야기를 찾고 있나요?</QuestionHeading>
          <QuestionDesc>장소, 분위기, 듣는 시간으로 자연스럽게 물어보세요. 답변과 함께 관련 소리마루 이야기를 추천해 드려요.</QuestionDesc>
          <SuggestionsRow>
            {SUGGESTIONS.map((suggestion) => (
              <SuggestionButton key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>
                {suggestion}
              </SuggestionButton>
            ))}
          </SuggestionsRow>
        </div>

        <FormContainer onSubmit={ask}>
          <SrOnly htmlFor="sorimaru-natural-question">찾고 싶은 오디오 이야기 질문</SrOnly>
          <InputWrapper>
            <Search size={16} strokeWidth={2} style={{ flexShrink: 0, color: meok[500] }} />
            <StyledInput
              id="sorimaru-natural-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              placeholder="예: 부여에서 짧게 들을 역사 이야기"
            />
            <SubmitButton
              type="submit"
              disabled={!question.trim() || isLoading}
              aria-label="질문 보내기"
            >
              {isLoading ? <RotateCcw size={14} strokeWidth={2} className="spinning" /> : <ArrowUp size={16} strokeWidth={2} />}
            </SubmitButton>
          </InputWrapper>
          {isLoading && <HelperText>소리마루 이야기에서 추천 장소를 찾고 있어요.</HelperText>}
          {error && <HelperText>{error.includes('아직 구성되지') ? '자연어 안내는 준비 중입니다. 지금은 카테고리와 검색으로 이야기를 찾아보세요.' : error}</HelperText>}
        </FormContainer>
      </CardBox>

      {result && (
        <ResultCard>
          <ResultAnswer>{result.answer}</ResultAnswer>
          <SourcesRow>
            {result.sources.map((source) => (
              <SourceButton key={source.stid} type="button" onClick={() => onOpenSource(source)}>
                <span className="title">{source.title}</span>
                <span className="desc">{[source.locationName, source.formattedDuration].filter(Boolean).join(' · ')}</span>
              </SourceButton>
            ))}
          </SourcesRow>
        </ResultCard>
      )}
    </SectionContainer>
  );
}
