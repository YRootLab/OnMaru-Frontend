'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './HanokScrollytelling.module.css';

import { HOTSPOTS } from './hanok.data';

export default function HanokAnnotatedImage() {
  const [activeId, setActiveId] = useState<string | null>('giwa');

  const activePart = HOTSPOTS.find(h => h.id === activeId) ?? HOTSPOTS[0];

  return (
    <div className={styles.annotatedSection}>
      {/* Section Header */}
      <div className={styles.annotatedHeader}>
        <span className={styles.sectionHeaderTag}>Chapter 1 · 공간의 해부학</span>
        <h2 className={styles.annotatedTitle}>자연을 빌려 짓다</h2>
        <p className={styles.annotatedSubtitle}>
          한옥의 모든 선과 각도에는 이유가 있습니다. 다섯 가지 핵심 부재를 통해 수백 년의 지혜를 읽어봅니다.
        </p>
      </div>

      {/* Main Layout: Image + Side Detail */}
      <div className={styles.annotatedLayout}>

        {/* LEFT: Annotated 3D Image */}
        <div className={styles.annotatedImageWrap}>
          <div className={styles.annotatedImageInner}>
            <Image
              src="/images/hanok/hanok-3d-cutaway.png"
              alt="한옥 3D 단면 일러스트"
              fill
              style={{ objectFit: 'contain' }}
              sizes="(max-width: 900px) 100vw, 700px"
              priority
            />

            {/* Hotspot dots — numbered badges on the image */}
            {HOTSPOTS.map((spot) => {
              const isActive = activeId === spot.id;

              return (
                <motion.button
                  key={spot.id}
                  className={styles.hotspotDot}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    background: isActive ? spot.color : '#d4af37',
                    borderColor: isActive ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.85)',
                    boxShadow: isActive
                      ? `0 0 0 3px ${spot.color}40, 0 4px 16px ${spot.color}70`
                      : '0 4px 16px rgba(212,175,55,0.5)',
                  }}
                  animate={{ scale: isActive ? 1.2 : 1 }}
                  transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                  onClick={() => setActiveId(spot.id)}
                  aria-label={`${spot.nameKo} 상세 보기`}
                >
                  <span className={styles.hotspotNumber}>{spot.number}</span>
                  {!isActive && (
                    <>
                      <span className={styles.hotspotRing} />
                      <span className={styles.hotspotRing} style={{ animationDelay: '0.7s' }} />
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Number tab legend below image */}
          <div className={styles.hotspotLegend}>
            {HOTSPOTS.map(spot => (
              <button
                key={spot.id}
                className={`${styles.legendItem} ${activeId === spot.id ? styles.legendActive : ''}`}
                style={activeId === spot.id ? { borderColor: spot.color, background: `${spot.color}18` } : {}}
                onClick={() => setActiveId(spot.id)}
              >
                <span
                  className={styles.legendNum}
                  style={activeId === spot.id ? { background: spot.color } : {}}
                >
                  {spot.number}
                </span>
                <span className={styles.legendName}>{spot.nameKo}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Detail Panel (never clips, always visible) */}
        <div className={styles.detailPanelWrap}>
          <AnimatePresence mode="wait">
            {activePart && (
              <motion.div
                key={activePart.id}
                className={styles.detailPanel}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              >
                {/* Color accent top bar */}
                <div
                  className={styles.detailPanelBar}
                  style={{ background: activePart.color }}
                />

                {/* Number + Name */}
                <div className={styles.detailNum}
                  style={{ color: activePart.color }}
                >
                  0{activePart.number}
                </div>
                <h3 className={styles.detailName}>{activePart.nameKo}</h3>
                <p className={styles.detailNameEn}>{activePart.nameEn}</p>

                <div className={styles.detailDivider} style={{ background: activePart.color }} />

                <p className={styles.detailDesc}>{activePart.desc}</p>
                <p className={styles.detailDetail}>{activePart.detail}</p>

                {/* Navigation arrows */}
                <div className={styles.detailNav}>
                  <button
                    className={styles.detailNavBtn}
                    disabled={activePart.number === 1}
                    onClick={() => {
                      const idx = HOTSPOTS.findIndex(h => h.id === activePart.id);
                      if (idx > 0) setActiveId(HOTSPOTS[idx - 1].id);
                    }}
                  >
                    ← 이전
                  </button>
                  <span className={styles.detailNavCount}>
                    {activePart.number} / {HOTSPOTS.length}
                  </span>
                  <button
                    className={styles.detailNavBtn}
                    disabled={activePart.number === HOTSPOTS.length}
                    onClick={() => {
                      const idx = HOTSPOTS.findIndex(h => h.id === activePart.id);
                      if (idx < HOTSPOTS.length - 1) setActiveId(HOTSPOTS[idx + 1].id);
                    }}
                  >
                    다음 →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
