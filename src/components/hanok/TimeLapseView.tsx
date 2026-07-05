'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from './HanokScrollytelling.module.css';

interface TimePeriod {
  name: string;
  label: string;
  skyGradient: string;
  overlayGradient: string;
  filter: string;
  description: string;
}

const TIME_PERIODS: TimePeriod[] = [
  {
    name: 'morning',
    label: '아침 (Morning)',
    skyGradient: 'linear-gradient(180deg, #ffcc99 0%, #ffeedd 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(255, 180, 100, 0.25) 0%, rgba(255, 230, 180, 0.1) 100%)',
    filter: 'brightness(1.05) sepia(0.15) saturate(1.1) hue-rotate(5deg)',
    description: '싱그러운 동틀 녘의 햇빛이 대청마루 가득히 스며듭니다.',
  },
  {
    name: 'noon',
    label: '낮 (Noon)',
    skyGradient: 'linear-gradient(180deg, #7ec0ee 0%, #f0f8ff 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 100%)',
    filter: 'brightness(1.1) saturate(1.2) contrast(1.05)',
    description: '눈부신 햇살이 한옥의 처마각도에 가로막혀 마루 안쪽은 시원한 그늘을 빚어냅니다.',
  },
  {
    name: 'sunset',
    label: '저녁 (Sunset)',
    skyGradient: 'linear-gradient(180deg, #ff5e36 0%, #9b30ff 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(255, 90, 0, 0.35) 0%, rgba(128, 0, 128, 0.2) 100%)',
    filter: 'brightness(0.85) sepia(0.3) saturate(1.4) hue-rotate(-15deg)',
    description: '타오르는 석양이 목재 기둥에 내려앉아 한옥 전체가 붉은 온기로 물듭니다.',
  },
  {
    name: 'night',
    label: '밤 (Night)',
    skyGradient: 'linear-gradient(180deg, #050515 0%, #0c1020 100%)',
    overlayGradient: 'linear-gradient(180deg, rgba(5, 5, 30, 0.6) 0%, rgba(0, 0, 10, 0.75) 100%)',
    filter: 'brightness(0.4) saturate(0.7) hue-rotate(-30deg)',
    description: '어스름한 정적 속에서 마당의 귀뚜라미 소리와 은은한 달빛이 평화로움을 더합니다.',
  },
];

export default function TimeLapseView() {
  const [sliderVal, setSliderVal] = useState<number>(0.5); // 0 to 1

  // Determine current period and next period to interpolate between them
  const currentPeriodIndex = useMemo(() => {
    const rawIndex = sliderVal * (TIME_PERIODS.length - 1);
    return Math.floor(rawIndex);
  }, [sliderVal]);

  const progressBetween = useMemo(() => {
    const rawVal = sliderVal * (TIME_PERIODS.length - 1);
    return rawVal - currentPeriodIndex;
  }, [sliderVal, currentPeriodIndex]);

  const activePeriod = TIME_PERIODS[currentPeriodIndex];
  const nextPeriod = TIME_PERIODS[Math.min(currentPeriodIndex + 1, TIME_PERIODS.length - 1)];

  // Set up interpolated style variables
  const containerStyle = {
    '--sky-gradient': activePeriod.skyGradient,
    '--overlay-gradient': activePeriod.overlayGradient,
    '--image-filter': activePeriod.filter,
  } as React.CSSProperties;

  // Generate glowing firefly stars for night period
  const fireflies = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${15 + Math.random() * 70}%`,
      top: `${10 + Math.random() * 55}%`,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }));
  }, []);

  return (
    <div className={styles.timeLapseContainer} style={containerStyle}>
      {/* Sky Canvas (behind porch image frame) */}
      <div className={styles.timeLapseSky} />

      {/* Starry stars for night mode */}
      {sliderVal > 0.65 && (
        <div className={styles.starryNight}>
          {fireflies.map((f) => (
            <motion.div
              key={f.id}
              className={styles.firefly}
              style={{ left: f.left, top: f.top }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.6, 1.2, 0.6],
              }}
              transition={{
                duration: f.duration,
                repeat: Infinity,
                delay: f.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* Main Porch Image */}
      <div className={styles.porchImageWrap}>
        <Image
          src="/images/hanok/hanok-porch.png"
          alt="한옥 마루 1인칭 전경"
          fill
          className={styles.porchImage}
          sizes="(max-width: 1200px) 95vw, 850px"
          priority
        />
        {/* Color overlay to tint wood columns dynamically */}
        <div className={styles.porchOverlay} />
      </div>

      {/* Interactive Controls Card */}
      <div className={styles.timeControlCard}>
        <div className={styles.timeDescription}>
          <h4 className={styles.timeLabel}>{activePeriod.label}</h4>
          <p className={styles.timeDescText}>{activePeriod.description}</p>
        </div>

        <div className={styles.timeSliderWrap}>
          <span className={styles.timeSliderLimit}>아침</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sliderVal}
            onChange={(e) => setSliderVal(parseFloat(e.target.value))}
            className={styles.timeSlider}
            aria-label="한옥 시간 타임랩스 조절"
          />
          <span className={styles.timeSliderLimit}>밤</span>
        </div>
      </div>
    </div>
  );
}
