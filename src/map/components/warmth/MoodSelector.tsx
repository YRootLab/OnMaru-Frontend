'use client';

import React from 'react';
import styled from '@emotion/styled';
import { SmilePlus, Smile, Meh, Frown, Angry } from 'lucide-react';
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
  font-weight: 500;
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

export default function MoodSelector({
  value,
  onChange,
  readonly = false,
}: MoodSelectorProps) {
  const moods: { val: MoodValue; icon: React.ReactNode }[] = [
    { val: 1, icon: <SmilePlus size={24} strokeWidth={1.8} /> },
    { val: 2, icon: <Smile size={24} strokeWidth={1.8} /> },
    { val: 3, icon: <Meh size={24} strokeWidth={1.8} /> },
    { val: 4, icon: <Frown size={24} strokeWidth={1.8} /> },
    { val: 5, icon: <Angry size={24} strokeWidth={1.8} /> },
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
