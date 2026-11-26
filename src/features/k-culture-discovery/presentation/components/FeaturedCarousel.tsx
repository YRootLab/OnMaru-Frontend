'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import styled from '@emotion/styled';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import FeaturedPlaceCard from './FeaturedPlaceCard';
import type { DiscoveryPlaceSummary } from '../../domain/types';

const AUTOPLAY_INTERVAL_MS = 6000;

const CarouselRoot = styled.section`
  position: relative;
  width: 100%;
  outline: none;

  &:hover .kmaru-carousel-nav,
  &:focus-within .kmaru-carousel-nav {
    opacity: 1;
  }
`;

const SlideViewport = styled.div`
  position: relative;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;

  @media (max-width: 640px) {
    border-radius: 16px;
  }
`;

const NavButton = styled.button<{ $side: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $side }) => ($side === 'left' ? 'left: 14px;' : 'right: 14px;')}
  transform: translateY(-50%);
  z-index: 4;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(15, 18, 24, 0.56);
  backdrop-filter: blur(10px);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.16s ease, transform 0.16s ease;

  &:hover {
    background: rgba(15, 18, 24, 0.8);
    transform: translateY(-50%) scale(1.06);
  }

  &:active {
    transform: translateY(-50%) scale(0.96);
  }

  @media (max-width: 640px) {
    opacity: 0.9;
    width: 32px;
    height: 32px;
    ${({ $side }) => ($side === 'left' ? 'left: 10px;' : 'right: 10px;')}
  }
`;

const ControlsBar = styled.div`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 14px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;

  @media (max-width: 640px) {
    left: 16px;
    right: 16px;
    bottom: 12px;
  }
`;

const DotsRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  pointer-events: auto;
`;

const DotButton = styled.button<{ $active: boolean }>`
  height: 6px;
  width: ${({ $active }) => ($active ? '22px' : '6px')};
  padding: 0;
  border: none;
  border-radius: 999px;
  background: ${({ $active }) =>
    $active ? '#ffffff' : 'rgba(255, 255, 255, 0.42)'};
  cursor: pointer;
  transition: width 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
  }
`;

const CounterPill = styled.span`
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
`;

export interface FeaturedCarouselProps {
  places: DiscoveryPlaceSummary[];
  onPlaceClick: (place: DiscoveryPlaceSummary) => void;
}

export default function FeaturedCarousel({ places, onPlaceClick }: FeaturedCarouselProps) {
  const t = useTranslations('kCulture');
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const count = places.length;
  const safeIndex = count > 0 ? activeIndex % count : 0;

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || isPaused || shouldReduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count, isPaused, shouldReduceMotion]);

  if (count === 0) return null;

  if (count === 1) {
    return (
      <FeaturedPlaceCard
        place={places[0]}
        onClick={onPlaceClick}
        badgeText={t('carousel.editorialLabel')}
      />
    );
  }

  const currentPlace = places[safeIndex];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <CarouselRoot
      role="region"
      aria-roledescription="carousel"
      aria-label={t('carousel.carouselLabel')}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <SlideViewport>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPlace.placeId}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.4, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.4 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <FeaturedPlaceCard
              place={currentPlace}
              onClick={onPlaceClick}
              badgeText={t('carousel.editorialLabel')}
              hasCarouselControls
            />
          </motion.div>
        </AnimatePresence>
      </SlideViewport>

      <NavButton
        type="button"
        className="kmaru-carousel-nav"
        $side="left"
        onClick={goPrev}
        aria-label={t('carousel.prevSlide')}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.2} aria-hidden="true" />
      </NavButton>

      <NavButton
        type="button"
        className="kmaru-carousel-nav"
        $side="right"
        onClick={goNext}
        aria-label={t('carousel.nextSlide')}
      >
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.2} aria-hidden="true" />
      </NavButton>

      <ControlsBar>
        <DotsRow role="tablist" aria-label={t('carousel.carouselLabel')}>
          {places.map((item, idx) => (
            <DotButton
              key={item.placeId}
              type="button"
              role="tab"
              $active={idx === safeIndex}
              aria-selected={idx === safeIndex}
              aria-label={t('carousel.slideIndicator', { index: idx + 1 })}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </DotsRow>

        <CounterPill aria-live="polite">
          {safeIndex + 1} / {count}
        </CounterPill>
      </ControlsBar>
    </CarouselRoot>
  );
}
