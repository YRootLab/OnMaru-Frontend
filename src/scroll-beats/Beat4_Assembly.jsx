'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.7, 0.85];

export default function Beat4_Assembly({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat4 영역입니다</BeatFrame>;
}
