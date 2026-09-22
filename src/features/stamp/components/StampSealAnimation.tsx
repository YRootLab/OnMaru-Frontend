'use client';

import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X, Check, Award } from 'lucide-react';
import type { StampDef } from '../types';
import { meok } from '@/design-system/tokens';
import { stampAudio } from '../utils/sound';


gsap.registerPlugin(useGSAP);



const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 16, 22, 0.76);
  backdrop-filter: blur(10px);
  padding: 20px;
  visibility: hidden;
`;

const SealCard = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: 24px;
  background: #ffffff;
  padding: 36px 26px 30px;
  text-align: center;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;

  [data-theme='dark'] & {
    background: #1c1a17;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const HanjiBackdrop = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  background: radial-gradient(circle at 50% 35%, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: ${meok[400]};
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: ${meok[900]};
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

const SealStage = styled.div`
  position: relative;
  width: 140px;
  height: 140px;
  margin: 8px auto 22px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SealPulseWave = styled.div<{ $color: string }>`
  position: absolute;
  inset: -16px;
  border-radius: 36px;
  border: 3px solid ${({ $color }) => $color};
  pointer-events: none;
  opacity: 0;
`;

const SealStampRing = styled.div<{ $color: string }>`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 26px;
  border: 4.5px solid ${({ $color }) => $color};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  box-shadow: 0 8px 32px rgba(234, 88, 12, 0.25);
  background: rgba(255, 255, 255, 0.95);
  opacity: 0;

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.85);
    box-shadow: 0 8px 32px rgba(234, 88, 12, 0.4);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1.5px dashed ${({ $color }) => $color};
    border-radius: 19px;
    opacity: 0.7;
  }
`;

const HanziSealText = styled.span`
  font-family: var(--font-traditional);
  font-size: 40px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
`;

const SparkParticle = styled.div<{ $color: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  pointer-events: none;
  opacity: 0;
`;

const RarityTag = styled.div<{ $rarity: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  margin-bottom: 10px;


  background: ${({ $rarity }) =>
    $rarity === 'legendary'
      ? 'rgba(249, 115, 22, 0.12)'
      : $rarity === 'rare'
      ? 'rgba(139, 92, 246, 0.12)'
      : 'rgba(225, 29, 72, 0.1)'}; // Crimson Red

  color: ${({ $rarity }) =>
    $rarity === 'legendary'
      ? '#ea580c'
      : $rarity === 'rare'
      ? '#7c3aed'
      : '#e11d48'};

  [data-theme='dark'] & {
    color: ${({ $rarity }) =>
      $rarity === 'legendary'
        ? '#fdba74'
        : $rarity === 'rare'
        ? '#a78bfa'
        : '#fb7185'};
  }
`;

const StampTitle = styled.h3`
  font-family: var(--font-traditional);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 6px 0;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const StampDesc = styled.p`
  font-family: var(--font-traditional-body);
  font-size: 14.5px;
  line-height: 1.65;
  color: ${meok[700]};
  margin: 0 0 24px 0;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ConfirmBtn = styled.button<{ $color: string }>`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: ${({ $color }) => $color};
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  transition: opacity 0.2s ease, transform 0.1s ease;

  &:hover {
    opacity: 0.92;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const SPARKS_COUNT = 14;

interface StampSealAnimationProps {
  stamp: StampDef | null;
  onClose: () => void;
}

export default function StampSealAnimation({ stamp, onClose }: StampSealAnimationProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);


  useGSAP(() => {
    if (!stamp || isClosing || !overlayRef.current || !cardRef.current) return;


    const tl = gsap.timeline();

    tl.set(overlayRef.current, { visibility: 'visible', opacity: 0 })
      .set(cardRef.current, { scale: 0.9, opacity: 0, y: 20 })
      .set(ringRef.current, { scale: 2.3, rotation: -20, opacity: 0 })
      .set(pulseRef.current, { scale: 0.8, opacity: 0 })
      .set('.spark-particle', { scale: 0, opacity: 1, x: 0, y: 0 });

    tl.to(overlayRef.current, { opacity: 1, duration: 0.3 })
      .to(cardRef.current, { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }, '<0.1')


      .add(() => {
        stampAudio.playStampSound();

        gsap.to(cardRef.current, { y: 6, duration: 0.05, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      }, '+=0.15')

      .to(ringRef.current, {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.35,
        ease: 'back.out(2.5)',
      }, '<')


      .to(pulseRef.current, {
        scale: 1.6,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
      }, '<')
      .to('.spark-particle', {
        x: (i, el) => el.dataset.tx,
        y: (i, el) => el.dataset.ty,
        scale: 1.4,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.out',
      }, '<');

  }, { scope: overlayRef, dependencies: [stamp] });


  const handleClose = () => {
    if (isClosing || !overlayRef.current || !cardRef.current) return;
    setIsClosing(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setIsClosing(false);
        onClose();
      }
    });

    tl.to(cardRef.current, { scale: 0.9, opacity: 0, y: 15, duration: 0.25, ease: 'power2.in' })
      .to(overlayRef.current, { opacity: 0, duration: 0.2 }, '<0.1');
  };

  if (!stamp) return null;

  return (
    <Overlay ref={overlayRef} onClick={handleClose}>
      <SealCard
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
      >
        <HanjiBackdrop />
        <CloseButton onClick={handleClose} aria-label="닫기">
          <X size={18} />
        </CloseButton>

        <RarityTag $rarity={stamp.rarity}>
          <Award size={13} />
          <span>
            {stamp.rarity === 'legendary'
              ? '전설 어보'
              : stamp.rarity === 'rare'
              ? '희귀 인장'
              : stamp.rarity === 'regional'
              ? '권역 인장'
              : '한옥 수결'}
          </span>
        </RarityTag>

        <SealStage>
          {}
          <SealPulseWave ref={pulseRef} $color={stamp.color} />

          {}
          {Array.from({ length: SPARKS_COUNT }).map((_, i) => {
            const angle = (i * (360 / SPARKS_COUNT) * Math.PI) / 180;
            const dist = 55 + (i % 3) * 16;
            const targetX = Math.cos(angle) * dist;
            const targetY = Math.sin(angle) * dist;

            return (
              <SparkParticle
                key={i}
                className="spark-particle"
                $color={i % 2 === 0 ? stamp.color : '#f59e0b'}
                data-tx={targetX}
                data-ty={targetY}
              />
            );
          })}

          {}
          <SealStampRing ref={ringRef} $color={stamp.color}>
            <HanziSealText>{stamp.sealText}</HanziSealText>
          </SealStampRing>
        </SealStage>

        <StampTitle>{stamp.name}</StampTitle>
        <StampDesc>{stamp.description}</StampDesc>

        <ConfirmBtn $color={stamp.color} onClick={handleClose}>
          <Check size={16} strokeWidth={2.5} />
          <span>인장첩에 담았어요</span>
        </ConfirmBtn>
      </SealCard>
    </Overlay>
  );
}