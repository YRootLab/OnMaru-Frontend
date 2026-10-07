// Runtime-tunable motion constants — single source of truth.
// Structural constants (BEE_MAX_CONCURRENT, lantern fractions, bezier control points)
// remain in beeFlightPath.ts; behaviour-shaping values live here.

export interface MotionParams {
  /** Bee sprite display height in CSS px */
  beeH: number;
  /** "me" bee flight duration in ms */
  meDurationMs: number;
  /** "other" bee flight duration in ms */
  otherDurationMs: number;
  /** Tail particle emit probability per RAF frame (0–1) */
  tailRate: number;
  /** Tail particle draw size in CSS px */
  tailParticleSize: number;
  /** Particle sway sine amplitude in px */
  sineAmp: number;
  /** Horizontal spawn x random jitter radius in px */
  startXJitter: number;
}

export const DEFAULT_MOTION: Readonly<MotionParams> = {
  beeH:             72,
  meDurationMs:     700,
  otherDurationMs:  1_400,
  tailRate:         0.3,
  tailParticleSize: 20,
  sineAmp:          6,
  startXJitter:     20,
};

export const MOTION_LIMITS = {
  beeH:             { min: 48,   max: 120,  step: 1    },
  meDurationMs:     { min: 400,  max: 2500, step: 50   },
  otherDurationMs:  { min: 400,  max: 2500, step: 50   },
  tailRate:         { min: 0.05, max: 1.0,  step: 0.05 },
  tailParticleSize: { min: 6,    max: 40,   step: 1    },
  sineAmp:          { min: 0,    max: 20,   step: 0.5  },
  startXJitter:     { min: 0,    max: 80,   step: 2    },
} as const satisfies Record<keyof MotionParams, { min: number; max: number; step: number }>;
