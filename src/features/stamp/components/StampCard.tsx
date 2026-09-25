'use client';

import { useRef } from 'react';
import styled from '@emotion/styled';
import { Lock } from 'lucide-react';
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
  padding: 10px 4px 14px;
  cursor: pointer;
  user-select: none;
  perspective: 800px;

  &:focus-visible {
    outline: 2px solid ${meok[700]};
    outline-offset: 4px;
    border-radius: 8px;
  }

  @media (prefers-reduced-motion: reduce) {
    perspective: none;
  }
`;

/* The stamp circle — this IS the design */
const Seal = styled.div<{ $unlocked: boolean; $color: string }>`
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  flex-shrink: 0;
  transform-style: preserve-3d;

  background: ${({ $unlocked, $color }) =>
    $unlocked
      ? `radial-gradient(circle at 38% 32%, color-mix(in srgb, ${$color} 82%, white), ${$color} 52%, color-mix(in srgb, ${$color} 86%, black) 100%)`
      : 'transparent'};

  /* Locked: dotted circle placeholder */
  border: ${({ $unlocked }) =>
    $unlocked ? 'none' : '2px dashed rgba(25, 31, 40, 0.18)'};

  /* Unlocked: ink impression (inset) + ambient lift */
  box-shadow: ${({ $unlocked }) =>
    $unlocked
      ? `inset 0 3px 8px rgba(0, 0, 0, 0.22), inset 0 -1px 3px rgba(255, 255, 255, 0.08), ${ringShadow.light.card}`
      : 'none'};

  transition: border-color 0.2s ease;

  [data-theme='dark'] & {
    border-color: ${({ $unlocked }) =>
      $unlocked ? 'none' : 'rgba(255, 255, 255, 0.15)'};
    box-shadow: ${({ $unlocked }) =>
      $unlocked
        ? `inset 0 3px 8px rgba(0, 0, 0, 0.35), ${ringShadow.dark.card}`
        : 'none'};
  }

  @media (max-width: 480px) {
    width: 58px;
    height: 58px;
    margin-bottom: 8px;
  }
`;

const SealText = styled.span`
  font-family: var(--font-traditional);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  color: rgba(255, 255, 255, 0.92);
  position: relative;
  z-index: 1;
  /* Two-character hanja stacked for longer seals */
  white-space: pre;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

/* Rarity ring — subtle outer ring for rare/legendary, no border on common */
const RarityRing = styled.div<{ $rarity: string; $color: string }>`
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: ${({ $rarity, $color }) => {
    if ($rarity === 'legendary') return `2px solid ${$color}`;
    if ($rarity === 'rare') return `1.5px solid ${$color}66`;
    return 'none';
  }};
  pointer-events: none;
`;

const StampName = styled.h4<{ $unlocked: boolean }>`
  font-family: var(--font-traditional);
  font-size: 12.5px;
  font-weight: ${({ $unlocked }) => ($unlocked ? 700 : 400)};
  margin: 0 0 4px 0;
  color: ${({ $unlocked }) => ($unlocked ? meok[900] : meok[400])};
  letter-spacing: -0.01em;
  word-break: keep-all;
  line-height: 1.35;

  [data-theme='dark'] & {
    color: ${({ $unlocked }) => ($unlocked ? '#ffffff' : meok[500])};
  }

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

const DateLine = styled.div`
  font-size: 10.5px;
  color: ${meok[400]};
  letter-spacing: 0;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }
`;

const ConditionLine = styled.div`
  font-size: 10px;
  color: ${meok[400]};
  line-height: 1.4;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[500]};
  }

  @media (max-width: 480px) {
    font-size: 9px;
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
    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 14;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 14;

    gsap.to(seal, {
      rotationX: rx,
      rotationY: ry,
      y: -6,
      boxShadow: `inset 0 3px 8px rgba(0,0,0,0.22), ${ringShadow.light.cardHoverGlow}`,
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
      boxShadow: `inset 0 3px 8px rgba(0,0,0,0.22), ${ringShadow.light.card}`,
      duration: 0.45,
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
        <RarityRing $rarity={stamp.rarity} $color={stamp.color} />
        {isUnlocked ? (
          <SealText>{stamp.sealText}</SealText>
        ) : (
          <Lock size={18} strokeWidth={1.5} color={meok[300]} />
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
