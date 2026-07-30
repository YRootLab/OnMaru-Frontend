'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.58, 0.7];

export default function Beat3d_Deuleoyeolgae({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat3d 영역입니다</BeatFrame>;
}
