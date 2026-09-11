import { getSorimaruTearBoundaries } from './sorimaruBackgroundScenes';
import type { SorimaruBackgroundStage, SorimaruBackgroundVariant } from './sorimaruBackground.types';
import styles from './SorimaruBackgroundStage.module.css';

interface HanjiTearTransitionProps {
  stage: SorimaruBackgroundStage;
  variant: SorimaruBackgroundVariant;
}

const TEAR_PATH = 'M0 28 L58 24 L113 30 L172 20 L238 27 L306 18 L375 25 L442 17 L510 26 L584 19 L653 29 L718 20 L786 27 L857 18 L929 26 L1000 19 L1071 28 L1142 18 L1211 25 L1287 19 L1360 27 L1440 21';

export function HanjiTearTransition({ stage, variant }: HanjiTearTransitionProps) {
  if (!getSorimaruTearBoundaries(variant).includes(stage)) return null;

  return (
    <div aria-hidden="true" className={styles.tear} data-stage={stage} data-variant={variant}>
      <svg viewBox="0 0 1440 52" preserveAspectRatio="none">
        <path className={styles.tearShadow} d={TEAR_PATH} />
        <path className={styles.tearBody} d={`${TEAR_PATH} L1440 0 L0 0 Z`} />
        <path className={styles.tearFringe} d={TEAR_PATH} />
      </svg>
    </div>
  );
}
