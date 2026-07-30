'use client';

import BeatFrame, { isInBeat } from './BeatFrame';

export const RANGE = [0.85, 0.94];

export default function Beat5_Silence({ progress }) {
  if (!isInBeat(progress, ...RANGE)) return null;

  return <BeatFrame>Beat5 영역입니다</BeatFrame>;
}
