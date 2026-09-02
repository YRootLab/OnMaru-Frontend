'use client';

import React from 'react';
import styled from '@emotion/styled';
import { lightPalette, meok } from '@/design-system/tokens';

export type MoodValue = 1 | 2 | 3 | 4 | 5;

interface MoodSelectorProps {
  value: MoodValue;
  onChange?: (val: MoodValue) => void;
  readonly?: boolean;
}

const Container = styled.div<{ $readonly: boolean }>`
  background: rgba(78, 89, 104, 0.04);
  border-radius: 16px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const FacesWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FaceButton = styled.button<{ $selected: boolean; $readonly: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;

  background: transparent;
  cursor: ${({ $readonly }) => ($readonly ? 'default' : 'pointer')};
  color: ${({ $selected }) => ($selected ? lightPalette.juhong[500] : meok[500])};
  opacity: ${({ $selected }) => ($selected ? 1 : 0.25)};
  transform: ${({ $selected }) => ($selected ? 'scale(1.1)' : 'scale(1)')};
  transition: all 0.18s ease;

  ${({ $readonly }) =>
    !$readonly &&
    `
    &:hover {
      opacity: 0.8;
      transform: scale(1.15);
    }
  `}
`;

const MoodLabel = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: ${meok[900]};
  white-space: nowrap;
`;

/** 5단계 감정 라벨 사전 */
const MOOD_LABELS: Record<MoodValue, string> = {
  1: '또 가고 싶어요',
  2: '좋았어요',
  3: '보통이에요',
  4: '아쉬웠어요',
  5: '별로였어요',
};

/** 1. 또 가고 싶어요: 활짝 웃는 얼굴 (반달눈 + 큰 미소) */
function IconMood1({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 9.5c.5-.8 1.5-1 2-1s1.5.2 2 1" />
      <path d="M12 9.5c.5-.8 1.5-1 2-1s1.5.2 2 1" />
      <path d="M7.5 14.5c1.5 2.5 7.5 2.5 9 0" fill="currentColor" opacity="0.3" />
      <path d="M7.5 14.5c1.5 2.5 7.5 2.5 9 0" />
    </svg>
  );
}

/** 2. 좋았어요: 웃는 얼굴 (동그란 눈 + 미소) */
function IconMood2({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="9.5" r="1" fill="currentColor" />
      <circle cx="15" cy="9.5" r="1" fill="currentColor" />
      <path d="M8 14.5s1.5 2 4 2 4-2 4-2" />
    </svg>
  );
}

/** 3. 보통이에요: 무표정 (동그란 눈 + 일자 입) */
function IconMood3({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <line x1="8.5" y1="15" x2="15.5" y2="15" />
    </svg>
  );
}

/** 4. 아쉬웠어요: 살짝 찡그림 (살짝 쳐진 눈썹 + 삐죽 입) */
function IconMood4({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 9l2 1" />
      <path d="M16 9l-2 1" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <path d="M9 16s1.2-1.2 3-1.2 3 1.2 3 1.2" />
    </svg>
  );
}

/** 5. 별로였어요: 찡그린 얼굴 (역아치 입 + 찡그린 눈썹) */
function IconMood5({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 9l2.5 1.5" />
      <path d="M16.5 9l-2.5 1.5" />
      <circle cx="9" cy="11.5" r="1" fill="currentColor" />
      <circle cx="15" cy="11.5" r="1" fill="currentColor" />
      <path d="M8 16.5s1.5-2 4-2 4 2 4 2" />
    </svg>
  );
}

export default function MoodSelector({
  value,
  onChange,
  readonly = false,
}: MoodSelectorProps) {
  const moods: { val: MoodValue; icon: React.ReactNode }[] = [
    { val: 1, icon: <IconMood1 /> },
    { val: 2, icon: <IconMood2 /> },
    { val: 3, icon: <IconMood3 /> },
    { val: 4, icon: <IconMood4 /> },
    { val: 5, icon: <IconMood5 /> },
  ];

  return (
    <Container $readonly={readonly}>
      <FacesWrapper role="group" aria-label="5단계 감정 선택">
        {moods.map(({ val, icon }) => (
          <FaceButton
            key={val}
            type="button"
            $selected={value === val}
            $readonly={readonly}
            onClick={() => !readonly && onChange?.(val)}
            disabled={readonly}
            aria-label={MOOD_LABELS[val]}
            title={MOOD_LABELS[val]}
          >
            {icon}
          </FaceButton>
        ))}
      </FacesWrapper>

      <MoodLabel>{MOOD_LABELS[value]}</MoodLabel>
    </Container>
  );
}
