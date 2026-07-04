'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './HanokExplorer.module.css';
import HanokHotspot from './HanokHotspot';
import type { HanokPart } from './hanok.data';

interface HanokCanvasProps {
  parts: HanokPart[];
  imageSrc: string;
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
  onDeselect: () => void;
}

export default function HanokCanvas({
  parts,
  imageSrc,
  selectedPartId,
  onSelectPart,
  onDeselect,
}: HanokCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPart = parts.find((p) => p.id === selectedPartId) ?? null;

  // Calculate zoom transform
  const getZoomTransform = () => {
    if (!selectedPart) {
      return { scale: 1, x: 0, y: 0 };
    }
    const { x, y, scale } = selectedPart.zoomTarget;
    // Convert percentage center to translate offset
    // We want the zoomTarget point to be at the center of the container
    const translateX = (50 - x) * (scale - 1) * 0.6;
    const translateY = (50 - y) * (scale - 1) * 0.6;
    return { scale, x: translateX, y: translateY };
  };

  const zoom = getZoomTransform();

  return (
    <div
      className={styles.canvasArea}
      onClick={onDeselect}
    >
      <motion.div
        className={styles.canvasInner}
        animate={{
          scale: zoom.scale,
          x: `${zoom.x}%`,
          y: `${zoom.y}%`,
        }}
        transition={{
          duration: 0.8,
          ease: [0.25, 1, 0.5, 1],
        }}
      >
        {/* Main Hanok Image */}
        <motion.div
          key={imageSrc} // Trigger fade animation when tab changes
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        >
          <Image
            src={imageSrc}
            alt="한옥 전경 - Hanok A to Z"
            fill
            className={`${styles.hanokImage} ${selectedPartId ? styles.dimmed : ''}`}
            style={{
              objectFit: 'contain',
              mixBlendMode: 'multiply', // blend white background away
            }}
            sizes="(max-width: 768px) 95vw, (max-width: 1280px) 80vw, 900px"
            priority
          />
        </motion.div>

        {/* Highlight overlay — brighter version of selected area */}
        <AnimatePresence>
          {selectedPart && (
            <motion.div
              key={`highlight-${selectedPart.id}`}
              className={styles.highlightOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                clipPath: getClipPath(selectedPart),
              }}
            >
              <Image
                src={imageSrc}
                alt=""
                fill
                style={{
                  objectFit: 'contain',
                  mixBlendMode: 'multiply',
                  filter: 'brightness(1.5) drop-shadow(0 0 15px rgba(196, 149, 106, 0.4))',
                }}
                sizes="900px"
                aria-hidden
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Special Effects */}
        <AnimatePresence>
          {selectedPart?.specialEffect === 'ondol' && (
            <motion.div
              key="ondol-effect"
              className={styles.ondolWaveContainer}
              style={{
                left: `${selectedPart.position.x}%`,
                top: `${selectedPart.position.y + 2}%`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className={styles.ondolWave} />
              <div className={styles.ondolWave} />
              <div className={styles.ondolWave} />
            </motion.div>
          )}

          {selectedPart?.specialEffect === 'light' && (
            <motion.div
              key="light-effect"
              className={styles.lightRayContainer}
              style={{
                left: `${selectedPart.position.x - 5}%`,
                top: `${selectedPart.position.y - 15}%`,
                width: '150px',
                height: '250px',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.lightRay} />
              <div className={styles.lightRay} />
            </motion.div>
          )}

          {selectedPart?.specialEffect === 'wind' && (
            <motion.div
              key="wind-effect"
              className={styles.windContainer}
              style={{
                left: `${selectedPart.position.x - 3}%`,
                top: `${selectedPart.position.y - 2}%`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.windParticle} />
              <div className={styles.windParticle} />
              <div className={styles.windParticle} />
              <div className={styles.windParticle} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hotspot Dots + Callout Lines */}
        <div className={styles.hotspotsContainer}>
          {parts.map((part, index) => (
            <motion.div
              key={part.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + index * 0.08 }}
            >
              <HanokHotspot
                part={part}
                isSelected={selectedPartId === part.id}
                isDimmed={!!selectedPartId && selectedPartId !== part.id}
                containerRef={containerRef}
                onClick={() => onSelectPart(part.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Navigation hint */}
      {!selectedPartId && (
        <div className={styles.navHint}>
          <span className={styles.navHintDot} />
          부위를 클릭하여 한옥의 디테일을 탐색하세요
        </div>
      )}
    </div>
  );
}

/**
 * Generate a CSS clip-path for the highlight overlay based on the part position.
 */
function getClipPath(part: HanokPart): string {
  const { x, y } = part.position;

  // Custom highlights per part
  const sizes: Record<string, { rx: number; ry: number }> = {
    giwa: { rx: 30, ry: 15 },
    gidung: { rx: 10, ry: 25 },
    juchutdol: { rx: 15, ry: 10 },
    maru: { rx: 20, ry: 12 },
    changho: { rx: 12, ry: 18 },
    
    yongmaru: { rx: 25, ry: 10 },
    bugo_chakgo: { rx: 25, ry: 10 },
    daegong: { rx: 12, ry: 15 },
    daedeulbo: { rx: 22, ry: 12 },
    seokkarae: { rx: 20, ry: 15 },
    jongdori: { rx: 20, ry: 12 },

    agungi_ondol: { rx: 18, ry: 15 },
    maruneol: { rx: 20, ry: 12 },
    meoreum: { rx: 15, ry: 12 },
    deulchang: { rx: 15, ry: 15 },
    munseolju: { rx: 10, ry: 18 },
  };

  const size = sizes[part.id] || { rx: 15, ry: 15 };

  return `ellipse(${size.rx}% ${size.ry}% at ${x}% ${y}%)`;
}
