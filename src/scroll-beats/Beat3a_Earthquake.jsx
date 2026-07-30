'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.18, 0.3];

export default function Beat3a_Earthquake({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat3a 영역입니다</BeatFrame>;
}
