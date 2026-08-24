'use client';

import type { CSSProperties } from 'react';
import { motion, useTransform } from 'framer-motion';
import {
  ODII_BACKGROUND_PALETTE,
  resolveOdiiBackgroundPresentation,
} from './odiiBackgroundScenes';
import type { OdiiBackgroundVariant } from './odiiBackground.types';
import { useOdiiBackgroundController } from './useOdiiBackgroundController';
import styles from './OdiiBackgroundStage.module.css';

interface OdiiBackgroundStageProps {
  variant: Exclude<OdiiBackgroundVariant, 'default'>;
  selectedCategory: string;
  isPlaying: boolean;
}

type BackgroundVariables = CSSProperties & Record<`--odii-bg-${string}`, string>;

const WARMTH_POINTS = Array.from({ length: 6 }, (_, index) => index);

export function OdiiBackgroundStage({
  variant,
  selectedCategory,
  isPlaying,
}: OdiiBackgroundStageProps) {
  const { scene, motion: motionState, pointerX, pointerY, scrollProgress } =
    useOdiiBackgroundController({ variant, selectedCategory, isPlaying });
  const presentation = resolveOdiiBackgroundPresentation(variant);
  const lightX = useTransform(pointerX, [-1, 1], motionState.parallax ? [-5, 5] : [0, 0]);
  const lightY = useTransform(pointerY, [-1, 1], motionState.parallax ? [-4, 4] : [0, 0]);
  const shadowX = useTransform(pointerX, [-1, 1], motionState.parallax ? [4, -4] : [0, 0]);
  const shadowY = useTransform(scrollProgress, [0, 1], motionState.drift ? [-3, 3] : [0, 0]);

  const stageStyle: BackgroundVariables = {
    '--odii-bg-canvas': ODII_BACKGROUND_PALETTE.canvas,
    '--odii-bg-paper-surface': ODII_BACKGROUND_PALETTE.paper,
    '--odii-bg-light-rgb': ODII_BACKGROUND_PALETTE.lightRgb,
    '--odii-bg-fiber-rgb': ODII_BACKGROUND_PALETTE.fiberRgb,
    '--odii-bg-shadow-rgb': ODII_BACKGROUND_PALETTE.shadowRgb,
    '--odii-bg-accent-rgb': ODII_BACKGROUND_PALETTE.accentRgb,
    '--odii-bg-hanji': presentation.hanjiAir.toString(),
    '--odii-bg-light': presentation.hospitalityLight.toString(),
    '--odii-bg-threshold': presentation.thresholdShadow.toString(),
    '--odii-bg-garden': presentation.gardenShadow.toString(),
    '--odii-bg-warmth': presentation.warmthField.toString(),
    '--odii-bg-paper': presentation.paperDepth.toString(),
  };

  return (
    <div
      aria-hidden="true"
      className={styles.stage}
      data-variant={scene.variant}
      data-stage={scene.stage}
      data-category={scene.category}
      data-motion={scene.motionLevel}
      data-breathing={variant === 'onmaru-signature' && motionState.breathing ? 'true' : 'false'}
      style={stageStyle}
    >
      <div className={styles.hanjiAir} />
      <motion.div className={styles.hospitalityLight} style={{ x: lightX, y: lightY }} />
      <motion.div className={styles.thresholdShadow} style={{ x: shadowX, y: shadowY }}>
        <span className={styles.thresholdBar} />
      </motion.div>
      <motion.svg
        className={styles.gardenShadow}
        style={{ x: shadowX, y: shadowY }}
        viewBox="0 0 560 520"
        fill="none"
      >
        <path d="M502 5C418 84 389 168 367 274C347 371 280 447 172 516" />
        <path d="M400 150C465 130 513 90 550 45M361 286C431 270 490 230 531 175M316 376C241 359 185 322 134 270" />
        <ellipse cx="472" cy="102" rx="58" ry="22" transform="rotate(-28 472 102)" />
        <ellipse cx="435" cy="213" rx="48" ry="19" transform="rotate(-18 435 213)" />
        <ellipse cx="234" cy="348" rx="52" ry="20" transform="rotate(24 234 348)" />
        <ellipse cx="373" cy="309" rx="42" ry="17" transform="rotate(-34 373 309)" />
      </motion.svg>
      <div className={styles.warmthField}>
        {WARMTH_POINTS.map((point) => (
          <span className={styles.warmthPoint} data-point={point + 1} key={point} />
        ))}
      </div>
      <div className={styles.paperDepth}>
        <span className={styles.paperSheet} />
        <span className={styles.paperIndex} />
        <span className={styles.paperRule} />
        <span className={styles.paperSeal} />
      </div>
      <div className={styles.edgeVignette} />
    </div>
  );
}
