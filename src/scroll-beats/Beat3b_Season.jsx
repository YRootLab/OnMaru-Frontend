'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.3, 0.44];

export default function Beat3b_Season({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat3b 영역입니다</BeatFrame>;
}
