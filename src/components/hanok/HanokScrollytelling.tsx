'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import styles from './HanokScrollytelling.module.css';
import RegionalMap from './RegionalMap';
import TimeLapseView from './TimeLapseView';
import HanokAnnotatedImage from './HanokAnnotatedImage';
import HanokHorizontalScroll from './HanokHorizontalScroll';
import HanokDataSection from './HanokDataSection';
import HanokOutroSection from './HanokOutroSection';

export default function HanokScrollytelling() {
  const containerRef = useRef<HTMLDivElement>(null);


  return (
    <div className={styles.scrollyContainer} ref={containerRef}>
      
      {/* GNB Logo Header */}
      <header className={styles.gnb}>
        <div className={styles.logo}>ON-MARU <span>A to Z</span></div>
        <div className={styles.gnbRight}>Hospitality Tech Labs</div>
      </header>

      {/* SECTION 0: HERO INTRO */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <motion.span
            className={styles.heroTag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Brand Identity · 온마루
          </motion.span>
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            가장 한국적인 공간에서 느끼는<br />
            가장 따뜻한 환대
          </motion.h1>
          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            한옥은 자연을 빌려 짓고, 바람의 길을 열어두는 온전한 우주입니다.
          </motion.p>
        </div>
        
        {/* Apple Bouncing Scroll Indicator */}
        <div className={styles.heroScrollPrompt}>
          <span>SCROLL DOWN TO EXPLORE</span>
          <div className={styles.scrollDot} />
        </div>
      </section>

      {/* SECTION 1: CHAPTER 1 - 공간의 해부학 (Annotated Image + Horizontal Scroll) */}
      <section className={styles.chapterAnnotatedSection}>
        <HanokAnnotatedImage />
        <HanokHorizontalScroll />
      </section>

      {/* SECTION 2: CHAPTER 2 - 바람과 땅이 빚어낸 형태 */}
      <section className={styles.chapterMapSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionHeaderTag}>Chapter 2. 바람과 땅이 빚어낸 형태</span>
          <h2 className={styles.sectionHeaderTitle}>기후와 형태의 큐레이션</h2>
          <p className={styles.sectionHeaderSubtitle}>
            바람이 거센 북쪽은 가옥들이 서로를 꼭 껴안아 가두었고, 따사로운 남쪽은 대청을 열어 세상을 향해 양팔을 뻗었습니다.
          </p>
        </div>
        
        {/* Dynamic Regional Map Component */}
        <RegionalMap />
      </section>

      {/* SECTION 3: CHAPTER 3 - 마루와 정의 철학 (Time Lapse) */}
      <section className={styles.chapterTimeSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionHeaderTag}>Chapter 3. &apos;마루&apos;와 &apos;정(情)&apos;의 철학</span>
          <h2 className={styles.sectionHeaderTitle}>자연을 들이는 마당의 액자</h2>
          <p className={styles.sectionHeaderSubtitle}>
            방 안과 바깥뜰의 한계를 완전히 지우는 경계 없는 환대의 열린 소통구. 대청마루에 가만히 앉아 하루의 시간과 사계의 순환을 지켜봅니다.
          </p>
        </div>
        
        {/* Porch Time Lapse Renderer */}
        <TimeLapseView />
      </section>

      {/* SECTION 4: CHAPTER 4 - 데이터로 읽는 한옥의 숨결 (Technical Data Snaps) */}
      <HanokDataSection />

      {/* SECTION 5: OUTRO & MAP CALL TO ACTION */}
      <HanokOutroSection />

      {/* Interactive Helper Overlay (bottom left) */}
      <div className={styles.interactionHelper}>
        Tip: Scroll to story, hover Timelapse to change hours, move mouse over outro map.
      </div>
    </div>
  );
}
