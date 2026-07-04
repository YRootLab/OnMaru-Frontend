'use client';

import React, { useState, useMemo, useCallback } from 'react';
import styles from './HanokExplorer.module.css';
import HanokCanvas from './HanokCanvas';
import HanokDetailPanel from './HanokDetailPanel';
import { HANOK_PARTS } from './hanok.data';
import { motion, animate } from 'framer-motion';

export default function HanokExplorer() {
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [explodeProgress, setExplodeProgress] = useState<number>(0);

  // Find the selected part
  const selectedPart = useMemo(() => {
    return HANOK_PARTS.find((p) => p.id === selectedPartId) ?? null;
  }, [selectedPartId]);

  // Calculate which side the floating panel should appear (opposite to the hotspot)
  const panelSide = useMemo(() => {
    if (!selectedPart) return 'right';
    return selectedPart.position.x <= 50 ? 'right' : 'left';
  }, [selectedPart]);

  const handleSelectPart = useCallback((partId: string) => {
    setSelectedPartId(partId);
    
    // Smoothly animate the explode progress to 1 (Fully Exploded) when a part is clicked
    animate(explodeProgress, 1, {
      duration: 0.6,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (latest) => setExplodeProgress(latest),
    });
  }, [explodeProgress]);

  const handleDeselect = useCallback(() => {
    setSelectedPartId(null);
    
    // Smoothly animate the explode progress back to 0 (Assembled)
    animate(explodeProgress, 0, {
      duration: 0.6,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (latest) => setExplodeProgress(latest),
    });
  }, [explodeProgress]);

  return (
    <div className={styles.page}>
      <div className={styles.explorer}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerTag}>온마루 · 공간의 해부학</span>
            <h1 className={styles.headerTitle}>Hanok Exploded View</h1>
            <p className={styles.headerSubtitle}>
              한옥의 5대 핵심 요소를 분해하여 선조들의 입체적인 지혜를 느껴보세요.
            </p>
          </div>
        </header>

        {/* Canvas Area with layers */}
        <HanokCanvas
          parts={HANOK_PARTS}
          selectedPartId={selectedPartId}
          explodeProgress={explodeProgress}
          onSelectPart={handleSelectPart}
          onDeselect={handleDeselect}
        />

        {/* Floating Detail Panel */}
        <HanokDetailPanel
          part={selectedPart}
          side={panelSide}
          onClose={handleDeselect}
        />

        {/* Apple-style Exploded Slider */}
        <div className={styles.sliderContainer}>
          <span className={styles.sliderLabel}>조립</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explodeProgress}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setExplodeProgress(val);
              if (val < 0.2 && selectedPartId) {
                setSelectedPartId(null);
              }
            }}
            className={styles.slider}
            aria-label="한옥 분해 조립 조절기"
          />
          <span className={styles.sliderLabel}>분해</span>
        </div>
      </div>
    </div>
  );
}
