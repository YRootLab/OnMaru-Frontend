'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'framer-motion';
import { meok } from '@/design-system/tokens';
import FeaturedPlaceCard from './FeaturedPlaceCard';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const INTERVAL = 5000;
const MAX_SLIDES = 5;

const Wrap = styled.div`
  position: relative;
`;

const SlideWrap = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 20px;

  @media (max-width: 640px) {
    border-radius: 16px;
  }
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? 20 : 8)}px;
  height: 8px;
  border-radius: 4px;
  border: none;
  padding: 0;
  cursor: pointer;
  background: ${({ $active }) => ($active ? meok[900] : meok[300])};
  transition: width 0.25s ease, background 0.25s ease;

  [data-theme='dark'] & {
    background: ${({ $active }) =>
      $active ? '#ffffff' : 'rgba(255,255,255,0.2)'};
  }
`;

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

interface Props {
  items: DiscoveryPlaceSummary[];
  onClick: (place: DiscoveryPlaceSummary) => void;
}

export default function FeaturedCarousel({ items, onClick }: Props) {
  const slides = items.slice(0, MAX_SLIDES);
  const [[page, direction], setPage] = useState([0, 0]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const go = useCallback(
    (next: number) => {
      setPage(([prev]) => [next, next > prev ? 1 : -1]);
    },
    [],
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setPage(([prev]) => [(prev + 1) % slides.length, 1]);
    }, INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (slides.length > 1) {
      timerRef.current = setInterval(() => {
        setPage(([prev]) => [(prev + 1) % slides.length, 1]);
      }, INTERVAL);
    }
  }, [slides.length]);

  if (slides.length === 0) return null;
  if (slides.length === 1) {
    return <FeaturedPlaceCard place={slides[0]} onClick={onClick} />;
  }

  const idx = ((page % slides.length) + slides.length) % slides.length;

  return (
    <Wrap>
      <SlideWrap>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={idx}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <FeaturedPlaceCard place={slides[idx]} onClick={onClick} />
          </motion.div>
        </AnimatePresence>
      </SlideWrap>

      <Dots>
        {slides.map((_, i) => (
          <Dot
            key={i}
            $active={i === idx}
            onClick={() => {
              go(i);
              resetTimer();
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </Dots>
    </Wrap>
  );
}
