'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.08, 0.18];

export default function Beat2_Reveal({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat2 영역입니다</BeatFrame>;
}
