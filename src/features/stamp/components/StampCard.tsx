'use client';

import { useRef } from 'react';
import styled from '@emotion/styled';
import { Lock, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import type { StampDef, CollectedStamp } from '../types';
import { meok } from '@/design-system/tokens';
import { stampAudio } from '../utils/sound';

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
  border-radius: 18px;

  background: ${({ $unlocked }) =>
    $unlocked ? 'rgba(255, 255, 255, 0.96)' : 'rgba(25, 31, 40, 0.02)'};
  border: 1px solid
    ${({ $unlocked }) =>
      $unlocked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(25, 31, 40, 0.05)'};
  cursor: pointer;
  user-select: none;


  perspective: 1000px;
  transform-style: preserve-3d;


  transition: background 0.3s ease, border-color 0.3s ease;
  overflow: hidden;

  [data-theme='dark'] & {
    background: ${({ $unlocked }) =>
      $unlocked ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'};
    border-color: ${({ $unlocked }) =>
      $unlocked ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  }


  &:active {
    transform: scale(0.97) !important;
  }

  @media (max-width: 480px) {
    padding: 14px 8px 12px;
    border-radius: 14px;
  }
`;


const GlowLayer = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: overlay;
  border-radius: 18px;
  z-index: 1;
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
    $unlocked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(25, 31, 40, 0.04)'};

  border: 2.5px solid
    ${({ $unlocked, $color }) => ($unlocked ? $color : 'rgba(25, 31, 40, 0.1)')};
  color: ${({ $unlocked, $color }) => ($unlocked ? $color : meok[400])};
  box-shadow: ${({ $unlocked }) =>
    $unlocked ? '0 4px 12px rgba(234, 88, 12, 0.15)' : 'none'};
  z-index: 2;

  [data-theme='dark'] & {
    background: ${({ $unlocked }) =>
      $unlocked ? 'rgba(28, 26, 23, 0.8)' : 'rgba(255, 255, 255, 0.03)'};
    border-color: ${({ $unlocked, $color }) =>
      $unlocked ? $color : 'rgba(255, 255, 255, 0.1)'};
    box-shadow: ${({ $unlocked }) =>
      $unlocked ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none'};
  }


  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border: 1.5px dashed
      ${({ $unlocked, $color }) => ($unlocked ? $color : 'rgba(25, 31, 40, 0.08)')};
    border-radius: 11px;
    opacity: 0.7;

    [data-theme='dark'] & {
      border-color: ${({ $unlocked, $color }) =>
        $unlocked ? $color : 'rgba(255, 255, 255, 0.1)'};
    }
  }

  @media (max-width: 480px) {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    margin-bottom: 8px;
  }
`;

const SealText = styled.span`
  font-family: var(--font-traditional);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const Title = styled.h4<{ $unlocked: boolean }>`
  font-family: var(--font-traditional);
  font-size: 14.5px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: ${({ $unlocked }) => ($unlocked ? '#78350f' : meok[500])};
  letter-spacing: -0.01em;
  z-index: 2;

  [data-theme='dark'] & {
    color: ${({ $unlocked }) => ($unlocked ? '#fde68a' : meok[400])};
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

const MetaText = styled.p<{ $unlocked: boolean }>`
  font-family: var(--font-traditional-body);
  font-size: 11.5px;
  color: ${meok[500]};
  margin: 0;
  line-height: 1.45;
  word-break: keep-all;
  z-index: 2;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const DateBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: #ea580c;
  background: rgba(234, 88, 12, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  z-index: 2;

  [data-theme='dark'] & {
    color: #fdba74;
    background: rgba(251, 146, 60, 0.15);
  }
`;



export default function StampCard({ stamp, collected, onClick }: StampCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const isUnlocked = Boolean(collected);

  const formattedDate = collected
    ? new Date(collected.collectedAt).toLocaleDateString('ko-KR', {
        year: '2-digit',
        month: 'numeric',
        day: 'numeric',
      })
    : null;


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !glowRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;


    const rx = -((y - rect.height / 2) / (rect.height / 2)) * 12;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    const gx = Math.round((x / rect.width) * 100);
    const gy = Math.round((y / rect.height) * 100);


    gsap.to(cardRef.current, {
      rotationX: rx,
      rotationY: ry,
      y: -6,
      scale: 1.02,
      boxShadow: isUnlocked
        ? '0 16px 32px rgba(234, 88, 12, 0.15)'
        : '0 12px 24px rgba(0, 0, 0, 0.08)',
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto',
    });


    gsap.to(glowRef.current, {
      opacity: isUnlocked ? 0.8 : 0.3,
      background: `radial-gradient(circle at ${gx}% ${gy}%, ${
        isUnlocked ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255, 255, 255, 0.3)'
      } 0%, transparent 70%)`,
      duration: 0.2,
      overwrite: 'auto',
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || !glowRef.current) return;


    gsap.to(cardRef.current, {
      rotationX: 0,
      rotationY: 0,
      y: 0,
      scale: 1,
      boxShadow: 'none',
      duration: 0.5,
      ease: 'back.out(1.2)',
      overwrite: 'auto',
    });

    gsap.to(glowRef.current, {
      opacity: 0,
      duration: 0.4,
      overwrite: 'auto',
    });
  };

  return (
    <Card
      ref={cardRef}
      $unlocked={isUnlocked}$color={stamp.color}
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
      aria-label={`${stamp.name} - ${isUnlocked ? '도장 획득' : '미방문'}`}
    >
      <GlowLayer ref={glowRef} />

      <SealFrame $unlocked={isUnlocked}$color={stamp.color}>
        {isUnlocked ? (
          <SealText>{stamp.sealText}</SealText>
        ) : (
          <Lock size={20} strokeWidth={1.75} />
        )}
      </SealFrame>

      <Title $unlocked={isUnlocked}>{stamp.name}</Title>

      {isUnlocked ? (
        <DateBadge>
          <CheckCircle2 size={12} />
          <span>{formattedDate}</span>
        </DateBadge>
      ) : (
        <MetaText $unlocked={isUnlocked}>{stamp.condition}</MetaText>
      )}
    </Card>
  );
}