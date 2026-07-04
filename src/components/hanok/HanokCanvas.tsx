'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from './HanokExplorer.module.css';
import HanokHotspot from './HanokHotspot';
import { HANOK_LAYERS } from './hanok.data';
import type { HanokPart } from './hanok.data';

interface HanokCanvasProps {
  parts: HanokPart[];
  selectedPartId: string | null;
  explodeProgress: number;
  onSelectPart: (partId: string) => void;
  onDeselect: () => void;
}

export default function HanokCanvas({
  parts,
  selectedPartId,
  explodeProgress,
  onSelectPart,
  onDeselect,
}: HanokCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedPart = parts.find((p) => p.id === selectedPartId) ?? null;

  // Calculate zoom transform accounting for dynamic layer translation
  const getZoomTransform = () => {
    if (!selectedPart) {
      return { scale: 1, x: 0, y: 0 };
    }
    const { x, y, scale } = selectedPart.zoomTarget;
    
    // Look up translation offset of the active layer
    const selectedLayer = HANOK_LAYERS.find((l) => l.id === selectedPart.layer)!;
    const yOffset = selectedLayer.maxPlayOffset * explodeProgress;
    
    // Convert pixel offset to percentage of canvas height
    const canvasHeight = containerRef.current ? containerRef.current.clientHeight : 560;
    const yOffsetPercent = (yOffset / canvasHeight) * 100;
    
    const translateX = (50 - x) * (scale - 1) * 0.6;
    const translateY = (50 - (y + yOffsetPercent)) * (scale - 1) * 0.6;
    
    return { scale, x: translateX, y: translateY };
  };

  const zoom = getZoomTransform();

  return (
    <div
      className={styles.canvasArea}
      onClick={onDeselect}
      ref={containerRef}
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
        {/* Image Layers Stack */}
        {HANOK_LAYERS.map((layer) => {
          const layerParts = parts.filter((p) => p.layer === layer.id);
          const yOffset = layer.maxPlayOffset * explodeProgress;
          const isLayerSelected = selectedPart && selectedPart.layer === layer.id;

          return (
            <motion.div
              key={layer.id}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: layer.zIndex,
                pointerEvents: 'none',
              }}
              animate={{
                y: yOffset,
                filter: selectedPartId && !isLayerSelected
                  ? 'brightness(0.35) contrast(1.1) blur(4px)'
                  : 'brightness(1) contrast(1) blur(0px)',
              }}
              transition={{
                duration: 0.7,
                ease: [0.25, 1, 0.5, 1],
              }}
            >
              {/* Layer Image */}
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Image
                  src={layer.imageSrc}
                  alt={layer.label}
                  fill
                  style={{
                    objectFit: 'contain',
                    mixBlendMode: 'multiply',
                  }}
                  sizes="(max-width: 768px) 95vw, (max-width: 1280px) 80vw, 900px"
                  priority
                />
              </div>
            </motion.div>
          );
        })}

        {/* Hotspots Overlay Stack (on top of all images to prevent blending/z-index issues) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {parts.map((part) => {
            const layerConfig = HANOK_LAYERS.find((l) => l.id === part.layer)!;
            const yOffset = layerConfig.maxPlayOffset * explodeProgress;

            return (
              <motion.div
                key={part.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                }}
                animate={{
                  y: yOffset,
                }}
                transition={{
                  duration: 0.7,
                  ease: [0.25, 1, 0.5, 1],
                }}
              >
                <HanokHotspot
                  part={part}
                  isSelected={selectedPartId === part.id}
                  isDimmed={!!selectedPartId && selectedPartId !== part.id}
                  containerRef={containerRef}
                  onClick={() => onSelectPart(part.id)}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Special visual effects when layers are focused */}
        <AnimatePresence>
          {selectedPart?.specialEffect === 'ondol' && (
            <motion.div
              key="ondol-effect"
              className={styles.ondolWaveContainer}
              style={{
                left: `${selectedPart.position.x}%`,
                top: `${selectedPart.position.y}%`,
                y: HANOK_LAYERS.find((l) => l.id === 'floor')!.maxPlayOffset * explodeProgress,
                zIndex: 101, // place above hotspots overlay
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
                y: HANOK_LAYERS.find((l) => l.id === 'walls')!.maxPlayOffset * explodeProgress,
                zIndex: 101,
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
        </AnimatePresence>
      </motion.div>

      {/* Navigation hint */}
      {!selectedPartId && (
        <div className={styles.navHint}>
          <span className={styles.navHintDot} />
          하단의 조절기나 핫스팟을 터치하여 한옥을 분해해 보세요
        </div>
      )}
    </div>
  );
}
