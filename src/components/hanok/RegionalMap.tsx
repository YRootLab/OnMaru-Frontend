'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HanokScrollytelling.module.css';

type RegionId = 'north' | 'central' | 'south';

interface RegionData {
  id: RegionId;
  label: string;
  shapeName: string;
  description: string;
  story: string;
  specValue: string;
  specLabel: string;
}

const REGIONS: RegionData[] = [
  {
    id: 'north',
    label: '북부 지방',
    shapeName: '폐쇄형 (ㅁ자형)',
    description: '방들이 마당(중정)을 완전히 감싸 안아 차가운 북풍을 막는 구조입니다.',
    story: '겨울이 길고 추위가 매서운 북쪽에서는 열 손실을 최소화하기 위해 네 면의 집채를 닫힌 구조로 조립했습니다.',
    specValue: '-15°C 대응',
    specLabel: '매서운 북풍 단열 구조',
  },
  {
    id: 'central',
    label: '중부 지방',
    shapeName: '절충형 (ㄱ자형)',
    description: '안채와 사랑채가 직각으로 꺾여 바람을 적절히 피하고 볕을 모으는 구조입니다.',
    story: '온화하면서도 겨울 추위가 공존하는 경기, 충청 지역에서는 꺾임형 구조를 통해 바람막이와 통풍의 조화를 이뤘습니다.',
    specValue: '절충형',
    specLabel: '바람막이와 채광의 균형',
  },
  {
    id: 'south',
    label: '남부 지방',
    shapeName: '개방형 (일자형)',
    description: '바람이 막힘없이 건물을 관통하여 한여름의 습기와 무더위를 이겨내는 구조입니다.',
    story: '바람이 들이치는 더운 남쪽에서는 사방을 튼 일자형(一) 배치를 택하여 마루를 중심으로 통풍을 극대화했습니다.',
    specValue: '100% 통풍',
    specLabel: '사방 관통 개방형 대청',
  },
];

