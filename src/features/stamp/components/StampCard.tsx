'use client';

import { useRef } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import type { StampDef, CollectedStamp } from '../types';
import { meok, ringShadow } from '@/design-system/tokens';
import { stampAudio } from '../utils/sound';

interface StampCardProps {
  stamp: StampDef;
  collected?: CollectedStamp;
  onClick: () => void;
}

const Slot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 4px 4px 16px;
  cursor: pointer;
  user-select: none;
  perspective: 1000px;

  &:focus-visible {
    outline: 2px solid ${meok[700]};
    outline-offset: 6px;
    border-radius: 50%;
  }

  @media (prefers-reduced-motion: reduce) {
    perspective: none;
  }
`;

const Seal = styled.div<{ $unlocked: boolean; $color: string }>`
  position: relative;
  width: clamp(96px, 14vw, 140px);
  height: clamp(96px, 14vw, 140px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  flex-shrink: 0;
  transform-style: preserve-3d;

  background: ${({ $unlocked, $color }) =>
    $unlocked
      ? `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${$color} 82%, white), ${$color} 52%, color-mix(in srgb, ${$color} 86%, black) 100%)`
      : 'rgba(25, 31, 40, 0.035)'};

  box-shadow: ${({ $unlocked }) =>
    $unlocked
      ? `inset 0 4px 12px rgba(0, 0, 0, 0.28), inset 0 -1px 4px rgba(255, 255, 255, 0.07), ${ringShadow.light.card}`
      : 'none'};

  transition: background 0.2s ease;

  [data-theme='dark'] & {
    background: ${({ $unlocked, $color }) =>
      $unlocked
        ? `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${$color} 82%, white), ${$color} 52%, color-mix(in srgb, ${$color} 86%, black) 100%)`
        : 'rgba(255, 255, 255, 0.04)'};
    box-shadow: ${({ $unlocked }) =>
      $unlocked
        ? `inset 0 4px 12px rgba(0, 0, 0, 0.4), ${ringShadow.dark.card}`
        : 'none'};
  }

  @media (max-width: 480px) {
    width: clamp(72px, 20vw, 96px);
    height: clamp(72px, 20vw, 96px);
    margin-bottom: 10px;
  }
`;

const SealText = styled.span`
  font-family: var(--font-traditional);
  font-size: clamp(26px, 4vw, 50px);
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1;
  color: rgba(255, 255, 255, 0.93);
  position: relative;
  z-index: 1;
  white-space: pre;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 480px) {
    font-size: clamp(18px, 5.5vw, 28px);
  }
`;

/* 잠긴 자리 — 아무 아이콘도 없이 빈 원만 */
const LockedDot = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(25, 31, 40, 0.12);

  [data-theme='dark'] & {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const RarityRing = styled.div<{ $rarity: string; $color: string }>`
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: ${({ $rarity, $color }) => {
    if ($rarity === 'legendary') return `2px solid ${$color}`;
    if ($rarity === 'rare') return `1.5px solid ${$color}55`;
    return 'none';
  }};
  pointer-events: none;
`;

const StampName = styled.h4<{ $unlocked: boolean }>`
  font-family: var(--font-traditional);
  font-size: clamp(12px, 1.4vw, 14px);
  font-weight: ${({ $unlocked }) => ($unlocked ? 700 : 400)};
  margin: 0 0 4px 0;
  color: ${({ $unlocked }) => ($unlocked ? meok[900] : meok[300])};
  letter-spacing: -0.01em;
  word-break: keep-all;
  line-height: 1.35;

  [data-theme='dark'] & {
    color: ${({ $unlocked }) => ($unlocked ? '#ffffff' : meok[600])};
  }
`;

const DateLine = styled.div`
  font-size: 11px;
  color: ${meok[400]};
  letter-spacing: 0;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
`;

const ConditionLine = styled.div`
  font-size: 10.5px;
  color: ${meok[300]};
  line-height: 1.4;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[600]};
  }
`;

export default function StampCard({ stamp, collected, onClick }: StampCardProps) {
  const sealRef = useRef<HTMLDivElement>(null);
  const isUnlocked = Boolean(collected);

  const formattedDate = collected
    ? new Date(collected.collectedAt).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
      })
    : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const seal = sealRef.current;
    if (!seal || !isUnlocked) return;

    const rect = seal.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 16;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 16;

    gsap.to(seal, {
      rotationX: rx,
      rotationY: ry,
      y: -8,
      boxShadow: `inset 0 4px 12px rgba(0,0,0,0.28), ${ringShadow.light.cardHoverGlow}`,
      duration: 0.3,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  };

  const handleMouseLeave = () => {
    const seal = sealRef.current;
    if (!seal || !isUnlocked) return;

    gsap.to(seal, {
      rotationX: 0,
      rotationY: 0,
      y: 0,
      boxShadow: `inset 0 4px 12px rgba(0,0,0,0.28), ${ringShadow.light.card}`,
      duration: 0.5,
      ease: 'back.out(1.2)',
      overwrite: 'auto',
    });
  };

  return (
    <Slot
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
      aria-label={`${stamp.name} — ${isUnlocked ? '도장 획득' : '미방문'}`}
    >
      <Seal ref={sealRef} $unlocked={isUnlocked} $color={stamp.color}>
        {isUnlocked && <RarityRing $rarity={stamp.rarity} $color={stamp.color} />}
        {isUnlocked ? (
          <SealText>{stamp.sealText}</SealText>
        ) : (
          <LockedDot />
        )}
      </Seal>

      <StampName $unlocked={isUnlocked}>{stamp.name}</StampName>

      {isUnlocked ? (
        <DateLine>{formattedDate}</DateLine>
      ) : (
        <ConditionLine>{stamp.condition}</ConditionLine>
      )}
    </Slot>
  );
}
