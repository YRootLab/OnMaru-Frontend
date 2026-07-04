'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './HanokExplorer.module.css';
import type { HanokPart } from './hanok.data';

interface HanokHotspotProps {
  part: HanokPart;
  isSelected: boolean;
  isDimmed: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClick: () => void;
}

export default function HanokHotspot({
  part,
  isSelected,
  isDimmed,
  onClick,
}: HanokHotspotProps) {
  const [isHovered, setIsHovered] = useState(false);

  const dotX = part.position.x;
  const dotY = part.position.y;
  
  // The label is positioned based on the offset
  const labelX = dotX + (part.calloutOffset.x / 9);
  const labelY = dotY + (part.calloutOffset.y / 5.6);

  const showCallout = isSelected || (isHovered && !isDimmed);

  return (
    <>
      {/* SVG Callout Line (Only shown when selected or hovered) */}
      <AnimatePresence>
        {showCallout && (
          <svg className={styles.calloutSvg} preserveAspectRatio="none">
            <motion.line
              x1={`${dotX}%`}
              y1={`${dotY}%`}
              x2={`${labelX}%`}
              y2={`${labelY}%`}
              className={`${styles.calloutLine} ${isSelected ? styles.active : ''}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            />
            <motion.circle
              cx={`${labelX}%`}
              cy={`${labelY}%`}
              r="2"
              fill={isSelected ? 'var(--hanok-accent)' : 'rgba(196, 149, 106, 0.6)'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </svg>
        )}
      </AnimatePresence>

      {/* Callout Label (Only shown when selected or hovered) */}
      <AnimatePresence>
        {showCallout && (
          <motion.div
            className={`${styles.calloutLabel} ${isSelected ? styles.active : isDimmed ? styles.dimmed : ''}`}
            style={{
              left: `${labelX}%`,
              top: `${labelY}%`,
            }}
            initial={{ opacity: 0, scale: 0.95, y: part.calloutOffset.y > 0 ? 5 : -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: part.calloutOffset.y > 0 ? 3 : -3 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className={styles.calloutLabelInner}>
              <div className={styles.calloutLabelName}>{part.nameKo}</div>
              <div className={styles.calloutLabelDesc}>{part.shortDesc}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotspot Dot (Always visible, style adapts to selection/dimming) */}
      <motion.div
        className={`${styles.hotspot} ${isSelected ? styles.active : isDimmed ? styles.dimmed : ''}`}
        style={{
          left: `${dotX}%`,
          top: `${dotY}%`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className={styles.hotspotDot} />
      </motion.div>
    </>
  );
}
