'use client';

import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Check, Award } from 'lucide-react';
import type { StampDef } from '../types';
import { meok } from '@/design-system/tokens';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 16, 22, 0.72);
  backdrop-filter: blur(8px);
  padding: 20px;
`;

const SealCard = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  background: #ffffff;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.28);
  overflow: hidden;

  [data-theme='dark'] & {
    background: #20242d;
    color: #ffffff;
  }
`;

const HanjiBackdrop = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
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
    background: rgba(0, 0, 0, 0.05);
    color: ${meok[900]};
  }

  [data-theme='dark'] &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }
`;

const SealStampRing = styled(motion.div)<{ $color: string }>`
  position: relative;
  width: 120px;
  height: 120px;
  margin: 10px auto 20px;
  border-radius: 24px;
  border: 4px solid ${({ $color }) => $color};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.85);

  [data-theme='dark'] & {
    background: rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px dashed ${({ $color }) => $color};
    border-radius: 18px;
    opacity: 0.65;
  }
`;

const HanziSealText = styled.span`
  font-family: 'Batang', 'Song Myung', serif;
  font-size: 38px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
`;

const RarityTag = styled.div<{ $rarity: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  margin-bottom: 8px;
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
`;

const StampTitle = styled.h3`
  font-size: 20px;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: ${meok[900]};

  [data-theme='dark'] & {
    color: #ffffff;
  }
`;

const StampDesc = styled.p`
  font-size: 13.5px;
  line-height: 1.5;
  color: ${meok[500]};
  margin: 0 0 20px 0;
  word-break: keep-all;

  [data-theme='dark'] & {
    color: ${meok[400]};
  }
`;

const ConfirmBtn = styled.button<{ $color: string }>`
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: ${({ $color }) => $color};
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s ease;

  &:hover {
    opacity: 0.92;
  }

  &:active {
    transform: scale(0.98);
  }
`;

interface StampSealAnimationProps {
  stamp: StampDef | null;
  onClose: () => void;
}

export default function StampSealAnimation({ stamp, onClose }: StampSealAnimationProps) {
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    if (stamp) {
      setStamped(false);
      const timer = setTimeout(() => setStamped(true), 150);
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
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
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

          <AnimatePresence>
            {stamped && (
              <SealStampRing
                $color={stamp.color}
                initial={{ scale: 2.2, rotate: -18, opacity: 0 }}
                animate={{
                  scale: [2.2, 0.92, 1],
                  rotate: [-18, 4, 0],
                  opacity: 1,
                }}
                transition={{
                  duration: 0.45,
                  times: [0, 0.75, 1],
                  ease: 'easeOut',
                }}
              >
                <HanziSealText>{stamp.sealText}</HanziSealText>
              </SealStampRing>
            )}
          </AnimatePresence>

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
