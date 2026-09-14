'use client';

import { useState } from 'react';
import styled from '@emotion/styled';
import { Lock, CheckCircle2 } from 'lucide-react';
import type { StampDef, CollectedStamp } from '../types';
import { meok } from '@/design-system/tokens';
import { stampAudio } from '../utils/sound';

interface StampCardProps {
  stamp: StampDef;
  collected?: CollectedStamp;
  onClick: () => void;
}

const Card = styled.div<{
  $unlocked: boolean;
  $color: string;
  $transform?: string;
  $glow?: string;
}>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 14px 16px;
  border-radius: 18px;
  background: ${({ $unlocked }) =>
    $unlocked ? 'rgba(255, 255, 255, 0.96)' : 'rgba(25, 31, 40, 0.03)'};
  border: 1px solid
    ${({ $unlocked, $color }) => ($unlocked ? 'rgba(212, 175, 55, 0.22)' : 'rgba(25, 31, 40, 0.05)')};
  cursor: pointer;
  user-select: none;
  perspective: 700px;
  transform: ${({ $transform }) => $transform || 'translateY(0)'};
  transition: transform 0.1s ease-out, box-shadow 0.15s ease-out, background 0.2s ease;
  overflow: hidden;

  [data-theme='dark'] & {
    background: ${({ $unlocked }) =>
      $unlocked ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)'};
    border-color: ${({ $unlocked }) =>
      $unlocked ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.05)'};
  }

  /* 3D 상호작용 홀로그램 반사광 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: ${({ $glow, $unlocked }) =>
      $unlocked && $glow ? $glow : 'transparent'};
    opacity: ${({ $unlocked }) => ($unlocked ? 0.75 : 0)};
    transition: opacity 0.2s ease;
  }

  &:hover {
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);

    [data-theme='dark'] &:hover {
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
    }
  }

  &:active {
    transform: scale(0.97);
  }
`;

const SealFrame = styled.div<{ $unlocked: boolean; $color: string }>`
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  background: ${({ $unlocked }) =>
    $unlocked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(25, 31, 40, 0.05)'};
  border: 2.5px solid ${({ $unlocked, $color }) => ($unlocked ? $color : 'rgba(25, 31, 40, 0.12)')};
  color: ${({ $unlocked, $color }) => ($unlocked ? $color : meok[400])};
  box-shadow: ${({ $unlocked }) =>
    $unlocked ? '0 4px 12px rgba(0, 0, 0, 0.06)' : 'none'};

  [data-theme='dark'] & {
    background: ${({ $unlocked }) =>
      $unlocked ? 'rgba(28, 26, 23, 0.65)' : 'rgba(255, 255, 255, 0.04)'};
    border-color: ${({ $unlocked, $color }) =>
      $unlocked ? $color : 'rgba(255, 255, 255, 0.12)'};
  }

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border: 1px dashed
      ${({ $unlocked, $color }) => ($unlocked ? $color : 'rgba(25, 31, 40, 0.1)')};
    border-radius: 11px;
    opacity: 0.65;

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
  font-weight: 800;
  margin: 0 0 4px 0;
  color: ${({ $unlocked }) => ($unlocked ? meok[900] : meok[500])};
  letter-spacing: -0.01em;

  [data-theme='dark'] & {
    color: ${({ $unlocked }) => ($unlocked ? '#ffffff' : meok[400])};
  }
`;

const MetaText = styled.p<{ $unlocked: boolean }>`
  font-size: 11px;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.4;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const DateBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: #059669;

  [data-theme='dark'] & {
    color: #34d399;
  }
`;

export default function StampCard({ stamp, collected, onClick }: StampCardProps) {
  const isUnlocked = Boolean(collected);
  const [tilt, setTilt] = useState<{ rx: number; ry: number; gx: number; gy: number } | null>(null);

  const formattedDate = collected
    ? new Date(collected.collectedAt).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
      })
    : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 10;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 10;
    const gx = Math.round((x / rect.width) * 100);
    const gy = Math.round((y / rect.height) * 100);
    setTilt({ rx, ry, gx, gy });
  };

  const handleMouseLeave = () => {
    setTilt(null);
  };

  const transformStyle = tilt
    ? `perspective(700px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-4px)`
    : undefined;

  const glowStyle = tilt
    ? `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(212, 175, 55, 0.28) 0%, transparent 60%)`
    : undefined;

  return (
    <Card
      $unlocked={isUnlocked}
      $color={stamp.color}
      $transform={transformStyle}
      $glow={glowStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        stampAudio.playMapClickSound();
        onClick();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          stampAudio.playMapClickSound();
          onClick();
        }
      }}
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
