'use client';

import type { CSSProperties } from 'react';
import {
  SORIMARU_BACKGROUND_PALETTE,
  SORIMARU_BACKGROUND_DARK_PALETTE,
  resolveSorimaruBackgroundPresentation,
} from './sorimaruBackgroundScenes';
import type { SorimaruBackgroundVariant } from './sorimaruBackground.types';
import { useSorimaruBackgroundController } from './useSorimaruBackgroundController';
import { useOnmaruTheme } from '@/design-system/ThemeProvider';
import styles from './SorimaruBackgroundStage.module.css';

interface SorimaruBackgroundStageProps {
  variant: Exclude<SorimaruBackgroundVariant, 'default'>;
  selectedCategory: string;
  isPlaying: boolean;
}

type BackgroundVariables = CSSProperties & Record<`--sorimaru-bg-${string}`, string>;

const DECKLE_EDGE_PATH =
  'M18 0 L14 55 L20 110 L16 165 L22 220 L15 275 L19 330 L13 385 L21 440 L17 495 L14 550 L20 605 L16 660 L23 715 L15 770 L18 825 L12 880 L20 935 L16 990 L22 1045 L14 1100 L19 1155 L17 1200';

export function SorimaruBackgroundStage({
  variant,
  selectedCategory,
  isPlaying,
}: SorimaruBackgroundStageProps) {
  const { mode } = useOnmaruTheme();
  const isDark = mode === 'dark';
  const palette = isDark ? SORIMARU_BACKGROUND_DARK_PALETTE : SORIMARU_BACKGROUND_PALETTE;

  const { scene, motion: motionState } =
    useSorimaruBackgroundController({ variant, selectedCategory, isPlaying });
  const presentation = resolveSorimaruBackgroundPresentation(variant);

  const stageStyle: BackgroundVariables = {
    '--sorimaru-bg-canvas': palette.canvas,
    '--sorimaru-bg-paper-surface': palette.paper,
    '--sorimaru-bg-light-rgb': palette.lightRgb,
    '--sorimaru-bg-fiber-rgb': palette.fiberRgb,
    '--sorimaru-bg-shadow-rgb': palette.shadowRgb,
    '--sorimaru-bg-accent-rgb': palette.accentRgb,
    '--sorimaru-bg-hanji': presentation.hanjiAir.toString(),
    '--sorimaru-bg-light': presentation.hospitalityLight.toString(),
    '--sorimaru-bg-threshold': presentation.thresholdShadow.toString(),
    '--sorimaru-bg-garden': presentation.gardenShadow.toString(),
    '--sorimaru-bg-warmth': presentation.warmthField.toString(),
    '--sorimaru-bg-paper': presentation.paperDepth.toString(),
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
      <div className={styles.hanjiFiber} />
      <div className={styles.edgeVignette} />

      <div className={styles.deckleEdge}>
        <svg className={styles.deckleEdgeLeft} viewBox="0 0 32 1200" preserveAspectRatio="none">
          <path className={styles.deckleBody} d={`${DECKLE_EDGE_PATH} L0 1200 L0 0 Z`} />
          <path className={styles.deckleShadow} d={DECKLE_EDGE_PATH} />
          <path className={styles.deckleFringe} d={DECKLE_EDGE_PATH} />
        </svg>
        <svg className={styles.deckleEdgeRight} viewBox="0 0 32 1200" preserveAspectRatio="none">
          <path className={styles.deckleBody} d={`${DECKLE_EDGE_PATH} L0 1200 L0 0 Z`} />
          <path className={styles.deckleShadow} d={DECKLE_EDGE_PATH} />
          <path className={styles.deckleFringe} d={DECKLE_EDGE_PATH} />
        </svg>
      </div>
    </div>
  );
}
