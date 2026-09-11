'use client';

import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { transientProps } from '@/design-system/styled';
import { meok, lightPalette } from '@/design-system/tokens';
import { Home, ArrowRight } from 'lucide-react';
import type { Village } from '@/hanok/types';
import { filterLabel } from '@/hanok/filterLabels';

// 각 인덱스에 고정된 회전각 (자연스러운 폴라로이드 느낌)
const ROTATIONS = [-4.2, 2.8, -2.1, 3.5];

const Wrapper = styled(motion.article, transientProps)<{ $rotate: number }>`
  display: flex;
  flex-direction: column;
  cursor: pointer;
  user-select: none;
  position: relative;
  transform-origin: center bottom;
  will-change: transform;
`;

const Frame = styled.div`
  background: #ffffff;
  padding: 12px 12px 60px;
  box-shadow:
    0 4px 16px rgba(25, 31, 40, 0.10),
    0 1px 4px rgba(25, 31, 40, 0.06),
    0 12px 40px rgba(25, 31, 40, 0.08);
  border-radius: 2px;
  position: relative;
  overflow: visible;
`;

const PhotoArea = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%;
  overflow: hidden;
  background: ${lightPalette.kobalt[50]};
`;

const Photo = styled(motion.div, transientProps)<{ $bg: string | null }>`
  position: absolute;
  inset: 0;
  ${({ $bg }) =>
    $bg
      ? `background-image: url("${$bg}"); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, #e8ded2 0%, #d4c9bb 100%);`}
`;

const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const PhotoSkeleton = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, ${lightPalette.kobalt[50]} 25%, #eef1f6 50%, ${lightPalette.kobalt[50]} 75%);
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const NoImageLabel = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  opacity: 0.25;
`;

const HandWritingCaption = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
`;

const HandWritingText = styled.p`
  font-family: 'GeuriunXGukhanbakSingoyangI', var(--font-hanok);
  font-size: 21px;
  font-weight: 400;
  color: ${meok[900]};
  margin: 0;
  text-align: center;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TapeStrip = styled.div<{ $left?: boolean }>`
  position: absolute;
  top: -11px;
  ${({ $left }) => ($left ? 'left: 20px;' : 'right: 20px;')}
  width: 44px;
  height: 22px;
  background: rgba(64, 104, 232, 0.28);
  border-radius: 2px;
  transform: rotate(${({ $left }) => ($left ? '-5deg' : '4deg')});
  z-index: 10;

  &::before {
    content: '';
    position: absolute;
    inset: 3px 0;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 4px,
      rgba(255,255,255,0.25) 4px,
      rgba(255,255,255,0.25) 5px
    );
  }
`;

// 폴라로이드 카드 프레임 바깥 하단 메타 정보
const OutsideMeta = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 0 4px;
`;

const OutsideTitle = styled.h3`
  font-family: var(--font-hanok);
  font-size: 16px;
  font-weight: 300;
  color: ${meok[900]};
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.3;

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

const OutsideBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  span {
    font-family: var(--font-hanok);
    font-size: 11.5px;
    font-weight: 500;
    color: ${lightPalette.kobalt[500]};
    background: rgba(78, 89, 104, 0.06);
    padding: 3px 10px;
    border-radius: 9999px;
  }
`;

const DetailButton = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-family: var(--font-hanok);
  font-size: 13px;
  font-weight: 400;
  color: ${meok[900]};
  transition: color 0.2s ease, transform 0.2s ease;

  .polaroid-card:hover & {
    color: ${lightPalette.kobalt[500]};
    transform: translateX(3px);
  }

  [data-theme='dark'] & {
    color: ${meok[100]};
  }
`;

interface PolaroidCardProps {
  village: Village;
  index: number;
  customHandText?: string;
  showOutsideMeta?: boolean;
  onClick?: (village: Village) => void;
  isImageLoading?: boolean;
}

export default function PolaroidCard({
  village,
  index,
  customHandText,
  showOutsideMeta = false,
  onClick,
  isImageLoading = false,
}: PolaroidCardProps) {
  const rotate = ROTATIONS[index % ROTATIONS.length];
  const showTape = index % 2 === 0;
  const tapeLeft = index % 4 < 2;

  const regionName = village.region || '한옥';
  const handText = customHandText || `고즈넉한 ${regionName}에서`;

  return (
    <Wrapper
      className="polaroid-card"
      $rotate={rotate}
      onClick={() => onClick?.(village)}
      role="button"
      tabIndex={0}
      aria-label={`${village.name} 자세히 보기`}
      initial={{ opacity: 0, y: 40, rotate }}
      whileInView={{ opacity: 1, y: 0, rotate }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        delay: index * 0.09,
        duration: 0.55,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        rotate: 0,
        y: -12,
        scale: 1.03,
        zIndex: 10,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.97 }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.(village);
      }}
      style={{ rotate }}
    >
      {showTape && <TapeStrip $left={tapeLeft} />}

      <Frame>
        <PhotoArea>
          {isImageLoading ? (
            <PhotoSkeleton />
          ) : (
            <>
              <Photo
                $bg={village.hasImage ? village.image : null}
                whileHover={{ scale: 1.07 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {!village.hasImage && <NoImageLabel><Home size={32} strokeWidth={2} /></NoImageLabel>}
            </>
          )}
        </PhotoArea>

        <HandWritingCaption>
          <HandWritingText>{handText}</HandWritingText>
        </HandWritingCaption>
      </Frame>

      {showOutsideMeta && (
        <OutsideMeta>
          <OutsideTitle>{village.name} · {village.region}</OutsideTitle>

          <OutsideBadges>
            <span>#{filterLabel(village.type)}</span>
            {village.badges.slice(0, 2).map((b) => (
              <span key={b}>#{filterLabel(b)}</span>
            ))}
          </OutsideBadges>

          <DetailButton>
            자세히 보기 <ArrowRight size={14} strokeWidth={2} />
          </DetailButton>
        </OutsideMeta>
      )}
    </Wrapper>
  );
}

