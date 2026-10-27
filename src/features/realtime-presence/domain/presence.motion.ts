export interface MotionParams {
  /** Particle sway sine amplitude in px */
  sineAmp: number;
  /** Horizontal spawn x random jitter radius in px */
  startXJitter: number;
}

export const DEFAULT_MOTION: Readonly<MotionParams> = {
  sineAmp:      6,
  startXJitter: 20,
};

export const MOTION_LIMITS = {
  sineAmp:      { min: 0, max: 20, step: 0.5 },
  startXJitter: { min: 0, max: 80, step: 2   },
} as const satisfies Record<keyof MotionParams, { min: number; max: number; step: number }>;
