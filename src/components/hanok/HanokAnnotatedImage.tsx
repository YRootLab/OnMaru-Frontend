'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './HanokScrollytelling.module.css';

interface HotspotData {
  id: string;
  number: number;
  nameKo: string;
  nameEn: string;
  /** Position as % of image container */
  x: number;
  y: number;
  labelDir: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  shortTag: string;
  desc: string;
  detail: string;
  color: string;
}

/**
 * Coordinates calibrated to the 3D isometric cutaway illustration.
 * The 16:10 container shows the hanok centered, roughly occupying 85% of the width.
 *
 * Visual layout (3D isometric):
 *   - Roof apex (기와): upper-center
 *   - Exposed rafters/beams: upper-left inside section
 *   - Sliding doors (창호): left interior face
 *   - Ondol glowing floor: lower-left interior section
 *   - Wooden deck (마루): right-side porch area
 */
const HOTSPOTS: HotspotData[] = [
  {
    id: 'giwa',
    number: 1,
    nameKo: '기와 · 처마',
    nameEn: 'Giwa & Cheoma',
    x: 50,
    y: 14,
    labelDir: 'top-right',
    shortTag: '기와',
    color: '#4a6fa5',
    desc: '음양 원리로 배열된 암수기와, 수학적으로 완벽한 처마 곡선.',
    detail: '28.5°의 처마 각도는 여름 직사광선을 막고 겨울 햇빛은 깊숙이 들이는 패시브 에너지 설계입니다. 암키와와 수키와가 교대로 맞물려 빗물을 완벽하게 흘려보냅니다.',
  },
  {
    id: 'daedeulbo',
    number: 2,
    nameKo: '대들보 · 서까래',
    nameEn: 'Main Beam & Rafters',
    x: 46,
    y: 36,
    labelDir: 'top-left',
    shortTag: '대들보',
    color: '#8b6f47',
    desc: '못 없이 홈으로만 결합하는 사개맞춤 목조 구조. 지진의 횡력을 탄력적으로 분산.',
    detail: '대들보는 앞기둥과 뒷기둥을 연결하며 지붕 전체 하중을 받아냅니다. 결구 방식은 지반 침하에도 건물이 유연하게 움직이며 스스로 안정을 찾도록 합니다.',
  },
  {
    id: 'changho',
    number: 3,
    nameKo: '창호',
    nameEn: 'Paper Door (Changho)',
    x: 28,
    y: 52,
    labelDir: 'bottom-left',
    shortTag: '창호',
    color: '#5a8a5a',
    desc: '한지가 빛을 산란시켜 실내에 숲속 같은 은은한 채광을 만듭니다.',
    detail: '창호지의 미세 구멍은 습기를 자연 조절하고 소리를 흡수합니다. 기하학적 살대 패턴은 단순한 장식이 아닌 구조 보강재입니다. 여름엔 통풍구, 겨울엔 단열재로 기능합니다.',
  },
  {
    id: 'ondol',
    number: 4,
    nameKo: '온돌',
    nameEn: 'Radiant Floor (Ondol)',
    x: 36,
    y: 67,
    labelDir: 'bottom-left',
    shortTag: '온돌',
    color: '#c0522a',
    desc: '아궁이 열기로 구들장을 달궈 복사열로 방 전체를 온기로 채웁니다.',
    detail: '구들장은 한 번 달궈지면 8~12시간 온기를 유지합니다. 원적외선 복사열은 현대 과학이 입증한 가장 건강한 난방 방식입니다. 연기는 굴뚝으로, 열기는 바닥으로.',
  },
  {
    id: 'maru',
    number: 5,
    nameKo: '대청마루',
    nameEn: 'Open Hall (Daecheong)',
    x: 72,
    y: 55,
    labelDir: 'bottom-right',
    shortTag: '마루',
    color: '#d4af37',
    desc: '안과 밖의 경계가 지워지는 환대의 중심 공간.',
    detail: '앞문과 뒷문을 모두 열면 통풍 통로가 열리며 여름 더위를 이깁니다. 한옥의 사회적 중심이자 자연과 사람을 잇는 인터페이스입니다. 마루에 걸터앉아 마당을 바라보는 그 시선이 온마루의 시작점입니다.',
  },
];

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
