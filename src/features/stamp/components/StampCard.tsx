'use client';

import styled from '@emotion/styled';
import { Lock, CheckCircle2, Award, Calendar } from 'lucide-react';
import type { StampDef, CollectedStamp } from '../types';
import { meok } from '@/design-system/tokens';

interface StampCardProps {
  stamp: StampDef;
  collected?: CollectedStamp;
  onClick: () => void;
}

const Card = styled.div<{ $unlocked: boolean; $color: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 14px 16px;
  border-radius: 16px;
  background: ${({ $unlocked }) =>
    $unlocked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(25, 31, 40, 0.03)'};
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
  user-select: none;

  [data-theme='dark'] & {
    background: ${({ $unlocked }) =>
      $unlocked ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'};
  }

  &:hover {
    transform: translateY(-3px);
    background: ${({ $unlocked }) =>
      $unlocked ? '#ffffff' : 'rgba(25, 31, 40, 0.06)'};

    [data-theme='dark'] &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const SealFrame = styled.div<{ $unlocked: boolean; $color: string }>`
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: ${({ $unlocked, $color }) =>
    $unlocked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(25, 31, 40, 0.05)'};
  border: 2px solid ${({ $unlocked, $color }) => ($unlocked ? $color : 'rgba(25, 31, 40, 0.12)')};
  color: ${({ $unlocked, $color }) => ($unlocked ? $color : meok[400])};

  [data-theme='dark'] & {
    background: ${({ $unlocked }) =>
      $unlocked ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.04)'};
    border-color: ${({ $unlocked, $color }) =>
      $unlocked ? $color : 'rgba(255, 255, 255, 0.12)'};
  }

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border: 1px dashed
      ${({ $unlocked, $color }) => ($unlocked ? $color : 'rgba(25, 31, 40, 0.1)')};
    border-radius: 10px;
    opacity: 0.6;

    [data-theme='dark'] & {
      border-color: ${({ $unlocked, $color }) =>
        $unlocked ? $color : 'rgba(255, 255, 255, 0.1)'};
    }
  }
`;

const SealText = styled.span`
  font-family: 'Batang', 'Song Myung', serif;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0.05em;
  line-height: 1;
`;

const Title = styled.h4<{ $unlocked: boolean }>`
  font-size: 13.5px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: ${({ $unlocked }) => ($unlocked ? meok[900] : meok[500])};
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${({ $unlocked }) => ($unlocked ? '#ffffff' : meok[400])};
  }
`;

const MetaText = styled.p<{ $unlocked: boolean }>`
  font-size: 11px;
  color: ${meok[400]};
  margin: 0;
  line-height: 1.4;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
`;

const DateBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 6px;
  font-size: 10.5px;
  font-weight: 600;
  color: #059669;
`;

export default function StampCard({ stamp, collected, onClick }: StampCardProps) {
  const isUnlocked = Boolean(collected);

  const formattedDate = collected
    ? new Date(collected.collectedAt).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
      })
    : null;

  return (
    <Card
      $unlocked={isUnlocked}
      $color={stamp.color}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${stamp.name} - ${isUnlocked ? '수집 완료' : '미수집'}`}
    >
      <SealFrame $unlocked={isUnlocked} $color={stamp.color}>
        {isUnlocked ? (
          <SealText>{stamp.sealText}</SealText>
        ) : (
          <Lock size={20} strokeWidth={1.75} />
        )}
      </SealFrame>

      <Title $unlocked={isUnlocked}>{stamp.name}</Title>

      {isUnlocked ? (
        <DateBadge>
          <CheckCircle2 size={11} />
          <span>{formattedDate}</span>
        </DateBadge>
      ) : (
        <MetaText $unlocked={isUnlocked}>{stamp.condition}</MetaText>
      )}
    </Card>
  );
}
