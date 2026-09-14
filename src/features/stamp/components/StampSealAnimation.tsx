'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Award } from 'lucide-react';
import type { StampDef } from '../types';
import { meok } from '@/design-system/tokens';
import { stampAudio } from '../utils/sound';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 16, 22, 0.76);
  backdrop-filter: blur(10px);
  padding: 20px;
`;

const SealCard = styled(motion.div)`
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
  background: radial-gradient(circle at 50% 35%, rgba(212, 175, 55, 0.12) 0%, transparent 70%);
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

const SealPulseWave = styled(motion.div)<{ $color: string }>`
  position: absolute;
  inset: -16px;
  border-radius: 36px;
  border: 3px solid ${({ $color }) => $color};
  pointer-events: none;
`;

const SealStampRing = styled(motion.div)<{ $color: string }>`
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
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.95);

  [data-theme='dark'] & {
    background: rgba(28, 26, 23, 0.85);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
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
  font-family: 'Batang', 'Song Myung', serif;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
`;

const SparkParticle = styled(motion.div)<{ $color: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  pointer-events: none;
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
      ? 'rgba(212, 175, 55, 0.18)'
      : $rarity === 'rare'
      ? 'rgba(109, 40, 217, 0.12)'
      : 'rgba(185, 28, 28, 0.1)'};
  color: ${({ $rarity }) =>
    $rarity === 'legendary'
      ? '#b45309'
      : $rarity === 'rare'
      ? '#6d28d9'
      : '#b91c1c'};

  [data-theme='dark'] & {
    color: ${({ $rarity }) =>
      $rarity === 'legendary'
        ? '#fbbf24'
        : $rarity === 'rare'
        ? '#a78bfa'
        : '#f87171'};
  }
`;

const StampTitle = styled.h3`
  font-size: 21px;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin: 0 0 6px 0;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const StampDesc = styled.p`
  font-size: 13.5px;
  line-height: 1.55;
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
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    if (stamp) {
      setStamped(false);
      const timer = setTimeout(() => {
        setStamped(true);
        stampAudio.playStampSound();
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [stamp]);

  if (!stamp) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <SealCard
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: stamped ? [0, -6, 2, 0] : 0,
          }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <HanjiBackdrop />
          <CloseButton onClick={onClose} aria-label="닫기">
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
            <AnimatePresence>
              {stamped && (
                <>
                  <SealPulseWave
                    $color={stamp.color}
                    initial={{ scale: 0.8, opacity: 0.9 }}
                    animate={{ scale: 1.55, opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                  />

                  {Array.from({ length: SPARKS_COUNT }).map((_, i) => {
                    const angle = (i * (360 / SPARKS_COUNT) * Math.PI) / 180;
                    const dist = 55 + (i % 3) * 16;
                    return (
                      <SparkParticle
                        key={i}
                        $color={i % 2 === 0 ? stamp.color : '#d4af37'}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos(angle) * dist,
                          y: Math.sin(angle) * dist,
                          scale: [0, 1.4, 0],
                          opacity: [1, 1, 0],
                        }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                      />
                    );
                  })}

                  <SealStampRing
                    $color={stamp.color}
                    initial={{ scale: 2.3, rotate: -20, opacity: 0 }}
                    animate={{
                      scale: [2.3, 0.92, 1],
                      rotate: [-20, 3, 0],
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.42,
                      times: [0, 0.72, 1],
                      ease: 'easeOut',
                    }}
                  >
                    <HanziSealText>{stamp.sealText}</HanziSealText>
                  </SealStampRing>
                </>
              )}
            </AnimatePresence>
          </SealStage>

          <StampTitle>{stamp.name}</StampTitle>
          <StampDesc>{stamp.description}</StampDesc>

          <ConfirmBtn $color={stamp.color} onClick={onClose}>
            <Check size={16} strokeWidth={2.5} />
            <span>수결첩에 보관 완료</span>
          </ConfirmBtn>
        </SealCard>
      </Overlay>
    </AnimatePresence>
  );
}