export default function RegionalMap() {
  const [activeRegion, setActiveRegion] = useState<RegionId>('central');

  const region = REGIONS.find((r) => r.id === activeRegion)!;

  // Render SVG for house shapes based on selection
  const renderHouseShape = () => {
    switch (activeRegion) {
      case 'north': // ㅁ자형 (Courtyard Square)
        return (
          <svg viewBox="0 0 200 200" className={styles.mapHouseSvg}>
            {/* Outline Box */}
            <motion.rect
              x="30"
              y="30"
              width="140"
              height="140"
              rx="12"
              className={styles.mapWireframe}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            {/* Inner Courtyard Box */}
            <motion.rect
              x="75"
              y="75"
              width="50"
              height="50"
              rx="4"
              className={styles.mapWireframeAccent}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            {/* Rooms blocks inside ㅁ-shape */}
            <rect x="40" y="40" width="120" height="25" fill="rgba(212, 175, 55, 0.05)" rx="4" />
            <rect x="40" y="65" width="25" height="70" fill="rgba(212, 175, 55, 0.05)" rx="4" />
            <rect x="135" y="65" width="25" height="70" fill="rgba(212, 175, 55, 0.05)" rx="4" />
            <rect x="40" y="135" width="120" height="25" fill="rgba(212, 175, 55, 0.05)" rx="4" />

            {/* Cold wind bouncing off */}
            <motion.path
              d="M10,80 Q50,70 65,55"
              stroke="#00d2ff"
              strokeWidth="2"
              fill="none"
              strokeDasharray="10 5"
              animate={{ strokeDashoffset: [0, -45] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
            <motion.path
              d="M10,120 Q50,130 65,145"
              stroke="#00d2ff"
              strokeWidth="2"
              fill="none"
              strokeDasharray="10 5"
              animate={{ strokeDashoffset: [0, -45] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
          </svg>
        );
      case 'north':
      case 'central': // ㄱ자형 (L-shape)
        return (
          <svg viewBox="0 0 200 200" className={styles.mapHouseSvg}>
            {/* L-Shape Outline */}
            <motion.path
              d="M30,30 L170,30 L170,80 L80,80 L80,170 L30,170 Z"
              className={styles.mapWireframe}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <motion.path
              d="M50,50 L150,50 L150,60 L60,60 L60,150 L50,150 Z"
              className={styles.mapWireframeAccent}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            {/* Rooms inside L-shape */}
            <rect x="40" y="40" width="120" height="30" fill="rgba(212, 175, 55, 0.05)" rx="4" />
            <rect x="40" y="70" width="30" height="90" fill="rgba(212, 175, 55, 0.05)" rx="4" />

            {/* Moderated Wind flowing */}
            <motion.path
              d="M10,120 Q90,110 100,50"
              stroke="#00d2ff"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="10 5"
              animate={{ strokeDashoffset: [0, -45] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
          </svg>
        );
      case 'south': // 일자형 (Straight Line)
        return (
          <svg viewBox="0 0 200 200" className={styles.mapHouseSvg}>
            {/* Straight Line Outline */}
            <motion.rect
              x="30"
              y="85"
              width="140"
              height="30"
              rx="4"
              className={styles.mapWireframe}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <motion.line
              x1="45"
              y1="100"
              x2="155"
              y2="100"
              className={styles.mapWireframeAccent}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
            <rect x="35" y="90" width="130" height="20" fill="rgba(212, 175, 55, 0.05)" rx="2" />

            {/* Free Wind flowing through */}
            <motion.path
              d="M10,70 L190,70"
              stroke="#00d2ff"
              strokeWidth="2"
              fill="none"
              strokeDasharray="12 6"
              animate={{ strokeDashoffset: [0, -54] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
            <motion.path
              d="M10,100 L190,100"
              stroke="#00d2ff"
              strokeWidth="2"
              fill="none"
              strokeDasharray="12 6"
              animate={{ strokeDashoffset: [0, -54] }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <motion.path
              d="M10,130 L190,130"
              stroke="#00d2ff"
              strokeWidth="2"
              fill="none"
              strokeDasharray="12 6"
              animate={{ strokeDashoffset: [0, -54] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          </svg>
        );
    }
  };

  return (
    <div className={styles.mapGrid}>
      {/* Left Menu Tab */}
      <div className={styles.mapTabs}>
        {REGIONS.map((r) => (
          <button
            key={r.id}
            className={`${styles.mapTabButton} ${activeRegion === r.id ? styles.active : ''}`}
            onClick={() => setActiveRegion(r.id)}
          >
            <span className={styles.mapTabBullet} />
            <div className={styles.mapTabTextWrap}>
              <span className={styles.mapTabLabel}>{r.label}</span>
              <span className={styles.mapTabShape}>{r.shapeName}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Right Map Canvas Stage */}
      <div className={styles.mapStage}>
        {/* Simplified Map Background */}
        <div className={styles.koreaMapContainer}>
          <svg viewBox="0 0 200 300" className={styles.koreaMapOutline}>
            {/* Outline of Korea */}
            <path
              d="M70,30 L100,20 L120,40 L130,70 L110,100 L120,130 L110,160 L130,190 L110,240 L90,270 L65,270 L55,230 L70,210 L50,180 L70,160 L50,120 L70,100 L60,80 L70,30 Z"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1.5"
            />
            {/* Regional division dash lines */}
            <line x1="60" y1="110" x2="120" y2="100" stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
            <line x1="60" y1="180" x2="120" y2="185" stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />

            {/* Glowing Region Pin */}
            {activeRegion === 'north' && (
              <motion.circle cx="95" cy="60" r="6" fill="var(--hanok-accent)" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
            )}
            {activeRegion === 'central' && (
              <motion.circle cx="90" cy="140" r="6" fill="var(--hanok-accent)" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
            )}
            {activeRegion === 'south' && (
              <motion.circle cx="85" cy="220" r="6" fill="var(--hanok-accent)" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
            )}
          </svg>
        </div>

        {/* Dynamic Vector House Shape Display */}
        <div className={styles.houseShapeWrapper}>
          {renderHouseShape()}
        </div>
      </div>

      {/* Description Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRegion}
          className={styles.mapInfoCard}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className={styles.mapInfoTitle}>{region.shapeName}</h3>
          <p className={styles.mapInfoDesc}>{region.description}</p>
          <p className={styles.mapInfoStory}>{region.story}</p>
          <div className={styles.mapInfoSpecs}>
            <div>
              <div className={styles.mapInfoSpecVal}>{region.specValue}</div>
              <div className={styles.mapInfoSpecLbl}>{region.specLabel}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
